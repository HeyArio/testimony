#!/usr/bin/env python3
"""Gavah worker: transcription (M2) + vertical clip rendering (M3).

Single process under pm2:
    pm2 start worker/worker.py --name gavah-worker --interpreter python3

Polls the SQLite `Job` table every 3 seconds (no Redis/Celery — see CLAUDE.md).
Job kinds:
    transcribe   faster-whisper (Persian, word timestamps) -> transcriptJson,
                 text, poster thumbnail; then queues render_clip.
    render_clip  ffmpeg 1080x1920 composition: brand-color background,
                 centered video, logo top-right, karaoke .ass subtitles
                 (libass shapes Persian correctly; ffmpeg drawtext does not).

Notes:
    - Prisma stores DateTime columns as INTEGER epoch milliseconds in SQLite;
      all timestamps written here must use now_ms().
    - Never log video URLs or personal data; errors go to Job.error.
"""

import json
import os
import shutil
import subprocess
import sqlite3
import sys
import tempfile
import time
import uuid

POLL_SECONDS = 3
MAX_ATTEMPTS = 3

DB_PATH = os.environ.get("GAVAH_DB", "/var/lib/gavah/gavah.db")
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "small")
R2_BUCKET = os.environ.get("R2_BUCKET", "gavah")
MEDIA_DIR = os.environ.get("GAVAH_MEDIA_DIR", "/var/lib/gavah/media")

# Rendered clip geometry. Free plan gets 720x1280; pro gets full HD.
CANVAS = {"free": (720, 1280), "pro": (1080, 1920)}
BADGE_TEXT = "ساخته‌شده با گواه"  # duplicated from app/src/config/brand.ts

_model = None  # lazy: loading the whisper model takes a while


def now_ms() -> int:
    return int(time.time() * 1000)


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn


def s3():
    import boto3

    account_id = os.environ["R2_ACCOUNT_ID"]
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def storage_is_local() -> bool:
    """Mirrors app/src/lib/r2.ts: empty R2_ACCOUNT_ID means media lives on
    local disk under MEDIA_DIR (demo/dev mode, no R2 account needed)."""
    return not os.environ.get("R2_ACCOUNT_ID")


def fetch_media(key: str, dest_path: str):
    if storage_is_local():
        shutil.copyfile(os.path.join(MEDIA_DIR, key), dest_path)
    else:
        s3().download_file(R2_BUCKET, key, dest_path)


def store_media(src_path: str, key: str, content_type: str):
    if storage_is_local():
        dest = os.path.join(MEDIA_DIR, key)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copyfile(src_path, dest)
    else:
        s3().upload_file(src_path, R2_BUCKET, key, ExtraArgs={"ContentType": content_type})


def claim_job(conn: sqlite3.Connection):
    """Atomically claim the oldest queued job (single worker, but be correct)."""
    with conn:  # BEGIN..COMMIT
        row = conn.execute(
            "SELECT * FROM Job WHERE status = 'queued' ORDER BY createdAt LIMIT 1"
        ).fetchone()
        if row is None:
            return None
        conn.execute(
            "UPDATE Job SET status = 'running', attempts = attempts + 1, updatedAt = ? WHERE id = ?",
            (now_ms(), row["id"]),
        )
    return row


def finish_job(conn: sqlite3.Connection, job_id: str, error: str | None, attempts: int):
    if error is None:
        status = "done"
    elif attempts >= MAX_ATTEMPTS:
        status = "failed"
    else:
        status = "queued"  # retry
    with conn:
        conn.execute(
            "UPDATE Job SET status = ?, error = ?, updatedAt = ? WHERE id = ?",
            (status, error, now_ms(), job_id),
        )


def queue_job(conn: sqlite3.Connection, testimonial_id: str, kind: str):
    with conn:
        conn.execute(
            "INSERT INTO Job (id, testimonialId, kind, status, attempts, createdAt, updatedAt)"
            " VALUES (?, ?, ?, 'queued', 0, ?, ?)",
            (str(uuid.uuid4()), testimonial_id, kind, now_ms(), now_ms()),
        )


