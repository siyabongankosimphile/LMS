"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CourseOverviewItem = {
  enrollmentId: string;
  courseId: string;
  title: string;
  description?: string;
  progressPercent: number;
  completed: boolean;
  enrolledAt: string;
  completedAt?: string;
  quizScore?: number;
};

type TimelineItem = {
  assignmentId: string;
  courseId: string;
  courseTitle: string;
  assignmentTitle: string;
  dueAt: string;
  submissionStatus: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
};

type BadgeItem = {
  id: string;
  label: string;
  issuedAt: string;
  fileUrl: string;
};

type EventItem = {
  id: string;
  kind: "ASSIGNMENT_DUE" | "QUIZ_OPEN" | "ANNOUNCEMENT";
  courseId: string;
  courseTitle: string;
  title: string;
  at: string;
  href: string;
  status?: "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";
};

type NotificationItem = {
  id: string;
  type: "ANNOUNCEMENT" | "FORUM_REPLY" | "GRADED";
  title: string;
  detail: string;
  at: string;
  href: string;
};

type Props = {
  courses: CourseOverviewItem[];
  timeline: TimelineItem[];
  badges: BadgeItem[];
  events: EventItem[];
  notifications: NotificationItem[];
};

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function eventLabel(kind: EventItem["kind"]): string {
  if (kind === "ASSIGNMENT_DUE") return "Assignment deadline";
  if (kind === "QUIZ_OPEN") return "Quiz schedule";
  return "Announcement";
}

