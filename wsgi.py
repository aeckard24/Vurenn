"""Production HTTP API for the Vurenn web frontend."""

import json
import os
import uuid
from datetime import datetime, timezone
from functools import wraps

import requests
import stripe
from anthropic import Anthropic
from flask import Flask, Response, g, jsonify, request


app = Flask(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get(
    "ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"
)
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://vurenn.com").rstrip("/")
FRONTEND_ORIGINS = {
    value.strip().rstrip("/")
    for value in os.environ.get("FRONTEND_ORIGIN", FRONTEND_URL).split(",")
    if value.strip()
}

anthropic_client = (
    Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
)
stripe.api_key = STRIPE_SECRET_KEY


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def api_error(status, code, message, *, retryable=False, details=None):
    payload = {
        "code": code,
        "message": message,
        "retryable": retryable,
    }
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status


@app.after_request
def add_security_headers(response):
    origin = request.headers.get("Origin", "").rstrip("/")
    if origin and origin in FRONTEND_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = (
            "Authorization, Content-Type, X-Idempotency-Key"
        )
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PATCH, DELETE, OPTIONS"
        )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


def supabase_configured():
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def supabase_request(method, path, *, params=None, body=None, prefer=None):
    if not supabase_configured():
        raise RuntimeError("Supabase is not configured.")
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    response = requests.request(
        method,
        f"{SUPABASE_URL}/rest/v1/{path.lstrip('/')}",
        params=params,
        json=body,
        headers=headers,
        timeout=15,
    )
    if response.status_code >= 400:
        raise RuntimeError(
            f"Database request failed ({response.status_code}): "
            f"{response.text[:300]}"
        )
    if not response.content:
        return None
    return response.json()


def authenticate():
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    if not token or not supabase_configured():
        return None
    response = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {token}",
        },
        timeout=10,
    )
    if response.status_code != 200:
        return None
    user = response.json()
    return user if user.get("id") else None


