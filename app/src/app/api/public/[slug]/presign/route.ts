import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { presignPut } from "@/lib/r2";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { testimonialCapReached } from "@/lib/plan";

// Public endpoint: presigns a direct-to-R2 PUT for the recorded video.
// Keys are server-generated UUIDs; content type and size are validated here.

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const bodySchema = z.object({
  contentType: z.enum(["video/webm", "video/mp4"]),
  size: z.number().int().positive().max(MAX_VIDEO_BYTES),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (!rateLimit(`presign:${clientIp(req)}`, 10, 60_000)) {
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
  const ext = parsed.data.contentType === "video/mp4" ? "mp4" : "webm";
  const key = `videos/${crypto.randomUUID()}.${ext}`;
  const url = await presignPut(key, parsed.data.contentType, parsed.data.size);
  return NextResponse.json({ uploadUrl: url, key });
}
