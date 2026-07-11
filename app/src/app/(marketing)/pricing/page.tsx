import type { Metadata } from "next";
import Link from "next/link";
import { fa } from "@/i18n/fa";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { PlanCards } from "@/components/marketing/PlanCards";

const m = fa.marketing;

export const metadata: Metadata = {
  title: `${m.nav.pricing} | ${fa.common.appName}`,
  description: m.pricingPage.sub,
};

const darkTexture = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0 1px, transparent 1px 22px), repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 1px, transparent 1px 22px)",
};

export default function PricingPage() {
  return (
    <main>
      <section className="px-5 pt-14 text-center sm:pt-22">
        <h1 className="text-3xl font-black leading-fa sm:text-[44px]" style={{ textWrap: "balance" }}>
          {m.pricingPage.title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg leading-fa text-[#5D4A51]">{m.pricingPage.sub}</p>
      </section>

      <section className="px-5 pt-10 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <PlanCards />
        </div>
      </section>

      {/* comparison table */}
      <section className="px-5 pt-12 sm:pt-20">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[18px] border border-hairline bg-card">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-hairline bg-porcelain px-5 py-4">
            <span />
            <span className="text-center text-sm font-extrabold">{m.pricingPage.compareFree}</span>
            <span className="text-center text-sm font-extrabold text-primary-dark">{m.pricingPage.comparePro}</span>
          </div>
          {m.pricingPage.compareRows.map((row, i) => (
            <div
              className={`grid grid-cols-[1.4fr_1fr_1fr] items-center px-5 py-3.5 ${i < m.pricingPage.compareRows.length - 1 ? "border-b border-hairline" : ""}`}
              key={row.label}
            >
              <span className="text-[14.5px] font-semibold">{row.label}</span>
              <span className="text-center text-sm text-[#5D4A51]">{row.free}</span>
              <span className="text-center text-sm font-bold text-primary-dark">{row.pro}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-12 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-7 text-center text-2xl font-extrabold leading-fa sm:text-3xl">{m.faqTitle}</h2>
          <FaqAccordion faqs={m.pricingPage.faqs} />
        </div>
      </section>

      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-ink px-7 py-11 text-center sm:py-16" style={darkTexture}>
          <h2 className="text-2xl font-extrabold leading-fa text-white sm:text-4xl">{m.finalCta.title}</h2>
          <div className="mt-7 flex flex-col items-center gap-3">
            <Link
              className="rounded-[14px] bg-primary px-9 py-3.5 text-[17px] font-extrabold text-white transition-colors hover:bg-primary-dark"
              href="/signup"
            >
              {m.finalCta.button}
            </Link>
            <span className="text-[13.5px] text-[#C2A3A9]">{m.finalCta.note}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
