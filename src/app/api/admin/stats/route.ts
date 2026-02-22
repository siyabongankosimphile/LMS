import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const [
      totalStudents,
      totalFacilitators,
      pendingFacilitators,
      totalCourses,
      publishedCourses,
      totalEnrollments,
    ] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "FACILITATOR" }),
      User.countDocuments({ role: "FACILITATOR", status: "PENDING_APPROVAL" }),
      Course.countDocuments(),
      Course.countDocuments({ published: true }),
      Enrollment.countDocuments(),
    ]);

    return NextResponse.json({
      totalStudents,
      totalFacilitators,
      pendingFacilitators,
      totalCourses,
      publishedCourses,
      totalEnrollments,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
