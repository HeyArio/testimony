import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { testimonialCapReached } from "@/lib/plan";
import { revalidateWalls } from "@/lib/walls";
import { fa } from "@/i18n/fa";

// Owner adds an existing (text) testimonial by hand — e.g. one received in
// DMs. Created approved directly since the owner is the moderator.

const bodySchema = z.object({
  authorName: z.string().trim().min(1).max(100),
  authorRole: z.string().trim().max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  text: z.string().trim().min(3).max(2000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (await testimonialCapReached(project)) {
    return NextResponse.json({ error: "limit_reached" }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const d = parsed.data;
  const testimonial = await db.testimonial.create({
    data: {
      projectId: project.id,
      type: "text",
      status: "approved",
      authorName: d.authorName,
      authorRole: d.authorRole || null,
      rating: d.rating ?? null,
      text: d.text,
      consentText: fa.inbox.manualConsentNote,
      consentAt: new Date(),
    },
  });
  revalidateWalls(project.slug);
  return NextResponse.json({ id: testimonial.id });
}
