import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import CourseModule from "@/models/Module";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Enrollment from "@/models/Enrollment";
import Certificate from "@/models/Certificate";
import LearningClient from "./LearningClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LearnPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "STUDENT") redirect(`/courses/${id}`);

  await connectDB();

  const enrollment = await Enrollment.findOne({
    student: session.user.id,
    course: id,
  }).lean();

  if (!enrollment) redirect(`/courses/${id}`);

  const [course, modules, lessons, quiz, certificate] = await Promise.all([
    Course.findById(id).lean(),
    CourseModule.find({ course: id }).sort({ order: 1 }).lean(),
    Lesson.find({ course: id }).sort({ order: 1 }).lean(),
    Quiz.findOne({ course: id }).lean(),
    Certificate.findOne({
      student: session.user.id,
      course: id,
    }).lean(),
  ]);

  if (!course) redirect("/courses");

  return (
    <LearningClient
      courseId={id}
      course={JSON.parse(JSON.stringify(course))}
      modules={JSON.parse(JSON.stringify(modules))}
      lessons={JSON.parse(JSON.stringify(lessons))}
      quiz={quiz ? JSON.parse(JSON.stringify(quiz)) : null}
      enrollment={JSON.parse(JSON.stringify(enrollment))}
      certificate={certificate ? JSON.parse(JSON.stringify(certificate)) : null}
    />
  );
}
