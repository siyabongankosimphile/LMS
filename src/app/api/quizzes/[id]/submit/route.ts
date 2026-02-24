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

    const { answers, courseId, startedAt } = await req.json();
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

    const now = new Date();
    if (quiz.openAt && now < quiz.openAt) {
      return NextResponse.json(
        { error: "Quiz is not open yet" },
        { status: 400 }
      );
    }
    if (quiz.closeAt && now > quiz.closeAt) {
      return NextResponse.json(
        { error: "Quiz is closed" },
        { status: 400 }
      );
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

    const attemptsAllowed = quiz.attemptsAllowed || 1;
    const currentAttempts = enrollment.quizAttempts || 0;
    if (currentAttempts >= attemptsAllowed) {
      return NextResponse.json(
        { error: "No attempts remaining for this quiz" },
        { status: 400 }
      );
    }

    if (quiz.timeLimitMinutes) {
      const startDate = startedAt ? new Date(startedAt) : null;
      if (!startDate || Number.isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Quiz start time is required" },
          { status: 400 }
        );
      }

      const elapsedMs = now.getTime() - startDate.getTime();
      const allowedMs = quiz.timeLimitMinutes * 60 * 1000;
      if (elapsedMs > allowedMs) {
        return NextResponse.json(
          { error: "Time limit exceeded" },
          { status: 400 }
        );
      }
    }

    const submittedAnswers: unknown[] = Array.isArray(answers) ? answers : [];

    let earnedMarks = 0;
    let maxMarks = 0;
    let correct = 0;

    const review = {
      showMarks: quiz.reviewOptions?.showMarks !== false,
      showCorrectAnswers: quiz.reviewOptions?.showCorrectAnswers === true,
      showFeedback: quiz.reviewOptions?.showFeedback !== false,
    };

    const questionResults = quiz.questions.map((question, index) => {
      const marks = typeof question.marks === "number" && question.marks > 0 ? question.marks : 1;
      maxMarks += marks;

      const type = question.type;
      const submitted = submittedAnswers[index];
      let isCorrect = false;
      let questionEarned = 0;

      if (type === "MCQ" || type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
        const submittedIndex = typeof submitted === "number" ? submitted : -1;
        if (typeof question.correctIndex === "number" && submittedIndex === question.correctIndex) {
          isCorrect = true;
          questionEarned = marks;
        }
      }

      if (type === "SHORT_ANSWER") {
        const submittedText = typeof submitted === "string" ? submitted.trim().toLowerCase() : "";
        const accepted = (question.acceptedAnswers || [])
          .map((answer) => String(answer).trim().toLowerCase())
          .filter(Boolean);

        if (submittedText && accepted.includes(submittedText)) {
          isCorrect = true;
          questionEarned = marks;
        }
      }

      if (type === "MATCHING") {
        const submittedMap =
          submitted && typeof submitted === "object"
            ? (submitted as Record<string, string>)
            : {};
        const pairs = question.matchingPairs || [];
        if (pairs.length > 0) {
          const allCorrect = pairs.every((pair) => {
            const left = String(pair.left || "");
            const expected = String(pair.right || "").trim().toLowerCase();
            const actual = String(submittedMap[left] || "").trim().toLowerCase();
            return expected && actual && expected === actual;
          });
          if (allCorrect) {
            isCorrect = true;
            questionEarned = marks;
          }
        }
      }

      if (type === "DESCRIPTIVE" || type === "ESSAY") {
        isCorrect = false;
        questionEarned = 0;
      }

      earnedMarks += questionEarned;
      if (isCorrect) correct++;

      const result: Record<string, unknown> = {
        index,
        type,
        question: question.question,
      };

      if (review.showMarks) {
        result.marksEarned = questionEarned;
        result.maxMarks = marks;
      }

      if (review.showCorrectAnswers) {
        if (type === "MCQ" || type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
          result.correctAnswer =
            typeof question.correctIndex === "number" && Array.isArray(question.options)
              ? question.options[question.correctIndex]
              : null;
        }
        if (type === "SHORT_ANSWER") {
          result.correctAnswer = question.acceptedAnswers || [];
        }
        if (type === "MATCHING") {
          result.correctAnswer = question.matchingPairs || [];
        }
      }

      if (review.showFeedback) {
        result.feedback = question.feedback || null;
      }

      result.isCorrect = isCorrect;

      return result;
    });

    const scorePercent = maxMarks > 0 ? Math.round((earnedMarks / maxMarks) * 100) : 0;

    const passed = scorePercent >= quiz.passMarkPercent;

    enrollment.quizScore = scorePercent;
    enrollment.quizPassed = passed;
    enrollment.quizAttempts = (enrollment.quizAttempts || 0) + 1;

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
      attemptsUsed: enrollment.quizAttempts,
      attemptsAllowed,
      reviewOptions: review,
      questionResults,
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
