# Gavah (گواه)

Persian-first video testimonial SaaS. Businesses send a link → customers
record a short video/text testimonial in the browser → Gavah auto-transcribes
(Persian), adds word-by-word subtitles and the business's brand frame →
outputs an embeddable "Wall of Love" widget + a vertical MP4 clip.

- `app/` — Next.js 14 (App Router, TypeScript, Tailwind), SQLite via Prisma
- `worker/` — Python worker: faster-whisper transcription + ffmpeg clip render
- `design/mockups/` — static design mockups
- `deploy.sh` — one-command VPS deploy (git pull → build → migrate → pm2)

See `CLAUDE.md` for the full spec and `DECISIONS.md` for choices made along
the way.

## Local dev

```bash
cd app
cp .env.example .env       # fill in R2 + SESSION_SECRET; DATABASE_URL="file:./dev.db" works locally
npm install
npx prisma migrate dev
npm run dev

# worker (needs ffmpeg + fonts-vazirmatn installed)
pip install -r worker/requirements.txt --break-system-packages
GAVAH_DB=app/prisma/dev.db python3 worker/worker.py
```

## Production (VPS)

First time, on a fresh Ubuntu server (as root, no domain needed):

```bash
git clone https://github.com/HeyArio/testimony.git ~/testimony
bash ~/testimony/scripts/setup-vps.sh
```

That installs Node + pm2 + nginx + ffmpeg/fonts, creates `app/.env` with a
generated `SESSION_SECRET` (fill in the `R2_*` values yourself), starts both
pm2 processes (`gavah`, `gavah-worker`), and serves the app on
`http://<server-ip>`. It also installs the one-word deploy command:

```bash
deploytest   # = ./deploy.sh: git pull → install → migrate → build → pm2 restart
```

When a domain arrives: point DNS at the server, set `server_name` in
`/etc/nginx/sites-available/gavah`, run `certbot --nginx`, and change
`APP_URL` in `app/.env` to the https URL.

## Demo without a domain or R2 (local storage mode)

With `R2_ACCOUNT_ID` left empty in `app/.env` (the setup default), media is
stored on the VPS disk (`/var/lib/gavah/media`) and served from `/media/*` —
the whole product works end-to-end: upload, Persian transcription, karaoke
clip render, wall, embed. Fill in the `R2_*` vars later to switch to R2.

Seed believable content (fictional café, Persian testimonials, pro plan):

```bash
cd ~/testimony
node scripts/seed-demo.mjs                          # demo login + text testimonials
node scripts/seed-demo.mjs --videos ~/demo-videos   # + ingest mock videos (mp4/mov/webm)
```

For mock videos: record a few 20–60s clips on a phone (portrait, Persian),
`scp` them to `~/demo-videos` on the VPS, run the line above. They are
normalized to H.264, transcribed, and rendered into branded karaoke clips
automatically (`pm2 logs gavah-worker` to watch). Dashboard login:
`demo@gavah.local` / `demo1234`. Reset demo content: `--reset`.

In-browser recording on `/r/[slug]` needs HTTPS (browsers block the camera
on plain http:// IPs). For a live recording demo:

```bash
bash scripts/demo-tunnel.sh   # prints a free https://….trycloudflare.com URL
```

If transcribe jobs fail with `403 Forbidden`, Hugging Face is blocked from
the server's region — set `HF_ENDPOINT="https://hf-mirror.com"` in
`app/.env` and run `deploytest`.
