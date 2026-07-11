import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Browser uploads go straight to R2 via presigned PUT URLs — video bytes must
// never pass through the Next.js server. Keys are always server-generated.

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(r2(), cmd, { expiresIn: 600 });
}

/** Size of an object, or null if it doesn't exist (or R2 is unreachable). */
export async function headObject(key: string): Promise<{ size: number } | null> {
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
  const objects = keys.filter(Boolean).map((Key) => ({ Key }));
  if (objects.length === 0) return;
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
  const base = process.env.R2_PUBLIC_BASE_URL || "";
  return `${base.replace(/\/$/, "")}/${key}`;
}

/** Inverse of publicUrl(); null for URLs that aren't on our media host. */
export function keyFromPublicUrl(url: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base || !url.startsWith(base)) return null;
  return url.slice(base.length).replace(/^\//, "") || null;
}
