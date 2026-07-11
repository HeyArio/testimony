import Link from "next/link";
import { brand } from "@/config/brand";
import { fa } from "@/i18n/fa";

const t = fa.marketing.footer;

const columns = [
  {
    title: t.product,
    links: [
      { href: "/#features", label: fa.marketing.nav.features },
      { href: "/pricing", label: fa.marketing.nav.pricing },
      { href: "/demo", label: fa.marketing.nav.demo },
    ],
  },
  {
    title: t.resources,
    links: [
      { href: "/#faq", label: t.faq },
      { href: "/demo", label: t.guide },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink px-5 pb-8 pt-14 text-[#DCC3C8]">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="max-w-[280px]">
            <div className="mb-3.5 flex items-center gap-2.5">
              {/* Footer logo variant: light card on dark background */}
              <span className="relative block h-7 w-8 shrink-0">
                <span className="absolute rounded-[5px]" style={{ top: 3, insetInlineEnd: 15, width: 16, height: 23, background: brand.colors.accent, transform: "rotate(-14deg)" }} />
                <span className="absolute rounded-[5px]" style={{ top: 1.5, insetInlineEnd: 10.5, width: 16, height: 23, background: "#C9505E", transform: "rotate(-4deg)" }} />
                <span className="absolute flex items-center justify-center rounded-[5px]" style={{ top: 1, insetInlineEnd: 5.5, width: 16, height: 24, background: brand.colors.bg, transform: "rotate(7deg)" }}>
                  <span className="pb-0.5 text-xs font-black leading-none text-ink">«</span>
                </span>
              </span>
              <span className="text-[19px] font-black text-white">{brand.nameFa}</span>
            </div>
            <p className="text-[13.5px] leading-loose text-[#C2A3A9]">{t.blurb}</p>
          </div>
          <div className="flex flex-wrap gap-x-16 gap-y-8">
            {columns.map((col) => (
              <div className="flex flex-col gap-3" key={col.title}>
                <span className="mb-1 text-sm font-extrabold text-white">{col.title}</span>
                {col.links.map((l) => (
                  <Link className="text-[13.5px] text-[#C2A3A9] hover:text-white" href={l.href} key={l.label}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-11 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <span className="text-[12.5px] text-[#C2A3A9]">{t.madeFor}</span>
          <span className="text-[12.5px] text-[#8A6F76]">{t.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
