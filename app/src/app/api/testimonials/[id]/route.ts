import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const updateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  text: z.string().trim().max(5000).optional(),
});

async function ownedTestimonial(id: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const testimonial = await db.testimonial.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });
  if (!testimonial || testimonial.project.userId !== user.id) return null;
  return testimonial;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const testimonial = await ownedTestimonial(params.id);
  if (!testimonial) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  await db.testimonial.update({
    where: { id: testimonial.id },
    data: { ...(parsed.data.status && { status: parsed.data.status }), ...(parsed.data.text !== undefined && { text: parsed.data.text }) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const testimonial = await ownedTestimonial(params.id);
  if (!testimonial) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db.testimonial.delete({ where: { id: testimonial.id } });
  return NextResponse.json({ ok: true });
}
