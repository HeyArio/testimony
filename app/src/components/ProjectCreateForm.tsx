"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fa } from "@/i18n/fa";

export function ProjectCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button className="btn-primary self-start" onClick={() => setOpen(true)} type="button">
        {fa.projects.create}
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        slug: String(form.get("slug") ?? ""),
      }),
    });
    setBusy(false);
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/dashboard/${id}`);
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    const messages: Record<string, string> = {
      slug_taken: fa.projects.slugTaken,
      limit_reached: fa.projects.limitReached,
    };
    setError(messages[data.error] ?? fa.common.error);
  }

  return (
    <form className="card flex max-w-md flex-col gap-4" onSubmit={onSubmit}>
      <div>
        <label className="label" htmlFor="p-name">
          {fa.projects.name}
        </label>
        <input className="input" id="p-name" name="name" required maxLength={100} />
      </div>
      <div>
        <label className="label" htmlFor="p-slug">
          {fa.projects.slug}
        </label>
        <input
          className="input"
          dir="ltr"
          id="p-slug"
          name="slug"
          required
          pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]"
          title="a-z, 0-9, -"
        />
        <p className="mt-1 text-xs text-ink/60">{fa.projects.slugHint}</p>
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
