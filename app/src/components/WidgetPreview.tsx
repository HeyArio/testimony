"use client";

import { useEffect, useRef, useState } from "react";
import { fa } from "@/i18n/fa";

// Live preview of the embed exactly as a visitor sees it on a customer's
// site: the real /w/[slug] iframe (same content embed.js loads), on a white
// "host page", resized through the same gavah:height postMessage protocol.

export function WidgetPreview({ slug }: { slug: string }) {
  const [layout, setLayout] = useState<"wall" | "carousel">("wall");
  const [height, setHeight] = useState(240);
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
    <div className="card flex flex-col gap-3 !p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black">{fa.inbox.previewTitle}</p>
          <p className="mt-0.5 text-xs text-ink/60">{fa.inbox.previewHint}</p>
        </div>
        <div className="inline-flex rounded-full border border-hairline bg-porcelain p-1">
          {(
            [
              ["wall", fa.inbox.previewTabWall],
              ["carousel", fa.inbox.previewTabCarousel],
            ] as const
          ).map(([key, label]) => (
            <button
              className={`rounded-full px-4 py-1 text-xs font-bold transition-colors ${
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

      {/* mini browser window standing in for the customer's site */}
      <div className="overflow-hidden rounded-[14px] border border-hairline">
        <div className="flex items-center gap-3 border-b border-hairline bg-porcelain px-3 py-2">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E0564F]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E8B93E]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#57BB5C]/70" />
          </span>
          <span className="mx-auto rounded-full bg-white px-4 py-0.5 text-xs text-ink/50">
            {fa.inbox.previewBar}
          </span>
          <span className="w-[46px]" />
        </div>
        <div className="bg-white p-3">
          <iframe
            className="block w-full border-0"
            key={layout}
            ref={frameRef}
            src={`/w/${slug}${layout === "carousel" ? "/carousel" : ""}`}
            style={{ height }}
            title={fa.inbox.previewTitle}
          />
        </div>
      </div>
    </div>
  );
}
