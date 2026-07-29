"""
app/main.py — FastAPI web server for Vurenn.

Endpoints:
    GET  /health            → liveness check
    GET  /v1/models         → lists available model(s)
    POST /v1/chat/stream    → streams a chat response as Server-Sent Events

SSE contract (see README.md for full details):
    Each event is a line of the form:  data: <json>\\n\\n
    Event payloads:
        {"type": "token", "content": "..."}   — one chunk of streamed text
        {"type": "done"}                      — stream finished successfully
        {"type": "error", "message": "..."}   — something went wrong

Local dev:
    uvicorn app.main:app --reload

Production (Railway or any host providing $PORT):
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""

import json
import os
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app import vurenn

app = FastAPI(title="Vurenn API")

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None


@app.get("/health")
def health():
    provider_info = vurenn.confirm_provider()
    return {
        "status": "ok",
        "provider": provider_info["provider"],
        "provider_configured": provider_info["configured"],
    }


@app.get("/v1/models")
def list_models():
    provider_info = vurenn.confirm_provider()
    return {
        "models": [
            {
                "id": "vurenn-default",
                "provider": provider_info["provider"],
                "underlying_model": provider_info["model"],
            }
        ]
    }


def _sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _chat_event_stream(message: str, history: Optional[List[ChatMessage]]):
    try:
        local_response = vurenn.get_local_response(message)

        if local_response is not None:
            yield _sse_event({"type": "token", "content": local_response})
            yield _sse_event({"type": "done"})
            return

        history_dicts = [{"role": m.role, "content": m.content} for m in (history or [])]

        for chunk in vurenn.stream_claude_response(message, history_dicts):
            yield _sse_event({"type": "token", "content": chunk})

        yield _sse_event({"type": "done"})

    except Exception as e:
        yield _sse_event({"type": "error", "message": str(e)})


@app.post("/v1/chat/stream")
def chat_stream(request: ChatRequest):
    return StreamingResponse(
        _chat_event_stream(request.message, request.history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
