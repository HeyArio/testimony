"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fa } from "@/i18n/fa";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    if (mode === "signup") body.name = String(form.get("name") ?? "");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    const messages: Record<string, string> = {
      invalid_credentials: fa.auth.invalidCredentials,
      email_taken: fa.auth.emailTaken,
      weak_password: fa.auth.weakPassword,
      rate_limited: fa.auth.tooManyAttempts,
    };
    setError(messages[data.error] ?? fa.common.error);
  }

  return (
    <form className="card flex w-full max-w-sm flex-col gap-4" onSubmit={onSubmit}>
      {mode === "signup" && (
        <div>
          <label className="label" htmlFor="name">
            {fa.auth.name}
          </label>
          <input className="input" id="name" name="name" required maxLength={100} />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">
          {fa.auth.email}
        </label>
        <input className="input" dir="ltr" id="email" name="email" type="email" required maxLength={200} />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {fa.auth.password}
        </label>
        <input
          className="input"
          dir="ltr"
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : 1}
          maxLength={200}
        />
      </div>
      {error && <p className="text-sm font-bold text-primary">{error}</p>}
      <button className="btn-primary" disabled={busy} type="submit">
        {busy ? fa.common.loading : mode === "login" ? fa.auth.login : fa.auth.signup}
      </button>
    </form>
  );
}
