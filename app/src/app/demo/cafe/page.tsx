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
          className="mt-7 inline-block rounded-2xl px-8 py-3.5 font-extrabold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
          href="#menu"
          style={{ background: color }}
        >
          {c.heroCta}
        </a>
        {/* CSS coffee cup with rising steam */}
        <div aria-hidden className="relative mx-auto mt-12 h-28 w-36">
          {[0, 1, 2].map((i) => (
            <span
              className="absolute h-7 w-1.5 rounded-full"
              key={i}
              style={{
                bottom: 78,
                insetInlineStart: 52 + i * 15,
                background: `${color}66`,
                filter: "blur(2px)",
                animation: `gvSteam 2.6s ease-in-out ${i * 0.7}s infinite`,
              }}
            />
          ))}
          <div
            className="absolute bottom-3 left-1/2 h-14 w-24 -translate-x-1/2 rounded-b-[38px] rounded-t-[10px]"
            style={{ background: color }}
          />
          <div
            className="absolute left-1/2 h-4 w-[104px] -translate-x-1/2 rounded-full bg-white"
            style={{ bottom: 62, border: `3px solid ${color}` }}
          />
          <div
            className="absolute bottom-6 left-1/2 h-9 w-9 translate-x-[40px] rounded-full border-4"
            style={{ borderColor: color }}
          />
          <div
            className="absolute bottom-0 left-1/2 h-2.5 w-32 -translate-x-1/2 rounded-full"
            style={{ background: `${color}30` }}
          />
        </div>
      </section>

      {/* menu */}
      <section className="px-5 py-14 sm:py-20" id="menu">
        <div className="mx-auto max-w-4xl">
          <div className="mb-9 text-center" data-reveal>
            <h2 className="text-2xl font-extrabold leading-fa sm:text-3xl">{c.menuTitle}</h2>
            <p className="mt-2 text-sm text-ink/55">{c.menuSub}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.menu.map((item, i) => (
              <div
                className="flex items-start gap-3.5 rounded-2xl border border-[#F2EDE9] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(58,32,40,.08)]"
                data-reveal
                key={item.name}
                style={{ transitionDelay: `${(i % 3) * 80}ms` }}
              >
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
          <div data-reveal>
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

      {/* the café's testimonials as Instagram-story clips (stylized preview
          of what the Gavah clip renderer produces — karaoke subtitles in the
          café's brand) */}
      <section className="px-5 py-14 sm:py-20" style={{ background: "#241812" }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center" data-reveal>
            <div className="mb-2.5 text-[13px] font-bold text-[#E9B872]">{c.storiesKicker}</div>
            <h2 className="text-2xl font-extrabold leading-fa text-white sm:text-3xl">{c.storiesTitle}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[14px] leading-fa text-[#C9B39F]">{c.storiesSub}</p>
          </div>
          <div className="flex flex-wrap items-start justify-center gap-6">
            {c.stories.map((s, i) => (
              <div className="w-[min(210px,62vw)]" data-reveal key={s.name} style={{ transitionDelay: `${i * 110}ms` }}>
                <div
                  className="relative overflow-hidden rounded-[20px] shadow-[0_18px_44px_rgba(0,0,0,.45)]"
                  style={{ aspectRatio: "9/16", background: "#1A100B" }}
                >
                  <div className="absolute inset-x-3 top-2.5 z-10 flex gap-1">
                    {[0, 1, 2].map((j) => (
                      <span className={`h-[3px] flex-1 rounded-full ${j <= i ? "bg-white/85" : "bg-white/25"}`} key={j} />
                    ))}
                  </div>
                  <span className="absolute start-3 top-6 z-10 flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1">
                    <span className="h-2 w-2 rounded-[3px] bg-[#E9B872]" />
                    <span className="text-[10.5px] font-bold text-white/90">{c.brand}</span>
                  </span>
                  <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(ellipse 95% 60% at 50% 75%, ${color}59, transparent 72%)` }}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex h-[56%] flex-col items-center">
                    <div
                      className="aspect-square w-[36%] rounded-full"
                      style={{ background: ["#5C4434", "#6A4E3B", "#53392B"][i % 3] }}
                    />
                    <div
                      className="mt-[4%] w-[76%] flex-1"
                      style={{
                        borderRadius: "48% 48% 0 0 / 90% 90% 0 0",
                        background: ["#5C4434", "#6A4E3B", "#53392B"][i % 3],
                      }}
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute inset-x-0 bottom-10 flex flex-wrap items-baseline justify-center gap-x-1.5 px-3">
                    {s.words.map((w, wi) => (
                      <span
                        className="text-[13px] font-extrabold"
                        key={w + wi}
                        style={{
                          color: wi === 1 ? "#E9B872" : "#FFFFFF",
                          textShadow: "0 1px 6px rgba(0,0,0,.5)",
                          animation: "gvWord 3.4s linear infinite",
                          animationDelay: `${wi * 0.35}s`,
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                  <span className="absolute bottom-2.5 end-3 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[10px] text-white/85">
                    {s.time}
                  </span>
                </div>
                <div className="mt-3 text-center text-[12.5px] text-[#C9B39F]">
                  <span className="font-bold text-white/90">{s.name}</span> · {s.role}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[11.5px] text-white/35">{c.storiesNote}</p>
        </div>
      </section>

      {/* testimonials — THE REAL WIDGET, installed with the real two lines */}
      <section className="px-4 py-14 sm:px-5 sm:py-20" id="reviews">
        <div className="mx-auto max-w-5xl">
          <div data-reveal>
            <div className="mb-2 text-center text-[13px] font-bold" style={{ color }}>
              {c.sectionKicker}
            </div>
            <h2 className="mb-3 text-center text-2xl font-extrabold leading-fa sm:text-3xl">{c.sectionTitle}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-[13px] leading-fa text-ink/45">{c.widgetNote}</p>
          </div>
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
