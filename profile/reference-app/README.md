# Sprint Dashboard Reference App (Runnable)

Minimal runnable API server implementing the PR-1/2/3 contracts for Issue #14.

## Run

```bash
cd profile/reference-app
npm test
npm start
```

Server runs on `http://localhost:8787` by default.

## Implemented endpoints

- `GET /health`
- `GET /auth/github/start`
- `GET /auth/github/callback`
- `GET /orgs`
- `POST /orgs/:orgId/connect`
- `GET /ingestion/jobs/:jobId`
- `GET /sprints/:sprintId/calendar`
- `GET /sprints/:sprintId/metrics`
- `PATCH /sprints/:sprintId/items/:itemId`
- `POST /sprints/:sprintId/replan`

This is an in-memory reference scaffold to de-risk implementation and contract alignment before production wiring.
