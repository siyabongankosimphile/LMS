import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const filter =
      session.user.role === "ADMIN"
        ? {}
        : { facilitator: session.user.id };

    const courses = await Course.find(filter)
      .populate("facilitator", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ courses });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      !["FACILITATOR", "ADMIN"].includes(session.user.role) ||
      (session.user.role === "FACILITATOR" && session.user.status !== "ACTIVE")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      title,
      shortName,
      category,
      description,
      welcomeMessage,
      enrollmentKey,
      passMarkPercent,
      published,
      startDate,
      endDate,
      format,
      groupMode,
      gradeCategories,
    } =
      await req.json();

    if (!title || !description || !enrollmentKey) {
      return NextResponse.json(
        { error: "title, description and enrollmentKey are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedTitle = String(title).trim();
    const existing = await Course.findOne({
      facilitator: session.user.id,
      title: { $regex: `^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    }).lean();

    if (existing) {
      return NextResponse.json(
        { error: "A course with this title already exists for your account." },
        { status: 409 }
      );
    }

    const course = await Course.create({
      title: normalizedTitle,
      shortName,
      category,
      description,
      welcomeMessage:
        typeof welcomeMessage === "string" && welcomeMessage.trim()
          ? welcomeMessage.trim()
          : undefined,
      facilitator: session.user.id,
      enrollmentKeyHash: hashKey(enrollmentKey),
      passMarkPercent: passMarkPercent || 70,
      published: published ?? false,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      format: format || "TOPICS",
      groupMode: groupMode || "NO_GROUPS",
      gradeCategories: Array.isArray(gradeCategories)
        ? gradeCategories
            .filter(
              (item) =>
                item &&
                typeof item.name === "string" &&
                item.name.trim() &&
                typeof item.weight === "number"
            )
            .map((item) => ({
              name: item.name.trim(),
              weight: Math.max(0, Math.min(100, item.weight)),
            }))
        : [
            { name: "Homework", weight: 20 },
            { name: "Tests", weight: 80 },
          ],
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
