import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { testimonialCapReached } from "@/lib/plan";
import { deleteObjects, headObject, MAX_VIDEO_BYTES } from "@/lib/r2";
import { revalidateWalls } from "@/lib/walls";
import { DEMO_SLUG } from "@/lib/demo";
import { fa } from "@/i18n/fa";

// Public endpoint: creates a pending testimonial after the (optional) video
// was uploaded straight to R2. Never public until approved in the dashboard.
//
// Sole exception: TEXT entries on the seeded demo project publish instantly,
// so someone trying the live demo sees their own words appear on the wall.
// Contained by the per-IP rate limit plus a prune: only the newest
// DEMO_KEEP visitor entries are kept, so junk can't pile up on the
// marketing site. Real projects always require approval.

const DEMO_KEEP = 12;

async function pruneDemoVisitorEntries(projectId: string) {
  // Visitor entries carry the public consent text; seeded ones don't.
  const stale = await db.testimonial.findMany({
    where: { projectId, consentText: fa.collect.consent },
    orderBy: { createdAt: "desc" },
    skip: DEMO_KEEP,
  });
  if (stale.length === 0) return;
  await db.testimonial.deleteMany({ where: { id: { in: stale.map((t) => t.id) } } });
  await deleteObjects(
    stale.flatMap((t) => [t.videoKey, t.thumbKey, t.clipKey]).filter((k): k is string => !!k),
  );
}

const KEY_RE = /^videos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webm|mp4)$/;

const base = {
  authorName: z.string().trim().min(1).max(100),
  authorRole: z.string().trim().max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  consent: z.literal(true),
};

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string().trim().min(3).max(2000), ...base }),
  z.object({ type: z.literal("video"), videoKey: z.string().regex(KEY_RE), ...base }),
]);

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (!rateLimit(`testimonial:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const project = await db.project.findUnique({ where: { slug: params.slug } });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (await testimonialCapReached(project)) {
    return NextResponse.json({ error: "limit_reached" }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.type === "video") {
    // Don't trust the client that the presigned PUT actually happened — a
    // well-formed key for a missing/oversized object would just fail later
    // in the worker.
    const head = await headObject(d.videoKey);
    if (!head || head.size === 0 || head.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
  }
  const autoPublish = project.slug === DEMO_SLUG && d.type === "text";
  const testimonial = await db.testimonial.create({
    data: {
      projectId: project.id,
      type: d.type,
      status: autoPublish ? "approved" : "pending",
      authorName: d.authorName,
      authorRole: d.authorRole || null,
      rating: d.rating ?? null,
      text: d.type === "text" ? d.text : null,
      videoKey: d.type === "video" ? d.videoKey : null,
      consentText: fa.collect.consent,
      consentAt: new Date(),
      ...(d.type === "video" ? { jobs: { create: { kind: "transcribe" } } } : {}),
    },
  });
  if (autoPublish) {
    await pruneDemoVisitorEntries(project.id);
    revalidateWalls(project.slug);
  }
  return NextResponse.json({ id: testimonial.id, published: autoPublish });
}
