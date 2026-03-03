"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type LessonResource = {
  name?: string;
  type?: "file" | "link";
  url?: string;
};

type LessonItem = {
  _id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  resources?: LessonResource[];
};

type ModuleItem = {
  _id: string;
  title: string;
  lessons: LessonItem[];
};

type AssignmentItem = {
  _id: string;
  title: string;
  description?: string;
  dueAt?: string;
  submissionStatus: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
};

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  at: string;
};

type UserItem = {
  id: string;
  name: string;
  role: string;
};

type Props = {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  courseImage?: string;
  facilitatorName: string;
  modules: ModuleItem[];
  assignments: AssignmentItem[];
  quiz: {
    _id: string;
    title: string;
    attemptsAllowed?: number;
    timeLimitMinutes?: number;
    questionCount: number;
  } | null;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessons: number;
  participantsCount: number;
  upcomingEvents: AssignmentItem[];
  recentActivity: ActivityItem[];
  onlineUsers: UserItem[];
};

function resourceIcon(resource?: LessonResource): string {
  const name = String(resource?.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return "📄";
  if (resource?.type === "file") return "📁";
  if (resource?.type === "link") return "🔗";
  return "📘";
}

export default function CourseStudentView({
  courseId,
  courseTitle,
  courseDescription,
  courseImage,
  facilitatorName,
  modules,
  assignments,
  quiz,
  progressPercent,
  completedLessonsCount,
  totalLessons,
  participantsCount,
  upcomingEvents,
  recentActivity,
  onlineUsers,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nowMs = Date.now();
  const orderedAssignments = useMemo(
    () =>
      [...assignments].sort((a, b) => {
        const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
    [assignments]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-300">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span className="mx-2">&gt;</span>
        <Link href="/courses" className="hover:underline">My courses</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-gray-700 dark:text-gray-100">{courseTitle}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-6">
        {courseImage ? (
          <div
            className="h-44 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${courseImage})` }}
          />
        ) : (
          <div className="h-44 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
        )}
        <div className="px-5 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{courseTitle}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{courseDescription}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-300">
            <span>👨‍🏫 {facilitatorName}</span>
            <span>👥 {participantsCount} participants</span>
            <span>📚 {totalLessons} lessons</span>
          </div>
        </div>
      </div>

      <div className="mb-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        >
          ☰ Course navigation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className={`${drawerOpen ? "block" : "hidden"} lg:block lg:col-span-3`}>
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3 sticky top-24">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Navigation</h2>
            <Link href={`/courses/${courseId}`} className="block text-sm text-blue-600 hover:underline">Home</Link>
            <Link href={`/courses/${courseId}/participants`} className="block text-sm text-blue-600 hover:underline">Participants</Link>
            <Link href={`/courses/${courseId}/grades`} className="block text-sm text-blue-600 hover:underline">Grades</Link>
            <Link href={`/courses/${courseId}/competencies`} className="block text-sm text-blue-600 hover:underline">Competencies</Link>
            <Link href={`/courses/${courseId}/learn`} className="block text-sm text-blue-600 hover:underline">General / Resources</Link>

            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <div className="text-xs text-gray-500 dark:text-gray-300">Course progress</div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>{completedLessonsCount}/{totalLessons} lessons</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-slate-700">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-6 space-y-6">
          <section className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Course Sections</h2>
            {modules.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-300">No sections yet.</p>
            ) : (
              <div className="space-y-4">
                {modules.map((module, idx) => (
                  <div key={module._id} className="rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="px-4 py-2 text-sm font-semibold bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100">
                      Section {idx + 1}: {module.title}
                    </div>
                    <div className="p-3 space-y-2">
                      {module.lessons.map((lesson) => (
                        <div key={lesson._id} className="rounded-md border border-gray-100 dark:border-slate-700 p-2">
                          <Link
                            href={`/courses/${courseId}/learn`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            📘 {lesson.title}
                          </Link>
                          <div className="mt-1 space-y-1">
                            {lesson.videoUrl && (
                              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-600 dark:text-gray-300 hover:underline">
                                🔗 Open lesson video
                              </a>
                            )}
                            {(lesson.resources || []).map((resource, i) => (
                              <a
                                key={`${lesson._id}-${i}`}
                                href={resource.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-gray-600 dark:text-gray-300 hover:underline"
                              >
                                {resourceIcon(resource)} {resource.name || "Resource"}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Activities</h2>
            <div className="space-y-3">
              {orderedAssignments.map((assignment) => {
                const overdue =
                  assignment.dueAt &&
                  new Date(assignment.dueAt).getTime() < nowMs &&
                  assignment.submissionStatus === "NOT_SUBMITTED";

                return (
                  <div key={assignment._id} className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/courses/${courseId}/learn`} className="text-sm font-medium text-blue-600 hover:underline">
                        📝 {assignment.title}
                      </Link>
                      <div className="flex items-center gap-2">
                        {overdue && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">LATE</span>
                        )}
                        {assignment.dueAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-300">
                            Due {new Date(assignment.dueAt).toLocaleDateString("en-ZA")}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      Status: {assignment.submissionStatus.replaceAll("_", " ")}
                    </p>
                  </div>
                );
              })}

              <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                <Link href={`/courses/${courseId}/forum`} className="text-sm font-medium text-blue-600 hover:underline">
                  💬 Forum discussion
                </Link>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Open discussions, reply to classmates, and participate in class conversation.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                <Link href={`/courses/${courseId}/glossary`} className="text-sm font-medium text-blue-600 hover:underline">
                  📚 Glossary
                </Link>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Browse terms alphabetically, search definitions, and add new entries.
                </p>
              </div>

              {quiz && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                  <Link href={`/courses/${courseId}/learn`} className="text-sm font-medium text-blue-600 hover:underline">
                    ❓ {quiz.title}
                  </Link>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    {quiz.questionCount} questions • {quiz.attemptsAllowed || 1} attempts
                    {quiz.timeLimitMinutes ? ` • ${quiz.timeLimitMinutes} minutes` : ""}
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="lg:col-span-3 space-y-6">
          <section className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Upcoming Events</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-300">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 6).map((item) => (
                  <div key={item._id} className="text-xs text-gray-700 dark:text-gray-200 rounded-md bg-gray-50 dark:bg-slate-900 p-2">
                    <p className="font-medium">{item.title}</p>
                    {item.dueAt && <p>Due {new Date(item.dueAt).toLocaleDateString("en-ZA")}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-300">No recent changes.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 8).map((item) => (
                  <div key={item.id} className="text-xs rounded-md border border-gray-100 dark:border-slate-700 p-2">
                    <p className="font-medium text-gray-800 dark:text-gray-100">{item.label}</p>
                    <p className="text-gray-600 dark:text-gray-300">{item.detail}</p>
                    <p className="text-gray-500 dark:text-gray-400">{new Date(item.at).toLocaleString("en-ZA")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Online Users</h3>
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-300">No users online right now.</p>
            ) : (
              <div className="space-y-2">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between text-xs rounded-md bg-gray-50 dark:bg-slate-900 p-2">
                    <span className="text-gray-800 dark:text-gray-100">{user.name}</span>
                    <span className="text-green-600">● {user.role}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
