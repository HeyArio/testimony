#!/usr/bin/env bash
# One-command deploy for the VPS (Ubuntu + nginx + pm2).
# Usage: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==> git pull"
git pull --ff-only

echo "==> app: install & build"
cd app
npm ci
npx prisma migrate deploy
npm run build
cd ..

echo "==> worker: python deps (system-wide, no venv)"
pip install -r worker/requirements.txt --break-system-packages --quiet

echo "==> pm2 restart"
# First run: pm2 start npm --name gavah --cwd app -- start
#            pm2 start worker/worker.py --name gavah-worker --interpreter python3
pm2 restart gavah gavah-worker --update-env

echo "==> done"
