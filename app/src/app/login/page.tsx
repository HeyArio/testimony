import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { fa } from "@/i18n/fa";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5">
      <Link href="/">
        <Logo />
      </Link>
      <h1 className="text-2xl font-black">{fa.auth.loginTitle}</h1>
      <AuthForm mode="login" />
      <p className="text-sm">
        {fa.auth.noAccount}{" "}
        <Link className="font-bold text-primary" href="/signup">
          {fa.auth.signup}
        </Link>
      </p>
    </main>
  );
}
