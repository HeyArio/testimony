"use client";

import { useEffect, useState } from "react";
import { DEMO_GUEST_KEY, DEMO_GUEST_TTL_MS, type DemoGuestEntry } from "@/lib/demo";
import { fa } from "@/i18n/fa";

// Renders the visitor's own ephemeral demo entry (text or video) on top of
// the demo walls — including inside the /demo widget iframe. The entry lives
// in localStorage (origin-wide), so the demo tab picks it up via the
// "storage" event the moment the collect tab writes it, with no reload.
// Entries expire after DEMO_GUEST_TTL_MS and are deleted by whichever
// reader sees them expired. Other visitors never see any of this; text
// entries exist nowhere server-side.

function readEntry(): DemoGuestEntry | null {
  try {
    const raw = localStorage.getItem(DEMO_GUEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoGuestEntry;
    if (!parsed || typeof parsed.authorName !== "string" || typeof parsed.at !== "number") return null;
    if (typeof parsed.text !== "string" && typeof parsed.videoUrl !== "string") return null;
    if (Date.now() - parsed.at > DEMO_GUEST_TTL_MS) {
      localStorage.removeItem(DEMO_GUEST_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null; // blocked/corrupt storage — render nothing
  }
}

export function DemoGuestCard({ brandColor }: { brandColor: string }) {
  const [entry, setEntry] = useState<DemoGuestEntry | null>(null);

  useEffect(() => {
    setEntry(readEntry());
    // Live update: fires when another tab (the collect page) writes the key.
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === DEMO_GUEST_KEY) setEntry(readEntry());
    };
    window.addEventListener("storage", onStorage);
    // Expire while mounted, too.
    const timer = setInterval(() => setEntry(readEntry()), 30_000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);

  if (!entry) return null;

  // Only trust same-origin relative /media URLs or plain https URLs.
  const videoUrl =
    entry.videoUrl && (entry.videoUrl.startsWith("/media/") || entry.videoUrl.startsWith("https://"))
      ? entry.videoUrl
      : null;

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
      {videoUrl && (
        <video className="mb-3 w-full rounded-card bg-ink" controls playsInline preload="metadata" src={videoUrl} />
      )}
      {entry.text && <p className="whitespace-pre-wrap text-sm leading-fa">{entry.text}</p>}
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
