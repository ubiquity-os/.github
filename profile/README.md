# Plugin Health Monitor

This profile scans public repositories in `ubiquity-os-marketplace` for workflows with sustained failure streaks and posts a concise alert back to the tracking issue when the threshold is reached.

## Purpose

- detect repositories that have `>= 10` consecutive workflow failures
- count only `workflow_dispatch` runs so the monitor stays scoped to the bounty's manual-trigger signal
- attach useful failure context for maintainers
- post a deduplicated alert comment on the tracking issue
- write a JSON report for downstream automation or review

## Run locally

```bash
GITHUB_TOKEN=... node profile/scripts/plugin-health-monitor.mjs
node --test profile/scripts/plugin-health-monitor.test.mjs
```

## Environment

- `GITHUB_TOKEN`: required GitHub API token
- `TARGET_ORG`: monitored org, defaults to `ubiquity-os-marketplace`
- `FAILURE_STREAK_THRESHOLD`: consecutive failure threshold, defaults to `10`
- `ALERT_REPO`: repository that receives the alert comment
- `ALERT_ISSUE_NUMBER`: tracking issue number, defaults to `12`
- `ALERT_TAGS`: mention list for the alert comment
- `OUTPUT_PATH`: JSON report path, defaults to `profile/plugin-health-report.json`

## Output

- `profile/plugin-health-report.json`
- GitHub Actions job summary with scan counts and top findings
- alert comment on the tracking issue when findings exist
