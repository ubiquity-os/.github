# Override + Replan Flow (PR-3)

## Goal

Enable managers to correct AI recommendations in seconds and regenerate a new sprint plan.

## User Actions

1. Change priority (`low/normal/high/urgent`)
2. Change assignee
3. Pin item to specific date
4. Mark recommendation as "ignored"

## API Contract (suggested)

### PATCH /sprints/{sprintId}/items/{itemId}
- accepts partial updates to priority/assignee/date/ignored
- may record actor and timestamp in server-side audit logs

### POST /sprints/{sprintId}/replan
- recalculates only impacted items
- preserves human overrides as hard constraints
- returns updated calendar payload + fresh value metrics

## UX Guardrails

- show visual badge for user-overridden items
- never silently revert explicit user edits
- show delta summary after replan (e.g., effort redistribution)
