import { brand } from "@/config/brand";

// The three-card quotation mark from the brand mockups, drawn with spans.
export function Logo({ size = 30 }: { size?: number }) {
  const s = size / 30;
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative block shrink-0" style={{ width: 34.5 * s, height: 30 * s }}>
        <span
          className="absolute rounded-[5px]"
          style={{ top: 3 * s, insetInlineEnd: 16 * s, width: 17.5 * s, height: 24.5 * s, background: brand.colors.accent, transform: "rotate(-14deg)" }}
        />
        <span
          className="absolute rounded-[5px]"
          style={{ top: 1.5 * s, insetInlineEnd: 11.5 * s, width: 17.5 * s, height: 24.5 * s, background: brand.colors.primary, transform: "rotate(-4deg)" }}
        />
        <span
          className="absolute flex items-center justify-center rounded-[5px]"
          style={{ top: 1 * s, insetInlineEnd: 6 * s, width: 17.5 * s, height: 26 * s, background: brand.colors.ink, transform: "rotate(7deg)" }}
        >
          <span className="font-black text-white" style={{ fontSize: 12.5 * s, lineHeight: 1, paddingBottom: 2 * s }}>
            «
          </span>
        </span>
      </span>
      <span className="font-black" style={{ fontSize: 21 * s }}>
        {brand.nameFa}
      </span>
    </span>
  );
}
