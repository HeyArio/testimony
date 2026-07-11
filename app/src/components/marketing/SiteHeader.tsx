"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { fa } from "@/i18n/fa";

const links = [
  { href: "/#features", label: fa.marketing.nav.features },
  { href: "/pricing", label: fa.marketing.nav.pricing },
  { href: "/demo", label: fa.marketing.nav.demo },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-porcelain/90 backdrop-blur">
      <div className="mx-auto flex h-[66px] max-w-5xl items-center justify-between gap-4 px-5">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 sm:flex">
          {links.map((l) => (
            <Link className="text-[15px] font-medium text-ink hover:text-primary-dark" href={l.href} key={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2.5 sm:flex">
          <Link className="rounded-[10px] px-4 py-2 text-[15px] font-semibold text-ink hover:bg-hairline" href="/login">
            {fa.marketing.nav.login}
          </Link>
          <Link
            className="rounded-[11px] bg-primary px-5 py-2.5 text-[15px] font-bold text-white hover:bg-primary-dark"
            href="/signup"
          >
            {fa.marketing.nav.cta}
          </Link>
        </div>
        <button
          aria-label={fa.marketing.nav.menuLabel}
          className="flex flex-col gap-[5px] rounded-lg p-2.5 sm:hidden"
          onClick={() => setOpen((o) => !o)}
          type="button"
        >
          <span className="block h-0.5 w-[22px] rounded bg-ink" />
          <span className="block h-0.5 w-[22px] rounded bg-ink" />
          <span className="block h-0.5 w-[22px] rounded bg-ink" />
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-0.5 border-t border-hairline bg-porcelain px-5 pb-5 pt-2.5 sm:hidden">
          {links.map((l) => (
            <Link
              className="rounded-[10px] px-2 py-3 font-semibold text-ink"
              href={l.href}
              key={l.href}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link className="rounded-[10px] px-2 py-3 font-semibold text-ink" href="/login" onClick={() => setOpen(false)}>
            {fa.marketing.nav.login}
          </Link>
          <Link
            className="mt-2.5 rounded-xl bg-primary px-5 py-3 text-center font-bold text-white hover:bg-primary-dark"
            href="/signup"
            onClick={() => setOpen(false)}
          >
            {fa.marketing.nav.cta}
          </Link>
        </div>
      )}
    </header>
  );
}
