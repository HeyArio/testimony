"use client";

import { useState } from "react";
import { fa } from "@/i18n/fa";
import {
  SampleCardsWall,
  SampleCardsCarousel,
  type SampleTheme,
} from "@/components/marketing/SampleWall";

// /demo centerpiece: a fictional customer's website inside a browser frame,
// with the Gavah widget embedded in its testimonials section — in *their*
// brand color, so the "widget adopts your brand" claim is visible, not told.

const d = fa.marketing.demoSite;
const p = fa.marketing.demoPage;

// The fictional studio's brand — deliberately NOT Gavah's palette.
const STUDIO = "#3F7A6D";
const STUDIO_DARK = "#31614F";
const THEME: SampleTheme = {
  brandName: d.brand,
  brandColor: STUDIO,
  highlight: "#8FD0BE",
  glow: "rgba(63,122,109,.30)",
  tints: ["#4A5B56", "#54605B", "#465550"],
};

export function DemoSiteFrame() {
  const [layout, setLayout] = useState<"wall" | "carousel">("wall");
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
            🔒 {d.url}
          </span>
          <span className="w-[52px]" />
        </div>

        {/* ——— the customer's fake site ——— */}
        <div className="bg-white">
          {/* site header */}
          <div className="flex items-center justify-between gap-4 border-b border-[#EEF2F0] px-5 py-4 sm:px-8">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[15px] font-black text-white"
                style={{ background: STUDIO }}
              >
                {d.brand.replace("استودیو ", "")[0]}
              </span>
              <span className="text-[15px] font-extrabold">{d.brand}</span>
            </div>
            <nav className="hidden items-center gap-5 text-[13px] font-semibold text-ink/55 md:flex">
              {d.nav.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </nav>
            <span
              className="rounded-[10px] px-4 py-2 text-[13px] font-bold text-white"
              style={{ background: STUDIO }}
            >
              {d.navCta}
            </span>
          </div>

          {/* site hero */}
          <div className="px-5 py-9 text-center sm:py-12" style={{ background: "rgba(63,122,109,.07)" }}>
            <h3 className="text-xl font-black leading-fa sm:text-[26px]">{d.heroTitle}</h3>
            <p className="mx-auto mt-2.5 max-w-md text-[13.5px] leading-fa text-ink/55 sm:text-sm">{d.heroSub}</p>
            <span
              className="mt-5 inline-block rounded-xl px-6 py-2.5 text-sm font-extrabold text-white"
              style={{ background: STUDIO_DARK }}
            >
              {d.heroCta}
            </span>
          </div>

          {/* testimonials section = the embedded widget */}
          <div className="px-4 py-9 sm:px-8 sm:py-12">
            <div className="mb-2 text-center text-[13px] font-bold" style={{ color: STUDIO_DARK }}>
              {d.sectionKicker}
            </div>
            <h4 className="mb-7 text-center text-lg font-extrabold leading-fa sm:text-[22px]">{d.sectionTitle}</h4>

            <div className="relative rounded-2xl border-2 border-dashed border-primary/50 bg-porcelain/50 p-4 pt-6 sm:p-6 sm:pt-7">
              <span className="absolute -top-[15px] start-5 flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-extrabold text-white shadow-[0_4px_12px_rgba(176,58,72,.35)]">
                <span className="h-1.5 w-1.5 rounded-full bg-white/85" />
                {p.widgetTag}
              </span>
              {layout === "wall" ? (
                <SampleCardsWall texts={d.texts} theme={THEME} videos={d.videos} withBadge />
              ) : (
                <SampleCardsCarousel texts={d.texts} theme={THEME} videos={d.videos} withBadge />
              )}
            </div>
          </div>

          {/* site footer */}
          <div className="border-t border-[#EEF2F0] px-5 py-5 text-center text-xs text-ink/40">{d.footer}</div>
        </div>
      </div>
    </div>
  );
}
