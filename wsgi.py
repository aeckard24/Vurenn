"""Railway entry point and the API contract consumed by the Vurenn frontend."""

import json
import os
import threading
import uuid
from datetime import datetime, timezone

from flask import Response, jsonify, request

from Vurenn import (
    app,
    handle_user_input,
    init_spotify,
    load_known_faces,
    start_audio_cleanup_loop,
)


def utc_now():
    return datetime.now(timezone.utc).isoformat()


FRONTEND_ORIGINS = {
    value.strip().rstrip("/")
    for value in os.environ.get("FRONTEND_ORIGIN", "").split(",")
    if value.strip()
}


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "").rstrip("/")
    if origin and origin in FRONTEND_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = (
            "Authorization, Content-Type, X-Idempotency-Key"
        )
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "vurenn-api"})


@app.route("/v1/models", methods=["GET"])
def models():
    return jsonify(
        {
            "models": [
                {
                    "id": "claude-sonnet",
                    "name": "Vurenn",
                    "description": "Vurenn assistant powered by Claude.",
                    "status": "available",
                    "required_plan": "free",
                    "capabilities": ["chat"],
                }
            ]
        }
    )


conversations = {}
messages = {}
store_lock = threading.Lock()


@app.route("/v1/conversations", methods=["GET", "POST", "OPTIONS"])
def conversation_collection():
    if request.method == "OPTIONS":
        return "", 204
    if request.method == "GET":
        with store_lock:
            ordered = sorted(
                conversations.values(),
                key=lambda value: value["updated_at"],
                reverse=True,
            )
            return jsonify({"conversations": ordered})

    payload = request.get_json(silent=True) or {}
    conversation_id = payload.get("temporary_id") or str(uuid.uuid4())
    now = utc_now()
    conversation = {
        "id": conversation_id,
        "title": payload.get("title") or "New conversation",
        "model_id": payload.get("model_id") or "claude-sonnet",
        "project_id": payload.get("project_id"),
        "created_at": now,
        "updated_at": now,
    }
    with store_lock:
        conversations.setdefault(conversation_id, conversation)
        messages.setdefault(conversation_id, [])
        return jsonify(conversations[conversation_id]), 201


@app.route(
    "/v1/conversations/<conversation_id>/messages",
    methods=["GET", "OPTIONS"],
)
def conversation_messages(conversation_id):
    if request.method == "OPTIONS":
        return "", 204
    with store_lock:
        return jsonify({"messages": messages.get(conversation_id, [])})


def sse(event_type, data):
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


@app.route("/v1/chat/stream", methods=["POST", "OPTIONS"])
def chat_stream():
    if request.method == "OPTIONS":
        return "", 204

    payload = request.get_json(silent=True) or {}
    conversation_id = payload.get("conversation_id")
    user_text = str(payload.get("message") or "").strip()
    if not conversation_id or not user_text:
        return jsonify(
            {
                "code": "invalid_request",
                "message": "conversation_id and message are required.",
                "retryable": False,
            }
        ), 400

    now = utc_now()
    user_message = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "role": "user",
        "content": user_text,
        "status": "completed",
        "attachments": payload.get("attachments") or [],
        "created_at": now,
    }
    assistant_id = str(uuid.uuid4())

    try:
        answer = handle_user_input(user_text)
    except Exception as error:
        def error_stream():
            yield sse(
                "error",
                {
                    "code": "assistant_error",
                    "message": str(error),
                    "retryable": True,
                },
            )
            yield sse("done", {})

        return Response(error_stream(), mimetype="text/event-stream")

    assistant_message = {
        "id": assistant_id,
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": answer,
        "status": "completed",
        "attachments": [],
        "created_at": utc_now(),
    }

    with store_lock:
        if conversation_id not in conversations:
            conversations[conversation_id] = {
                "id": conversation_id,
                "title": user_text[:80] or "New conversation",
                "model_id": payload.get("model") or "claude-sonnet",
                "project_id": None,
                "created_at": now,
                "updated_at": now,
            }
        conversations[conversation_id]["updated_at"] = utc_now()
        messages.setdefault(conversation_id, []).extend(
            [user_message, assistant_message]
        )

    def stream():
        yield sse("message_started", {"message_id": assistant_id})
        yield sse("token", {"text": answer})
        yield sse(
            "message_completed",
            {
                "message_id": assistant_id,
                "conversation_id": conversation_id,
                "usage": {
                    "input_tokens": max(1, len(user_text) // 4),
                    "output_tokens": max(1, len(answer) // 4),
                },
            },
        )
        yield sse("done", {})

    return Response(
        stream(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def initialize():
    load_known_faces()
    init_spotify()
    start_audio_cleanup_loop()


if __name__ == "__main__":
    initialize()
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
