import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { published: true };

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("facilitator", "name email image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter),
    ]);

    // If logged in as student, mark enrolled courses
    let enrolledCourseIds: string[] = [];
    if (session?.user?.id && session.user.role === "STUDENT") {
      const enrollments = await Enrollment.find({
        student: session.user.id,
      })
        .select("course")
        .lean();
      enrolledCourseIds = enrollments.map((e) => String(e.course));
    }

    const coursesWithEnrollment = courses.map((c) => ({
      ...c,
      enrolled: enrolledCourseIds.includes(String(c._id)),
    }));

    return NextResponse.json({
      courses: coursesWithEnrollment,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