def auth_required(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        if request.method == "OPTIONS":
            return "", 204
        user = authenticate()
        if not user:
            return api_error(
                401,
                "authentication_required",
                "Sign in to use Vurenn.",
            )
        g.user = user
        g.user_id = user["id"]
        return handler(*args, **kwargs)

    return wrapped


@app.route("/health", methods=["GET"])
def health():
    checks = {
        "database": supabase_configured(),
        "assistant": anthropic_client is not None,
        "billing": bool(STRIPE_SECRET_KEY and STRIPE_PRICE_ID),
    }
    return jsonify(
        {
            "status": "ok" if all(checks.values()) else "degraded",
            "service": "vurenn-api",
            "checks": checks,
        }
    )


@app.route("/v1/models", methods=["GET"])
def models():
    available = anthropic_client is not None
    return jsonify(
        {
            "models": [
                {
                    "id": "vurenn-fast",
                    "name": "Vurenn Fast",
                    "description": "Fast, efficient responses for everyday tasks.",
                    "status": "available" if available else "unavailable",
                    "required_plan": "free",
                    "capabilities": ["chat"],
                },
                {
                    "id": "vurenn",
                    "name": "Vurenn",
                    "description": "Balanced help for reasoning, writing, and planning.",
                    "status": "available" if available else "unavailable",
                    "required_plan": "free",
                    "capabilities": ["chat"],
                },
            ]
        }
    )


def get_owned_conversation(conversation_id, user_id):
    rows = supabase_request(
        "GET",
        "conversations",
        params={
            "select": "*",
            "id": f"eq.{conversation_id}",
            "user_id": f"eq.{user_id}",
            "limit": "1",
        },
    )
    return rows[0] if rows else None


@app.route("/v1/conversations", methods=["GET", "POST", "OPTIONS"])
@auth_required
def conversation_collection():
    if request.method == "GET":
        rows = supabase_request(
            "GET",
            "conversations",
            params={
                "select": (
                    "id,title,model_id,project_id,created_at,updated_at"
                ),
                "user_id": f"eq.{g.user_id}",
                "order": "updated_at.desc",
            },
        )
        return jsonify({"conversations": rows or []})

    payload = request.get_json(silent=True) or {}
    conversation_id = str(payload.get("temporary_id") or uuid.uuid4())
    now = utc_now()
    row = {
        "id": conversation_id,
        "user_id": g.user_id,
        "title": str(payload.get("title") or "New conversation")[:160],
        "model_id": str(payload.get("model_id") or "vurenn"),
        "project_id": payload.get("project_id"),
        "created_at": now,
        "updated_at": now,
    }
    created = supabase_request(
        "POST",
        "conversations",
        params={"on_conflict": "id"},
        body=row,
        prefer="resolution=ignore-duplicates,return=representation",
    )
    stored = created[0] if created else get_owned_conversation(
        conversation_id, g.user_id
    )
    if not stored:
        return api_error(409, "conversation_conflict", "Conversation ID conflict.")
    return jsonify(
        {
            key: stored.get(key)
            for key in (
                "id",
                "title",
                "model_id",
                "project_id",
                "created_at",
                "updated_at",
            )
        }
    ), 201


@app.route(
    "/v1/conversations/<conversation_id>/messages",
    methods=["GET", "OPTIONS"],
)
@auth_required
def conversation_messages(conversation_id):
    if not get_owned_conversation(conversation_id, g.user_id):
        return api_error(404, "conversation_not_found", "Conversation not found.")
    rows = supabase_request(
        "GET",
        "messages",
        params={
            "select": (
                "id,conversation_id,role,content,status,attachments,created_at"
            ),
            "conversation_id": f"eq.{conversation_id}",
            "user_id": f"eq.{g.user_id}",
            "order": "created_at.asc",
        },
    )
    return jsonify({"messages": rows or []})


def sse(event_type, data):
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


@app.route("/v1/chat/stream", methods=["POST", "OPTIONS"])
@auth_required
def chat_stream():
    payload = request.get_json(silent=True) or {}
    conversation_id = str(payload.get("conversation_id") or "")
    user_text = str(payload.get("message") or "").strip()
    if not conversation_id or not user_text:
        return api_error(
            422,
            "invalid_request",
            "conversation_id and message are required.",
            details={"fields": ["conversation_id", "message"]},
        )
    conversation = get_owned_conversation(conversation_id, g.user_id)
    if not conversation:
        return api_error(404, "conversation_not_found", "Conversation not found.")
    if not anthropic_client:
        return api_error(
            503,
            "assistant_not_configured",
            "Vurenn's response service is not configured.",
            retryable=True,
        )

    previous = supabase_request(
        "GET",
        "messages",
        params={
            "select": "role,content",
            "conversation_id": f"eq.{conversation_id}",
            "user_id": f"eq.{g.user_id}",
            "role": "in.(user,assistant)",
            "order": "created_at.asc",
            "limit": "30",
        },
    ) or []
    user_message_id = str(uuid.uuid4())
    assistant_message_id = str(uuid.uuid4())
    now = utc_now()
    attachments = payload.get("attachments") or []
    supabase_request(
        "POST",
        "messages",
        body={
            "id": user_message_id,
            "conversation_id": conversation_id,
            "user_id": g.user_id,
            "role": "user",
            "content": user_text,
            "status": "completed",
            "attachments": attachments,
            "created_at": now,
        },
        prefer="return=minimal",
    )
    supabase_request(
        "PATCH",
        "conversations",
        params={
            "id": f"eq.{conversation_id}",
            "user_id": f"eq.{g.user_id}",
        },
        body={
            "updated_at": now,
            **(
                {"title": user_text[:80]}
                if conversation.get("title") == "New conversation"
                else {}
            ),
        },
        prefer="return=minimal",
    )

    user_id = g.user_id
    model_messages = [
        {"role": item["role"], "content": item["content"]}
        for item in previous
        if item.get("content")
    ]
    model_messages.append({"role": "user", "content": user_text})

    def stream():
        full_text = []
        usage = {"input_tokens": 0, "output_tokens": 0}
        yield sse("message_started", {"message_id": assistant_message_id})
        try:
            with anthropic_client.messages.stream(
                model=ANTHROPIC_MODEL,
                max_tokens=2048,
                system=(
                    "You are Vurenn, a clear, honest, practical AI assistant. "
                    "State uncertainty plainly. Never claim actions or sources "
                    "you did not actually use."
                ),
                messages=model_messages,
            ) as response_stream:
                for text in response_stream.text_stream:
                    full_text.append(text)
                    yield sse("token", {"text": text})
                final = response_stream.get_final_message()
                usage = {
                    "input_tokens": final.usage.input_tokens,
                    "output_tokens": final.usage.output_tokens,
                }
            answer = "".join(full_text)
            supabase_request(
                "POST",
                "messages",
                body={
                    "id": assistant_message_id,
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "role": "assistant",
                    "content": answer,
                    "status": "completed",
                    "attachments": [],
                    "created_at": utc_now(),
                },
                prefer="return=minimal",
            )
            yield sse(
                "message_completed",
                {
                    "message_id": assistant_message_id,
                    "conversation_id": conversation_id,
                    "usage": usage,
                },
            )
        except Exception:
            app.logger.exception("Assistant streaming failed")
            yield sse(
                "error",
                {
                    "code": "assistant_error",
                    "message": "Vurenn could not complete the response.",
                    "retryable": True,
                },
            )
        finally:
            yield sse("done", {})

    return Response(
        stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )


@app.route("/v1/subscription", methods=["GET", "OPTIONS"])
@auth_required
def subscription():
    rows = supabase_request(
        "GET",
        "subscriptions",
        params={
            "select": "plan_id,status,current_period_end",
            "user_id": f"eq.{g.user_id}",
            "limit": "1",
        },
    )
    if not rows:
        return jsonify(
            {"plan_id": "free", "status": "inactive", "current_period_end": None}
        )
    return jsonify(rows[0])


@app.route("/v1/billing/checkout", methods=["POST", "OPTIONS"])
@auth_required
def create_checkout():
    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_ID:
        return api_error(503, "billing_not_configured", "Billing is unavailable.")
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        customer_email=g.user.get("email"),
        success_url=f"{FRONTEND_URL}/settings/subscription?checkout=success",
        cancel_url=f"{FRONTEND_URL}/pricing?checkout=canceled",
        allow_promotion_codes=True,
        metadata={"user_id": g.user_id, "plan_id": "pro"},
        subscription_data={
            "metadata": {"user_id": g.user_id, "plan_id": "pro"}
        },
    )
    return jsonify({"url": session.url})


