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
from stripe._error import SignatureVerificationError


app = Flask(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get(
    "ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"
)
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "")
STRIPE_PRICES = {
    "pro_monthly": os.environ.get(
        "STRIPE_PRO_MONTHLY_PRICE_ID", STRIPE_PRICE_ID
    ),
    "pro_annual": os.environ.get("STRIPE_PRO_ANNUAL_PRICE_ID", ""),
    "premier_monthly": os.environ.get("STRIPE_PREMIER_MONTHLY_PRICE_ID", ""),
    "premier_annual": os.environ.get("STRIPE_PREMIER_ANNUAL_PRICE_ID", ""),
    "credits_50": os.environ.get("STRIPE_CREDITS_50_PRICE_ID", ""),
    "credits_100": os.environ.get("STRIPE_CREDITS_100_PRICE_ID", ""),
}
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_EXPECTED_UNIT_AMOUNT = int(
    os.environ.get("STRIPE_EXPECTED_UNIT_AMOUNT", "999")
)
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

PLAN_CATALOG = {
    "pro_monthly": {
        "plan_id": "pro",
        "interval": "month",
        "amount_cents": 999,
    },
    "pro_annual": {
        "plan_id": "pro",
        "interval": "year",
        "amount_cents": 9900,
    },
    "premier_monthly": {
        "plan_id": "premier",
        "interval": "month",
        "amount_cents": 1999,
    },
    "premier_annual": {
        "plan_id": "premier",
        "interval": "year",
        "amount_cents": 19900,
    },
}

CREDIT_PACKS = {
    "credits_50": {"credits": 50, "amount_cents": 1299},
    "credits_100": {"credits": 100, "amount_cents": 2399},
}

# This catalog is returned to the client and is also used for server-side
# metering. Never trust a credit amount supplied by the browser.
USAGE_COSTS = {
    "chat_fast": {
        "label": "Fast message",
        "credits": 1,
        "description": "Short everyday responses",
        "available": True,
    },
    "chat_balanced": {
        "label": "Balanced message",
        "credits": 2,
        "description": "More reasoning and a longer response",
        "available": True,
    },
    "voice_turn": {
        "label": "Voice turn",
        "credits": 2,
        "description": "Browser speech input plus a spoken reply",
        "available": True,
    },
    "file_analysis": {
        "label": "File analysis",
        "credits": 3,
        "description": "Per analyzed file, when file processing launches",
        "available": False,
    },
    "web_search": {
        "label": "Web search",
        "credits": 3,
        "description": "Per search task, when connected",
        "available": False,
    },
    "deep_research": {
        "label": "Deep research",
        "credits": 8,
        "description": "Multi-step research task, when connected",
        "available": False,
    },
    "data_analysis": {
        "label": "Data analysis",
        "credits": 5,
        "description": "Per analysis run, when connected",
        "available": False,
    },
    "image_generation": {
        "label": "Image generation",
        "credits": 10,
        "description": "Per image, when connected",
        "available": False,
    },
}


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


def update_user_plan(user_id, plan_id):
    response = requests.put(
        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        },
        json={"app_metadata": {"plan": plan_id}},
        timeout=15,
    )
    if response.status_code >= 400:
        raise RuntimeError(
            f"Could not update the user's plan ({response.status_code})."
        )


def user_plan(user):
    plan = (user.get("app_metadata") or {}).get("plan", "free")
    return plan if plan in {"pro", "premier"} else "free"


def get_credit_account(user_id):
    rows = supabase_request(
        "GET",
        "credit_accounts",
        params={
            "select": "balance,lifetime_granted,lifetime_spent,updated_at",
            "user_id": f"eq.{user_id}",
            "limit": "1",
        },
    )
    if rows:
        return rows[0]
    created = supabase_request(
        "POST",
        "credit_accounts",
        body={"user_id": user_id},
        prefer="return=representation",
    )
    return created[0]


def spend_credits(user_id, amount, feature_id, idempotency_key, metadata=None):
    return supabase_request(
        "POST",
        "rpc/spend_vurenn_credits",
        body={
            "p_user_id": user_id,
            "p_amount": amount,
            "p_feature_id": feature_id,
            "p_idempotency_key": idempotency_key,
            "p_metadata": metadata or {},
        },
    )


def grant_credits(user_id, amount, feature_id, idempotency_key, metadata=None):
    return supabase_request(
        "POST",
        "rpc/grant_vurenn_credits",
        body={
            "p_user_id": user_id,
            "p_amount": amount,
            "p_feature_id": feature_id,
            "p_idempotency_key": idempotency_key,
            "p_metadata": metadata or {},
        },
    )


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
        "billing": bool(
            STRIPE_SECRET_KEY
            and STRIPE_PRICES["pro_monthly"]
            and STRIPE_PRICES["premier_monthly"]
        ),
    }
    return jsonify(
        {
            "status": "ok" if all(checks.values()) else "degraded",
            "service": "vurenn-api",
            "checks": checks,
        }
    )


