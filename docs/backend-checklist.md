# Andrew's Python backend checklist

## Initial connectivity

- [ ] `GET /health` returns `{"status":"ok","service":"vurenn-api"}`.
- [ ] `GET /v1/models` matches the documented contract.
- [ ] CORS allows only correct local, preview, and production frontend origins.
- [ ] HTTPS is required outside local development.
- [ ] `X-Request-ID` is generated or propagated on every response.
- [ ] Safe errors exist for 401, 403, 404, 409, 422, 429, and 5xx.
- [ ] Timeouts are bounded and logged without leaking secrets.

## Conversations and chat

- [ ] `GET /v1/conversations` returns only the authenticated user's records.
- [ ] `POST /v1/conversations` accepts the documented request.
- [ ] Temporary ID or `X-Idempotency-Key` prevents duplicate creation.
- [ ] The create response returns one stable ID and ISO timestamps.
- [ ] `GET /v1/conversations/{id}/messages` enforces ownership.
- [ ] `POST /v1/chat/stream` accepts the documented request.
- [ ] The response is `text/event-stream` with buffering disabled.
- [ ] SSE names and JSON payloads exactly match the specification.
- [ ] A normal stream ends with `message_completed`, then `done`.
- [ ] A failed stream emits a safe structured `error`.
- [ ] Client cancellation promptly stops downstream model work.
- [ ] Duplicate sends are protected by `X-Idempotency-Key`.
- [ ] Partial, stopped, failed, and completed states persist consistently.
- [ ] Provider identity stays private unless intentionally configured.

## Authentication and authorization

- [ ] Validate Supabase JWT signature, issuer, audience, expiry, and subject.
- [ ] Scope every protected record query to the authenticated user.
- [ ] Ignore browser-provided user IDs, roles, plans, and entitlements.
- [ ] Enforce plan, model, feature, and usage limits server-side.
- [ ] Protect admin routes with explicit backend roles.
- [ ] Record admin writes in an audit log.
- [ ] Never expose service-role keys, provider keys, database passwords, tokens, stack traces, or routing IDs.

## Files and settings

- [ ] Agree on direct upload or signed authorization before frontend work.
- [ ] Enforce file type, size, ownership, scanning, cancellation, and deletion.
- [ ] Return stable file IDs and safe metadata.
- [ ] Define settings read/update/reset endpoints and schema conflicts.
- [ ] Define local-to-server settings migration precedence.

## Operations

- [ ] Use production structured logging with safe correlation IDs.
- [ ] Redact authorization headers, protected prompts, and secrets.
- [ ] Configure upstream/proxy timeouts for SSE.
- [ ] Monitor latency, errors, disconnects, rate limits, and provider failures.
- [ ] Gracefully cancel or drain active requests during shutdown.
- [ ] Test preflight, expired JWTs, ownership, rate limits, retries, duplicates, malformed payloads, and cancellation.
- [ ] Publish the API base URL and supported frontend origins.
