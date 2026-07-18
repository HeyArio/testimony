import type { Project, Testimonial } from "@prisma/client";
import { appUrl } from "@/config/brand";

// Telegram bot integration: new-testimonial notifications with inline
// approve/reject buttons, handled by /api/telegram/webhook. Feature is off
// (all helpers no-op) until TELEGRAM_BOT_TOKEN is set. Errors are swallowed
// after logging a short line — a Telegram outage must never break a
// user-facing request.

export function telegramEnabled(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN;
}

export function telegramBotUsername(): string | null {
  return process.env.TELEGRAM_BOT_USERNAME || null;
}

export async function telegramApi(method: string, payload: Record<string, unknown>): Promise<unknown> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.log(`telegram ${method} failed: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch {
    console.log(`telegram ${method} unreachable`);
    return null;
  }
}

/** Fire-and-forget notification for a fresh testimonial. */
export async function notifyNewTestimonial(
  project: Pick<Project, "id" | "name" | "telegramChatId">,
  t: Pick<Testimonial, "id" | "type" | "authorName" | "authorRole" | "rating" | "text">,
): Promise<void> {
  if (!telegramEnabled() || !project.telegramChatId) return;
  const stars = t.rating != null ? "★".repeat(t.rating) : "—";
  const kind = t.type === "video" ? "🎥 ویدیویی" : "✍️ متنی";
  const body =
    t.type === "video" && !t.text
      ? "(متن گفتار بعد از پیاده‌سازی خودکار اضافه می‌شود)"
      : (t.text || "").slice(0, 500);
  const lines = [
    `🔔 گواهی جدید برای «${project.name}»`,
    ``,
    `${kind} · ${stars}`,
    `از: ${t.authorName}${t.authorRole ? ` (${t.authorRole})` : ""}`,
    ``,
    body,
  ];
  await telegramApi("sendMessage", {
    chat_id: project.telegramChatId,
    text: lines.join("\n"),
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ تأیید", callback_data: `a:${t.id}` },
          { text: "❌ رد", callback_data: `r:${t.id}` },
        ],
        [{ text: "📋 مشاهده در داشبورد", url: `${appUrl()}/dashboard/${project.id}` }],
      ],
    },
  });
}