@app.route("/v1/usage-costs", methods=["GET"])
def usage_costs():
    return jsonify(
        {
            "currency": "Vurenn credits",
            "costs": [
                {"id": feature_id, **details}
                for feature_id, details in USAGE_COSTS.items()
            ],
            "note": (
                "Long responses can use additional credits. Paid plans use "
                "their included allowance; credits meter the Free Top-off plan."
            ),
        }
    )


@app.route("/v1/credits", methods=["GET", "OPTIONS"])
@auth_required
def credits():
    account = get_credit_account(g.user_id)
    return jsonify(
        {
            **account,
            "plan_id": user_plan(g.user),
            "metered": user_plan(g.user) == "free",
        }
    )


@app.route("/v1/profile", methods=["GET", "PATCH", "OPTIONS"])
@auth_required
def profile():
    if request.method == "GET":
        rows = supabase_request(
            "GET",
            "profiles",
            params={
                "select": (
                    "display_name,occupation,goals,response_style,"
                    "onboarding_completed,onboarding_skipped,"
                    "security_prompt_dismissed,camera_unlock_enabled"
                ),
                "user_id": f"eq.{g.user_id}",
                "limit": "1",
            },
        )
        if rows:
            return jsonify(rows[0])
        name = (
            (g.user.get("user_metadata") or {}).get("display_name")
            or g.user.get("email", "").split("@")[0]
        )
        created = supabase_request(
            "POST",
            "profiles",
            body={"user_id": g.user_id, "display_name": name},
            prefer="return=representation",
        )
        return jsonify(created[0])

    payload = request.get_json(silent=True) or {}
    allowed = {
        "display_name",
        "occupation",
        "goals",
        "response_style",
        "onboarding_completed",
        "onboarding_skipped",
        "security_prompt_dismissed",
        "camera_unlock_enabled",
    }
    values = {key: payload[key] for key in allowed if key in payload}
    if "display_name" in values:
        values["display_name"] = str(values["display_name"]).strip()[:80]
    if "occupation" in values:
        values["occupation"] = str(values["occupation"]).strip()[:160]
    if "goals" in values:
        values["goals"] = [
            str(goal).strip()[:120]
            for goal in (values["goals"] or [])[:8]
            if str(goal).strip()
        ]
    if "response_style" in values:
        values["response_style"] = (
            values["response_style"]
            if values["response_style"] in {"concise", "balanced", "detailed"}
            else "balanced"
        )
    values["updated_at"] = utc_now()
    updated = supabase_request(
        "PATCH",
        "profiles",
        params={"user_id": f"eq.{g.user_id}"},
        body=values,
        prefer="return=representation",
    )
    return jsonify(updated[0] if updated else values)


