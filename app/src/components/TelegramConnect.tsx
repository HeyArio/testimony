"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fa } from "@/i18n/fa";

// Settings card for linking a project to Telegram. Server passes whether the
// feature is configured and whether this project is already connected.

export function TelegramConnect({
  projectId,
  connected,
  available,
}: {
  projectId: string;
  connected: boolean;
  available: boolean;
}) {
  const router = useRouter();
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createLink() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/telegram-link`, { method: "POST" });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.link) setLink(data.link);
    else setError(fa.common.error);
  }

  async function disconnect() {
    setBusy(true);
    await fetch(`/api/projects/${projectId}/telegram-link`, { method: "DELETE" });
    setBusy(false);
    setLink(null);
    router.refresh();
  }

  return (
    <div className="card flex flex-col gap-3">
      <div>
        <p className="font-black">💬 {fa.settings.telegramTitle}</p>
        <p className="mt-1 text-sm leading-fa text-ink/60">{fa.settings.telegramHint}</p>
      </div>
      {!available ? (
        <p className="text-sm text-ink/50">{fa.settings.telegramUnavailable}</p>
      ) : connected ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-primary">{fa.settings.telegramConnected}</span>
          <button className="btn-ghost !py-1.5 text-sm" disabled={busy} onClick={disconnect} type="button">
            {fa.settings.telegramDisconnect}
          </button>
        </div>
      ) : link ? (
        <div className="flex flex-col gap-2">
          <a className="btn-primary self-start" href={link} rel="noopener noreferrer" target="_blank">
            {fa.settings.telegramOpenLink}
          </a>
          <p className="text-xs text-ink/55">{fa.settings.telegramLinkNote}</p>
        </div>
      ) : (
        <button className="btn-ghost self-start" disabled={busy} onClick={createLink} type="button">
          {busy ? fa.common.loading : fa.settings.telegramConnect}
        </button>
      )}
      {error && <p className="text-sm font-bold text-primary">{error}</p>}
    </div>
  );
}
