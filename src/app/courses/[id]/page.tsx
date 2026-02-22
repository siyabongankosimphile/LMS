import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import CourseModule from "@/models/Module";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Enrollment from "@/models/Enrollment";
import EnrollForm from "./EnrollForm";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  await connectDB();
  const session = await getServerSession(authOptions);

  const course = await Course.findById(id)
    .populate("facilitator", "name")
    .lean();

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
      </div>
    );
  }

  const modules = await CourseModule.find({ course: id })
    .sort({ order: 1 })
    .lean();

  const lessons = await Lesson.find({ course: id })
    .sort({ order: 1 })
    .lean();

  const quiz = await Quiz.findOne({ course: id }).lean();

  let enrollment = null;
  if (session?.user?.id) {
    enrollment = await Enrollment.findOne({
      student: session.user.id,
      course: id,
    }).lean();
  }

  const facilitator = course.facilitator as unknown as { name: string };
  const modulesWithLessons = modules.map((m) => ({
    ...m,
    lessons: lessons.filter((l) => String(l.module) === String(m._id)),
  }));

  const totalLessons = lessons.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
        <p className="text-blue-100 mb-4">{course.description}</p>
        <div className="flex items-center gap-4 text-sm text-blue-200">
          <span>👨‍🏫 {facilitator?.name || "Facilitator"}</span>
          <span>📚 {totalLessons} lessons</span>
          {quiz && <span>📝 Quiz included</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course content */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Course Content
          </h2>
          {modulesWithLessons.length === 0 ? (
            <p className="text-gray-500 text-sm">No content available yet.</p>
          ) : (
            <div className="space-y-3">
              {modulesWithLessons.map((m, i) => (
                <div
                  key={String(m._id)}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  <div className="bg-gray-50 px-5 py-3 font-medium text-gray-800">
                    Module {i + 1}: {m.title}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {m.lessons.map((l, j) => (
                      <div
                        key={String(l._id)}
                        className="px-5 py-3 text-sm text-gray-600 flex items-center gap-2"
                      >
                        <span className="text-gray-400">{j + 1}.</span>
                        <span>{l.title}</span>
                        {enrollment && (
                          <span className="ml-auto text-xs text-gray-400">
                            {(enrollment.completedLessons || [])
                              .map(String)
                              .includes(String(l._id))
                              ? "✅"
                              : "○"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrollment sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            {enrollment ? (
              <div>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {enrollment.progressPercent}%
                  </div>
                  <div className="text-gray-500 text-sm">Complete</div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${enrollment.progressPercent}%` }}
                    />
                  </div>
                </div>
                {enrollment.completed ? (
                  <div className="text-center text-green-600 font-semibold text-sm mb-3">
                    🎉 Course Completed!
                  </div>
                ) : (
                  <Link
                    href={`/courses/${id}/learn`}
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3"
                  >
                    Continue Learning
                  </Link>
                )}
              </div>
            ) : session?.user?.role === "STUDENT" ? (
              <EnrollForm courseId={id} />
            ) : !session ? (
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-3">
                  Sign in to enroll in this course
                </p>
                <Link
                  href={`/login?callbackUrl=/courses/${id}`}
                  className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign in to Enroll
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
