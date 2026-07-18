#!/usr/bin/env bash
# Wire the Gavah Telegram bot: writes env vars and registers the webhook.
#
#   bash scripts/setup-telegram.sh
#
# One-time prep in Telegram first:
#   1. Open @BotFather → /newbot → pick a name and a username
#      (e.g. GavahBot). Copy the HTTP API token it prints.
#   2. Run this script on the VPS and paste the token when asked.
#
# Needs APP_URL in app/.env to be an https:// URL (Telegram refuses plain
# http webhooks) — run scripts/setup-domain.sh first if you haven't.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$DIR/app/.env"

[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE missing (run setup-vps.sh first)" >&2; exit 1; }

get() { grep -oP "^$1=\"?\K[^\"]*" "$ENV_FILE" 2>/dev/null || true; }
setvar() {
  if grep -q "^$1=" "$ENV_FILE"; then
    sed -i "s|^$1=.*|$1=\"$2\"|" "$ENV_FILE"
  else
    printf '%s="%s"\n' "$1" "$2" >> "$ENV_FILE"
  fi
}

APP_URL="$(get APP_URL)"
case "$APP_URL" in
  https://*) ;;
  *) echo "ERROR: APP_URL is '$APP_URL' — Telegram needs https. Run scripts/setup-domain.sh first." >&2; exit 1 ;;
esac

TOKEN="$(get TELEGRAM_BOT_TOKEN)"
if [ -z "$TOKEN" ]; then
  read -r -p "Bot token from @BotFather: " TOKEN
  [ -n "$TOKEN" ] || { echo "no token given" >&2; exit 1; }
  setvar TELEGRAM_BOT_TOKEN "$TOKEN"
fi

# Ask Telegram for the bot's username (also validates the token).
USERNAME="$(curl -s "https://api.telegram.org/bot$TOKEN/getMe" | grep -oP '"username":"\K[^"]*' || true)"
[ -n "$USERNAME" ] || { echo "ERROR: token rejected by Telegram (getMe failed)" >&2; exit 1; }
setvar TELEGRAM_BOT_USERNAME "$USERNAME"

SECRET="$(get TELEGRAM_WEBHOOK_SECRET)"
if [ -z "$SECRET" ]; then
  SECRET="$(head -c 24 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)"
  setvar TELEGRAM_WEBHOOK_SECRET "$SECRET"
fi

echo "==> registering webhook: $APP_URL/api/telegram/webhook"
RESULT="$(curl -s -X POST "https://api.telegram.org/bot$TOKEN/setWebhook" \
  -d "url=$APP_URL/api/telegram/webhook" \
  -d "secret_token=$SECRET" \
  -d 'allowed_updates=["message","callback_query"]')"
echo "    $RESULT"
case "$RESULT" in
  *'"ok":true'*) ;;
  *) echo "ERROR: setWebhook failed" >&2; exit 1 ;;
esac

echo "==> restarting app so it picks up the new env"
pm2 restart gavah --update-env >/dev/null 2>&1 || echo "    (pm2 not running — start it with ./deploy.sh)"
echo "==> done — @$USERNAME is live. Connect a project from its settings page."
