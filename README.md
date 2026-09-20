# Vurenn

Vurenn is a lightweight Next.js frontend generated with
[v0](https://v0.app). It runs in an honest local preview mode by default and
is prepared for Andrew's future Python API.

## Getting started

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Backend mode, the API/SSE contract, authentication rules, environment
variables, and deployment steps are in
[`docs/backend-integration.md`](docs/backend-integration.md). Andrew's backend
acceptance list is in
[`docs/backend-checklist.md`](docs/backend-checklist.md).

## Validation

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## v0 project

This repository remains linked to its
[v0 project](https://v0.app/chat/projects/prj_OboYVnGNgcvTvTFqcCodyO0um6mh).
Review feature branches and pull requests before merging to `main`.
