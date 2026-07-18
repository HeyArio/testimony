"use client";

import { useEffect, useState } from "react";
import { DEMO_GUEST_KEY, type DemoGuestEntry } from "@/lib/demo";
import { fa } from "@/i18n/fa";

// Renders the visitor's own ephemeral demo entry on top of the demo wall.
// The entry lives only in this tab's sessionStorage (written by the collect
// page) and is removed on first read — so it survives exactly one viewing
// and disappears on refresh. Other visitors never see it; nothing is stored
// server-side. Mounted on the demo project's walls only.

export function DemoGuestCard({ brandColor }: { brandColor: string }) {
  const [entry, setEntry] = useState<DemoGuestEntry | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DEMO_GUEST_KEY);
      if (!raw) return;
      sessionStorage.removeItem(DEMO_GUEST_KEY); // consume: gone on refresh
      const parsed = JSON.parse(raw) as DemoGuestEntry;
      if (parsed && typeof parsed.text === "string" && typeof parsed.authorName === "string") {
        setEntry(parsed);
      }
    } catch {
      // blocked/corrupt storage — just render nothing
    }
  }, []);

  if (!entry) return null;

  return (
    <article className="card mb-4 border-2" style={{ borderColor: brandColor }}>
      <p className="mb-2">
        <span
          className="rounded-full px-3 py-0.5 text-xs font-bold text-white"
          style={{ background: brandColor }}
        >
          {fa.wall.guestTag}
        </span>
      </p>
      <p className="whitespace-pre-wrap text-sm leading-fa">{entry.text}</p>
      <footer className="mt-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black">{entry.authorName}</p>
          {entry.authorRole && <p className="text-xs text-ink/60">{entry.authorRole}</p>}
        </div>
        {entry.rating != null && entry.rating >= 1 && entry.rating <= 5 && (
          <span className="text-sm" style={{ color: brandColor }}>
            {"★".repeat(entry.rating)}
          </span>
        )}
      </footer>
    </article>
  );
}
