import Link from "next/link";
import { Logo } from "@/components/Logo";
import { fa } from "@/i18n/fa";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getSessionUser();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5">
      <header className="flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-3">
          {user ? (
            <Link className="btn-primary" href="/dashboard">
              {fa.nav.dashboard}
            </Link>
          ) : (
            <>
              <Link className="btn-ghost" href="/login">
                {fa.auth.login}
              </Link>
              <Link className="btn-primary" href="/signup">
                {fa.landing.cta}
              </Link>
            </>
          )}
        </nav>
      </header>
      <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <h1 className="max-w-xl text-3xl font-black leading-fa sm:text-4xl">{fa.landing.heroTitle}</h1>
        <p className="mt-6 max-w-xl text-lg leading-fa text-ink/80">{fa.landing.heroBody}</p>
        <div className="mt-8 flex gap-3">
          <Link className="btn-primary" href="/signup">
            {fa.landing.cta}
          </Link>
          <Link className="btn-ghost" href="/login">
            {fa.landing.ctaSecondary}
          </Link>
        </div>
      </section>
    </main>
  );
}
