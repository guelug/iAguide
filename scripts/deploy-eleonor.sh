#!/usr/bin/env bash
# Eleonor's existing cron entry invokes this script through ~/bin/iaguide-auto-deploy.sh.
set -euo pipefail
APP_DIR="/home/pedro/workspace/iAguide"
PORT=3010
LOG="/tmp/iaguide-deploy.log"
BUN="/home/pedro/.bun/bin/bun"
exec 9>/tmp/iaguide-deploy.lock
flock -n 9 || exit 0
cd "$APP_DIR"
git fetch origin main --quiet 2>>"$LOG"
CURRENT=$(git rev-parse HEAD)
TARGET=$(git rev-parse origin/main)
if [ "$CURRENT" = "$TARGET" ] && [ ! -f /tmp/iaguide-deploy-pending ]; then exit 0; fi
printf '%s\n' "$TARGET" > /tmp/iaguide-deploy-pending
printf '[deploy] %s -> %s at %s\n' "$CURRENT" "$TARGET" "$(date -Is)" >>"$LOG"
# Preserve server-local dependency adjustments; refuse conflicts instead of discarding them.
git diff HEAD > "/tmp/iaguide-local-backup-$(date +%Y%m%d-%H%M%S).patch"
git merge --ff-only origin/main >>"$LOG" 2>&1
"$BUN" install >>"$LOG" 2>&1
if ! "$BUN" run build >>"$LOG" 2>&1; then
  printf '[deploy] BUILD FAILED at %s\n' "$(date -Is)" >>"$LOG"
  exit 1
fi
# There must be one owner of port 3010. Replace the legacy orphan started by nohup.
systemctl --user stop iaguide.service
PID=$(ss -ltnp "sport = :$PORT" | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1)
if [ -n "$PID" ]; then
  if [ "$(readlink "/proc/$PID/cwd")" != "$APP_DIR" ]; then
    echo '[deploy] Refusing to stop an unrelated process on port 3010' >>"$LOG"
    exit 1
  fi
  kill "$PID"
  for _ in $(seq 1 20); do
    kill -0 "$PID" 2>/dev/null || break
    sleep 0.25
  done
fi
systemctl --user reset-failed iaguide.service
systemctl --user start iaguide.service
for _ in $(seq 1 30); do
  if curl --fail --silent --max-time 5 "http://127.0.0.1:$PORT/es" >/dev/null; then
    printf '[deploy] healthy %s at %s\n' "$TARGET" "$(date -Is)" >>"$LOG"
    rm -f /tmp/iaguide-deploy-pending
    exit 0
  fi
  sleep 1
done
echo '[deploy] Health check failed' >>"$LOG"
exit 1
