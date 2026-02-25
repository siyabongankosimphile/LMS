import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/s3";

const SPREADSHEET_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const SPREADSHEET_MIME_TYPES = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ASSIGNMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".zip",
];

const ASSIGNMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const context = (formData.get("context") as string) || "resources";

    const isAdminOrFacilitator = ["FACILITATOR", "ADMIN"].includes(session.user.role);
    const isStudentSubmissionContext =
      session.user.role === "STUDENT" && context.startsWith("assignment-submissions/");

    if (!isAdminOrFacilitator && !isStudentSubmissionContext) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const normalizedFileName = file.name.toLowerCase();
    const isSpreadsheetByExtension = SPREADSHEET_EXTENSIONS.some((extension) =>
      normalizedFileName.endsWith(extension)
    );
    const isSpreadsheetByMime = SPREADSHEET_MIME_TYPES.includes(file.type);

    if (
      context.startsWith("admin-private") &&
      !isSpreadsheetByExtension &&
      !isSpreadsheetByMime
    ) {
      return NextResponse.json(
        { error: "Only spreadsheet files (.csv, .xlsx, .xls) are allowed" },
        { status: 400 }
      );
    }

    const isAssignmentContext =
      context.startsWith("assignment-resources/") ||
      context.startsWith("assignment-submissions/");

    if (isAssignmentContext) {
      const isAllowedByExtension = ASSIGNMENT_EXTENSIONS.some((extension) =>
        normalizedFileName.endsWith(extension)
      );
      const isAllowedByMime = ASSIGNMENT_MIME_TYPES.includes(file.type);

      if (!isAllowedByExtension && !isAllowedByMime) {
        return NextResponse.json(
          {
            error:
              "Invalid file type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, WEBP, ZIP",
          },
          { status: 400 }
        );
      }
    }

    // Limit file size to 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const key = `${context}/${session.user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, "_")}`;

    const url = await uploadFile(key, buffer, file.type || "application/octet-stream");

    return NextResponse.json({ url, key, name: file.name });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
