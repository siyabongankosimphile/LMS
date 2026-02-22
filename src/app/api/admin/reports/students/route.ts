import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const students = await User.find({ role: "STUDENT" })
      .select("name email status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((student) => student._id);

    const summaries = await Enrollment.aggregate([
      { $match: { student: { $in: studentIds } } },
      {
        $group: {
          _id: "$student",
          enrolledCourses: { $sum: 1 },
          completedCourses: {
            $sum: {
              $cond: [{ $eq: ["$completed", true] }, 1, 0],
            },
          },
          averageProgress: { $avg: "$progressPercent" },
        },
      },
    ]);

    const summaryMap = new Map<string, { enrolledCourses: number; completedCourses: number; averageProgress: number }>();
    summaries.forEach((summary) => {
      summaryMap.set(String(summary._id), {
        enrolledCourses: summary.enrolledCourses || 0,
        completedCourses: summary.completedCourses || 0,
        averageProgress: Math.round(summary.averageProgress || 0),
      });
    });

    const header = [
      "Student Name",
      "Email",
      "Account Status",
      "Enrolled Courses",
      "Completed Courses",
      "In Progress Courses",
      "Average Progress (%)",
      "Joined Date",
    ];

    const rows = students.map((student) => {
      const summary = summaryMap.get(String(student._id)) || {
        enrolledCourses: 0,
        completedCourses: 0,
        averageProgress: 0,
      };

      const inProgressCourses = Math.max(
        summary.enrolledCourses - summary.completedCourses,
        0
      );

      return [
        student.name,
        student.email,
        student.status,
        summary.enrolledCourses,
        summary.completedCourses,
        inProgressCourses,
        summary.averageProgress,
        new Date(student.createdAt).toLocaleDateString("en-ZA"),
      ];
    });

    const csv = [header, ...rows]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="student-report-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
