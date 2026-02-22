import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can enroll" },
        { status: 403 }
      );
    }

    const { enrollmentKey } = await req.json();
    if (!enrollmentKey) {
      return NextResponse.json(
        { error: "Enrollment key is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (!course.published) {
      return NextResponse.json(
        { error: "Course is not available" },
        { status: 400 }
      );
    }

    const keyHash = hashKey(enrollmentKey);
    if (keyHash !== course.enrollmentKeyHash) {
      return NextResponse.json(
        { error: "Invalid enrollment key" },
        { status: 400 }
      );
    }

    const existing = await Enrollment.findOne({
      student: session.user.id,
      course: id,
    });
    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    const enrollment = await Enrollment.create({
      student: session.user.id,
      course: id,
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
