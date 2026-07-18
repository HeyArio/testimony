import Link from "next/link";
import { fa } from "@/i18n/fa";

const t = fa.marketing.plans;

export function PlanCards() {
  return (
    <div className="grid items-stretch gap-5 sm:grid-cols-2">
      <div className="card-lift flex flex-col rounded-[20px] border border-hairline bg-card p-8" data-reveal>
        <h3 className="text-xl font-extrabold">{t.free.name}</h3>
        <div className="mb-1 mt-3.5 text-4xl font-black">{t.free.price}</div>
        <div className="mb-6 text-[13.5px] text-[#9B8288]">{t.free.period}</div>
        <ul className="mb-7 flex flex-col gap-3">
          {t.free.features.map((f) => (
            <li className="flex items-baseline gap-2 text-[14.5px] text-[#5D4A51]" key={f}>
              <span className="font-extrabold text-primary">✓</span>
              {f}
            </li>
          ))}
          <li className="flex items-baseline gap-2 text-[14.5px] text-[#9B8288]">
            <span className="font-extrabold">·</span>
            {t.free.badgeNote}
          </li>
        </ul>
        <Link
          className="mt-auto rounded-xl border-[1.5px] border-primary px-5 py-3 text-center font-bold text-primary-dark transition-colors hover:bg-primary hover:text-white"
          href="/signup"
        >
          {t.free.cta}
        </Link>
      </div>

      <div
        className="card-lift relative flex flex-col rounded-[20px] bg-ink p-8 shadow-[0_18px_44px_rgba(58,32,40,.28)]"
        data-reveal
        style={{ transitionDelay: "120ms" }}
      >
        <span className="absolute -top-3 start-7 rounded-full bg-accent px-3.5 py-1 text-[12.5px] font-extrabold text-ink">
          {t.pro.popular}
        </span>
        <h3 className="text-xl font-extrabold text-white">{t.pro.name}</h3>
        <div className="mb-1 mt-3.5 text-4xl font-black text-white">
          {t.pro.price} <span className="text-[15px] font-semibold text-[#C2A3A9]">{t.pro.priceUnit}</span>
        </div>
        <div className="mb-6 text-[13.5px] text-accent">{t.pro.yearlyNote}</div>
        <ul className="mb-7 flex flex-col gap-3">
          {t.pro.features.map((f) => (
            <li className="flex items-baseline gap-2 text-[14.5px] text-[#F7E9EB]" key={f}>
              <span className="font-extrabold text-primary">✓</span>
              {f}
            </li>
          ))}
        </ul>
        <Link
          className="mt-auto rounded-xl bg-primary px-5 py-3.5 text-center font-bold text-white transition-colors hover:bg-primary-dark"
          href="/signup"
        >
          {t.pro.cta}
        </Link>
      </div>
    </div>
  );
}
