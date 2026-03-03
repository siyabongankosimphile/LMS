import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { deleteFile } from "@/lib/s3";
import PrivateFile from "@/models/PrivateFile";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const file = await PrivateFile.findById(id).lean();
    if (!file || String(file.owner) !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (file.key) {
      await deleteFile(file.key);
    }

    await PrivateFile.findByIdAndDelete(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
