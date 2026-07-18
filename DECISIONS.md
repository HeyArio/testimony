# DECISIONS

Decisions not (fully) covered by CLAUDE.md, and why. Newest last.

- **Design tokens follow the `.dc.html` mockups, not the CLAUDE.md token list.**
  CLAUDE.md says "match the look of the existing mockup"; the mockups in
  `design/mockups/` (Brand Explorations) use crimson `#B03A48` / warm ink
  `#3A2028` / paper `#FAF0ED`, which supersede the older turquoise tokens.
  All values live in `app/tailwind.config.ts` + `app/src/config/brand.ts`.
- **Hand-rolled auth instead of Lucia.** bcryptjs + opaque session id in an
  httpOnly cookie + Prisma `Session` table (~60 lines, no dependency churn).
  bcryptjs over bcrypt to avoid native builds on the VPS.
- **Headings use Vazirmatn (heavy weights), not Estedad.** The mockups load
  Estedad from Google Fonts; self-hosting one font keeps things simple and
  CLAUDE.md only requires Vazirmatn. Revisit if the brand needs it.
- **Rate limiting is in-memory** (fixed window, `app/src/lib/rate-limit.ts`).
  Fine for one pm2 process; swap to a DB-backed limiter before clustering.
- **Project cap for "pro":** `plan` lives on Project (per CLAUDE.md), so the
  3-project pro cap is granted when the account has at least one pro project.
- **Worker writes epoch-milliseconds integers for DateTime columns** — that is
  how Prisma stores DateTime in SQLite (verified empirically).
- **Karaoke subtitles + the free-plan badge are burned via one `.ass` file**
  (libass shapes Persian correctly; ffmpeg `drawtext` does not). Requires
  `apt install fonts-vazirmatn` on the VPS.
- **Free plan renders 720x1280 clips; pro renders 1080x1920** — this is the
  "HD clip export" pro feature.
