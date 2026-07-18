"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fa } from "@/i18n/fa";
import { faDigits } from "@/lib/format";
import { DEMO_GUEST_KEY, type DemoGuestEntry } from "@/lib/demo";

/** Demo mode: hand the visitor's entry to the demo walls via localStorage —
 * origin-wide, so the /demo tab's widget picks it up live. */
function storeGuestEntry(entry: Omit<DemoGuestEntry, "at">) {
  try {
    localStorage.setItem(DEMO_GUEST_KEY, JSON.stringify({ ...entry, at: Date.now() }));
  } catch {
    // storage blocked — the thanks screen still works, just no echo
  }
}

const MAX_SECONDS = 90;

type Mode = "choose" | "video" | "text" | "done";
type RecState = "idle" | "recording" | "preview";

export function CollectClient({ slug }: { slug: string }) {
  const [mode, setMode] = useState<Mode>("choose");
  // True when the API auto-published the entry (demo project) — the visitor
  // can go see their own words on the wall right away.
  const [published, setPublished] = useState(false);

  function done(isPublished: boolean) {
    setPublished(isPublished);
    setMode("done");
  }

  if (mode === "done") {
    return (
      <div className="card relative text-center">
        {/* one short celebratory star burst */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              className="absolute text-accent"
              key={i}
              style={{
                insetInlineStart: `${10 + i * 15}%`,
                top: -6,
                fontSize: 13 + ((i * 7) % 11),
                animation: `gvFloat 1.9s ease-out ${i * 0.2}s 3`,
                opacity: 0,
              }}
            >
              ★
            </span>
          ))}
        </div>
        <p className="text-2xl font-black">{fa.collect.thanksTitle}</p>
        <p className="mt-2 text-ink/80">{published ? fa.collect.thanksLiveBody : fa.collect.thanksBody}</p>
        {published && (
          <a className="btn-primary mt-4" href={`/wall/${slug}`}>
            {fa.collect.seeWall}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "choose" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            className="card card-lift flex flex-col items-center gap-1.5 !border-2 !border-primary !p-5 text-center"
            onClick={() => setMode("video")}
            type="button"
          >
            <span aria-hidden className="text-3xl">
              🎥
            </span>
            <span className="font-black">{fa.collect.recordVideo}</span>
            <span className="text-xs text-ink/55">{fa.collect.recordVideoHint}</span>
          </button>
          <button
            className="card card-lift flex flex-col items-center gap-1.5 !p-5 text-center"
            onClick={() => setMode("text")}
            type="button"
          >
            <span aria-hidden className="text-3xl">
              ✍️
            </span>
            <span className="font-black">{fa.collect.writeText}</span>
            <span className="text-xs text-ink/55">{fa.collect.writeTextHint}</span>
          </button>
        </div>
      )}
      {mode === "video" && <VideoFlow onDone={done} slug={slug} />}
      {mode === "text" && <TextFlow onDone={done} slug={slug} />}
    </div>
  );
}

/** Shared metadata fields + consent + submit. */
function MetaFields({
  busy,
  error,
  submitLabel,
}: {
  busy: boolean;
  error: string | null;
  submitLabel: string;
}) {
  const [rating, setRating] = useState(0);
  return (
    <>
      <div>
        <label className="label" htmlFor="c-name">
          {fa.collect.yourName}
        </label>
        <input className="input" id="c-name" name="authorName" required maxLength={100} />
      </div>
      <div>
        <label className="label" htmlFor="c-role">
          {fa.collect.yourRole}
        </label>
        <input className="input" id="c-role" name="authorRole" maxLength={100} />
      </div>
      <div>
        <p className="label">{fa.collect.rating}</p>
        <input name="rating" type="hidden" value={rating || ""} />
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
        {rating === 0 && <p className="mt-1 text-xs text-ink/50">{fa.collect.ratingHint}</p>}
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input className="mt-1" name="consent" required type="checkbox" />
        <span>{fa.collect.consent}</span>
      </label>
      {error && <p className="text-sm font-bold text-primary">{error}</p>}
      <button className="btn-primary" disabled={busy} type="submit">
        {busy ? fa.collect.uploading : submitLabel}
      </button>
    </>
  );
}

function readMeta(form: FormData) {
  const rating = Number(form.get("rating"));
  return {
    authorName: String(form.get("authorName") ?? ""),
    authorRole: String(form.get("authorRole") ?? "") || undefined,
    rating: rating >= 1 && rating <= 5 ? rating : undefined,
    consent: true as const,
  };
}

