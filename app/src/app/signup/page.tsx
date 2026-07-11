import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { fa } from "@/i18n/fa";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5">
      <Link href="/">
        <Logo />
      </Link>
      <h1 className="text-2xl font-black">{fa.auth.signupTitle}</h1>
      <AuthForm mode="signup" />
      <p className="text-sm">
        {fa.auth.haveAccount}{" "}
        <Link className="font-bold text-primary" href="/login">
          {fa.auth.login}
        </Link>
      </p>
    </main>
  );
}
