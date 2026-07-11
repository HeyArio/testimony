import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Re-queues a failed worker job (transcribe / render_clip) for a testimonial
// the caller owns. The worker picks it up on its next poll.

const bodySchema = z.object({
  kind: z.enum(["transcribe", "render_clip"]),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const testimonial = await db.testimonial.findUnique({
    where: { id: params.id },
    include: { project: { select: { userId: true } } },
  });
  if (!testimonial || testimonial.project.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (testimonial.type !== "video" || !testimonial.videoKey) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { kind } = parsed.data;

  const failed = await db.job.findFirst({
    where: { testimonialId: testimonial.id, kind, status: "failed" },
    orderBy: { createdAt: "desc" },
  });
  if (failed) {
    await db.job.update({
      where: { id: failed.id },
      data: { status: "queued", attempts: 0, error: null },
    });
  } else {
    // No failed job to restart and one is already queued/running → no-op;
    // otherwise (e.g. job row was cleaned up) create a fresh one.
    const active = await db.job.findFirst({
      where: { testimonialId: testimonial.id, kind, status: { in: ["queued", "running"] } },
    });
    if (!active) {
      await db.job.create({ data: { testimonialId: testimonial.id, kind } });
    }
  }
  return NextResponse.json({ ok: true });
}
