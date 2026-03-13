"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type LessonResource = {
  name?: string;
  type?: "file" | "link";
  url?: string;
  key?: string;
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
  attachment?: {
    url?: string;
    key?: string;
    name?: string;
  };
};

type AnnouncementItem = {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  createdByName: string;
};

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  at: string;
};

type ParticipantItem = {
  id: string;
  name: string;
  role: string;
};

type Props = {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  welcomeMessage?: string;
  courseImage?: string;
  facilitatorName: string;
  courseFormat?: "TOPICS" | "WEEKLY" | "GRID";
  modules: ModuleItem[];
  assignments: AssignmentItem[];
  announcements: AnnouncementItem[];
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
  participants: ParticipantItem[];
};

function resourceKind(resource?: LessonResource): "PDF" | "FILE" | "LINK" | "DOC" {
  const name = String(resource?.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return "PDF";
  if (resource?.type === "file") return "FILE";
  if (resource?.type === "link") return "LINK";
  return "DOC";
}

function normalizeUrl(raw?: string): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|\/)/i.test(value)) return value;
  return `https://${value}`;
}

function resolveResourceUrl(resource?: LessonResource): string {
  const normalized = normalizeUrl(resource?.url);
  if (normalized) return normalized;
  const key = String(resource?.key || "").trim();
  if (!key) return "";
  return `/uploads/${key.replace(/^\/+/, "")}`;
}

