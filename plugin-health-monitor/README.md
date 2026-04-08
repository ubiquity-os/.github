# Plugin Health Monitor

A daily cron job that checks all plugins in the `@ubiquity-os-marketplace` organization for consecutive GitHub Actions workflow failures.

## How It Works

1. **Lists all repositories** in the `ubiquity-os-marketplace` organization via the GitHub API.
2. **Checks the last 10 completed workflow runs** for each repository.
3. **Counts consecutive failures** — if a repo has 10 or more consecutive failures, it's flagged.
4. **Posts a notification** by creating or updating an issue on `ubiquity-os/.github`, tagging `@0x4007` and `@gentlementlegen`.

## Configuration

No configuration needed. The workflow runs daily at 06:00 UTC and can also be triggered manually via `workflow_dispatch`.

### Required Secrets

- `GITHUB_TOKEN` — automatically provided by GitHub Actions.

## Local Development

```bash
cd plugin-health-monitor
npm install
GITHUB_TOKEN=<your-token> npx tsx src/monitor.ts
```

## Threshold

The default consecutive failure threshold is **10**. To change it, modify `CONSECUTIVE_FAILURE_THRESHOLD` in `src/monitor.ts`.
