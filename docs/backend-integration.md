# Vurenn backend integration specification

This is the handoff contract between the Vurenn Next.js frontend and Andrew's
future Python API. The frontend is prepared for the contract but does not
include or simulate that backend.

## Frontend architecture

Vurenn uses Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, and pnpm.
Components remain presentational, hooks manage UI state, and hooks call the
service registry in `lib/services/index.ts`.

- Backend flag false: lightweight local frontend adapters.
- Backend flag true: HTTP chat, conversation, and model adapters. Failed real
  requests never fall back to mocks.
- `lib/api/`: HTTP client, endpoints, structured errors, backend types, and SSE.
- `lib/services/`: replaceable domain boundaries.
- `lib/mock/`: local-only adapters with no fabricated intelligence or success.
- `lib/config/`: environment, plans, models, features, and public wording.
- `lib/state/`: optimistic conversation/message state and duplicate-send gate.

No model-provider API is called from the browser. Provider credentials,
database passwords, Supabase service-role keys, and private routing identifiers
must remain in the Python service.

## Service interfaces

The UI depends on `AuthService`, `ChatService`, `ConversationService`,
`FileService`, `SettingsService`, `ModelService`, `ProjectService`,
`SubscriptionService`, and `AdminService`. Replace adapters in `lib/services/`;
do not add fetch calls to components.

`AuthService` defines `getSession`, `getAccessToken`, `signIn`, `signUp`,
`signOut`, `resetPassword`, and `onAuthStateChange`. Supabase is not installed
or initialized. Until an approved browser client is connected, backend mode
intentionally reports authentication as unavailable.

## Environment variables

Copy `.env.example` to `.env.local` for local work. Never commit `.env.local`.

| Variable | Required | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | When backend mode is true | Absolute API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Later, with anon key | Public Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Later, with URL | Browser-safe anon key |
| `NEXT_PUBLIC_VURENN_BACKEND_ENABLED` | No; defaults false | Selects mock or backend services |

Validation rejects invalid URLs, incomplete Supabase pairs, and backend mode
without an API URL. `NEXT_PUBLIC_*` values are visible to visitors and must
never contain secrets.

## HTTP and JSON contract

Responses use JSON and ISO 8601 timestamps.

### Health

`GET /health` is public.

```json
{"status":"ok","service":"vurenn-api"}
```

### Models

`GET /v1/models` is public.

```json
{
  "models": [{
    "id": "vurenn-fast",
    "name": "Vurenn Fast",
    "description": "string",
    "status": "available",
    "required_plan": "free",
    "capabilities": ["string"]
  }]
}
```

`status` is `available`, `unavailable`, `coming_soon`, or `maintenance`.
`required_plan` is `free`, `pro`, or `premier`.

### Create conversation

`POST /v1/conversations` is authenticated. The frontend also sends
`X-Idempotency-Key: <temporary_id>`.

```json
{
  "temporary_id": "temp_c_...",
  "title": "First message title",
  "model_id": "vurenn",
  "project_id": null
}
```

Response:

```json
{
  "id": "conversation_...",
  "title": "First message title",
  "model_id": "vurenn",
  "project_id": null,
  "created_at": "2026-07-23T12:00:00Z",
  "updated_at": "2026-07-23T12:00:00Z"
}
```

Repeated requests with the same temporary ID must return the same logical
conversation, not create duplicates.

### List conversations

`GET /v1/conversations` is authenticated.

```json
{
  "conversations": [{
    "id": "conversation_...",
    "title": "Title",
    "model_id": "vurenn",
    "project_id": null,
    "created_at": "2026-07-23T12:00:00Z",
    "updated_at": "2026-07-23T12:00:00Z"
  }]
}
```

### Conversation messages

`GET /v1/conversations/{conversationId}/messages` is authenticated.

```json
{
  "messages": [{
    "id": "message_...",
    "conversation_id": "conversation_...",
    "role": "assistant",
    "content": "string",
    "status": "completed",
    "attachments": [{
      "id": "file_...",
      "name": "notes.pdf",
      "mime_type": "application/pdf",
      "size": 1024
    }],
    "created_at": "2026-07-23T12:00:00Z"
  }]
}
```

Roles are `user`, `assistant`, `system`, `tool`, or `status`. Statuses are
`pending`, `streaming`, `completed`, `stopped`, or `failed`.

Rename, pin, archive, delete, project, settings-sync, billing, upload, and
secure-admin endpoints are not invented here. Their unconfigured adapters
return explicit errors until a contract is agreed.

## Streaming chat

`POST /v1/chat/stream` is authenticated, returns
`Content-Type: text/event-stream`, and receives
`X-Idempotency-Key: <request_id>`.

```json
{
  "conversation_id": "conversation_...",
  "message": "Exact user text",
  "model": "vurenn",
  "attachments": [{
    "id": "file_...",
    "name": "notes.pdf",
    "mime_type": "application/pdf",
    "size": 1024
  }]
}
```