def upsert_subscription(user_id, values):
    row = {
        "user_id": user_id,
        "updated_at": utc_now(),
        **values,
    }
    supabase_request(
        "POST",
        "subscriptions",
        params={"on_conflict": "user_id"},
        body=row,
        prefer="resolution=merge-duplicates,return=minimal",
    )


@app.route("/webhook", methods=["POST"])
@app.route("/v1/billing/webhook", methods=["POST"])
def stripe_webhook():
    if not STRIPE_WEBHOOK_SECRET:
        return api_error(503, "webhook_not_configured", "Webhook is unavailable.")
    try:
        event = stripe.Webhook.construct_event(
            request.get_data(),
            request.headers.get("Stripe-Signature", ""),
            STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return api_error(400, "invalid_webhook", "Invalid webhook signature.")

    data = event["data"]["object"]
    if event["type"] == "checkout.session.completed":
        user_id = data.get("metadata", {}).get("user_id")
        if user_id:
            upsert_subscription(
                user_id,
                {
                    "plan_id": data.get("metadata", {}).get("plan_id", "pro"),
                    "status": "active",
                    "stripe_customer_id": data.get("customer"),
                    "stripe_subscription_id": data.get("subscription"),
                },
            )
    elif event["type"] in {
        "customer.subscription.updated",
        "customer.subscription.deleted",
    }:
        user_id = data.get("metadata", {}).get("user_id")
        if user_id:
            active = data.get("status") in {"active", "trialing"}
            upsert_subscription(
                user_id,
                {
                    "plan_id": (
                        data.get("metadata", {}).get("plan_id", "pro")
                        if active
                        else "free"
                    ),
                    "status": data.get("status", "canceled"),
                    "stripe_customer_id": data.get("customer"),
                    "stripe_subscription_id": data.get("id"),
                    "current_period_end": datetime.fromtimestamp(
                        data.get("current_period_end", 0), timezone.utc
                    ).isoformat()
                    if data.get("current_period_end")
                    else None,
                },
            )
    return jsonify({"received": True})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
