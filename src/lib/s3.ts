import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

let cachedS3Client: S3Client | null = null;

function usesLocalStorage(): boolean {
  const storageDriver = (process.env.STORAGE_DRIVER || "").trim().toLowerCase();
  if (storageDriver === "local") return true;

  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY?.trim() || process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim();

  if (!accessKeyId && !secretAccessKey && !endpoint) {
    return true;
  }

  return false;
}

function getLocalUploadDir(): string {
  return path.join(process.cwd(), "public", "uploads");
}

function getLocalFilePath(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  const targetPath = path.resolve(getLocalUploadDir(), normalized);
  const basePath = path.resolve(getLocalUploadDir());

  if (!targetPath.startsWith(basePath)) {
    throw new Error("Invalid upload key path");
  }

  return targetPath;
}

async function uploadFileLocal(key: string, body: Buffer): Promise<string> {
  const filePath = getLocalFilePath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
  return `/uploads/${key.replace(/\\/g, "/")}`;
}

function getS3Client(): S3Client {
  if (cachedS3Client) return cachedS3Client;

  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim() ||
    "";
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
    "";
  const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim();

  if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
    throw new Error(
      "S3 credentials are incomplete. Set both S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY (or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)."
    );
  }

  if (endpoint && !accessKeyId && !secretAccessKey) {
    throw new Error(
      "S3 credentials are missing. For S3_ENDPOINT storage, set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env.local."
    );
  }

  const config: S3ClientConfig = {
    region: process.env.S3_REGION || "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  };

  if (endpoint) {
    config.endpoint = endpoint;
  }

  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    };
  }

  cachedS3Client = new S3Client(config);
  return cachedS3Client;
}

const bucket = process.env.S3_BUCKET?.trim() || "lms-bucket";

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (usesLocalStorage()) {
    return uploadFileLocal(key, body);
  }

  const s3Client = getS3Client();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // If using a public bucket or CDN, return direct URL
  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  }

  // Otherwise return a presigned URL (1 week expiry)
  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 604800 }
  );
  return url;
}

export async function getFileUrl(key: string): Promise<string> {
  if (usesLocalStorage()) {
    return `/uploads/${key.replace(/\\/g, "/")}`;
  }

  const s3Client = getS3Client();

  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  }
  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 604800 }
  );
  return url;
}

export async function deleteFile(key: string): Promise<void> {
  if (usesLocalStorage()) {
    const filePath = getLocalFilePath(key);
    try {
      await unlink(filePath);
    } catch {
      // Ignore missing files for idempotent delete behavior.
    }
    return;
  }

  const s3Client = getS3Client();

  await s3Client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
}
