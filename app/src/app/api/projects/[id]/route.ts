import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

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
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const project = await ownedProject(params.id);
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db.project.delete({ where: { id: project.id } });
  return NextResponse.json({ ok: true });
}