function resolveAttachmentUrl(attachment?: { url?: string; key?: string }): string {
  const normalized = normalizeUrl(attachment?.url);
  if (normalized) return normalized;
  const key = String(attachment?.key || "").trim();
  if (!key) return "";
  return `/uploads/${key.replace(/^\/+/, "")}`;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CourseStudentView({
  courseId,
  courseTitle,
  courseDescription,
  welcomeMessage,
  courseImage,
  facilitatorName,
  courseFormat = "WEEKLY",
  modules,
  assignments,
  announcements,
  quiz,
  progressPercent,
  completedLessonsCount,
  totalLessons,
  participantsCount,
  upcomingEvents,
  recentActivity,
  participants,
}: Props) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("announcements");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    announcements: true,
    assignments: true,
    quizzes: true,
    finalProject: true,
  });

  const nowMs = Date.now();
  const currentYear = new Date().getFullYear();

  const orderedAssignments = useMemo(
    () =>
      [...assignments].sort((a, b) => {
        const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
    [assignments]
  );

  const courseEventDates = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of upcomingEvents) {
      if (!event.dueAt) continue;
      const key = toDateKey(new Date(event.dueAt));
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [upcomingEvents]);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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

  const moduleLabel = courseFormat === "TOPICS" ? "Topic" : "Week";

  function openSection(sectionId: string) {
    setActiveSection(sectionId);
    if (typeof window !== "undefined") {
      const target = window.document.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileDrawerOpen(false);
  }

  function toggleSection(sectionId: string) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? true),
    }));
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[14px] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-4 py-2.5">
          <Link href="/" className="text-[15px] font-semibold text-slate-800">LMS</Link>
          <nav className="hidden items-center gap-4 text-[13px] text-slate-600 md:flex">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
            <Link href="/courses" className="hover:text-slate-900">My Courses</Link>
            <Link href={`/courses/${courseId}`} className="font-semibold text-slate-900">{courseTitle}</Link>
          </nav>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className="ms-auto rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] lg:hidden"
          >
            {mobileDrawerOpen ? "Close index" : "Course index"}
          </button>
          <button
            type="button"
            onClick={() => setDesktopDrawerOpen((prev) => !prev)}
            className="ms-auto hidden rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50 lg:inline-flex"
          >
            {desktopDrawerOpen ? "Hide course index" : "Show course index"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1360px] px-4 pt-4">
        <div className="text-[13px] text-slate-600">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">&gt;</span>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <span className="mx-2">&gt;</span>
          <Link href="/courses" className="hover:underline">My Courses</Link>
          <span className="mx-2">&gt;</span>
          <span className="text-slate-900">{courseTitle}</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12">
        <aside className={`${mobileDrawerOpen ? "block" : "hidden"} ${desktopDrawerOpen ? "lg:block" : "lg:hidden"} lg:col-span-3`}>
          <div className="sticky top-20 rounded border border-slate-200 bg-white p-3 shadow-sm">
            <h2 className="mb-3 text-[13px] font-semibold">Course Index</h2>
            <div className="space-y-1.5 text-[13px]">
              <button type="button" onClick={() => openSection("announcements")} className={`block w-full rounded px-2 py-1 text-left ${activeSection === "announcements" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}>
                Announcements
              </button>

              {modules.map((module, idx) => {
                const sectionId = `module-${module._id}`;
                return (
                  <button
                    key={module._id}
                    type="button"
                    onClick={() => openSection(sectionId)}
                    className={`block w-full rounded px-2 py-1 text-left ${activeSection === sectionId ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    {moduleLabel} {idx + 1}: {module.title}
                  </button>
                );
              })}

              <button type="button" onClick={() => openSection("assignments")} className={`block w-full rounded px-2 py-1 text-left ${activeSection === "assignments" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}>
                Assignments
              </button>
              <button type="button" onClick={() => openSection("quizzes")} className={`block w-full rounded px-2 py-1 text-left ${activeSection === "quizzes" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}>
                Quizzes
              </button>
              <Link href={`/courses/${courseId}/grades`} className="block rounded px-2 py-1 text-slate-700 hover:bg-slate-50">
                Grades
              </Link>
              <Link href={`/courses/${courseId}/participants`} className="block rounded px-2 py-1 text-slate-700 hover:bg-slate-50">
                Participants
              </Link>
            </div>
          </div>
        </aside>

        <main className={`space-y-4 ${desktopDrawerOpen ? "lg:col-span-6" : "lg:col-span-9"}`}>
          <section className="overflow-hidden rounded border border-slate-200 bg-white">
            {courseImage ? (
              <div className="h-36 w-full bg-cover bg-center" style={{ backgroundImage: `url(${courseImage})` }} />
            ) : (
              <div className="h-36 w-full bg-gradient-to-r from-sky-700 to-indigo-700" />
            )}
            <div className="space-y-2 p-4">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{courseTitle}</h1>
              <p className="text-sm text-slate-600">Lecturer: {facilitatorName}</p>
              <p className="text-sm text-slate-600">Semester: {currentYear}</p>
              {welcomeMessage && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Welcome Message</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-900">{welcomeMessage}</p>
                </div>
              )}
              <p className="text-sm text-slate-700">{courseDescription}</p>
            </div>
          </section>

          <section id="announcements" className="rounded border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() => toggleSection("announcements")}
              className="mb-2 flex w-full items-center justify-between text-left"
            >
              <h2 className="text-[16px] font-semibold">Announcements</h2>
              <span className="text-[12px] text-slate-500">{openSections.announcements ? "Hide" : "Show"}</span>
            </button>
            {!openSections.announcements ? null : announcements.length === 0 ? (
              <p className="text-[13px] text-slate-500">No announcements yet.</p>
            ) : (
              <ul className="space-y-2">
                {announcements.map((announcement) => (
                  <li key={announcement._id} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-[13px] font-semibold text-slate-900">{announcement.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-700">{announcement.message}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(announcement.createdAt).toLocaleString("en-ZA")}  {announcement.createdByName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {modules.map((module, idx) => (
            <section key={module._id} id={`module-${module._id}`} className="rounded border border-slate-200 bg-white p-3">
              <button
                type="button"
                onClick={() => toggleSection(`module-${module._id}`)}
                className="mb-2 flex w-full items-center justify-between text-left"
              >
                <h2 className="text-[16px] font-semibold">{moduleLabel} {idx + 1} – {module.title}</h2>
                <span className="text-[12px] text-slate-500">
                  {openSections[`module-${module._id}`] ?? true ? "Hide" : "Show"}
                </span>
              </button>
              {!(openSections[`module-${module._id}`] ?? true) ? null : module.lessons.length === 0 ? (
                <p className="text-[13px] text-slate-500">No learning materials added yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {module.lessons.map((lesson) => (
                    <li key={lesson._id} className="rounded border border-slate-200 p-2.5">
                      <p className="text-[13px] font-semibold text-slate-900">📂 {lesson.title}</p>
                      <div className="mt-1.5 space-y-1 pl-1 text-[12px]">
                        {lesson.content && <p className="text-slate-700">• Notes</p>}
                      {lesson.videoUrl && normalizeUrl(lesson.videoUrl) && (
                        <a
                          href={normalizeUrl(lesson.videoUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-[12px] text-blue-700 hover:underline"
                        >
                          • Video
                        </a>
                      )}
                      {(lesson.resources || []).map((resource, resourceIdx) => (
                        <div key={`${lesson._id}-${resourceIdx}`} className="mt-1 text-[12px] text-slate-700">
                          {resolveResourceUrl(resource) ? (
                            <a href={resolveResourceUrl(resource)} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                              • {resource.name || `${resourceKind(resource)} file`}
                            </a>
                          ) : (
                            <span>• {resource.name || `${resourceKind(resource)} file`}</span>
                          )}
                        </div>
                      ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="rounded border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() => toggleSection("finalProject")}
              className="mb-2 flex w-full items-center justify-between text-left"
            >
              <h2 className="text-[16px] font-semibold">Final Project</h2>
              <span className="text-[12px] text-slate-500">{openSections.finalProject ? "Hide" : "Show"}</span>
            </button>
            {!openSections.finalProject ? null : orderedAssignments.filter((item) => /project/i.test(item.title)).length === 0 ? (
              <p className="text-[13px] text-slate-500">No project description added yet.</p>
            ) : (
              <div className="space-y-2">
                {orderedAssignments
                  .filter((item) => /project/i.test(item.title))
                  .map((assignment) => (
                    <div key={`project-${assignment._id}`} className="rounded border border-slate-200 p-2.5">
                      <p className="text-[13px] font-semibold text-slate-900">• {assignment.title}</p>
                      {assignment.description && (
                        <p className="mt-1 text-[12px] text-slate-700">{assignment.description}</p>
                      )}
                      <Link href={`/courses/${courseId}/learn`} className="mt-1 inline-block text-[12px] text-blue-700 hover:underline">
                        Submission link
                      </Link>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section id="assignments" className="rounded border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() => toggleSection("assignments")}
              className="mb-2 flex w-full items-center justify-between text-left"
            >
              <h2 className="text-[16px] font-semibold">Assignments</h2>
              <span className="text-[12px] text-slate-500">{openSections.assignments ? "Hide" : "Show"}</span>
            </button>
            {!openSections.assignments ? null : orderedAssignments.length === 0 ? (
              <p className="text-[13px] text-slate-500">No assignments yet.</p>
            ) : (
              <div className="space-y-2">
                {orderedAssignments.map((assignment) => {
                  const overdue =
                    assignment.dueAt &&
                    new Date(assignment.dueAt).getTime() < nowMs &&
                    assignment.submissionStatus === "NOT_SUBMITTED";

                  return (
                    <div key={assignment._id} className="rounded border border-slate-200 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/courses/${courseId}/learn`} className="text-[13px] font-semibold text-blue-700 hover:underline">
                          {assignment.title}
                        </Link>
                        {overdue && <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">LATE</span>}
                      </div>
                      {assignment.description && <p className="mt-1 text-[12px] text-slate-700">{assignment.description}</p>}
                      {resolveAttachmentUrl(assignment.attachment) && (
                        <a
                          href={resolveAttachmentUrl(assignment.attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-[12px] text-blue-700 hover:underline"
                        >
                          {assignment.attachment?.name || "Assignment file"}
                        </a>
                      )}
                      <p className="mt-1 text-[11px] text-slate-500">
                        {assignment.dueAt ? `Due: ${new Date(assignment.dueAt).toLocaleDateString("en-ZA")}` : "No due date"}  {assignment.submissionStatus.replaceAll("_", " ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section id="quizzes" className="rounded border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() => toggleSection("quizzes")}
              className="mb-2 flex w-full items-center justify-between text-left"
            >
              <h2 className="text-[16px] font-semibold">Quizzes</h2>
              <span className="text-[12px] text-slate-500">{openSections.quizzes ? "Hide" : "Show"}</span>
            </button>
            {!openSections.quizzes ? null : quiz ? (
              <div className="rounded border border-slate-200 p-2.5">
                <Link href={`/courses/${courseId}/learn`} className="text-[13px] font-semibold text-blue-700 hover:underline">
                  {quiz.title}
                </Link>
                <p className="mt-1 text-[11px] text-slate-500">
                  {quiz.questionCount} questions  Attempts: {quiz.attemptsAllowed || 1}
                  {quiz.timeLimitMinutes ? `  ${quiz.timeLimitMinutes} min` : ""}
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">No quizzes yet.</p>
            )}
          </section>
        </main>

        <aside className="space-y-4 lg:col-span-3">
          <section className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-[13px] font-semibold">Upcoming Events</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-[12px] text-slate-500">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingEvents.slice(0, 8).map((item) => (
                  <div key={item._id} className="rounded border border-slate-200 bg-slate-50 p-2 text-[12px]">
                    <p className="font-medium">{item.title}</p>
                    {item.dueAt && <p>Due {new Date(item.dueAt).toLocaleDateString("en-ZA")}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">Calendar</h3>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                    )
                  }
                  className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
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
                  className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
            <p className="mb-2 text-[12px] text-slate-600">
              {calendarMonth.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="font-semibold text-slate-500">{day}</div>
              ))}
              {calendarDays.map((item, idx) => {
                if (!item) return <div key={`blank-${idx}`} className="h-7" />;
                const count = courseEventDates.get(item.key) || 0;
                return (
                  <div
                    key={item.key}
                    className={`flex h-7 items-center justify-center rounded border ${
                      count > 0
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                    title={count > 0 ? `${count} event(s)` : "No events"}
                  >
                    {item.day}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-[13px] font-semibold">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-[12px] text-slate-500">No recent activity.</p>
            ) : (
              <div className="space-y-1.5">
                {recentActivity.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded border border-slate-200 p-2 text-[12px]">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-slate-500">{item.detail}</p>
                    <p className="text-[10px] text-slate-400">{new Date(item.at).toLocaleString("en-ZA")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-[13px] font-semibold">Participants ({participantsCount})</h3>
            <div className="space-y-1.5">
              <div className="rounded border border-slate-200 bg-slate-50 p-2 text-[12px]">
                <p className="font-medium">{facilitatorName}</p>
                <p className="text-slate-500">Lecturer</p>
              </div>
              {participants.length === 0 ? (
                <p className="text-[12px] text-slate-500">Participant list unavailable.</p>
              ) : (
                participants.slice(0, 10).map((user) => (
                  <div key={user.id} className="rounded border border-slate-200 p-2 text-[12px]">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-slate-500">{user.role}</p>
                  </div>
                ))
              )}
              <Link href={`/courses/${courseId}/participants`} className="block text-[12px] text-blue-700 hover:underline">
                View all participants
              </Link>
            </div>
          </section>

          <section className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-[13px] font-semibold">Progress</h3>
            <div className="flex items-center justify-between text-[12px] text-slate-600">
              <span>{completedLessonsCount}/{totalLessons} items completed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progressPercent}%` }} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
