"use client";

import { useEffect, useRef, useState } from "react";
import { fa } from "@/i18n/fa";

// The real widget, live on the marketing site: a fictional café website in a
// browser frame whose testimonials section is the actual /w/[slug] embed —
// same iframe + resize protocol embed.js uses, no login, no setup. The café
// (کافه گندم) is the seeded demo project, so the cards are real data.

const c = fa.marketing.demoCafe;
const p = fa.marketing.demoPage;

export function LiveDemoSite({ slug, brandColor }: { slug: string; brandColor: string }) {
  const [layout, setLayout] = useState<"wall" | "carousel">("wall");
  const [height, setHeight] = useState(320);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== "gavah:height" || data.slug !== slug) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const h = Number(data.height);
      if (h > 0 && h < 100000) setHeight(h);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slug]);

  return (
    <div>
      {/* layout toggle — the two real embed layouts */}
      <div className="mb-5 flex justify-center">
        <div className="inline-flex rounded-full border border-hairline bg-card p-1">
          {(
            [
              ["wall", p.tabWall],
              ["carousel", p.tabCarousel],
            ] as const
          ).map(([key, label]) => (
            <button
              className={`rounded-full px-5 py-1.5 text-sm font-bold transition-colors ${
                layout === key ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
              }`}
              key={key}
              onClick={() => setLayout(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* browser window */}
      <div className="overflow-hidden rounded-[18px] border border-hairline bg-card shadow-[0_24px_64px_rgba(58,32,40,.18)]">
        {/* chrome bar */}
        <div className="flex items-center gap-3 border-b border-hairline bg-[#F3EBE7] px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#E0564F]/80" />
            <span className="h-3 w-3 rounded-full bg-[#E8B93E]/80" />
            <span className="h-3 w-3 rounded-full bg-[#57BB5C]/80" />
          </span>
          <span
            className="mx-auto w-full max-w-[300px] rounded-full bg-white px-4 py-1 text-center font-mono text-xs text-[#6B5A5E]"
            dir="ltr"
          >
            🔒 {c.url}
          </span>
          <span className="w-[52px]" />
        </div>

        {/* ——— the café's site ——— */}
        <div className="bg-white">
          {/* site header */}
          <div className="flex items-center justify-between gap-4 border-b border-[#F2EDE9] px-5 py-4 sm:px-8">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[15px] font-black text-white"
                style={{ background: brandColor }}
              >
                {c.brand.replace("کافه ", "")[0]}
              </span>
              <span className="text-[15px] font-extrabold">{c.brand}</span>
            </div>
            <nav className="hidden items-center gap-5 text-[13px] font-semibold text-ink/55 md:flex">
              {c.nav.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </nav>
            <span
              className="rounded-[10px] px-4 py-2 text-[13px] font-bold text-white"
              style={{ background: brandColor }}
            >
              {c.navCta}
            </span>
          </div>

          {/* site hero */}
          <div className="px-5 py-9 text-center sm:py-12" style={{ background: `${brandColor}10` }}>
            <h3 className="text-xl font-black leading-fa sm:text-[26px]">{c.heroTitle}</h3>
            <p className="mx-auto mt-2.5 max-w-md text-[13.5px] leading-fa text-ink/55 sm:text-sm">{c.heroSub}</p>
            <span
              className="mt-5 inline-block rounded-xl px-6 py-2.5 text-sm font-extrabold text-white"
              style={{ background: brandColor }}
            >
              {c.heroCta}
            </span>
          </div>

          {/* testimonials section = the real embedded widget */}
          <div className="px-4 py-9 sm:px-8 sm:py-12">
            <div className="mb-2 text-center text-[13px] font-bold" style={{ color: brandColor }}>
              {c.sectionKicker}
            </div>
            <h4 className="mb-7 text-center text-lg font-extrabold leading-fa sm:text-[22px]">{c.sectionTitle}</h4>

            <div className="relative rounded-2xl border-2 border-dashed border-primary/50 p-3 pt-6 sm:p-5 sm:pt-7">
              <span className="absolute -top-[15px] start-5 flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-extrabold text-white shadow-[0_4px_12px_rgba(176,58,72,.35)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/85" />
                {p.widgetTagLive}
              </span>
              <iframe
                className="block w-full border-0"
                key={layout}
                ref={frameRef}
                src={`/w/${slug}${layout === "carousel" ? "/carousel" : ""}`}
                style={{ height }}
                title={p.widgetTagLive}
              />
            </div>
          </div>

          {/* site footer */}
          <div className="border-t border-[#F2EDE9] px-5 py-5 text-center text-xs text-ink/40">{c.footer}</div>
        </div>
      </div>

      {/* invite to try the live loop */}
      <p className="mx-auto mt-5 max-w-2xl text-center text-[13.5px] leading-fa text-[#9B8288]">{p.tryNote}</p>
    </div>
  );
}
