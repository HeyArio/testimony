#!/usr/bin/env bash
# Free HTTPS for demos, before a domain exists.
#
# Browsers only allow camera/mic (getUserMedia) on secure origins, so the
# recording flow on /r/[slug] won't work over http://<ip>. This opens a
# Cloudflare "quick tunnel" (no account needed) and prints a random
# https://….trycloudflare.com URL that proxies to the local app. Share that
# URL for the demo; Ctrl-C closes it. URL changes on every run — fine for a
# demo, not for production.
set -euo pipefail

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "==> installing cloudflared"
  arch="$(dpkg --print-architecture)"   # amd64 or arm64
  curl -fsSL -o /tmp/cloudflared.deb \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${arch}.deb"
  dpkg -i /tmp/cloudflared.deb
  rm -f /tmp/cloudflared.deb
fi

echo "==> opening tunnel to http://127.0.0.1:3000 (Ctrl-C to stop)"
echo "    the https URL appears in the box below — open /r/<slug> on it to demo recording"
exec cloudflared tunnel --url http://127.0.0.1:3000