Events are separated by a blank line:

```text
event: message_started
data: {"message_id":"message_..."}

event: token
data: {"text":"partial text"}

event: source
data: {"id":"source_1","title":"Title","url":"https://example.com"}

event: tool_started
data: {"tool_call_id":"tool_1","tool_name":"search"}

event: tool_completed
data: {"tool_call_id":"tool_1","tool_name":"search","summary":"Completed"}

event: message_completed
data: {"message_id":"message_...","conversation_id":"conversation_...","usage":{"input_tokens":0,"output_tokens":0}}

event: done
data: {}
```

Failure:

```text
event: error
data: {"code":"string","message":"string","retryable":true}
```

The parser supports CRLF/LF framing, partial chunks, several events per chunk,
comments, multiline data, and split UTF-8 decoding. Malformed payloads become
structured errors. On browser abort, the server should promptly stop provider
work. The frontend preserves partial text and marks the message stopped.

## Authentication header

For authenticated requests, `ApiClient` asks `AuthService.getAccessToken()`:

```http
Authorization: Bearer <access_token>
```

Tokens are never written to Vurenn's own localStorage keys or shown in
diagnostics. A 401 invokes the centralized unauthorized handler. The API must
validate the JWT and derive user, role, plan, and ownership server-side.

## Error contract

Return this shape for non-2xx responses:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Human-readable safe message.",
    "details": {}
  }
}
```

Top-level `code`, `message`, and `details` are also accepted. Include
`X-Request-ID`, and include `Retry-After` for 429 when known. The client
normalizes 401, 403, 404, 409, 422, 429, 5xx, network failures, timeouts,
invalid JSON, and aborts.

Never expose stack traces, SQL, credentials, keys, routing IDs, or other users'
data.

## Temporary-to-real conversation flow

1. Generate temporary conversation and request IDs in the browser.
2. Insert the conversation, exact user text, attachment metadata, and one
   assistant placeholder locally.
3. Immediately navigate to `/chat/{temporaryId}`.
4. Create the conversation using the temporary ID as the idempotency key.
5. Atomically replace pending references before routing to the stable ID.
6. Resume the preserved first message and start one stream on the stable route.
7. Gate duplicate submissions.
8. Retry by replacing the assistant placeholder, not duplicating the user.

Stable backend conversation IDs may not change after creation.

## File upload integration

The frontend validates and preserves selected metadata but does not upload
bytes. Current local types are PDF, text, CSV, JSON, JPEG, PNG, and WebP, with a
25 MB local ceiling.

When the contract is agreed:

1. Implement `FileService.uploadFile` using an approved direct endpoint or
   backend-issued signed authorization.
2. Report progress and return stable ID, name, MIME type, and size.
3. Attach only returned file metadata to chat.
4. Implement cancellation, retry, removal, lookup, and deletion.
5. Revalidate type, size, ownership, and security policy on the backend.

Never give storage administrator credentials to the browser.

## Settings migration

Local settings schema:

```json
{"schemaVersion":1,"theme":"dark","selectedModelId":"vurenn"}
```

The local adapter migrates legacy theme/model keys without deleting them. When
settings endpoints exist, send `getMigrationPayload()` after authentication,
define server-vs-local precedence, and retain theme locally for first paint.

## Plans, entitlements, and admin

Free, Pro, and Premier remain centralized in `lib/config/plans.ts`. Features
use `SubscriptionService`; model selection uses `ModelService.canAccess`. The
frontend does not define exact numeric limits. The API must independently
enforce subscription, model, feature, and cost limits.

`/admin` is an explicitly labeled, unsecured local preview. Before production,
replace `developmentAdminService` with role-protected endpoints for plans,
models, features, limits, content, announcements, flags, users, status, and
audit logs. Add server-side roles, draft/preview/publish, and immutable audit
records.

## CORS

Allow only known frontend origins. Permit the contract's methods plus
`Authorization`, `Content-Type`, `Accept`, and `X-Idempotency-Key`. Expose
`X-Request-ID` and `Retry-After`. Do not combine credentials with wildcard
origins. Disable proxy buffering for SSE and allow an appropriate stream idle
timeout.

## Local development

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Leave backend mode false for frontend-only preview. With backend mode true,
protected UI routes require the future auth adapter. The development-only
`/dev/backend` route can check health and models without displaying secrets.

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Production connection

1. Deploy the Python API behind HTTPS.
2. Configure exact origins and non-buffered streaming.
3. Connect the approved Supabase browser client and backend JWT validation.
4. Set the four frontend environment variables in the host.
5. Validate mock and backend modes.
6. Smoke-test expiry, 401/403, idempotency, first-message routing, interruption,
   retry, rate limits, and mobile navigation.
7. Keep all provider and service-role credentials in backend secret storage.

Use `docs/backend-checklist.md` as Andrew's acceptance checklist.
