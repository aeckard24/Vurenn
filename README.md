# Vurenn Backend (FastAPI)

Deployable FastAPI backend wrapping Server.py's assistant logic. Immediate
launch scope only — see "Out of scope" below.

## Does this call an outside model provider?

**Yes.** `app/vurenn.py` calls **Anthropic's Claude API** via the official
`anthropic` Python SDK (`stream_claude_response()`). It requires the
**`ANTHROPIC_API_KEY`** environment variable. Without it, `/health` and
`/v1/models` still work, but any chat message not handled by a local
fast-path (math, dictionary, time, YouTube, Spotify) returns an error
message instead of a real answer. `GET /health` reports whether the key is
configured at runtime.

## Out of scope for this launch pass

Per the immediate objective, this build does **not** include: Supabase,
billing (Stripe), plugins, background tasks, advanced memory, TTS/STT,
face recognition/MFA. Those existed in the original Server.py (a Flask
voice app) but are intentionally left out here to ship a minimal, testable
chat API first.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env, set ANTHROPIC_API_KEY at minimum
```

## Run locally

```bash
uvicorn app.main:app --reload
```

Docs at `http://localhost:8000/docs`.

## Endpoints

### `GET /health`
```json
{ "status": "ok", "provider": "anthropic", "provider_configured": true }
```

### `GET /v1/models`
```json
{ "models": [{ "id": "vurenn-default", "provider": "anthropic", "underlying_model": "claude-sonnet-4-6" }] }
```

### `POST /v1/chat/stream`
Request:
```json
{ "message": "What's the square root of 144?", "history": [] }
```

Response: `text/event-stream`. Each event: `data: <json>\n\n`

| `type`  | Fields | Meaning |
|---------|--------|---------|
| `token` | `content: str` | One chunk of response text |
| `done`  | — | Stream complete |
| `error` | `message: str` | Something failed |

> **Assumption flagged:** this exact shape (`type`/`token`/`content`/`done`)
> is what's implemented, since no existing frontend contract was supplied.
> If your frontend expects a different shape, tell me and I'll adjust
> `_sse_event()` in `app/main.py` — that's the only place the wire format
> is defined.

## Testing

```bash
pytest
```

## Deploying to Railway

Production start command (set in Railway service settings):
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set `ANTHROPIC_API_KEY` (and any optional vars from `.env.example`) in
Railway's environment variables dashboard — never commit `.env`.

## Git

This project was scaffolded and tested locally but has not been pushed to
a remote. See the accompanying report for the local commit hash — you'll
need to add your own GitHub remote and push it, since I don't have access
to your GitHub account or credentials.
