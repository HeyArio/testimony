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
