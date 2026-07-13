#!/usr/bin/env bash
# One-time bootstrap for a fresh Ubuntu VPS (run as root). Idempotent — safe
# to re-run; it skips anything already in place and never overwrites app/.env
# or an existing nginx config.
#
#   git clone https://github.com/HeyArio/testimony.git ~/testimony
#   bash ~/testimony/scripts/setup-vps.sh
#
# After it finishes, the app is live on http://<server-ip> (no domain needed)
# and every future deploy is just:  deploytest
#
# Overridables:  REPO_URL, GAVAH_DIR (default ~/testimony), BRANCH (default
# main), SERVER_IP (default: first address from `hostname -I`).
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/HeyArio/testimony.git}"
DIR="${GAVAH_DIR:-$HOME/testimony}"
BRANCH="${BRANCH:-main}"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run as root (the VPS deploy user)." >&2
  exit 1
fi
export DEBIAN_FRONTEND=noninteractive

echo "==> apt packages (git, nginx, ffmpeg, fonts, python)"
apt-get update -qq
apt-get install -y -qq ca-certificates curl git nginx ffmpeg fonts-vazirmatn \
  python3 python3-pip sqlite3

echo "==> node.js 22 (NodeSource) + pm2"
need_node=1
if command -v node >/dev/null 2>&1; then
  major="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$major" -ge 20 ] && need_node=0
fi
if [ "$need_node" -eq 1 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
command -v pm2 >/dev/null 2>&1 || npm install -g pm2 --silent

echo "==> repo at $DIR (branch $BRANCH)"
if [ ! -d "$DIR/.git" ]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$DIR"
fi

echo "==> data dir /var/lib/gavah (SQLite + local-mode media live here)"
mkdir -p /var/lib/gavah/media

echo "==> app/.env"
if [ ! -f "$DIR/app/.env" ]; then
  cp "$DIR/app/.env.example" "$DIR/app/.env"
  SECRET="$(openssl rand -hex 32)"
  sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=\"$SECRET\"|" "$DIR/app/.env"
  IP="${SERVER_IP:-$(hostname -I | awk '{print $1}')}"
  sed -i "s|^APP_URL=.*|APP_URL=\"http://$IP\"|" "$DIR/app/.env"
  echo "    created with a generated SESSION_SECRET and APP_URL=http://$IP"
  echo "    -> fill in the R2_* values before collecting video testimonials"
else
  echo "    exists, leaving it alone"
fi

echo "==> nginx: serve the app on port 80 (IP only, no domain yet)"
if [ ! -f /etc/nginx/sites-available/gavah ]; then
  cat > /etc/nginx/sites-available/gavah <<'NGINX'
# Gavah — catch-all server so the bare IP works until there is a domain.
# When a domain arrives: set server_name, then `certbot --nginx`.
server {
    # IPv4 only — add `listen [::]:80 default_server;` if the box has IPv6.
    listen 80 default_server;
    server_name _;

    # With R2 configured, videos upload straight to R2 via presigned URLs and
    # only small payloads pass through here. Without R2 (local demo mode),
    # uploads go to /api/upload/* — allow up to the app's 100MB video cap.
    client_max_body_size 105m;

    # Local-storage mode media (demo mode, no R2): serve straight from disk.
    # Harmless when R2 is configured — these files just won't exist.
    location /media/ {
        alias /var/lib/gavah/media/;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
NGINX
fi
ln -sf ../sites-available/gavah /etc/nginx/sites-enabled/gavah
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  echo "==> ufw: allow HTTP"
  ufw allow 80/tcp >/dev/null
fi

echo "==> deploytest command -> /usr/local/bin/deploytest"
cat > /usr/local/bin/deploytest <<WRAP
#!/usr/bin/env bash
# Deploy Gavah: git pull, install deps, migrate, build, pm2 restart.
exec bash "$DIR/deploy.sh" "\$@"
WRAP
chmod 755 /usr/local/bin/deploytest

echo "==> pm2: resurrect processes on reboot"
pm2 startup systemd -u root --hp /root >/dev/null

echo "==> first deploy"
bash "$DIR/deploy.sh"

IP="${SERVER_IP:-$(hostname -I | awk '{print $1}')}"
cat <<DONE

────────────────────────────────────────────────────────
 Done. The app is running:

   http://$IP            (nginx -> Next.js)

 Every deploy from now on:   deploytest

 Next steps:
   - Fill R2 credentials in $DIR/app/.env, then run: deploytest
   - Logs:      pm2 logs gavah / pm2 logs gavah-worker
   - Status:    pm2 status
   - First video transcription downloads the whisper model
     (~500 MB, one time).
────────────────────────────────────────────────────────
DONE
