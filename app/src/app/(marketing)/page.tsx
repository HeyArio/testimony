import Link from "next/link";
import { fa } from "@/i18n/fa";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { EmbedCodeCard } from "@/components/marketing/EmbedCodeCard";
import { PlanCards } from "@/components/marketing/PlanCards";
import { SampleWall } from "@/components/marketing/SampleWall";

const m = fa.marketing;

// Dark textured background used across the mockups' dark sections.
const darkTexture = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(255,255,255,.025) 0 1px, transparent 1px 22px), repeating-linear-gradient(-45deg, rgba(255,255,255,.025) 0 1px, transparent 1px 22px)",
};

function Silhouette({ tint }: { tint: string }) {
  return (
    <div className="absolute bottom-[-6%] left-1/2 w-[72%] -translate-x-1/2">
      <div className="mx-auto aspect-square w-[34%] rounded-full" style={{ background: tint }} />
      <div
        className="mx-auto mt-[5%] w-[86%]"
        style={{ aspectRatio: "2/1.1", borderRadius: "48% 48% 0 0 / 80% 80% 0 0", background: tint }}
      />
    </div>
  );
}

function KaraokeWords({ words, size = 15, accentIndex = 0 }: { words: readonly string[]; size?: number; accentIndex?: number }) {
  return (
    <div className="absolute bottom-9 left-0 right-0 flex flex-wrap justify-center gap-1.5 px-3.5">
      {words.map((w, i) => (
        <span
          className="font-extrabold"
          key={w + i}
          style={{
            fontSize: size,
            color: i === accentIndex ? "#D98E4F" : "#FFFFFF",
            animation: "gvWord 3.2s linear infinite",
            animationDelay: `${i * 0.35}s`,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

function HeroPhones() {
  return (
    <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4 pt-12 sm:gap-11 sm:pt-16">
      {/* raw customer video */}
      <div className="w-[min(270px,74vw)]">
        <div
          className="relative overflow-hidden rounded-[18px] bg-[#454e60] shadow-[0_14px_36px_rgba(58,32,40,.2)]"
          style={{ aspectRatio: "9/13", transform: "rotate(-2deg)", animation: "gvHand 5s ease-in-out 1.6s infinite" }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px)" }}
          />
          <Silhouette tint="#6b7488" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-[#e5484d]" style={{ animation: "gvBlink 1.4s ease-in-out infinite" }} />
            <span className="font-mono text-[11px] tracking-wider text-white">REC</span>
          </div>
          <div className="absolute bottom-2.5 right-3 font-mono text-[11px] text-white/70">۰:۱۴</div>
        </div>
        <div className="mt-3.5 text-center text-sm font-semibold text-[#9B8288]">{m.hero.rawLabel}</div>
      </div>

      <div className="mb-9 flex h-[46px] w-[46px] items-center justify-center self-center rounded-full border border-hairline bg-card text-xl text-primary shadow-[0_4px_14px_rgba(58,32,40,.08)]">
        <span className="hidden sm:inline">←</span>
        <span className="sm:hidden">↓</span>
      </div>

      {/* Gavah output */}
      <div className="w-[min(270px,74vw)]">
        <div
          className="relative overflow-hidden rounded-[20px] border-2 border-primary bg-ink shadow-[0_18px_44px_rgba(58,32,40,.3)]"
          style={{ aspectRatio: "9/13", animation: "gvRise .9s cubic-bezier(.2,.7,.2,1) .45s both" }}
        >
          <div className="absolute inset-0" style={darkTexture} />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 90% 55% at 50% 78%, rgba(176,58,72,.22), transparent 70%)" }}
          />
          <Silhouette tint="#6E4A55" />
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <span className="h-[9px] w-[9px] rounded-[3px] bg-accent" />
            <span className="text-xs font-bold text-white">{m.hero.demoBrand}</span>
          </div>
          <KaraokeWords words={m.hero.demoWords} />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
            <div className="absolute right-0 top-0 h-full w-[62%] bg-primary" />
          </div>
        </div>
        <div className="mt-3.5 text-center text-sm font-bold text-primary-dark">{m.hero.outLabel}</div>
      </div>
    </div>
  );
}

function SectionHeading({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div className="mb-11 text-center">
      {kicker && <div className="mb-2.5 text-sm font-bold text-primary-dark">{kicker}</div>}
      <h2 className="text-2xl font-extrabold leading-fa sm:text-4xl">{title}</h2>
      {sub && <p className="mx-auto mt-3.5 max-w-lg text-[15.5px] leading-fa text-[#5D4A51]">{sub}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* hero */}
      <section className="px-5 pt-14 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-black leading-[1.5] sm:text-5xl" style={{ textWrap: "balance" }}>
            {m.hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-fa text-[#5D4A51] sm:text-lg">{m.hero.sub}</p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              className="rounded-[14px] bg-primary px-10 py-4 text-lg font-extrabold text-white shadow-[0_8px_24px_rgba(176,58,72,.28)] transition-colors hover:bg-primary-dark"
              href="/signup"
            >
              {m.nav.cta}
            </Link>
            <span className="text-[13.5px] text-[#9B8288]">{m.hero.noCard}</span>
          </div>
        </div>
        <HeroPhones />
      </section>

      {/* claim vs trust */}
      <section className="px-5 py-16 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <SectionHeading kicker={m.why.kicker} title={m.why.title} />
          <div className="grid items-start gap-7 sm:grid-cols-2">
            <div>
              <div className="rounded-card border border-hairline bg-[#fafbfb] p-5 opacity-85 grayscale">
                <div className="flex items-center gap-2.5 border-b border-hairline pb-3.5">
                  <span className="h-[34px] w-[34px] rounded-full bg-[#c8cfd6]" />
                  <span className="h-2.5 w-[90px] rounded-md bg-[#c8cfd6]" />
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                  <div className="flex w-[78%] flex-col gap-2 self-start rounded-[14px] rounded-es-[4px] bg-[#e7ebee] p-3.5">
                    <span className="block h-2 w-full rounded-[5px] bg-[#c2cad2]" />
                    <span className="block h-2 w-[82%] rounded-[5px] bg-[#c2cad2]" />
                    <span className="block h-2 w-[55%] rounded-[5px] bg-[#c2cad2]" />
                  </div>
                  <div className="flex w-[52%] flex-col gap-2 self-end rounded-[14px] rounded-ee-[4px] bg-[#dfe4e8] p-3.5">
                    <span className="block h-2 w-full rounded-[5px] bg-[#c2cad2]" />
                    <span className="block h-2 w-[64%] rounded-[5px] bg-[#c2cad2]" />
                  </div>
                </div>
              </div>
              <p className="mt-3.5 text-center text-[14.5px] leading-fa text-[#9B8288]">{m.why.fakeCaption}</p>
            </div>
            <div>
              <div className="relative overflow-hidden rounded-card bg-ink p-5 shadow-[0_14px_36px_rgba(58,32,40,.22)]">
                <div className="absolute inset-0" style={darkTexture} />
                <div className="relative flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">
                    {m.why.realName[0]}
                  </span>
                  <div>
                    <div className="text-[15px] font-bold text-white">{m.why.realName}</div>
                    <div className="text-[12.5px] text-[#C2A3A9]">{m.why.realRole}</div>
                  </div>
                  <span className="ms-auto flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/15">
                    <span className="ml-0.5 h-0 w-0 border-y-[6px] border-y-transparent border-r-[9px] border-r-white" />
                  </span>
                </div>
                <p className="relative mb-2.5 mt-4 text-[15.5px] font-semibold leading-fa text-[#F7E9EB]">{m.why.realQuote}</p>
                <div className="relative text-sm tracking-[2px] text-accent">★★★★★</div>
              </div>
              <p className="mt-3.5 text-center text-[14.5px] font-bold leading-fa">{m.why.realCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="px-5 pb-16 sm:pb-28" id="features">
        <div className="mx-auto max-w-4xl">
          <SectionHeading kicker={m.how.kicker} title={m.how.title} />
          <div className="grid gap-5 sm:grid-cols-3">
            {m.how.steps.map((step, i) => (
              <div className="flex flex-col gap-3.5 rounded-[18px] border border-hairline bg-card p-6" key={step.title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-extrabold text-white">
                  {["۱", "۲", "۳"][i]}
                </span>
                <h3 className="text-lg font-extrabold">{step.title}</h3>
                <p className="text-[14.5px] leading-fa text-[#5D4A51]">{step.body}</p>
                <div className="mt-auto flex h-[110px] items-center justify-center rounded-xl bg-porcelain p-3.5">
                  {i === 0 && (
                    <div className="flex items-center gap-2 rounded-full border border-hairline bg-card px-4 py-2 shadow-sm" dir="ltr">
                      <span className="font-mono text-[12.5px] text-primary-dark">gavah.io/r/your-brand</span>
                      <span className="h-4 w-4 rounded border-[1.5px] border-[#9B8288]" />
                    </div>
                  )}
                  {i === 1 && (
                    <div className="relative h-[92px] w-14 overflow-hidden rounded-xl bg-[#454e60]">
                      <div className="absolute bottom-[-4px] left-1/2 w-[70%] -translate-x-1/2">
                        <div className="mx-auto aspect-square w-[38%] rounded-full bg-[#6b7488]" />
                        <div className="mx-auto mt-[6%] w-[90%] bg-[#6b7488]" style={{ aspectRatio: "2/1.2", borderRadius: "48% 48% 0 0 / 80% 80% 0 0" }} />
                      </div>
                      <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e5484d]" style={{ animation: "gvBlink 1.4s ease-in-out infinite" }} />
                    </div>
                  )}
                  {i === 2 && (
                    <div className="grid h-full w-full grid-cols-2 gap-2 px-7">
                      <span className="rounded-lg bg-ink" />
                      <span className="rounded-lg border border-hairline bg-card" />
                      <span className="rounded-lg border border-hairline bg-card" />
                      <span className="rounded-lg bg-ink" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* the magic (dark) */}
      <section className="bg-ink px-5 py-16 sm:py-28" style={darkTexture}>
        <div className="mx-auto grid max-w-4xl items-center gap-8 sm:grid-cols-2 sm:gap-16">
          <div>
            <div className="mb-3 text-sm font-bold text-primary">{m.magic.kicker}</div>
            <h2 className="text-2xl font-extrabold leading-fa text-white sm:text-[38px] sm:leading-[1.65]">{m.magic.title}</h2>
            <p className="mb-6 mt-4 leading-fa text-[#DCC3C8]">{m.magic.body}</p>
            <div className="flex flex-col gap-3.5">
              {m.magic.bullets.map((b) => (
                <div className="flex items-baseline gap-2.5" key={b}>
                  <span className="font-extrabold text-primary">✓</span>
                  <span className="text-[15px] text-[#F7E9EB]">{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#2A161C] shadow-[0_24px_60px_rgba(0,0,0,.4)]"
              style={{ width: "min(280px, 80vw)", aspectRatio: "9/16" }}
            >
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 50% at 50% 80%, rgba(176,58,72,.25), transparent 70%)" }} />
              <Silhouette tint="#61414C" />
              <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <span className="h-[9px] w-[9px] rounded-[3px] bg-accent" />
                <span className="text-[12.5px] font-bold text-white">{m.magic.phoneBrand}</span>
              </div>
              <div className="absolute bottom-14 left-0 right-0 flex flex-wrap justify-center gap-1.5 px-4">
                {m.magic.phoneWords.map((w, i) => (
                  <span
                    className="text-lg font-black"
                    key={w + i}
                    style={{
                      color: i === m.magic.phoneWords.length - 1 ? "#D98E4F" : "#FFFFFF",
                      animation: "gvWord 3.6s linear infinite",
                      animationDelay: `${i * 0.4}s`,
                    }}
                  >
                    {w}
                  </span>
                ))}
              </div>
              <div className="absolute bottom-5 left-0 right-0 text-center text-[11px] font-semibold text-white/45">{m.magic.badge}</div>
            </div>
          </div>
        </div>
      </section>

      {/* wall of love */}
      <section className="px-5 py-16 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <SectionHeading kicker={m.wallSection.kicker} title={m.wallSection.title} sub={m.wallSection.sub} />
          <SampleWall />
          <div className="mt-8 text-center">
            <Link className="font-bold text-primary-dark hover:text-ink" href="/demo">
              {m.wallSection.demoLink}
            </Link>
          </div>
        </div>
      </section>

      {/* publish anywhere */}
      <section className="px-5 pb-16 sm:pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-7 text-2xl font-extrabold leading-fa sm:text-3xl">{m.publish.title}</h2>
          <div className="mb-7 flex flex-wrap justify-center gap-2.5">
            {m.publish.platforms.map((p) => (
              <span className="rounded-full border border-hairline bg-card px-5 py-2 text-sm font-semibold" key={p}>
                {p}
              </span>
            ))}
          </div>
          <EmbedCodeCard />
          <p className="mt-4 text-[13.5px] text-[#9B8288]">{m.publish.note}</p>
        </div>
      </section>

      {/* pricing summary */}
      <section className="px-5 pb-16 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <SectionHeading kicker={m.pricingSummary.kicker} title={m.pricingSummary.title} />
          <PlanCards />
          <div className="mt-7 text-center">
            <Link className="font-bold text-primary-dark hover:text-ink" href="/pricing">
              {m.pricingSummary.detailsLink}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 pb-16 sm:pb-28" id="faq">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-extrabold leading-fa sm:text-3xl">{m.faqTitle}</h2>
          <FaqAccordion faqs={m.homeFaqs} />
        </div>
      </section>

      {/* final CTA */}
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