function TextFlow({ slug, onDone }: { slug: string; onDone: (published: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const meta = readMeta(form);
    const text = String(form.get("text") ?? "");
    const res = await fetch(`/api/public/${slug}/testimonials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", text, ...meta }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      if (data.ephemeral) {
        storeGuestEntry({ authorName: meta.authorName, authorRole: meta.authorRole, rating: meta.rating, text });
      }
      onDone(!!data.published);
    } else {
      setError(data.error === "limit_reached" ? fa.collect.full : fa.common.error);
    }
  }

  return (
    <form className="card flex flex-col gap-4" onSubmit={onSubmit}>
      <div>
        <label className="label" htmlFor="c-text">
          {fa.collect.yourText}
        </label>
        <textarea className="input min-h-32" id="c-text" maxLength={2000} minLength={3} name="text" required />
      </div>
      <MetaFields busy={busy} error={error} submitLabel={fa.collect.submit} />
    </form>
  );
}

function VideoFlow({ slug, onDone }: { slug: string; onDone: (published: boolean) => void }) {
  const [rec, setRec] = useState<RecState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopStream();
    };
  }, [stopStream]);

  async function start() {
    setError(null);
    setBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = mimeType.startsWith("video/mp4") ? "video/mp4" : "video/webm";
        const out = new Blob(chunksRef.current, { type });
        setBlob(out);
        setRec("preview");
        stopStream();
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.muted = false;
          videoRef.current.src = URL.createObjectURL(out);
        }
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setSeconds(0);
      setRec("recording");
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError(fa.collect.cameraError);
    }
  }

  function stop() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function retake() {
    setBlob(null);
    setRec("idle");
    if (videoRef.current) {
      videoRef.current.src = "";
    }
    void start();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!blob) return;
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const contentType = blob.type.startsWith("video/mp4") ? "video/mp4" : "video/webm";
      const presign = await fetch(`/api/public/${slug}/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, size: blob.size }),
      });
      if (!presign.ok) {
        const data = await presign.json().catch(() => ({}));
        throw new Error(data.error === "limit_reached" ? "full" : "presign");
      }
      const { uploadUrl, key } = await presign.json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      if (!put.ok) throw new Error("upload");
      const meta = readMeta(form);
      const res = await fetch(`/api/public/${slug}/testimonials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "video", videoKey: key, ...meta }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error === "limit_reached" ? "full" : "submit");
      }
      if (data.ephemeral && data.videoUrl) {
        storeGuestEntry({
          authorName: meta.authorName,
          authorRole: meta.authorRole,
          rating: meta.rating,
          videoUrl: String(data.videoUrl),
        });
      }
      onDone(!!data.published);
    } catch (err) {
      setError(err instanceof Error && err.message === "full" ? fa.collect.full : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="relative">
        <video
          className={`aspect-[3/4] w-full rounded-card bg-ink object-cover transition-shadow ${
            rec === "recording" ? "shadow-[0_0_0_3px_rgba(176,58,72,.55)]" : ""
          }`}
          controls={rec === "preview"}
          playsInline
          ref={videoRef}
        />
        {rec === "recording" && (
          <span className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur-[2px]">
            <span
              className="h-2 w-2 rounded-full bg-[#e5484d]"
              style={{ animation: "gvBlink 1.4s ease-in-out infinite" }}
            />
            <span className="font-mono text-[11px] tracking-wider text-white">REC</span>
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        {rec === "idle" && (
          <button className="btn-primary flex-1" onClick={start} type="button">
            ● {fa.collect.startRecording}
          </button>
        )}
        {rec === "recording" && (
          <>
            <button className="btn-primary flex-1" onClick={stop} type="button">
              ■ {fa.collect.stopRecording}
            </button>
            <span className="text-sm font-bold tabular-nums">
              {faDigits(seconds)} / {faDigits(MAX_SECONDS)}
            </span>
          </>
        )}
        {rec === "preview" && (
          <button className="btn-ghost flex-1" onClick={retake} type="button">
            ↺ {fa.collect.retake}
          </button>
        )}
      </div>
      {rec !== "preview" && <p className="text-center text-xs text-ink/60">{fa.collect.maxSeconds}</p>}
      {rec === "preview" && <MetaFields busy={busy} error={error} submitLabel={fa.collect.submit} />}
      {rec !== "preview" && error && <p className="text-sm font-bold text-primary">{error}</p>}
    </form>
  );
}
