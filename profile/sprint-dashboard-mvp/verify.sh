#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-18080}"
URL="http://127.0.0.1:${PORT}"

python3 -m http.server "$PORT" >/tmp/sprint-dashboard-mvp-server.log 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in {1..20}; do
  if curl -fsS "$URL" >/tmp/sprint-dashboard-mvp-home.html 2>/dev/null; then
    break
  fi
  sleep 0.2
done

if ! grep -q "Sprint Management Dashboard" /tmp/sprint-dashboard-mvp-home.html; then
  echo "❌ Verification failed: expected page title/content not found"
  exit 1
fi

echo "✅ Sprint Dashboard MVP is reproducible"
echo "   URL: $URL"
echo "   Check: homepage contains 'Sprint Management Dashboard'"
