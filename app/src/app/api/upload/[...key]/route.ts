import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { finished } from "stream/promises";
import { NextResponse } from "next/server";
import {
  storageIsLocal,
  verifyLocalUpload,
  mediaPath,
  MAX_VIDEO_BYTES,
} from "@/lib/r2";

// Local-storage mode only: the PUT target that presignPut() mints instead of
// an R2 presigned URL. The HMAC token binds key + content type + size + expiry,
// so this accepts exactly what the presign endpoint authorized — nothing else.

const KEY_RE = /^(videos|logos)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webm|mp4|png|jpg|webp)$/;

export async function PUT(req: Request, { params }: { params: { key: string[] } }) {
  if (!storageIsLocal()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const key = params.key.join("/");
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: "invalid_key" }, { status: 400 });
  }
  const q = new URL(req.url).searchParams;
  const contentType = q.get("ct") || "";
  const size = Number(q.get("size"));
  const exp = Number(q.get("exp"));
  const sig = q.get("sig") || "";
  if (!verifyLocalUpload(key, contentType, size, exp, sig)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!req.body) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const abs = mediaPath(key);
  await fsp.mkdir(path.dirname(abs), { recursive: true });

  // Stream to disk, hard-capping at the presigned size (+ a little slack for
  // multipart boundaries some clients add). Never buffer whole videos in RAM.
  const cap = Math.min(size + 1024, MAX_VIDEO_BYTES);
  const file = fs.createWriteStream(abs);
  let written = 0;
  try {
    // DOM's ReadableStream type lacks asyncIterator in TS libs; Node supports it.
    const body = req.body as unknown as AsyncIterable<Uint8Array>;
    for await (const chunk of body) {
      written += chunk.byteLength;
      if (written > cap) throw new Error("too_large");
      if (!file.write(Buffer.from(chunk))) {
        await new Promise<void>((resolve) => file.once("drain", () => resolve()));
      }
    }
    file.end();
    await finished(file);
  } catch (err) {
    file.destroy();
    await fsp.unlink(abs).catch(() => {});
    const tooLarge = err instanceof Error && err.message === "too_large";
    return NextResponse.json(
      { error: tooLarge ? "too_large" : "upload_failed" },
      { status: tooLarge ? 413 : 500 },
    );
  }
  if (written === 0) {
    await fsp.unlink(abs).catch(() => {});
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  return new NextResponse(null, { status: 200 });
}
