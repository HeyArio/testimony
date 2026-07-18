import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { telegramApi, telegramEnabled } from "@/lib/telegram";
import { revalidateWalls } from "@/lib/walls";

// Telegram webhook: /start <token> links a chat to a project; inline-button
// callbacks (a:<id> / r:<id>) approve or reject a testimonial from inside
// Telegram. Authenticated two ways: the secret_token header Telegram echoes
// back (set by scripts/setup-telegram.sh), and — for moderation — the chat
// must be the one linked to the testimonial's project. Always answers 200 so
// Telegram doesn't retry-storm on our mistakes.

type TgUpdate = {
  message?: { chat: { id: number }; text?: string };
  callback_query?: { id: string; data?: string; message?: { chat: { id: number }; message_id: number } };
};

export async function POST(req: Request) {
  if (!telegramEnabled()) return NextResponse.json({ ok: true });
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  if (!update) return NextResponse.json({ ok: true });

  // --- /start <link-token>: bind this chat to the project -------------------
  const text = update.message?.text;
  if (text && update.message) {
    const m = text.match(/^\/start[ =]([0-9a-f-]{36})$/);
    const chatId = String(update.message.chat.id);
    if (m) {
      const project = await db.project.findUnique({ where: { telegramLinkToken: m[1] } });
      if (project) {
        await db.project.update({
          where: { id: project.id },
          data: { telegramChatId: chatId, telegramLinkToken: null },
        });
        await telegramApi("sendMessage", {
          chat_id: chatId,
          text: `✅ پروژه‌ی «${project.name}» متصل شد. از این به بعد هر گواهی جدید همین‌جا می‌آید.`,
        });
      } else {
        await telegramApi("sendMessage", {
          chat_id: chatId,
          text: "لینک اتصال معتبر نیست یا قبلاً استفاده شده. از تنظیمات پروژه لینک تازه بسازید.",
        });
      }
    }
    return NextResponse.json({ ok: true });
  }

  // --- inline buttons: approve / reject ------------------------------------
  const cb = update.callback_query;
  if (cb?.data && cb.message) {
    const m = cb.data.match(/^([ar]):([0-9a-f-]{36})$/);
    if (!m) {
      await telegramApi("answerCallbackQuery", { callback_query_id: cb.id });
      return NextResponse.json({ ok: true });
    }
    const status = m[1] === "a" ? "approved" : "rejected";
    const testimonial = await db.testimonial.findUnique({
      where: { id: m[2] },
      include: { project: { select: { slug: true, telegramChatId: true } } },
    });
    const chatId = String(cb.message.chat.id);
    if (!testimonial || testimonial.project.telegramChatId !== chatId) {
      await telegramApi("answerCallbackQuery", { callback_query_id: cb.id, text: "دسترسی ندارید." });
      return NextResponse.json({ ok: true });
    }
    await db.testimonial.update({ where: { id: testimonial.id }, data: { status } });
    revalidateWalls(testimonial.project.slug);
    await telegramApi("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: status === "approved" ? "تأیید شد ✓ — روی دیوار نشست." : "رد شد.",
    });
    // Replace the buttons with the outcome so the thread shows final state.
    await telegramApi("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: cb.message.message_id,
      reply_markup: {
        inline_keyboard: [[{ text: status === "approved" ? "✅ تأییدشده" : "❌ ردشده", callback_data: "noop" }]],
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
