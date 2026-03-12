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

function formatExcelText(value: string | number | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  const looksNumeric = /^[0-9+\-() ]+$/.test(text);
  if (looksNumeric) {
    return `="${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toValidDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (value && typeof value === "object" && "$date" in value) {
    const maybeDate = (value as { $date?: unknown }).$date;
    if (typeof maybeDate === "string" || typeof maybeDate === "number") {
      const parsed = new Date(maybeDate);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  return null;
}

function formatJoinedDate(value: unknown) {
  const date = toValidDate(value);
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}-${year}`;
}

function getJoinedDateExportValue(value: unknown) {
  const formatted = formatJoinedDate(value);
  if (!formatted) {
    return "";
  }

  return `="${formatted}"`;
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const students = await User.find({ role: "STUDENT" })
      .select(
        "name surname email status cityTown country gender race employmentStatus highestQualification province age phone saId createdAt"
      )
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
      "Surname",
      "Email",
      "City/Town",
      "Country",
      "Gender",
      "Race",
      "Employment Status",
      "Highest Qualification",
      "Province",
      "Age",
      "Phone",
      "SA ID",
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
        student.surname || "",
        student.email,
        student.cityTown || "",
        student.country || "",
        student.gender || "",
        student.race || "",
        student.employmentStatus || "",
        student.highestQualification || "",
        student.province || "",
        student.age || "",
        formatExcelText(student.phone || ""),
        formatExcelText(student.saId || ""),
        student.status,
        summary.enrolledCourses,
        summary.completedCourses,
        inProgressCourses,
        summary.averageProgress,
        getJoinedDateExportValue(student.createdAt),
      ];
    });

    const csvBody = [header, ...rows]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");

    const csv = `\uFEFFsep=,\n${csvBody}`;

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