export default function StudentDashboardClient({
  courses,
  timeline,
  badges,
  events,
  notifications,
}: Props) {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()));
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    const loadReadState = async () => {
      const res = await fetch("/api/dashboard/notifications/read-state");
      if (!res.ok) return;
      const data = await res.json();
      setReadIds(Array.isArray(data.readIds) ? data.readIds : []);
    };

    loadReadState();
  }, []);

  async function markAsRead(ids: string[]) {
    if (ids.length === 0) return;
    setReadIds((prev) => Array.from(new Set([...prev, ...ids])));
    await fetch("/api/dashboard/notifications/read-state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, read: true }),
    });
  }

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readIds.includes(item.id)).length,
    [notifications, readIds]
  );

  const recentCourses = useMemo(
    () =>
      [...courses]
        .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
        .slice(0, 6),
    [courses]
  );

  const upcomingDeadlines = useMemo(
    () =>
      [...timeline]
        .filter((item) => new Date(item.dueAt).getTime() >= Date.now())
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
        .slice(0, 8),
    [timeline]
  );

  const timelineItems = useMemo(
    () =>
      [...events]
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
        .slice(0, 12),
    [events]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const item of events) {
      const key = toDateKey(new Date(item.at));
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [events]);

  const selectedDateEvents = eventsByDate.get(selectedDateKey) || [];
  const todayKey = toDateKey(new Date());

  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();
  const firstWeekday = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  ).getDay();

  const calendarDays: Array<{ day: number; key: string } | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = toDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    calendarDays.push({ day, key });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">Learner Home</span>
          <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">Home</Link>
          <Link href="/dashboard" className="text-blue-600 hover:underline dark:text-blue-400">Dashboard</Link>
          <Link href="/courses" className="text-blue-600 hover:underline dark:text-blue-400">My Courses</Link>
          <Link href="/dashboard/messages" className="text-blue-600 hover:underline dark:text-blue-400">
            Messages {unreadCount > 0 ? `(${unreadCount})` : ""}
          </Link>
          <a href="#profile" className="text-blue-600 hover:underline dark:text-blue-400">Profile</a>
          <Link href="/dashboard" className="ml-auto text-xs text-gray-500 hover:underline dark:text-gray-300">Refresh</Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="space-y-5 lg:col-span-8">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Courses</h2>
            {courses.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">No registered modules yet.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {courses.map((course) => (
                  <Link
                    key={course.enrollmentId}
                    href={`/courses/${course.courseId}`}
                    className="rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-700 dark:hover:bg-slate-700/40"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{course.progressPercent}% progress</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Course Overview</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Recently accessed courses</p>
                <div className="mt-2 space-y-2">
                  {recentCourses.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-300">No recent course activity yet.</p>
                  ) : (
                    recentCourses.map((course) => (
                      <Link key={`recent-${course.enrollmentId}`} href={`/courses/${course.courseId}`} className="block text-sm text-blue-600 hover:underline dark:text-blue-400">
                        {course.title}
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Upcoming deadlines</p>
                <div className="mt-2 space-y-2">
                  {upcomingDeadlines.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-300">No upcoming deadlines.</p>
                  ) : (
                    upcomingDeadlines.map((item) => (
                      <Link key={item.assignmentId} href={`/courses/${item.courseId}/learn`} className="block rounded-md border border-gray-200 px-2 py-1 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
                        <span className="font-medium text-gray-800 dark:text-gray-100">{item.assignmentTitle}</span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">{new Date(item.dueAt).toLocaleDateString("en-ZA")}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Achievements</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {badges.map((badge) => (
                  <a key={badge.id} href={badge.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
                    {badge.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Timeline</h3>
            <div className="mt-3 space-y-2">
              {timelineItems.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-300">No timeline items yet.</p>
              ) : (
                timelineItems.map((item) => (
                  <Link key={item.id} href={item.href} className="block rounded-md border border-gray-200 px-2 py-2 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
                    <p className="text-xs text-gray-500 dark:text-gray-300">{eventLabel(item.kind)}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{item.courseTitle} - {new Date(item.at).toLocaleDateString("en-ZA")}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Calendar</h3>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                    )
                  }
                  className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                    )
                  }
                  className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-200">
              {calendarMonth.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="font-semibold text-gray-500 dark:text-gray-300">{day}</div>
              ))}
              {calendarDays.map((item, idx) => {
                if (!item) return <div key={`empty-${idx}`} className="h-8" />;
                const hasEvents = (eventsByDate.get(item.key) || []).length > 0;
                const isToday = item.key === todayKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(item.key);
                      setCalendarDrawerOpen(true);
                    }}
                    className={`flex h-8 items-center justify-center rounded border text-xs ${
                      hasEvents
                        ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-500/20 dark:text-blue-200"
                        : "border-gray-200 text-gray-600 dark:border-slate-700 dark:text-gray-300"
                    } ${isToday ? "ring-1 ring-emerald-400" : ""}`}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>
          </div>

          <div id="messages" className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Messages / Notifications</h3>
              <Link href="/dashboard/messages" className="text-xs text-blue-600 hover:underline dark:text-blue-400">Open all</Link>
            </div>
            <div className="mt-3 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-300">No notifications yet.</p>
              ) : (
                notifications.slice(0, 12).map((item) => {
                  const isRead = readIds.includes(item.id);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        if (!isRead) void markAsRead([item.id]);
                      }}
                      className={`block rounded-md border px-2 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/40 ${
                        isRead
                          ? "border-gray-200 dark:border-slate-700"
                          : "border-blue-200 bg-blue-50/60 dark:border-blue-600/50 dark:bg-blue-500/10"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{item.detail}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-400">{new Date(item.at).toLocaleString("en-ZA")}</p>
                    </Link>
                  );
                })
              )}
            </div>
            <div id="profile" className="mt-3 border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-slate-700 dark:text-gray-300">
              Use Profile settings from the top-right menu to update your account.
            </div>
          </div>
        </aside>
      </div>

      {calendarDrawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-4 shadow-xl dark:bg-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule for {selectedDateKey}</h3>
              <button
                type="button"
                onClick={() => setCalendarDrawerOpen(false)}
                className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-300">No scheduled activities for this date.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((item) => (
                  <Link key={item.id} href={item.href} className="block rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
                    <p className="text-xs text-gray-500 dark:text-gray-300">{eventLabel(item.kind)}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{item.courseTitle}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
