import fs from "fs";
import fsp from "fs/promises";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { storageIsLocal, mediaPath } from "@/lib/r2";

// Local-storage mode only: serves media files that publicUrl() points at
// (/media/<key>). In production nginx serves these directly via an alias and
// requests never reach here; this route is the fallback (dev, tunnel on :3000).
// Single-range requests are honored so <video> seeking works.

const KEY_RE = /^(videos|thumbs|clips|logos)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webm|mp4|jpg|png|webp)$/;

const MIME: Record<string, string> = {
  webm: "video/webm",
  mp4: "video/mp4",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(req: Request, { params }: { params: { key: string[] } }) {
  if (!storageIsLocal()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const key = params.key.join("/");
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const abs = mediaPath(key);
  let size: number;
  try {
    size = (await fsp.stat(abs)).size;
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ext = key.split(".").pop()!;
  const headers = new Headers({
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Accept-Ranges": "bytes",
    // Keys are immutable UUIDs — cache forever.
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  let start = 0;
  let end = size - 1;
  let status = 200;
  const range = req.headers.get("range");
  if (range) {
    const m = range.match(/^bytes=(\d*)-(\d*)$/);
    if (!m || (m[1] === "" && m[2] === "")) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    if (m[1] === "") {
      // suffix range: last N bytes
      start = Math.max(0, size - Number(m[2]));
    } else {
      start = Number(m[1]);
      if (m[2] !== "") end = Math.min(end, Number(m[2]));
    }
    if (start > end || start >= size) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  }
  headers.set("Content-Length", String(end - start + 1));

  const nodeStream = fs.createReadStream(abs, { start, end });
  // node:stream web ReadableStream vs DOM ReadableStream — same thing at runtime.
  const body = Readable.toWeb(nodeStream) as unknown as BodyInit;
  return new NextResponse(body, { status, headers });
}
