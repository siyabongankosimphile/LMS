import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import Certificate from "@/models/Certificate";
import Course from "@/models/Course";
import User from "@/models/User";
import { generateCertificatePDF } from "@/lib/certificate";
import { uploadFile } from "@/lib/s3";

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

    const { lessonId } = await req.json();
    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const enrollment = await Enrollment.findOne({
      student: session.user.id,
      course: id,
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson || String(lesson.course) !== id) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Add lesson to completedLessons if not already there
    const alreadyCompleted = enrollment.completedLessons
      .map((l) => String(l))
      .includes(lessonId);

    if (!alreadyCompleted) {
      enrollment.completedLessons.push(lesson._id);
    }

    // Calculate progress
    const totalLessons = await Lesson.countDocuments({ course: id });
    enrollment.progressPercent =
      totalLessons > 0
        ? Math.round((enrollment.completedLessons.length / totalLessons) * 100)
        : 0;

    // Check if all lessons completed
    if (
      enrollment.progressPercent === 100 &&
      !enrollment.completed &&
      enrollment.quizPassed !== false
    ) {
      // If there's no quiz requirement or quiz is already passed
      const shouldMarkComplete =
        enrollment.quizPassed === true || enrollment.quizScore === undefined;

      if (shouldMarkComplete) {
        enrollment.completed = true;
        enrollment.completedAt = new Date();

        // Generate certificate
        await issueCertificate(enrollment, session.user.id, id);
      }
    }

    await enrollment.save();

    return NextResponse.json({
      completedLessons: enrollment.completedLessons,
      progressPercent: enrollment.progressPercent,
      completed: enrollment.completed,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function issueCertificate(
  enrollment: InstanceType<typeof Enrollment>,
  studentId: string,
  courseId: string
) {
  try {
    const existing = await Certificate.findOne({
      student: studentId,
      course: courseId,
    });
    if (existing) return;

    const [student, course] = await Promise.all([
      User.findById(studentId).lean(),
      Course.findById(courseId).lean(),
    ]);

    if (!student || !course) return;

    const pdfBuffer = await generateCertificatePDF({
      studentName: student.name,
      courseName: course.title,
      completionDate: enrollment.completedAt || new Date(),
    });

    const key = `certificates/${studentId}/${courseId}-${Date.now()}.pdf`;
    let fileUrl: string;

    try {
      fileUrl = await uploadFile(key, pdfBuffer, "application/pdf");
    } catch {
      // Fallback: store as data URL if S3 is not configured
      fileUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    }

    await Certificate.create({
      student: studentId,
      course: courseId,
      enrollment: enrollment._id,
      fileUrl,
      fileKey: key,
      issuedAt: new Date(),
    });
  } catch (err) {
    console.error("Certificate generation failed:", err);
  }
}
