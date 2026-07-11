"use client";

import { useState } from "react";
import { fa } from "@/i18n/fa";

const CODE = `<script async src="https://gavah.io/embed.js"><\/script>\n<div data-gavah-wall="your-brand"></div>`;

export function EmbedCodeCard() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative mx-auto max-w-[560px] rounded-[14px] bg-[#2A161C] p-6 text-start shadow-[0_14px_36px_rgba(58,32,40,.2)]" dir="ltr">
      <button
        className="absolute right-3 top-3 rounded-lg border border-white/15 bg-white/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-white/20"
        onClick={async () => {
          await navigator.clipboard.writeText(CODE);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        type="button"
      >
        {copied ? fa.common.copied : fa.common.copy}
      </button>
      <pre className="overflow-x-auto pr-20 font-mono text-[13px] leading-[1.9] text-[#E3CCD1]">{CODE}</pre>
    </div>
  );
}
