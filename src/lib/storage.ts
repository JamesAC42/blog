import { PutObjectCommand, S3Client, type PutObjectCommandInput } from "@aws-sdk/client-s3";

/**
 * Object storage for uploaded media. Works with Cloudflare R2 (or any
 * S3-compatible store) and plain AWS S3.
 *
 * Env:
 *   AWS_S3_ENDPOINT         R2: https://<account-id>.r2.cloudflarestorage.com (omit for AWS S3)
 *   AWS_REGION              "auto" for R2 (default when AWS_S3_ENDPOINT is set)
 *   AWS_S3_BUCKET           bucket name
 *   AWS_ACCESS_KEY_ID       R2 API token access key id
 *   AWS_SECRET_ACCESS_KEY   R2 API token secret
 *   AWS_S3_PUBLIC_BASE_URL  public URL that serves the bucket, e.g. https://media.jamescrovo.com
 *   AWS_S3_USE_ACL          "true" to send ACL=public-read (AWS only; R2 ignores ACLs)
 */

type StorageConfig = {
  client: S3Client;
  bucket: string;
  publicBaseUrl: string;
};

let cached: StorageConfig | null = null;

export class StorageConfigError extends Error {}

function getStorage(): StorageConfig {
  if (cached) return cached;

  const endpoint = process.env.AWS_S3_ENDPOINT?.trim() || undefined;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || (endpoint ? "auto" : undefined);
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region) throw new StorageConfigError("Missing AWS_REGION (or AWS_S3_ENDPOINT)");
  if (!bucket) throw new StorageConfigError("Missing AWS_S3_BUCKET");
  if (!accessKeyId || !secretAccessKey) throw new StorageConfigError("Missing AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY");

  let publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();
  if (!publicBaseUrl) {
    if (endpoint) throw new StorageConfigError("Missing AWS_S3_PUBLIC_BASE_URL (required with AWS_S3_ENDPOINT)");
    publicBaseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
  }

  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // Only send checksums when an operation requires them; keeps
    // S3-compatible stores like R2 happy with newer SDK defaults.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  cached = { client, bucket, publicBaseUrl: publicBaseUrl.replace(/\/+$/, "") };
  return cached;
}

/** Build a random object key like `blog/1731470000000-abc123.png`. */
export function makeKey(prefix: string, fileName: string | null): string {
  const name = fileName || `upload-${Date.now()}`;
  const rawExt = name.includes(".") ? name.split(".").pop() : undefined;
  const ext = rawExt ? rawExt.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) : "";
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext ? `.${ext}` : ""}`;
}

/** Upload a request body to storage and return its public URL. */
export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<{ url: string; key: string }> {
  const { client, bucket, publicBaseUrl } = getStorage();
  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  };
  if (process.env.AWS_S3_USE_ACL === "true") params.ACL = "public-read";
  await client.send(new PutObjectCommand(params));
  return { url: `${publicBaseUrl}/${key}`, key };
}
