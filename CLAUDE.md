# CLAUDE.md — Gavah (گواه)

Persian-first video testimonial SaaS. Businesses send a link → their customers record a short video/text testimonial in the browser → Gavah auto-transcribes (Persian), adds word-by-word subtitles and the business's brand frame → outputs an embeddable "Wall of Love" widget + a vertical MP4 clip for Instagram.

Working name "Gavah" is a placeholder — keep all branding in one config file (`src/config/brand.ts`) so renaming is a one-file change.

## Who builds & runs this

Solo founder, deploys on a Linux VPS (Ubuntu, nginx, pm2). Preferences that are hard requirements:
- **One-command deploy** via a `deploy.sh` script (git pull → install → build → migrate → pm2 restart). GitHub-based workflow.
- Python deps installed **system-wide with `pip install --break-system-packages`** — do NOT create virtualenvs.
- Keep ops simple: no Docker, no Kubernetes, no managed queues. Prefer boring solutions.

## Architecture

Two processes, one repo:

```
gavah/
├── app/                  # Next.js 14+ (App Router, TypeScript, Tailwind)
│   ├── src/app/(marketing)/        # later; marketing site may live elsewhere
│   ├── src/app/(dashboard)/        # authed business dashboard
│   ├── src/app/r/[slug]/           # PUBLIC collection page (customer records here)
│   ├── src/app/wall/[slug]/        # PUBLIC hosted Wall of Love page
│   ├── src/app/w/[slug]/           # iframe content the embed script loads
│   ├── src/app/api/                # route handlers (REST-ish)
│   └── public/embed.js             # the 2-line embed loader (vanilla JS, <4KB)
├── worker/               # Python worker: transcription + clip rendering
│   ├── worker.py         # poll loop
│   └── requirements.txt  # faster-whisper, ffmpeg via system binary
├── deploy.sh
└── CLAUDE.md
```

- **Web app:** Next.js, runs under pm2 (`pm2 start npm --name gavah -- start`), behind nginx.
- **Worker:** single Python process under pm2 (`pm2 start worker/worker.py --name gavah-worker --interpreter python3`). It polls the DB `jobs` table every 3s. No Redis, no Celery — a DB-backed job table is enough at MVP scale (~tens of videos/day).
- **DB:** SQLite via Prisma (file at `/var/lib/gavah/gavah.db`). Design schema so a later move to Postgres is a connection-string change (no SQLite-only features).
- **Storage:** Cloudflare R2 (S3-compatible). Browser uploads video **directly to R2 via presigned URLs** — video bytes must never pass through the Next.js server. Playback via R2 public bucket / custom domain (free egress).
- **Transcription:** faster-whisper (model `small` or `medium`, CPU, `language="fa"`, `word_timestamps=True`). Store the word-level JSON in DB.
- **Clip rendering (vertical MP4):** worker-side ffmpeg. Generate an `.ass` subtitle file from word timestamps (karaoke-style `\k` tags for word-by-word highlight), burn onto a 1080x1920 composition: brand-color background bar/frame, business logo top-right, video centered. Do NOT attempt client-side WebCodecs export in MVP — server ffmpeg is the reliable path.

## Data model (Prisma)

- `User` — id, email, passwordHash, name, createdAt
- `Project` — id, userId, name, slug (unique, url-safe), brandColor, logoUrl, plan (`free`|`pro`), createdAt
- `Testimonial` — id, projectId, type (`video`|`text`), status (`pending`|`approved`|`rejected`), authorName, authorRole, rating (1-5), text (for text type / edited transcript), videoKey (R2 key), thumbKey, transcriptJson, clipKey (rendered MP4), createdAt
- `Job` — id, testimonialId, kind (`transcribe`|`render_clip`), status (`queued`|`running`|`done`|`failed`), error, attempts, createdAt, updatedAt
- `Session` — standard session table for auth

## Auth

Email + password only. Use Lucia (or hand-rolled: bcrypt + httpOnly session cookie). No OAuth in MVP. Rate-limit login and signup.

## Product rules (business logic)

- **Free plan:** max **5 testimonials per project**, 1 project, "ساخته‌شده با گواه" badge rendered on all widgets/walls/clips. Enforce the cap server-side at testimonial creation; when hit, collection page still accepts nothing new and dashboard shows upgrade prompt.
- **Pro plan ($19/mo):** unlimited testimonials, 3 projects, no badge, HD clip export. Stripe Checkout + webhook (`checkout.session.completed`, `customer.subscription.deleted`). Build billing LAST (Milestone 4) behind a feature flag; until then a manual `plan` column flip is fine.
- Testimonials are NEVER public until `status = approved`.
- Collection page requires no auth from the recording customer.

