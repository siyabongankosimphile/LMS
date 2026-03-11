import { Readable } from "node:stream";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

const GRIDFS_BUCKET_NAME = "lmsUploads";
let cachedBucket: mongoose.mongo.GridFSBucket | null = null;

async function getBucket(): Promise<mongoose.mongo.GridFSBucket> {
  if (cachedBucket) return cachedBucket;

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not ready for file storage");
  }

  cachedBucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: GRIDFS_BUCKET_NAME,
  });
  return cachedBucket;
}

function encodeKeyForRoute(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  return normalized
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getDbFileUrl(key: string): string {
  return `/api/files/${encodeKeyForRoute(key)}`;
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const bucket = await getBucket();

  await new Promise<void>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(key, {
      metadata: { contentType },
    });

    uploadStream.on("finish", () => resolve());
    uploadStream.on("error", (error) => reject(error));

    Readable.from([body]).pipe(uploadStream);
  });

  return getDbFileUrl(key);
}

export async function getFileUrl(key: string): Promise<string> {
  return getDbFileUrl(key);
}

export async function deleteFile(key: string): Promise<void> {
  const bucket = await getBucket();
  const files = await bucket.find({ filename: key }).toArray();

  await Promise.all(
    files.map(async (file) => {
      await bucket.delete(file._id);
    })
  );
}