@app.route("/v1/voice/config", methods=["GET"])
def voice_config():
    return jsonify(
        {
            "available": True,
            "transport": "browser",
            "speech_recognition": "web-speech-api",
            "speech_synthesis": "speech-synthesis-api",
            "credit_cost": USAGE_COSTS["voice_turn"]["credits"],
            "privacy": (
                "Audio is handled by the browser's speech service. Vurenn's "
                "backend receives the transcript, not a stored voice recording."
            ),
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
    request_id = str(
        request.headers.get("X-Idempotency-Key")
        or payload.get("request_id")
        or uuid.uuid4()
    )[:160]
    voice_mode = bool(payload.get("voice_mode"))
    model_id = str(payload.get("model") or "vurenn")
    feature_id = (
        "voice_turn"
        if voice_mode
        else ("chat_fast" if model_id == "vurenn-fast" else "chat_balanced")
    )
    base_cost = USAGE_COSTS[feature_id]["credits"]
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
    metered = user_plan(g.user) == "free"
    starting_balance = None
    if metered:
        try:
            starting_balance = spend_credits(
                g.user_id,
                base_cost,
                feature_id,
                f"usage:{request_id}:base",
                {
                    "conversation_id": conversation_id,
                    "model_id": model_id,
                    "voice_mode": voice_mode,
                },
            )
        except RuntimeError as error:
            if "INSUFFICIENT_CREDITS" in str(error):
                return api_error(
                    402,
                    "insufficient_credits",
                    "You need more Vurenn credits for this message.",
                    details={"required": base_cost, "feature_id": feature_id},
                )
            raise

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
    profile_rows = supabase_request(
        "GET",
        "profiles",
        params={
            "select": "display_name,occupation,goals,response_style",
            "user_id": f"eq.{g.user_id}",
            "limit": "1",
        },
    ) or []
    profile = profile_rows[0] if profile_rows else {}
    user_context = []
    if profile.get("display_name"):
        user_context.append(f"The user's name is {profile['display_name']}.")
    if profile.get("occupation"):
        user_context.append(f"They describe their work as: {profile['occupation']}.")
    if profile.get("goals"):
        user_context.append(
            "Their stated goals include: " + ", ".join(profile["goals"]) + "."
        )
    if profile.get("response_style"):
        user_context.append(
            f"They prefer {profile['response_style']} responses."
        )

    def stream():
        full_text = []
        usage = {"input_tokens": 0, "output_tokens": 0}
        balance_after = starting_balance
        yield sse("message_started", {"message_id": assistant_message_id})
        try:
            with anthropic_client.messages.stream(
                model=ANTHROPIC_MODEL,
                max_tokens=2048,
                system=(
                    "You are Vurenn, a clear, honest, practical AI assistant. "
                    "State uncertainty plainly. Never claim actions or sources "
                    "you did not actually use. Use the saved user context "
                    "naturally when helpful; do not repeat it unnecessarily. "
                    + " ".join(user_context)
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
            final_cost = base_cost
            if metered:
                variable_cost = min(
                    3,
                    (usage["input_tokens"] // 4000)
                    + (usage["output_tokens"] // 2000),
                )
                if variable_cost:
                    try:
                        balance_after = spend_credits(
                            user_id,
                            variable_cost,
                            feature_id,
                            f"usage:{request_id}:variable",
                            {
                                "input_tokens": usage["input_tokens"],
                                "output_tokens": usage["output_tokens"],
                            },
                        )
                        final_cost += variable_cost
                    except RuntimeError:
                        app.logger.warning(
                            "Could not apply variable credit charge for %s",
                            request_id,
                        )
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
                    "credit_charge": final_cost if metered else 0,
                    "credits_remaining": balance_after,
                },
            )
        except Exception:
            app.logger.exception("Assistant streaming failed")
            if metered:
                try:
                    grant_credits(
                        user_id,
                        base_cost,
                        feature_id,
                        f"refund:{request_id}:base",
                        {"reason": "assistant_error"},
                    )
                except Exception:
                    app.logger.exception("Credit refund failed")
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
    payload = request.get_json(silent=True) or {}
    plan_id = str(payload.get("plan_id") or "")
    interval = str(payload.get("interval") or "monthly")
    pack_id = str(payload.get("pack_id") or "")
    if pack_id:
        catalog_id = pack_id
        expected = CREDIT_PACKS.get(catalog_id)
        checkout_mode = "payment"
    else:
        catalog_id = f"{plan_id}_{interval}"
        expected = PLAN_CATALOG.get(catalog_id)
        checkout_mode = "subscription"
    price_id = STRIPE_PRICES.get(catalog_id, "")
    if not expected:
        return api_error(422, "invalid_checkout_item", "Unknown checkout item.")
    if not STRIPE_SECRET_KEY or not price_id:
        return api_error(503, "billing_not_configured", "Billing is unavailable.")
    price = stripe.Price.retrieve(price_id)
    valid = (
        price.get("active")
        and price.get("currency") == "usd"
        and price.get("unit_amount") == expected["amount_cents"]
    )
    if checkout_mode == "subscription":
        valid = valid and (price.get("recurring") or {}).get(
            "interval"
        ) == expected["interval"]
    else:
        valid = valid and not price.get("recurring")
    if not valid:
        return api_error(
            409,
            "billing_price_mismatch",
            "Checkout is paused because the configured Stripe price does not "
            "match Vurenn's displayed catalog.",
        )
    metadata = {
        "user_id": g.user_id,
        "purchase_type": "credits" if pack_id else "subscription",
        "catalog_id": catalog_id,
    }
    if pack_id:
        metadata.update(
            {
                "pack_id": pack_id,
                "credits": str(expected["credits"]),
                "amount_cents": str(expected["amount_cents"]),
            }
        )
    else:
        metadata["plan_id"] = expected["plan_id"]
    session_kwargs = {
        "mode": checkout_mode,
        "line_items": [{"price": price_id, "quantity": 1}],
        "customer_email": g.user.get("email"),
        "success_url": f"{FRONTEND_URL}/pricing?checkout=success",
        "cancel_url": f"{FRONTEND_URL}/pricing?checkout=canceled",
        "allow_promotion_codes": True,
        "metadata": metadata,
    }
    if checkout_mode == "subscription":
        session_kwargs["subscription_data"] = {"metadata": metadata}
    session = stripe.checkout.Session.create(
        **session_kwargs,
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
    update_user_plan(user_id, row["plan_id"])


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
    except (ValueError, SignatureVerificationError):
        return api_error(400, "invalid_webhook", "Invalid webhook signature.")

    data = event["data"]["object"]
    if event["type"] in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    }:
        metadata = data.get("metadata", {})
        user_id = metadata.get("user_id")
        if user_id and metadata.get("purchase_type") == "credits":
            pack_id = metadata.get("pack_id")
            pack = CREDIT_PACKS.get(pack_id)
            if pack and data.get("payment_status") in {"paid", "no_payment_required"}:
                session_id = data.get("id")
                supabase_request(
                    "POST",
                    "credit_purchases",
                    params={"on_conflict": "stripe_session_id"},
                    body={
                        "stripe_session_id": session_id,
                        "user_id": user_id,
                        "pack_id": pack_id,
                        "credits": pack["credits"],
                        "amount_cents": pack["amount_cents"],
                        "status": "completed",
                    },
                    prefer="resolution=ignore-duplicates,return=minimal",
                )
                grant_credits(
                    user_id,
                    pack["credits"],
                    pack_id,
                    f"stripe:{session_id}",
                    {"stripe_session_id": session_id},
                )
        elif user_id:
            upsert_subscription(
                user_id,
                {
                    "plan_id": metadata.get("plan_id", "pro"),
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
