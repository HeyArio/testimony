import type { Metadata } from "next";
import Link from "next/link";
import { fa } from "@/i18n/fa";
import { DemoSiteFrame } from "@/components/marketing/DemoSiteFrame";
import { EmbedCodeCard } from "@/components/marketing/EmbedCodeCard";

const m = fa.marketing;

export const metadata: Metadata = {
  title: `${m.nav.demo} | ${fa.common.appName}`,
  description: m.demoPage.sub,
};

export default function DemoPage() {
  return (
    <main>
      <div className="bg-ink px-5 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-[#DCC3C8]">{m.demoPage.barText}</span>
          <Link
            className="rounded-[10px] bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            href="/signup"
          >
            {m.demoPage.barCta}
          </Link>
        </div>
      </div>

      {/* the widget, in context */}
      <section className="px-4 py-12 sm:px-5 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-9 text-center">
            <h1 className="text-2xl font-black leading-fa sm:text-4xl">{m.demoPage.title}</h1>
            <p className="mx-auto mt-3.5 max-w-xl leading-fa text-[#5D4A51]">{m.demoPage.sub}</p>
          </div>
          <DemoSiteFrame />
        </div>
      </section>

      {/* how it got there: two lines of code */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-7 text-2xl font-extrabold leading-fa sm:text-3xl">{m.demoPage.embedTitle}</h2>
          <EmbedCodeCard />
          <p className="mx-auto mt-4 max-w-md text-[13.5px] leading-fa text-[#9B8288]">{m.demoPage.embedNote}</p>
        </div>
      </section>

      {/* final CTA */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl bg-ink px-7 py-10 text-center sm:py-12">
          <h2 className="text-xl font-extrabold leading-fa text-white sm:text-3xl">{m.demoPage.bottomCtaTitle}</h2>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              className="rounded-[14px] bg-primary px-9 py-3.5 font-extrabold text-white transition-colors hover:bg-primary-dark"
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
