import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

const GRIDFS_BUCKET_NAME = "lmsUploads";

async function getBucket(): Promise<mongoose.mongo.GridFSBucket> {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not ready for file reads");
  }
  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: GRIDFS_BUCKET_NAME,
  });
}

function decodeKey(parts: string[]): string {
  return parts.map((part) => decodeURIComponent(part)).join("/");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params;
    const key = decodeKey(Array.isArray(keyParts) ? keyParts : [String(keyParts || "")]);

    if (!key) {
      return NextResponse.json({ error: "File key is required" }, { status: 400 });
    }

    const bucket = await getBucket();
    const file = await bucket.find({ filename: key }).sort({ uploadDate: -1 }).next();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const downloadStream = bucket.openDownloadStream(file._id);
    const stream = Readable.toWeb(downloadStream) as ReadableStream;

    const contentType =
      (file.metadata as { contentType?: string } | undefined)?.contentType ||
      "application/octet-stream";

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
