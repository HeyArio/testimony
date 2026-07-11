import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { projectCapReached } from "@/lib/plan";
import { brand } from "@/config/brand";

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/, "invalid_slug"),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (await projectCapReached(user)) {
    return NextResponse.json({ error: "limit_reached" }, { status: 403 });
  }
  const { name, slug } = parsed.data;
  if (await db.project.findUnique({ where: { slug } })) {
    return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  }
  const project = await db.project.create({
    data: { userId: user.id, name, slug, brandColor: brand.defaultBrandColor },
  });
  return NextResponse.json({ id: project.id });
}
