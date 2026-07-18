import { brand } from "@/config/brand";
import { fa } from "@/i18n/fa";
import { faDigits } from "@/lib/format";
import type { AvazehScore } from "@/lib/avazeh";

// The آوازه seal — the embeddable face of the proof-weighted trust score.
// Pill layout, RTL: score block · proportional stars · proof count · Gavah
// wordmark. Stars fill to score/2 via a clipped overlay, in brand color.

export function AvazehSeal({
  avazeh,
  brandColor,
  compact = false,
}: {
  avazeh: AvazehScore;
  brandColor: string;
  compact?: boolean;
}) {
  const starFillPercent = Math.max(0, Math.min(100, (avazeh.score / 10) * 100));
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border border-hairline bg-white shadow-[0_6px_20px_rgba(58,32,40,.10)] ${
        compact ? "px-4 py-1.5" : "px-5 py-2.5"
      }`}
      dir="rtl"
    >
      <span className="flex items-baseline gap-1">
        <span className={`font-black leading-none ${compact ? "text-lg" : "text-2xl"}`} style={{ color: brandColor }}>
          {faDigits(avazeh.score.toLocaleString("en-US", { minimumFractionDigits: 1 }))}
        </span>
        <span className="text-[10px] font-bold text-ink/45">{fa.avazeh.outOfTen}</span>
      </span>
      {/* proportional stars: gray base + color overlay clipped to score% */}
      <span aria-hidden className="relative inline-block leading-none" dir="ltr">
        <span className={`tracking-[1px] text-ink/15 ${compact ? "text-sm" : "text-base"}`}>★★★★★</span>
        <span
          className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
          style={{ width: `${starFillPercent}%` }}
        >
          <span className={`tracking-[1px] ${compact ? "text-sm" : "text-base"}`} style={{ color: brandColor }}>
            ★★★★★
          </span>
        </span>
      </span>
      <span className={`leading-tight text-ink/55 ${compact ? "text-[10px]" : "text-[11px]"}`}>
        <span className="block font-bold text-ink/75">
          {brand.scoreNameFa} · {fa.avazeh.basedOn(faDigits(avazeh.totalCount))}
        </span>
        {avazeh.videoCount > 0 && <span className="block">{fa.avazeh.videoShare(faDigits(avazeh.videoCount))}</span>}
      </span>
      <span className="ms-1 border-s border-hairline ps-2.5 text-[10px] font-black text-ink/40">{brand.nameFa}</span>
    </div>
  );
}
