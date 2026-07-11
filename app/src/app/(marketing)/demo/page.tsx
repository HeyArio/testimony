import type { Metadata } from "next";
import Link from "next/link";
import { fa } from "@/i18n/fa";
import { SampleWall } from "@/components/marketing/SampleWall";

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
      <section className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-black leading-fa sm:text-4xl">{m.demoPage.title}</h1>
            <p className="mx-auto mt-3.5 max-w-lg leading-fa text-[#5D4A51]">{m.demoPage.sub}</p>
          </div>
          <SampleWall wide />
        </div>
      </section>
    </main>
  );
}
