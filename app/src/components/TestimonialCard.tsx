"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fa } from "@/i18n/fa";

type Props = {
  testimonial: {
    id: string;
    type: string;
    status: string;
    authorName: string;
    authorRole: string | null;
    rating: number | null;
    text: string | null;
    hasTranscript: boolean;
    createdAt: string;
  };
  videoUrl: string | null;
  clipUrl: string | null;
  transcribeFailed: boolean;
  clipFailed: boolean;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-accent/15 text-accent",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-ink/10 text-ink/60",
};

export function TestimonialCard({ testimonial: t, videoUrl, clipUrl, transcribeFailed, clipFailed }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(t.text ?? "");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  async function retry(kind: "transcribe" | "render_clip") {
    setBusy(true);
    await fetch(`/api/testimonials/${t.id}/retry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    setBusy(false);
    router.refresh();
  }

  function RetryNote({ label, kind }: { label: string; kind: "transcribe" | "render_clip" }) {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="font-bold text-primary">{label}</span>
        <button className="btn-ghost !px-3 !py-1 text-xs" disabled={busy} onClick={() => retry(kind)} type="button">
          ↻ {fa.inbox.retry}
        </button>
      </span>
    );
  }

  const statusLabel: Record<string, string> = {
    pending: fa.inbox.pending,
    approved: fa.inbox.approved,
    rejected: fa.inbox.rejected,
  };

  return (
    <article className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-black">{t.authorName}</span>
          {t.authorRole && <span className="ms-2 text-sm text-ink/60">{t.authorRole}</span>}
          {t.rating != null && (
            <span className="ms-2 text-sm text-accent">{"★".repeat(t.rating)}</span>
          )}
        </div>
        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${STATUS_STYLE[t.status] ?? ""}`}>
          {statusLabel[t.status] ?? t.status}
        </span>
      </div>

      {videoUrl && (
        <video className="max-h-72 w-full rounded-card bg-ink" controls preload="metadata" src={videoUrl} />
      )}

      {t.type === "video" &&
        !t.text &&
        !t.hasTranscript &&
        (transcribeFailed ? (
          <RetryNote kind="transcribe" label={fa.inbox.transcriptFailed} />
        ) : (
          <p className="text-sm text-ink/60">{fa.inbox.transcriptPending}</p>
        ))}

      {editing ? (
        <div className="flex flex-col gap-2">
          <label className="label">{fa.inbox.transcript}</label>
          <textarea
            className="input min-h-28"
            maxLength={5000}
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
          <div className="flex gap-2">
            <button
              className="btn-primary !py-1.5 text-sm"
              disabled={busy}
              onClick={async () => {
                await patch({ text });
                setEditing(false);
              }}
              type="button"
            >
              {fa.common.save}
            </button>
            <button className="btn-ghost !py-1.5 text-sm" onClick={() => setEditing(false)} type="button">
              {fa.common.cancel}
            </button>
          </div>
        </div>
      ) : (
        t.text && <p className="whitespace-pre-wrap leading-fa">{t.text}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {t.status !== "approved" && (
          <button className="btn-primary !py-1.5 text-sm" disabled={busy} onClick={() => patch({ status: "approved" })} type="button">
            {fa.inbox.approve}
          </button>
        )}
        {t.status !== "rejected" && (
          <button className="btn-ghost !py-1.5 text-sm" disabled={busy} onClick={() => patch({ status: "rejected" })} type="button">
            {fa.inbox.reject}
          </button>
        )}
        {!editing && (t.text || t.hasTranscript) && (
          <button className="btn-ghost !py-1.5 text-sm" onClick={() => setEditing(true)} type="button">
            {fa.inbox.edit}
          </button>
        )}
        {t.type === "video" &&
          (clipUrl ? (
            <a className="btn-ghost !py-1.5 text-sm" download href={clipUrl}>
              {fa.inbox.downloadClip}
            </a>
          ) : clipFailed ? (
            <RetryNote kind="render_clip" label={fa.inbox.clipFailed} />
          ) : transcribeFailed ? null : (
            <span className="text-sm text-ink/50">{fa.inbox.clipPending}</span>
          ))}
      </div>
    </article>
  );
}
