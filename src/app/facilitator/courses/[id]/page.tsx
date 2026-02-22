import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import CourseModule from "@/models/Module";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import CourseEditor from "./CourseEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilitatorCoursePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["FACILITATOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  await connectDB();

  const course = await Course.findById(id).lean();
  if (!course) redirect("/facilitator");

  if (
    session.user.role !== "ADMIN" &&
    String(course.facilitator) !== session.user.id
  ) {
    redirect("/facilitator");
  }

  const modules = await CourseModule.find({ course: id })
    .sort({ order: 1 })
    .lean();

  const lessons = await Lesson.find({ course: id })
    .sort({ order: 1 })
    .lean();

  const quiz = await Quiz.findOne({ course: id }).lean();

  return (
    <CourseEditor
      courseId={id}
      course={JSON.parse(JSON.stringify(course))}
      modules={JSON.parse(JSON.stringify(modules))}
      lessons={JSON.parse(JSON.stringify(lessons))}
      quiz={quiz ? JSON.parse(JSON.stringify(quiz)) : null}
    />
  );
}
