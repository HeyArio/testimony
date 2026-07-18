// The seeded public demo project (created by scripts/seed-demo.mjs — keep the
// slug in sync with DEMO_SLUG there). Marketing pages embed its real widget;
// when it doesn't exist they fall back to static sample cards.
export const DEMO_SLUG = "cafe-gandom";

// sessionStorage key for the visitor's own ephemeral demo entry: written by
// the collect page, consumed (removed on first read) by the demo wall, so a
// refresh makes it disappear. Nothing is ever stored server-side.
export const DEMO_GUEST_KEY = "gavah:demo-guest";

export type DemoGuestEntry = {
  authorName: string;
  authorRole?: string;
  rating?: number;
  text: string;
};