## Key flows

1. **Collection (`/r/[slug]`):** mobile-first page. Shows project brand chip + 3 guiding questions (hardcoded defaults for MVP, per-project custom later). Two paths: (a) video — `getUserMedia` + `MediaRecorder` (webm), 90s max, preview, retake, then presigned PUT to R2 and POST metadata (name, role, rating, consent checkbox); (b) text — simple form. On submit for video: create Testimonial (pending) + Job (transcribe).
2. **Worker:** transcribe job → faster-whisper → save transcriptJson + set `text` to full transcript → auto-queue render_clip job → ffmpeg burn → upload MP4 to R2 → save clipKey.
3. **Dashboard:** projects list → testimonial inbox (pending first) → approve/reject → widget code snippet + hosted wall link → clip download button (when rendered) → brand settings (color picker + logo upload).
4. **Embed:** customer pastes `<script src="https://DOMAIN/embed.js" async></script><div data-gavah-wall="slug"></div>`. embed.js finds the div, injects an iframe to `/w/[slug]`, auto-resizes via postMessage. `/w/[slug]` and `/wall/[slug]` render approved testimonials only, cached (`s-maxage=300`), masonry layout, video cards with poster + play.

## UI / design system

- **RTL-first.** Root layout: `dir="rtl" lang="fa"`. Use CSS logical properties (`margin-inline-start`, etc.) everywhere. All UI copy in Persian (keep strings in `src/i18n/fa.ts` for a later English pass — no i18n framework yet, just the strings file).
- Font: Vazirmatn (self-host via `next/font/local` or npm package `vazirmatn`).
- Tokens: ink `#152238`, turquoise `#0FA08E` (hover `#0A6E62`), saffron `#E9A13B` (sparingly), porcelain bg `#F3F6F5`, card `#FFFFFF`, hairline `#E2E9E8`, radius 16px. Match the look of the existing mockup (`gavah-mvp-mockup.html` if present in repo).
- Persian digits in UI where natural (`۱۲۳`); latin digits in code/URLs.
- Persian line-height ≥ 1.75. Test every screen at 360px width.

## Security & correctness (non-negotiable)

- Validate uploads: content-type + max size (100MB) enforced in presign logic; R2 keys are server-generated UUIDs, never user-supplied names.
- All public endpoints rate-limited (simple in-memory or DB-backed limiter is fine).
- Sanitize/escape all user text everywhere it renders (widget XSS is the nightmare scenario — testimonial text renders on OTHER people's websites; treat it as hostile input, render as text nodes only, never innerHTML).
- Embed iframe: set proper `Content-Security-Policy` and `X-Frame-Options: ALLOWALL` only on `/w/*` routes; dashboard routes deny framing.
- Consent checkbox text stored with timestamp on each testimonial (GDPR-adjacent hygiene).
- Never log video URLs or personal data; worker errors go to `Job.error`.

## Milestones — build in this order, each independently shippable

1. **M1 — Collect & display (the working skeleton):** auth, project CRUD + brand settings, collection page (text + video recording + R2 upload), dashboard inbox with approve/reject, hosted wall + embed widget + embed.js, free-tier cap + badge. *At the end of M1 the product is usable and demo-able without any AI.*
2. **M2 — The magic:** Python worker, faster-whisper Persian transcription, transcript shown/editable in dashboard.
3. **M3 — The clip:** ffmpeg vertical clip render with karaoke subtitles + brand frame, download button, thumbnail generation.
4. **M4 — Money:** Stripe checkout, webhook, plan enforcement, upgrade prompts.

## Commands & env

```bash
# app
cd app && npm run dev            # local dev
npm run build && npm start      # prod
npx prisma migrate dev          # schema changes
npx prisma studio               # inspect DB

# worker
python3 worker/worker.py        # deps: pip install -r worker/requirements.txt --break-system-packages
# requires system ffmpeg: apt install ffmpeg

# deploy (on VPS)
./deploy.sh                     # git pull, npm ci, build, prisma migrate deploy, pm2 restart gavah gavah-worker
```

`.env` (never commit): `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `SESSION_SECRET`, `APP_URL`, `STRIPE_SECRET_KEY` (M4), `STRIPE_WEBHOOK_SECRET` (M4).

## Conventions

- TypeScript strict; no `any` without a comment justifying it.
- Server-side validation with zod on every API input.
- Keep components small; colocate by route. No global state library — server components + minimal client islands.
- Commit style: `m1: collection page recording flow` (milestone-prefixed).
- When a decision isn't covered here, choose the boring, maintainable option and note it in `DECISIONS.md`.
