"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fa } from "@/i18n/fa";

type Props = {
  project: { id: string; name: string; brandColor: string; logoUrl: string | null };
};

export function BrandSettingsForm({ project }: Props) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.brandColor);
  const [logoUrl, setLogoUrl] = useState(project.logoUrl);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(extra: Record<string, unknown> = {}) {
    setBusy(true);
    setSaved(false);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, brandColor: color, ...extra }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(fa.common.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function uploadLogo(file: File) {
    setBusy(true);
    setError(null);
    try {
      const presign = await fetch(`/api/projects/${project.id}/logo-presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      if (!presign.ok) throw new Error("presign");
      const { uploadUrl, publicUrl } = await presign.json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("upload");
      setLogoUrl(publicUrl);
      await save({ logoUrl: publicUrl });
    } catch {
      setError(fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-col gap-5">
      <div>
        <label className="label" htmlFor="s-name">
          {fa.projects.name}
        </label>
        <input className="input" id="s-name" maxLength={100} onChange={(e) => setName(e.target.value)} value={name} />
      </div>
      <div>
        <label className="label" htmlFor="s-color">
          {fa.settings.brandColor}
        </label>
        <div className="flex items-center gap-3">
          <input
            className="h-10 w-14 cursor-pointer rounded border border-hairline"
            id="s-color"
            onChange={(e) => setColor(e.target.value)}
            type="color"
            value={color}
          />
          <code dir="ltr">{color}</code>
        </div>
      </div>
      <div>
        <p className="label">{fa.settings.logo}</p>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="mb-2 h-16 w-16 rounded-card border border-hairline object-contain" src={logoUrl} />
        )}
        <label className="btn-ghost cursor-pointer !py-1.5 text-sm">
          {fa.settings.uploadLogo}
          <input
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadLogo(f);
            }}
            type="file"
          />
        </label>
        <p className="mt-1 text-xs text-ink/60">{fa.settings.logoHint}</p>
      </div>
      {error && <p className="text-sm font-bold text-primary">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={busy} onClick={() => save()} type="button">
          {busy ? fa.common.loading : fa.common.save}
        </button>
        {saved && <span className="text-sm font-bold text-primary">{fa.settings.saved}</span>}
      </div>
    </div>
  );
}
