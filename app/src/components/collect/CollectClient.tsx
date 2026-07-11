"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fa } from "@/i18n/fa";
import { faDigits } from "@/lib/format";

const MAX_SECONDS = 90;

type Mode = "choose" | "video" | "text" | "done";
type RecState = "idle" | "recording" | "preview";

export function CollectClient({ slug }: { slug: string }) {
  const [mode, setMode] = useState<Mode>("choose");

  if (mode === "done") {
    return (
      <div className="card text-center">
        <p className="text-2xl font-black">{fa.collect.thanksTitle}</p>
        <p className="mt-2 text-ink/80">{fa.collect.thanksBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "choose" && (
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary" onClick={() => setMode("video")} type="button">
            🎥 {fa.collect.recordVideo}
          </button>
          <button className="btn-ghost" onClick={() => setMode("text")} type="button">
            ✍️ {fa.collect.writeText}
          </button>
        </div>
      )}
      {mode === "video" && <VideoFlow onDone={() => setMode("done")} slug={slug} />}
      {mode === "text" && <TextFlow onDone={() => setMode("done")} slug={slug} />}
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
        <div className="flex gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              aria-label={faDigits(n)}
              className={`text-2xl transition-colors ${n <= rating ? "text-accent" : "text-hairline"}`}
              key={n}
              onClick={() => setRating(n)}
              type="button"
            >
              ★
            </button>
          ))}
        </div>
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

function TextFlow({ slug, onDone }: { slug: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/public/${slug}/testimonials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", text: String(form.get("text") ?? ""), ...readMeta(form) }),
    });
    setBusy(false);
    if (res.ok) onDone();
    else {
      const data = await res.json().catch(() => ({}));
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

function VideoFlow({ slug, onDone }: { slug: string; onDone: () => void }) {
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
      const res = await fetch(`/api/public/${slug}/testimonials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "video", videoKey: key, ...readMeta(form) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error === "limit_reached" ? "full" : "submit");
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error && err.message === "full" ? fa.collect.full : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card flex flex-col gap-4" onSubmit={onSubmit}>
      <video
        className="aspect-[3/4] w-full rounded-card bg-ink object-cover"
        controls={rec === "preview"}
        playsInline
        ref={videoRef}
      />
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
