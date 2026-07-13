import crypto from "crypto";
import fsp from "fs/promises";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Browser uploads go straight to R2 via presigned PUT URLs — video bytes must
// never pass through the Next.js server. Keys are always server-generated.
//
// Local-disk fallback (demo/dev mode): when R2_ACCOUNT_ID is empty, media is
// stored under GAVAH_MEDIA_DIR and served by /media/[...key], and "presigned"
// URLs point at /api/upload/[...key] with an HMAC token. This lets the whole
// product run on a bare VPS before R2 exists; R2 stays the production path.

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export function storageIsLocal(): boolean {
  return !process.env.R2_ACCOUNT_ID;
}

export const MEDIA_DIR = path.resolve(
  process.env.GAVAH_MEDIA_DIR || "/var/lib/gavah/media",
);

/** Absolute path of a media key, guaranteed to stay inside MEDIA_DIR. */
export function mediaPath(key: string): string {
  const abs = path.resolve(MEDIA_DIR, key);
  if (!abs.startsWith(MEDIA_DIR + path.sep)) throw new Error("bad media key");
  return abs;
}

function uploadToken(key: string, contentType: string, size: number, exp: number): string {
  const secret = process.env.SESSION_SECRET || "insecure-dev-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${key}\n${contentType}\n${size}\n${exp}`)
    .digest("hex");
}

/** Validates the token minted by presignPut() in local mode. */
export function verifyLocalUpload(
  key: string,
  contentType: string,
  size: number,
  exp: number,
  sig: string,
): boolean {
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  if (!Number.isFinite(size) || size <= 0) return false;
  const expected = uploadToken(key, contentType, size, exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

let client: S3Client | null = null;

function r2(): S3Client {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    if (!accountId) throw new Error("R2 env vars not configured");
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export async function presignPut(key: string, contentType: string, contentLength: number): Promise<string> {
  if (storageIsLocal()) {
    const exp = Date.now() + 600_000;
    const sig = uploadToken(key, contentType, contentLength, exp);
    const ct = encodeURIComponent(contentType);
    // Relative URL: inherits whatever origin the page is on (IP, tunnel, domain).
    return `/api/upload/${key}?ct=${ct}&size=${contentLength}&exp=${exp}&sig=${sig}`;
  }
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(r2(), cmd, { expiresIn: 600 });
}

/** Size of an object, or null if it doesn't exist (or storage is unreachable). */
export async function headObject(key: string): Promise<{ size: number } | null> {
  if (storageIsLocal()) {
    try {
      const stat = await fsp.stat(mediaPath(key));
      return { size: stat.size };
    } catch {
      return null;
    }
  }
  try {
    const res = await r2().send(
      new HeadObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }),
    );
    return { size: res.ContentLength ?? 0 };
  } catch {
    return null;
  }
}

/**
 * Best-effort cleanup. A failed delete must never block the user-facing
 * request — an orphaned object costs cents, a failed moderation action
 * costs trust.
 */
export async function deleteObjects(keys: string[]): Promise<void> {
  const valid = keys.filter(Boolean);
  if (valid.length === 0) return;
  if (storageIsLocal()) {
    for (const key of valid) {
      try {
        await fsp.unlink(mediaPath(key));
      } catch {
        // ignore — see docstring
      }
    }
    return;
  }
  const objects = valid.map((Key) => ({ Key }));
  try {
    for (let i = 0; i < objects.length; i += 1000) {
      await r2().send(
        new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET!,
          Delete: { Objects: objects.slice(i, i + 1000), Quiet: true },
        }),
      );
    }
  } catch {
    // ignore — see docstring
  }
}

export function publicUrl(key: string): string {
  if (storageIsLocal()) return `/media/${key}`;
  const base = process.env.R2_PUBLIC_BASE_URL || "";
  return `${base.replace(/\/$/, "")}/${key}`;
}

/** Inverse of publicUrl(); null for URLs that aren't on our media host. */
export function keyFromPublicUrl(url: string): string | null {
  if (storageIsLocal()) {
    return url.startsWith("/media/") ? url.slice("/media/".length) || null : null;
  }
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base || !url.startsWith(base)) return null;
  return url.slice(base.length).replace(/^\//, "") || null;
}
