# PRODUCTION.md — the gap between the demo and real customers

The demo is honest and complete. These are the known gaps before real
businesses (and their customers' faces) depend on us. Ordered by how much
each one can hurt. Check items off as they land; details/decisions go to
DECISIONS.md as usual.

## Tier 1 — before the FIRST real customer

- [ ] **Backups + R2.** Today all media sits on one VPS disk (local-storage
  mode) and the SQLite file has no copy anywhere. One disk failure loses
  every customer's videos permanently. Do both halves:
  - Configure R2 (fill `R2_*` in `app/.env`) so media leaves the VPS disk.
    Presign/publicUrl/worker already switch automatically.
  - Nightly cron: copy `/var/lib/gavah/gavah.db` (and, until R2, the media
    dir) off-box — even a second VPS or R2 itself is fine.

- [ ] **Normalize uploads to H.264 MP4 (cross-device playback).**
  Chrome/Android records webm; Safari/iOS often cannot play it. The wall
  plays the RAW upload, so Android-recorded testimonials look broken to
  iPhone viewers — on the customer's own site. Add a normalize step to the
  worker's transcribe job (transcode to H.264/AAC MP4 like
  `scripts/seed-demo.mjs` already does, replace `videoKey`, delete the
  original). Keep webm accepted at upload; fix on the server.

- [ ] **New-testimonial notifications.** Businesses get no signal when a
  testimonial arrives; pending entries rot and the collect→approve→display
  loop dies. Even one channel is transformative: email (Resend/SMTP), or —
  more realistic for the market — SMS or a Telegram bot message
  («یک گواهی جدید دارید»). Fire on create in
  `app/src/app/api/public/[slug]/testimonials/route.ts`.

- [ ] **Validate the magic on real footage.** Run ~10 real, noisy,
  colloquial phone-recorded Persian videos through transcribe → clip on the
  VPS and *watch the outputs*. Judge: transcript accuracy, word-timestamp
  drift, RTL karaoke rendering, font shaping. If `small` disappoints, try
  `WHISPER_MODEL=medium` (slower, better) before shipping the promise.

## Tier 2 — before charging money

- [ ] **Password reset flow.** Locked-out customers currently have no
  recourse but emailing support.
- [ ] **Privacy + terms pages.** Strings exist in `fa.ts` (footer.legal);
  pages don't. A business hosting videos of people's faces will be asked
  about this by *their* customers.
- [ ] **Monitoring.** UptimeRobot (or similar) on `/` + a look at
  `pm2 logs` cadence; today an outage is discovered by customers. Consider
  `pm2 max_memory_restart` for the worker.
- [ ] **Free cap counts rejected entries** (`testimonialCapReached` counts
  all statuses) — spam can permanently exhaust a free project's 5 slots.
  Count `status != "rejected"` (or approved+pending) instead.
- [ ] **Disk-exhaustion via public uploads (local mode only).** ~10
  presigned 100MB uploads/min/IP can fill the disk in hours. Moving media
  to R2 (Tier 1) defuses the disk death; optionally add a per-project
  daily upload quota.
- [ ] **Email verification on signup** (spam accounts; low urgency while
  invite-only).

## Tier 3 — deliberately later (do NOT build these now)

- Wall view analytics ("is this doing anything for me?" — retention lever,
  build after there are walls to measure)
- Widget theming beyond brand color; reorder/pin testimonials
- English/i18n pass (fa.ts is already structured for it)
- Teams / multiple users per account
- Custom domains for hosted walls
- Postgres migration (schema already avoids SQLite-only features)
- CAPTCHA on public endpoints (moderation gate + rate limit absorb it for
  now)
- Per-project domain allowlist for the embed (`frame-ancestors` from a
  stored list — natural Pro feature if wall-hotlinking ever becomes real
  abuse)

## Already handled — don't re-litigate

- Testimonial text renders as text nodes only (widget XSS); approval gate
  server-side; presign validates type+size and keys are server UUIDs;
  upload verified via HEAD before row creation.
- Rate limiting keyed on the last X-Forwarded-For hop (nginx appends it);
  login is enumeration-safe; sessions are httpOnly + SameSite=Lax (CSRF).
- Framing denied everywhere except `/w/*`; embed background transparent;
  iframe height measured from the content root (no ratchet).
- Consent text + timestamp stored per testimonial; media deleted with
  testimonial/project; demo entries ephemeral (text never stored, video
  invisible-pending, purged on deploy unless owner-approved).
- Camera requires HTTPS → `scripts/setup-domain.sh` (live on
  gavah.nazarbanai.com); deploy runs the demo seed idempotently.
