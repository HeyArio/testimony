"use client";

import { useState } from "react";
import { fa } from "@/i18n/fa";

export function CopySnippet({ text, multiline = false }: { text: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <pre
        className={`min-w-0 flex-1 overflow-x-auto rounded-card border border-hairline bg-porcelain px-3 py-2 text-xs ${multiline ? "" : "whitespace-nowrap"}`}
        dir="ltr"
      >
        {text}
      </pre>
      <button
        className="btn-ghost shrink-0 !px-3 !py-1.5 text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        type="button"
      >
        {copied ? fa.common.copied : fa.common.copy}
      </button>
    </div>
  );
}
