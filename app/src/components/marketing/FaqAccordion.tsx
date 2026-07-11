"use client";

import { useState } from "react";

export function FaqAccordion({ faqs }: { faqs: readonly { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      {faqs.map((f, i) => (
        <div className="overflow-hidden rounded-[14px] border border-hairline bg-card" key={f.q}>
          <button
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-3.5 px-5 py-4 text-start"
            onClick={() => setOpen(open === i ? -1 : i)}
            type="button"
          >
            <span className="font-bold leading-fa">{f.q}</span>
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-porcelain font-bold text-primary-dark">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i && <p className="px-5 pb-5 text-[15px] leading-fa text-[#5D4A51]">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
