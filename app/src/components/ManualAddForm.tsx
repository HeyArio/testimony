"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fa } from "@/i18n/fa";
import { faDigits } from "@/lib/format";

export function ManualAddForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button className="btn-ghost self-start !py-1.5 text-sm" onClick={() => setOpen(true)} type="button">
        + {fa.inbox.addManual}
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/projects/${projectId}/testimonials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorName: String(form.get("authorName") ?? ""),
        authorRole: String(form.get("authorRole") ?? "") || undefined,
        rating: rating || undefined,
        text: String(form.get("text") ?? ""),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setRating(0);
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error === "limit_reached" ? fa.inbox.freeCapFull : fa.common.error);
  }

  return (
    <form className="card flex flex-col gap-4" onSubmit={onSubmit}>
      <div>
        <p className="font-black">{fa.inbox.addManual}</p>
        <p className="mt-1 text-xs text-ink/60">{fa.inbox.addManualHint}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="m-name">
            {fa.collect.yourName}
          </label>
          <input className="input" id="m-name" maxLength={100} name="authorName" required />
        </div>
        <div>
          <label className="label" htmlFor="m-role">
            {fa.collect.yourRole}
          </label>
          <input className="input" id="m-role" maxLength={100} name="authorRole" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="m-text">
          {fa.collect.yourText}
        </label>
        <textarea className="input min-h-24" id="m-text" maxLength={2000} minLength={3} name="text" required />
      </div>
      <div>
        <p className="label">{fa.collect.rating}</p>
        <div className="flex items-center gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              aria-label={faDigits(n)}
              aria-pressed={n <= rating}
              className={`p-0.5 text-3xl leading-none transition-colors ${
                n <= rating ? "text-accent" : "text-ink/25 hover:text-accent/60"
              }`}
              key={n}
              onClick={() => setRating(n)}
              type="button"
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="ms-2 text-sm font-bold text-ink/70">
              {faDigits(rating)} / {faDigits(5)}
            </span>
          )}
        </div>
      </div>
      {error && <p className="text-sm font-bold text-primary">{error}</p>}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={busy} type="submit">
          {busy ? fa.common.loading : fa.common.save}
        </button>
        <button className="btn-ghost" onClick={() => setOpen(false)} type="button">
          {fa.common.cancel}
        </button>
      </div>
    </form>
  );
}
