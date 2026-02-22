import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  await connectDB();

  const courses = await Course.find({ published: true })
    .populate("facilitator", "name")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h1>
      <p className="text-gray-500 mb-8">Browse and enroll in available courses</p>

      {courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-500">No courses available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const facilitator = course.facilitator as unknown as { name: string };
            return (
              <Link
                key={String(course._id)}
                href={`/courses/${course._id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-36 flex items-center justify-center">
                  <span className="text-5xl">🎓</span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>By {facilitator?.name || "Facilitator"}</span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                      Enroll
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
