#!/usr/bin/env bash
set -euo pipefail

ORG="ubiquity-os-marketplace"
CONSECUTIVE_THRESHOLD=10
RUNS_TO_CHECK=20
ISSUE_REPO="ubiquity-os/.github"

echo "Fetching repos for org: $ORG"
repos=$(gh api "/orgs/$ORG/repos" --paginate --jq '.[].full_name' 2>/dev/null)

if [ -z "$repos" ]; then
  echo "No repos found or API error"
  exit 1
fi

for repo in $repos; do
  echo "Checking $repo..."

  # Get recent workflow runs (completed ones only)
  conclusions=$(gh api "/repos/$repo/actions/runs?per_page=$RUNS_TO_CHECK" \
    --jq '.workflow_runs[] | select(.status == "completed") | .conclusion' 2>/dev/null || true)

  if [ -z "$conclusions" ]; then
    echo "  No completed workflow runs found"
    continue
  fi

  # Count consecutive failures from the most recent run
  consecutive_failures=0
  for conclusion in $conclusions; do
    if [ "$conclusion" = "failure" ]; then
      consecutive_failures=$((consecutive_failures + 1))
    else
      break
    fi
  done

  echo "  Consecutive failures: $consecutive_failures"

  if [ "$consecutive_failures" -ge "$CONSECUTIVE_THRESHOLD" ]; then
    echo "  WARNING: $repo has $consecutive_failures consecutive failures!"

    # Check if we already have an open issue for this repo
    repo_name=$(basename "$repo")
    existing=$(gh issue list --repo "$ISSUE_REPO" --search "Plugin Health Alert: $repo" --state open --json number --jq 'length' 2>/dev/null || echo "0")

    if [ "$existing" -gt "0" ]; then
      echo "  Already has an open issue, skipping"
      continue
    fi

    # Get recent runs summary
    recent_runs=$(gh api "/repos/$repo/actions/runs?per_page=5" \
      --jq '.workflow_runs[] | "- **\(.name)** (\(.conclusion // "in_progress")) - \(.created_at)"' 2>/dev/null || echo "Could not fetch run details")

    today=$(date -u +%Y-%m-%d)

    # Create an issue to notify
    gh issue create \
      --repo "$ISSUE_REPO" \
      --title "Plugin Health Alert: $repo has $consecutive_failures consecutive workflow failures" \
      --body "## Plugin Health Alert

**Repository:** [$repo](https://github.com/$repo)
**Consecutive Failures:** $consecutive_failures
**Detected:** $today

The last $consecutive_failures workflow runs for \`$repo\` have all failed.

### Recent workflow runs:
$recent_runs

cc @0x4007 @gentlementlegen"

    echo "  Created issue notification"
  fi
done

echo "Health check complete"
