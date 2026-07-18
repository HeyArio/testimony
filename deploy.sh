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
  # A failure here must NOT abort the deploy — the web app (gavah) has to start
  # regardless. Common cause: a Debian/apt-managed package (e.g. click) with no
  # RECORD file that pip cannot upgrade; --ignore-installed sidesteps it by
  # installing over the top instead of trying to uninstall it. The worker's
  # heavy imports (faster-whisper, boto3) are lazy, so it starts and the site
  # serves fine even if this is incomplete — these are only needed when a video
  # is actually transcribed.
  if ! python3 -m pip install -r worker/requirements.txt --break-system-packages --quiet 2>/tmp/gavah-pip.log; then
    echo "    retrying with --ignore-installed (system-package conflict)…"
    if ! python3 -m pip install -r worker/requirements.txt --break-system-packages --ignore-installed --quiet 2>>/tmp/gavah-pip.log; then
      echo "    WARNING: worker deps incomplete (details in /tmp/gavah-pip.log)."
      echo "    The web app still starts; transcription/clip render may be off until this is resolved."
    fi
  fi

  echo "==> demo seed (idempotent — keeps the live marketing demo alive)"
  # Creates/updates the کافه گندم demo project the marketing site embeds.
  # Safe to run every deploy: it upserts and skips existing testimonials.
  # Must never abort the deploy — the site works without it (static fallback).
  if ! node scripts/seed-demo.mjs; then
    echo "    WARNING: demo seed failed; marketing pages fall back to static samples."
  fi

  echo "==> pm2: start/restart gavah + gavah-worker"
  pm2 startOrRestart ecosystem.config.js --update-env
  pm2 save

  port="$( (grep -oE '^PORT="?[0-9]+' app/.env | grep -oE '[0-9]+') 2>/dev/null || true)"
  echo "==> done — app on 127.0.0.1:${port:-3000}, nginx serves it on port 80"
}

main "$@"