- **M4 (Stripe) is not implemented yet**, per CLAUDE.md ("build billing LAST
  behind a feature flag; until then a manual `plan` column flip is fine").
  `BILLING_ENABLED` env + `billingEnabled()` in `app/src/lib/plan.ts` are the
  flag; plans are flipped manually via `npx prisma studio`.
- **Design mockups moved to `design/mockups/`** so the repo root matches the
  layout in CLAUDE.md.
- **Marketing site implemented from the mockups** (Home, Pricing, /demo) in a
  `(marketing)` route group. Blog nav item omitted until there is content —
  no dead links. Sample-wall/demo content lives in `fa.ts` like all copy.
- **Manually added testimonials are text-only and created `approved`** (the
  owner is the moderator); consentText records that the owner added it.
  They count toward the free cap like any other testimonial.
- **Embed layouts are path segments** (`/w/[slug]` wall, `/w/[slug]/carousel`)
  rather than query params, so ISR caching keeps working per layout.
- **pm2 runs from `ecosystem.config.js`** (`pm2 startOrRestart` in deploy.sh)
  instead of two manual first-run commands — first start and every redeploy
  are the same idempotent command. The ecosystem file parses `app/.env` and
  injects it into the worker (which reads plain process env and would get
  nothing under pm2); `GAVAH_DB` is derived from `DATABASE_URL`. The Next
  app needs no injection — it loads `app/.env` itself.
- **`scripts/setup-vps.sh` bootstraps a fresh Ubuntu VPS in one run:**
  NodeSource Node 22, pm2 (+ systemd resurrection), nginx as an IP-only
  catch-all `default_server` proxying :80 → :3000 (works before a domain
  exists; when one arrives set `server_name` + certbot), ffmpeg +
  fonts-vazirmatn, `app/.env` with a generated SESSION_SECRET, and a
  `deploytest` wrapper in `/usr/local/bin` that runs `deploy.sh`. Idempotent;
  never overwrites an existing `app/.env` or nginx config. nginx listens
  IPv4-only so boxes with IPv6 disabled don't abort the bootstrap.
- **Local-disk storage fallback when `R2_ACCOUNT_ID` is empty** ("demo mode").
  presignPut() then mints an HMAC-signed relative PUT URL handled by
  `/api/upload/[...key]`, files live under `/var/lib/gavah/media`
  (`GAVAH_MEDIA_DIR`), and publicUrl() returns relative `/media/<key>` URLs
  (served by an nginx alias in prod, with a Range-capable Next route as
  fallback — relative so pages work on bare IP, tunnel, or future domain
  alike). The worker mirrors the switch in fetch_media()/store_media().
  CLAUDE.md's "video bytes never pass through Next" rule still holds whenever
  R2 is configured — local mode exists so the product can run/demo on a bare
  VPS with zero external services, at demo-scale traffic only.
- **Demo content is seeded by `scripts/seed-demo.mjs`** — fictional café
  (کافه گندم, slug `cafe-gandom`, plan pro so walls/clips are badge-free and
  HD), invented Persian testimonials, login `demo@gavah.local`/`demo1234`.
  `--videos <dir>` ingests mock phone videos: always normalized to H.264 MP4
  via ffmpeg (phone HEVC won't play in browsers), stored like real uploads,
  transcribe job queued so the worker produces transcript + thumb + clip.
- **Live-recording demos go through a Cloudflare quick tunnel**
  (`scripts/demo-tunnel.sh`): getUserMedia requires a secure origin, quick
  tunnels give free https with no account; URL rotates per run, so this is a
  demo tool, not a production plan.
- **The embed background is transparent** (`app/src/app/w/layout.tsx`): the
  widget sits on other people's pages and must not bring Gavah's porcelain
  page color with it. Cards carry their own white/ink surfaces; the empty
  state got a card wrapper so it stays readable on any host background.
- **The embed iframe reports the height of its content root (`#gavah-root`),
  not `documentElement.scrollHeight`.** The document can never be shorter
  than the iframe viewport, so measuring it lets the reported height ratchet
  up but never shrink — one early oversized report (pre-CSS) left a
  permanent blank void under the wall. Observed in testing, fixed.
- **The widget carries a "ثبت تجربه" CTA linking to the collect page**
  (`/r/[slug]`, new tab), rendered on both embed layouts and the hosted
  wall, in the project's brand color; hidden when the free cap is full.
  Collection itself never happens inside the widget — the widget displays,
  the collect page records. Always-on (no config attribute) as the boring
  option while there are no existing customers to surprise; add an opt-out
  if someone asks.
- **Dashboard shows a live widget preview** (`WidgetPreview.tsx`): the real
  `/w/[slug]` iframe inside a mock browser window on a white host page,
  resized with the same postMessage protocol embed.js uses — so "how will
  it look on my customer's site" is answered in the product, not imagined.
- **`clientIp()` trusts the LAST X-Forwarded-For hop, not the first.** nginx
  appends the real client IP (`$proxy_add_x_forwarded_for`); everything
  before it is client-supplied, and keying rate limits on the first hop let
  a spoofed header reset the limit per request.
- **Logo URL validation maps the URL back to a storage key** instead of
  requiring an absolute URL on `R2_PUBLIC_BASE_URL` — local-storage mode
  hands out relative `/media/logos/…` URLs, which the old check (and
  `z.url()`) rejected, so logo upload was broken in demo mode. Accepted iff
  `keyFromPublicUrl()` yields `logos/<uuid>.<ext>`.
- **The marketing site embeds the LIVE demo widget** (`LiveDemoSite.tsx`, on
  the home wall section and /demo): a fictional کافه گندم website in a
  browser frame whose testimonials section is the real `/w/cafe-gandom`
  iframe — the seeded demo project, so real data, no login, resized via the
  same postMessage protocol. Pages are ISR (300s) and fall back to the old
  static sample cards when the demo project doesn't exist, so the marketing
  site can't break on a fresh install. The seed gives the café its own
  brand color (`#7A4E2D`) so the widget visibly wears a customer brand, not
  Gavah's; re-run `node scripts/seed-demo.mjs` after deploy to apply it.
- **Demo testimonials are EPHEMERAL, echoed only to their author.** Both
  types answer `{published, ephemeral}`; the collect page writes the entry
  to localStorage (origin-wide, 10-minute TTL) and `DemoGuestCard` renders
  it on the demo walls AND inside the /demo widget iframe — live via the
  "storage" event, so the /demo tab updates the moment the collect tab
  submits. Text is never stored server-side at all. Video is stored as a
  normal invisible pending row (worker can demo transcription; the owner
  can approve keepers) and the response carries `videoUrl` for the
  immediate echo. The seed purges non-approved visitor entries (public
  consent text) on every run; approved keepers and seeded rows survive.
  (This evolved from auto-approve+prune → strict consume-on-read
  sessionStorage; the tab-scoped version confused even us, hence
  localStorage + TTL.) `deploy.sh` runs the idempotent seed on every
  deploy so the live demo can't rot.
- **`scripts/setup-domain.sh <domain>` wires a (sub)domain + HTTPS in one
  run:** nginx server block (same shape as setup-vps.sh), `certbot --nginx`
  with auto-renewal, `APP_URL` rewrite, pm2 restart. Exists because video
  recording (getUserMedia) requires a secure origin — a free subdomain of
  an existing domain (e.g. gavah.nazarbanai.com) is the boring way to get
  one without buying anything. Bare-IP http access keeps working.
- **`/demo/cafe` is a full fictional café website** (outside the marketing
  route group — no Gavah chrome, slim honesty banner instead) that installs
  the widget with the REAL two-line embed (`<script src="/embed.js">` +
  `<div data-gavah-wall>`), so our own demo dogfoods the exact customer
  integration path, full-page-load only (plain `<a>` links, no client nav —
  embed.js mounts on load). The URL bar in the /demo browser frame links to
  it. noindex; ISR 300s; graceful when the demo project is missing.
- **Production gaps live in PRODUCTION.md** (tiered checklist: what blocks
  the first real customer vs charging money vs deliberately-later), so the
  demo can ship while the list survives.
- **The app port lives in `app/.env` (`PORT`, default 3000) and nowhere else.**
  `next start` only honors PORT from process env, so ecosystem.config.js
  injects it; setup-vps.sh writes the nginx proxy_pass from the same value
  (and warns if an existing config disagrees), and demo-tunnel.sh reads it
  too. Born of a real incident: the port was changed in one place, nginx kept
  proxying :3000 to a stale process, and every asset 400'd as text/html.
