# PR-1 Implementation Scaffold (Issue #14)

This scaffold is the implementation baseline for:

- Landing page conversion flow
- GitHub OAuth + organization connect
- Initial ingestion job skeleton

## What this scaffold provides

1. **API contract draft** (`openapi.yaml`)
2. **Database schema draft** (`schema.sql`)
3. **Delivery checklist** (`checklist.md`)

## Proposed stack (suggested)

- Frontend: Next.js + Tailwind
- Backend API: Next.js route handlers or Node/Fastify
- DB: PostgreSQL
- Queue: Redis + BullMQ (or equivalent)
- Auth: GitHub OAuth App

## Implementation target

A manager should complete first setup in < 10 minutes and trigger the first ingestion job in one flow.
