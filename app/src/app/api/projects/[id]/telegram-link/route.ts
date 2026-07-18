import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { telegramBotUsername, telegramEnabled } from "@/lib/telegram";

// Owner-only Telegram link management: POST mints a fresh single-use /start
// deep link (invalidates any previous unused one); DELETE disconnects.

async function ownedProject(id: string) {
  const user = await getSessionUser();
  if (!user) return null;
  const project = await db.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) return null;
  return project;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const project = await ownedProject(params.id);
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const bot = telegramBotUsername();
  if (!telegramEnabled() || !bot) {
    return NextResponse.json({ error: "telegram_disabled" }, { status: 503 });
  }
  const token = crypto.randomUUID();
  await db.project.update({ where: { id: project.id }, data: { telegramLinkToken: token } });
  return NextResponse.json({ link: `https://t.me/${bot}?start=${token}` });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const project = await ownedProject(params.id);
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db.project.update({
    where: { id: project.id },
    data: { telegramChatId: null, telegramLinkToken: null },
  });
  return NextResponse.json({ ok: true });
}
