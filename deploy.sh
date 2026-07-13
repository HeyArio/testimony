#!/usr/bin/env bash
# One-command deploy for the VPS (Ubuntu + nginx + pm2).
# Usage: ./deploy.sh — or just `deploytest` (installed by scripts/setup-vps.sh).
set -euo pipefail
cd "$(dirname "$0")"

# Everything lives in main() so that `git pull` replacing this file mid-run
# can't confuse bash (the whole function is parsed before anything executes).
main() {
  if [ ! -f app/.env ]; then
    echo "ERROR: app/.env is missing. First-time setup: bash scripts/setup-vps.sh" >&2
    exit 1
  fi

  echo "==> git pull"
  git pull --ff-only

  echo "==> app: install, migrate, build"
  (cd app && npm ci --include=dev && npx prisma migrate deploy && npm run build)

  echo "==> worker: python deps (system-wide, no venv)"
  python3 -m pip install -r worker/requirements.txt --break-system-packages --quiet

  echo "==> pm2: start/restart gavah + gavah-worker"
  pm2 startOrRestart ecosystem.config.js --update-env
  pm2 save

  echo "==> done — app on 127.0.0.1:3000, nginx serves it on port 80"
}

main "$@"
