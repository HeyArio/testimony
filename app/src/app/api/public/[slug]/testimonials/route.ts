import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { testimonialCapReached } from "@/lib/plan";
import { headObject, publicUrl, MAX_VIDEO_BYTES } from "@/lib/r2";
import { DEMO_SLUG } from "@/lib/demo";
import { notifyNewTestimonial } from "@/lib/telegram";
import { fa } from "@/i18n/fa";

// Public endpoint: creates a pending testimonial after the (optional) video
// was uploaded straight to R2. Never public until approved in the dashboard.
//
// Sole exception — the seeded demo project, so trying the demo closes the
// loop without polluting the real wall. Both types answer `ephemeral: true`
// and the visitor's own browser echoes the entry back (DemoGuestCard):
//   text   -> never stored at all
//   video  -> stored as a normal INVISIBLE pending row (the worker can
//             demo transcription and the seed purge cleans it up on the
//             next deploy), and the response carries the playback URL so
//             the visitor sees their recording in the widget immediately.

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
  const isDemo = project.slug === DEMO_SLUG;
  if (isDemo && d.type === "text") {
    // Ephemeral demo entry: validated, acknowledged, never stored.
    return NextResponse.json({ published: true, ephemeral: true });
  }
  const testimonial = await db.testimonial.create({
    data: {
      projectId: project.id,
      type: d.type,
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
  // Telegram ping (fire-and-forget — must never delay or fail the submit).
  void notifyNewTestimonial(project, testimonial).catch(() => {});
  if (isDemo && d.type === "video") {
    return NextResponse.json({
      id: testimonial.id,
      published: true,
      ephemeral: true,
      videoUrl: publicUrl(d.videoKey),
    });
  }
  return NextResponse.json({ id: testimonial.id, published: false });
}
