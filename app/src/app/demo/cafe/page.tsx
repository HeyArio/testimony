import type { Metadata } from "next";
import Script from "next/script";
import { db } from "@/lib/db";
import { DEMO_SLUG } from "@/lib/demo";
import { fa } from "@/i18n/fa";

// The "inception" demo: a full fictional café website that installs the
// Gavah widget with the REAL two-line embed (script + div), exactly like a
// paying customer's site. Reached from the URL bar of the browser frame on
// /demo and the home page. Deliberately outside the (marketing) group — no
// Gavah header/footer, this is supposed to feel like someone else's site.
// A slim banner keeps it honest (the café is fictional).

const c = fa.marketing.demoCafe;

export const revalidate = 300;

export const metadata: Metadata = {
  title: `${c.brand} — سایت نمونه`,
  robots: { index: false },
};

export default async function CafeDemoPage() {
  const project = await db.project.findUnique({ where: { slug: DEMO_SLUG } });
  const color = project?.brandColor ?? "#7A4E2D";

  return (
    <div className="bg-white text-ink">
      {/* honesty banner */}
      <div className="bg-ink px-4 py-2 text-center text-[12.5px] leading-fa text-white/85">
        {c.banner}{" "}
        <a className="font-bold text-white underline underline-offset-4 hover:no-underline" href="/demo">
          {c.bannerBack}
        </a>
      </div>

      {/* café header */}
      <header className="sticky top-0 z-10 border-b border-[#F2EDE9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black text-white"
              style={{ background: color }}
            >
              {c.brand.replace("کافه ", "")[0]}
            </span>
            <span className="text-lg font-extrabold">{c.brand}</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-ink/60 sm:flex">
            <a className="hover:text-ink" href="#menu">
              {c.nav[0]}
            </a>
            <a className="hover:text-ink" href="#about">
              {c.nav[1]}
            </a>
            <a className="hover:text-ink" href="#reviews">
              {c.sectionKicker}
            </a>
          </nav>
          <a
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            href="#menu"
            style={{ background: color }}
          >
            {c.navCta}
          </a>
        </div>
      </header>

      {/* hero */}
      <section className="px-5 py-16 text-center sm:py-24" style={{ background: `${color}10` }}>
        <span
          className="mb-4 inline-block rounded-full border px-4 py-1 text-[12.5px] font-bold"
          style={{ borderColor: `${color}55`, color }}
        >
          {c.heroBadge}
        </span>
        <h1 className="text-3xl font-black leading-fa sm:text-5xl">{c.heroTitle}</h1>
        <p className="mx-auto mt-4 max-w-md leading-fa text-ink/60 sm:text-lg">{c.heroSub}</p>
        <a
          className="mt-7 inline-block rounded-2xl px-8 py-3.5 font-extrabold text-white transition-opacity hover:opacity-90"
          href="#menu"
          style={{ background: color }}
        >
          {c.heroCta}
        </a>
      </section>

      {/* menu */}
      <section className="px-5 py-14 sm:py-20" id="menu">
        <div className="mx-auto max-w-4xl">
          <div className="mb-9 text-center">
            <h2 className="text-2xl font-extrabold leading-fa sm:text-3xl">{c.menuTitle}</h2>
            <p className="mt-2 text-sm text-ink/55">{c.menuSub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.menu.map((item) => (
              <div className="flex items-start gap-3.5 rounded-2xl border border-[#F2EDE9] p-5" key={item.name}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${color}14` }}
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-extrabold">{item.name}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-fa text-ink/55">{item.desc}</p>
                  <p className="mt-1.5 text-[13px] font-bold" style={{ color }}>
                    {item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* about + info */}
      <section className="px-5 py-14 sm:py-20" id="about" style={{ background: `${color}08` }}>
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-3 text-2xl font-extrabold leading-fa">{c.aboutTitle}</h2>
            <p className="leading-fa text-ink/70">{c.aboutBody}</p>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-[#F2EDE9] bg-white p-6">
            <div>
              <p className="text-sm font-extrabold" style={{ color }}>
                {c.hoursTitle}
              </p>
              <p className="mt-1 text-sm leading-fa text-ink/70">{c.hours}</p>
            </div>
            <div>
              <p className="text-sm font-extrabold" style={{ color }}>
                {c.addressTitle}
              </p>
              <p className="mt-1 text-sm leading-fa text-ink/70">{c.address}</p>
            </div>
          </div>
        </div>
      </section>

      {/* testimonials — THE REAL WIDGET, installed with the real two lines */}
      <section className="px-4 py-14 sm:px-5 sm:py-20" id="reviews">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 text-center text-[13px] font-bold" style={{ color }}>
            {c.sectionKicker}
          </div>
          <h2 className="mb-3 text-center text-2xl font-extrabold leading-fa sm:text-3xl">{c.sectionTitle}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-[13px] leading-fa text-ink/45">{c.widgetNote}</p>
          {project ? (
            <>
              {/* The real embed. Loaded via next/script (post-hydration) —
                  a raw <script> runs mid-parse, embed.js mutates the div
                  before React hydrates, and React wipes the widget as a
                  hydration mismatch. Customer sites have no hydration, so
                  the documented 2-line snippet is unaffected. */}
              <Script src="/embed.js" strategy="afterInteractive" />
              <div data-gavah-wall={DEMO_SLUG} />
            </>
          ) : (
            <p className="rounded-2xl border border-[#F2EDE9] p-8 text-center text-ink/50">{fa.wall.empty}</p>
          )}
        </div>
      </section>

      {/* café footer */}
      <footer className="border-t border-[#F2EDE9] px-5 py-8 text-center text-sm text-ink/45">{c.footer}</footer>
    </div>
  );
}
