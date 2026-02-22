import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { studentId, courseId } = (await req.json()) as {
      studentId?: string;
      courseId?: string;
    };

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: "studentId and courseId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const [student, course] = await Promise.all([
      User.findById(studentId).lean(),
      Course.findById(courseId).lean(),
    ]);

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existing) {
      return NextResponse.json({ error: "Student already enrolled" }, { status: 409 });
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
