import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
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

    const { answers, courseId } = await req.json();
    if (!answers || !courseId) {
      return NextResponse.json(
        { error: "answers and courseId are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const quiz = await Quiz.findById(id);
    if (!quiz || String(quiz.course) !== courseId) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const enrollment = await Enrollment.findOne({
      student: session.user.id,
      course: courseId,
    });
    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Score the quiz
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] !== undefined && answers[i] === q.correctIndex) {
        correct++;
      }
    });

    const scorePercent =
      quiz.questions.length > 0
        ? Math.round((correct / quiz.questions.length) * 100)
        : 0;

    const passed = scorePercent >= quiz.passMarkPercent;

    enrollment.quizScore = scorePercent;
    enrollment.quizPassed = passed;

    // Check if course should be marked complete
    const totalLessons = await Lesson.countDocuments({ course: courseId });
    const allLessonsDone = enrollment.completedLessons.length >= totalLessons;

    if (passed && allLessonsDone && !enrollment.completed) {
      enrollment.completed = true;
      enrollment.completedAt = new Date();

      // Generate certificate
      await issueCertificate(enrollment, session.user.id, courseId);
    }

    await enrollment.save();

    return NextResponse.json({
      scorePercent,
      passed,
      correct,
      total: quiz.questions.length,
      passMarkPercent: quiz.passMarkPercent,
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
