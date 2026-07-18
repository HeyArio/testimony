// The seeded public demo project (created by scripts/seed-demo.mjs — keep the
// slug in sync with DEMO_SLUG there). Marketing pages embed its real widget;
// when it doesn't exist they fall back to static sample cards.
export const DEMO_SLUG = "cafe-gandom";

// localStorage key for the visitor's own ephemeral demo entry: written by the
// collect page, rendered back by DemoGuestCard on the demo walls AND inside
// the /demo widget iframe (localStorage is origin-wide, and the "storage"
// event lets the demo tab update live while the visitor submits in another
// tab). Entries expire after DEMO_GUEST_TTL_MS; readers delete expired ones.
// Text entries exist nowhere else; video entries additionally sit as an
// invisible pending row so the worker can process them and deploys can purge.
export const DEMO_GUEST_KEY = "gavah:demo-guest";
export const DEMO_GUEST_TTL_MS = 10 * 60_000;

export type DemoGuestEntry = {
  authorName: string;
  authorRole?: string;
  rating?: number;
  text?: string;
  videoUrl?: string;
  at: number; // epoch ms, for expiry
};
