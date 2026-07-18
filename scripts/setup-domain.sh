#!/usr/bin/env bash
# Point a (sub)domain at this Gavah VPS, with HTTPS via Let's Encrypt.
#
#   bash scripts/setup-domain.sh gavah.nazarbanai.com [email-for-certbot]
#
# Prerequisite: a DNS A record for the domain pointing at this server's IP,
# already propagated (check with: getent hosts <domain>). If the domain sits
# behind Cloudflare, set the record to "DNS only" (gray cloud) while certbot
# issues the certificate; you can turn the proxy back on afterwards.
#
# What it does (idempotent, safe to re-run):
#   1. nginx server block for the domain (same proxy + /media as setup-vps.sh)
#   2. certbot --nginx  ->  HTTPS + auto-renewal (getUserMedia/video recording
#      only works on secure origins, so this unlocks the camera demo)
#   3. APP_URL in app/.env  ->  https://<domain>  (links + embed snippets)
#   4. pm2 restart gavah so the app picks up the new APP_URL
#
# The bare-IP catch-all from setup-vps.sh keeps working alongside this.
set -euo pipefail

if [ "$(id -u)" != 0 ]; then
  echo "run as root (sudo bash scripts/setup-domain.sh <domain>)" >&2
  exit 1
fi
DOMAIN="${1:-}"
EMAIL="${2:-}"
if [ -z "$DOMAIN" ]; then
  echo "usage: bash scripts/setup-domain.sh <domain> [email-for-certbot]" >&2
  exit 1
fi
DIR="$(cd "$(dirname "$0")/.." && pwd)"

APP_PORT="$( (grep -oE '^PORT="?[0-9]+' "$DIR/app/.env" | grep -oE '[0-9]+') 2>/dev/null || true)"
APP_PORT="${APP_PORT:-3000}"

# --- sanity: does the domain resolve to this box? (warn only — DNS may lag) --
SERVER_IP="$(hostname -I | awk '{print $1}')"
DOMAIN_IP="$(getent hosts "$DOMAIN" | awk '{print $1; exit}' || true)"
if [ -z "$DOMAIN_IP" ]; then
  echo "WARNING: $DOMAIN does not resolve yet. Create the A record ($DOMAIN -> $SERVER_IP)"
  echo "         and wait for DNS to propagate; certbot will fail until it does."
elif [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
  echo "WARNING: $DOMAIN resolves to $DOMAIN_IP but this server is $SERVER_IP."
  echo "         If the domain is Cloudflare-proxied, switch it to 'DNS only' for issuance."
fi

echo "==> nginx server block for $DOMAIN (app port $APP_PORT)"
CONF="/etc/nginx/sites-available/gavah-$DOMAIN"
cat > "$CONF" <<NGINX
# Gavah — $DOMAIN (written by scripts/setup-domain.sh; certbot adds the 443 block)
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 105m;

    location /media/ {
        alias /var/lib/gavah/media/;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files \$uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
NGINX
ln -sf "../sites-available/gavah-$DOMAIN" "/etc/nginx/sites-enabled/gavah-$DOMAIN"
nginx -t
systemctl reload nginx

echo "==> certbot (Let's Encrypt)"
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx
fi
if [ -n "$EMAIL" ]; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
else
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
fi

echo "==> APP_URL -> https://$DOMAIN"
if grep -q '^APP_URL=' "$DIR/app/.env"; then
  sed -i "s|^APP_URL=.*|APP_URL=\"https://$DOMAIN\"|" "$DIR/app/.env"
else
  echo "APP_URL=\"https://$DOMAIN\"" >> "$DIR/app/.env"
fi
pm2 restart gavah --update-env
pm2 save

echo "==> done — https://$DOMAIN"
echo "    camera recording now works: https://$DOMAIN/r/cafe-gandom"
echo "    (bare-IP http access keeps working for anything that used it)"
