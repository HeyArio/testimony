import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { deleteObjects, keyFromPublicUrl } from "@/lib/r2";
import { revalidateWalls } from "@/lib/walls";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  logoUrl: z.string().url().max(500).nullable().optional(),
});

async function ownedProject(id: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const project = await db.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) return null;
  return project;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const project = await ownedProject(params.id);
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  // Only allow logo URLs on our own media host — never arbitrary origins.
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (parsed.data.logoUrl && (!base || !parsed.data.logoUrl.startsWith(base))) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  await db.project.update({ where: { id: project.id }, data: parsed.data });
  // A replaced or removed logo is orphaned in R2 — clean it up.
  if (parsed.data.logoUrl !== undefined && project.logoUrl && project.logoUrl !== parsed.data.logoUrl) {
    const oldKey = keyFromPublicUrl(project.logoUrl);
    if (oldKey) await deleteObjects([oldKey]);
  }
  revalidateWalls(project.slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const project = await ownedProject(params.id);
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const testimonials = await db.testimonial.findMany({
    where: { projectId: project.id },
    select: { videoKey: true, thumbKey: true, clipKey: true },
  });
  await db.project.delete({ where: { id: project.id } }); // cascades testimonials + jobs
  const keys = testimonials
    .flatMap((t) => [t.videoKey, t.thumbKey, t.clipKey])
    .filter((k): k is string => !!k);
  const logoKey = project.logoUrl ? keyFromPublicUrl(project.logoUrl) : null;
  if (logoKey) keys.push(logoKey);
  await deleteObjects(keys);
  revalidateWalls(project.slug);
  return NextResponse.json({ ok: true });
}
