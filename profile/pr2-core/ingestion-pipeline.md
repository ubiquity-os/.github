# Ingestion Pipeline Spec (PR-2)

## Objective

Transform raw GitHub org/repo data into normalized planning inputs.

## Input

- Organization ID
- Selected repositories
- Optional date window

## Steps

1. **Fetch repositories metadata**
   - default branch
   - active contributors (recent 90d)
2. **Fetch open issues**
   - title/body/labels/assignees/milestones
   - created/updated timestamps
3. **Fetch PR activity signals**
   - merged PR counts by author
   - review activity
4. **Normalize and persist snapshots**
5. **Emit planning trigger event**

## Failure Handling

- retry transient GitHub API failures with exponential backoff
- partial-success mode when one repo fails
- write structured error records per repository

## Required Outputs

- `issue_snapshot`
- `member_signal_snapshot`
- `repo_health_snapshot`
- planning trigger job id
