import type { Testimonial } from "@prisma/client";
import { fa } from "@/i18n/fa";

// آوازه — the proof-weighted trust score (name lives in brand.scoreNameFa).
// Not a plain star average: evidence strength weights each rating, because a
// face on camera is stronger proof than typed text, fresh testimonials say
// more than old ones, and owner-added entries are self-reported.
//
//   weight = type (video 2.0 / text 1.0)
//          × recency decay (half-life 180 days)
//          × origin (owner-added manual entries 0.6)
//   score  = 2 × Σ(weight·rating) / Σ(weight)   → 0..10, one decimal
//
// Only approved testimonials count; needs MIN_RATED rated ones to show at
// all (a score built on two data points is noise, not renown).

export const AVAZEH_MIN_RATED = 3;
const HALF_LIFE_DAYS = 180;

export type AvazehScore = {
  score: number; // 0..10, one decimal
  ratedCount: number;
  totalCount: number;
  videoCount: number;
};

export function computeAvazeh(approved: Pick<Testimonial, "type" | "rating" | "createdAt" | "consentText">[], now = new Date()): AvazehScore | null {
  const rated = approved.filter((t) => t.rating != null);
  if (rated.length < AVAZEH_MIN_RATED) return null;

  let weightSum = 0;
  let weighted = 0;
  for (const t of rated) {
    const ageDays = Math.max(0, (now.getTime() - t.createdAt.getTime()) / 86_400_000);
    let w = t.type === "video" ? 2.0 : 1.0;
    w *= Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    if (t.consentText === fa.inbox.manualConsentNote) w *= 0.6;
    weightSum += w;
    weighted += w * (t.rating as number);
  }
  if (weightSum === 0) return null;

  const score = Math.round(20 * (weighted / weightSum)) / 10;
  return {
    score: Math.min(10, score),
    ratedCount: rated.length,
    totalCount: approved.length,
    videoCount: approved.filter((t) => t.type === "video").length,
  };
}
