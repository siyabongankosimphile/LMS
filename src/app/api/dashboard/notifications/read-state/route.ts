import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import NotificationReadState from "@/models/NotificationReadState";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const state = await NotificationReadState.findOne({ student: session.user.id })
      .select("readIds")
      .lean();

    return NextResponse.json({ readIds: state?.readIds || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = (await req.json()) as {
      ids?: string[];
      id?: string;
      read?: boolean;
    };

    const incomingIds = Array.isArray(payload.ids)
      ? payload.ids
      : payload.id
        ? [payload.id]
        : [];

    const ids = incomingIds
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ error: "No notification ids provided" }, { status: 400 });
    }

    const shouldMarkRead = payload.read !== false;

    await connectDB();

    if (shouldMarkRead) {
      const updated = await NotificationReadState.findOneAndUpdate(
        { student: session.user.id },
        { $addToSet: { readIds: { $each: ids } } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
        .select("readIds")
        .lean();

      return NextResponse.json({ readIds: updated?.readIds || [] });
    }

    const updated = await NotificationReadState.findOneAndUpdate(
      { student: session.user.id },
      { $pull: { readIds: { $in: ids } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .select("readIds")
      .lean();

    return NextResponse.json({ readIds: updated?.readIds || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