def load_testimonial(conn: sqlite3.Connection, testimonial_id: str):
    return conn.execute(
        "SELECT t.*, p.brandColor, p.logoUrl, p.plan FROM Testimonial t"
        " JOIN Project p ON p.id = t.projectId WHERE t.id = ?",
        (testimonial_id,),
    ).fetchone()


def run(cmd: list[str]):
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"{cmd[0]} failed: {proc.stderr[-2000:]}")


# ---------------------------------------------------------------- transcribe


def get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        _model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
    return _model


def make_thumbnail(video_path: str, out_path: str):
    run([
        "ffmpeg", "-y", "-i", video_path, "-ss", "0.5",
        "-frames:v", "1", "-vf", "scale=640:-2", out_path,
    ])


def handle_transcribe(conn: sqlite3.Connection, testimonial, tmp: str):
    video_path = os.path.join(tmp, "input" + os.path.splitext(testimonial["videoKey"])[1])
    fetch_media(testimonial["videoKey"], video_path)

    segments, _info = get_model().transcribe(
        video_path, language="fa", word_timestamps=True, vad_filter=True
    )
    words = []
    for seg in segments:
        for w in seg.words or []:
            words.append({"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word.strip()})
    text = " ".join(w["word"] for w in words).strip()
    transcript = {"language": "fa", "words": words, "text": text}

    thumb_key = None
    try:
        thumb_path = os.path.join(tmp, "thumb.jpg")
        make_thumbnail(video_path, thumb_path)
        thumb_key = f"thumbs/{uuid.uuid4()}.jpg"
        store_media(thumb_path, thumb_key, "image/jpeg")
    except Exception:
        thumb_key = None  # thumbnail is nice-to-have; don't fail the job

    with conn:
        conn.execute(
            "UPDATE Testimonial SET transcriptJson = ?, text = COALESCE(text, ?), thumbKey = COALESCE(?, thumbKey)"
            " WHERE id = ?",
            (json.dumps(transcript, ensure_ascii=False), text or None, thumb_key, testimonial["id"]),
        )
    queue_job(conn, testimonial["id"], "render_clip")


# --------------------------------------------------------------- render_clip


def ass_time(seconds: float) -> str:
    cs = max(0, int(round(seconds * 100)))
    h, rem = divmod(cs, 360000)
    m, rem = divmod(rem, 6000)
    s, cs = divmod(rem, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def build_ass(words: list[dict], canvas: tuple[int, int], brand_color: str, show_badge: bool) -> str:
    """Karaoke subtitles: lines of a few words, \\k tag per word so each word
    highlights as it is spoken. libass handles RTL shaping for Persian."""
    width, height = canvas
    # &HAABBGGRR — ass colors are BGR
    r, g, b = brand_color[1:3], brand_color[3:5], brand_color[5:7]
    highlight = f"&H00{b}{g}{r}".upper()
    font_size = int(height * 0.036)
    margin_v = int(height * 0.14)

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Karaoke,Vazirmatn,{font_size},{highlight},&H00FFFFFF,&H00201014,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,60,60,{margin_v},1
Style: Badge,Vazirmatn,{int(height * 0.018)},&H66FFFFFF,&H66FFFFFF,&H00201014,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,20,20,{int(height * 0.02)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    # Group words into chunks of <= 4 words or <= 3.5s.
    chunk: list[dict] = []
    chunks: list[list[dict]] = []
    for w in words:
        if chunk and (len(chunk) >= 4 or w["end"] - chunk[0]["start"] > 3.5):
            chunks.append(chunk)
            chunk = []
        chunk.append(w)
    if chunk:
        chunks.append(chunk)

    for c in chunks:
        start, end = c[0]["start"], c[-1]["end"]
        parts = []
        prev = start
        for w in c:
            # silence before the word counts toward its \k duration
            dur_cs = max(1, int(round((w["end"] - prev) * 100)))
            prev = w["end"]
            parts.append(f"{{\\k{dur_cs}}}{w['word']}")
        text = " ".join(parts).replace("\n", " ")
        events.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Karaoke,,0,0,0,,{text}")

    if show_badge and words:
        end = words[-1]["end"] + 1
        events.append(f"Dialogue: 0,{ass_time(0)},{ass_time(end)},Badge,,0,0,0,,{BADGE_TEXT}")

    return header + "\n".join(events) + "\n"


def handle_render_clip(conn: sqlite3.Connection, testimonial, tmp: str):
    if not testimonial["transcriptJson"]:
        raise RuntimeError("no transcript yet")
    transcript = json.loads(testimonial["transcriptJson"])
    words = transcript.get("words") or []

    canvas = CANVAS["pro" if testimonial["plan"] == "pro" else "free"]
    width, height = canvas
    show_badge = testimonial["plan"] != "pro"
    brand_color = testimonial["brandColor"] or "#B03A48"

    video_path = os.path.join(tmp, "input" + os.path.splitext(testimonial["videoKey"])[1])
    fetch_media(testimonial["videoKey"], video_path)

    ass_path = os.path.join(tmp, "subs.ass")
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(build_ass(words, canvas, brand_color, show_badge))

    logo_path = None
    logo_url = testimonial["logoUrl"]
    if logo_url:
        try:
            # Logo lives in our own bucket; derive the key from the public URL.
            key = logo_url.split("/logos/")[-1]
            logo_path = os.path.join(tmp, "logo")
            fetch_media(f"logos/{key}", logo_path)
        except Exception:
            logo_path = None  # missing logo must not fail the render

    out_path = os.path.join(tmp, "clip.mp4")
    video_w = int(width * 0.92)
    ass_arg = ass_path.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")

    cmd = ["ffmpeg", "-y", "-i", video_path]
    if logo_path:
        cmd += ["-i", logo_path]
    filters = [
        f"color=c={brand_color}:s={width}x{height}:r=30[bg]",
        f"[0:v]scale={video_w}:-2[vid]",
        "[bg][vid]overlay=(W-w)/2:(H-h)/2:shortest=1[comp]",
    ]
    last = "comp"
    if logo_path:
        logo_h = int(height * 0.06)
        filters += [
            f"[1:v]scale=-2:{logo_h}[logo]",
            f"[comp][logo]overlay=W-w-{int(width * 0.04)}:{int(width * 0.04)}[comp2]",
        ]
        last = "comp2"
    filters.append(f"[{last}]ass='{ass_arg}'[out]")
    cmd += [
        "-filter_complex", ";".join(filters),
        "-map", "[out]", "-map", "0:a?",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        out_path,
    ]
    run(cmd)

    clip_key = f"clips/{uuid.uuid4()}.mp4"
    store_media(out_path, clip_key, "video/mp4")
    with conn:
        conn.execute("UPDATE Testimonial SET clipKey = ? WHERE id = ?", (clip_key, testimonial["id"]))


# --------------------------------------------------------------------- main


HANDLERS = {"transcribe": handle_transcribe, "render_clip": handle_render_clip}


def process(conn: sqlite3.Connection, job) -> None:
    testimonial = load_testimonial(conn, job["testimonialId"])
    if testimonial is None:
        raise RuntimeError("testimonial not found")
    if not testimonial["videoKey"]:
        raise RuntimeError("testimonial has no video")
    tmp = tempfile.mkdtemp(prefix="gavah-")
    try:
        HANDLERS[job["kind"]](conn, testimonial, tmp)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main() -> None:
    print(f"gavah-worker: polling {DB_PATH} every {POLL_SECONDS}s", flush=True)
    conn = db()
    while True:
        try:
            job = claim_job(conn)
        except sqlite3.OperationalError as exc:
            print(f"db unavailable: {exc}", flush=True)
            time.sleep(POLL_SECONDS)
            continue
        if job is None:
            time.sleep(POLL_SECONDS)
            continue
        print(f"job {job['id']} {job['kind']} attempt {job['attempts'] + 1}", flush=True)
        try:
            process(conn, job)
            finish_job(conn, job["id"], None, job["attempts"] + 1)
            print(f"job {job['id']} done", flush=True)
        except Exception as exc:  # error text goes to Job.error, not logs
            finish_job(conn, job["id"], str(exc)[:2000], job["attempts"] + 1)
            print(f"job {job['id']} error (attempt {job['attempts'] + 1})", flush=True)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
