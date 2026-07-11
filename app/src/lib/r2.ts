import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Browser uploads go straight to R2 via presigned PUT URLs — video bytes must
// never pass through the Next.js server. Keys are always server-generated.

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

export function publicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL || "";
  return `${base.replace(/\/$/, "")}/${key}`;
}
