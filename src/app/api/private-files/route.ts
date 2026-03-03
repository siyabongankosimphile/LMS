import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PrivateFile from "@/models/PrivateFile";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const files = await PrivateFile.find({ owner: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ files });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, url, key, contentType, size } = (await req.json()) as {
      name?: string;
      url?: string;
      key?: string;
      contentType?: string;
      size?: number;
    };

    if (!name || !url || !key) {
      return NextResponse.json(
        { error: "name, url and key are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const created = await PrivateFile.create({
      owner: session.user.id,
      name,
      url,
      key,
      contentType,
      size,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
