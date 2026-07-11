import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { presignPut, publicUrl } from "@/lib/r2";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const bodySchema = z.object({
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  size: z.number().int().positive().max(MAX_LOGO_BYTES),
});

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const project = await db.project.findUnique({ where: { id: params.id } });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const key = `logos/${crypto.randomUUID()}.${EXT[parsed.data.contentType]}`;
  const url = await presignPut(key, parsed.data.contentType, parsed.data.size);
  return NextResponse.json({ uploadUrl: url, publicUrl: publicUrl(key) });
}
