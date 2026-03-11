"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CourseEditor from "./CourseEditor";

type Lesson = {
  _id: string;
  title: string;
  module: string;
  videoUrl?: string;
  resources?: Array<{ name?: string; url?: string; key?: string; type?: string }>;
};

type Module = {
  _id: string;
  title: string;
};

type Assignment = {
  _id: string;
  title: string;
  dueAt?: string;
};

type Announcement = {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  createdBy?: { name?: string; surname?: string };
};

type Quiz = {
  _id: string;
  title: string;
  questions: Array<unknown>;
  attemptsAllowed?: number;
};

type Course = {
  _id: string;
  title: string;
  description: string;
  format?: "TOPICS" | "WEEKLY" | "GRID";
  published: boolean;
  passMarkPercent: number;
  enrollmentKeyHash: string;
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

export default function FacilitatorCourseShell({
  courseId,
  course,
  modules,
  lessons,
  quiz,
  assignments,
  announcements,
  upcomingEvents,
  recentActivity,
  participants,
  participantsCount,
  showCreatedNotice = false,
}: {
  courseId: string;
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  quiz: Quiz | null;
  assignments: Assignment[];
  announcements: Announcement[];
  upcomingEvents: Assignment[];
  recentActivity: ActivityItem[];
  participants: ParticipantItem[];
  participantsCount: number;
  showCreatedNotice?: boolean;
}) {
  const [editingOn, setEditingOn] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("announcements");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    announcements: true,
    assignments: true,
    quizzes: true,
    finalProject: true,
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
  });
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const normalizeUrl = (raw?: string) => {
    const value = String(raw || "").trim();
    if (!value) return "";
    if (/^(https?:|mailto:|tel:|\/)/i.test(value)) return value;
    return `https://${value}`;
  };

  const resolveResourceUrl = (resource?: { url?: string; key?: string }) => {
    const url = normalizeUrl(resource?.url);
    if (url) return url;
    const key = String(resource?.key || "").trim();
    if (!key) return "";
    return `/uploads/${key.replace(/^\/+/, "")}`;
  };

  const courseFormat = course.format || "WEEKLY";
  const moduleLabel = courseFormat === "TOPICS" ? "Topic" : "Week";

  const sortedAssignments = [...assignments].sort((a, b) => {
    const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  const eventDateCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of upcomingEvents) {
      if (!event.dueAt) continue;
      const date = new Date(event.dueAt);
      const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [upcomingEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const event of upcomingEvents) {
      if (!event.dueAt) continue;
      const date = new Date(event.dueAt);
      const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [upcomingEvents]);

  const selectedDateEvents = eventsByDate.get(selectedDateKey) || [];

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
    const key = `${calendarMonth.getFullYear()}-${`${calendarMonth.getMonth() + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
    calendarDays.push({ day, key });
  }

  function openSection(sectionId: string) {
    setActiveSection(sectionId);
    if (typeof window !== "undefined") {
      const target = window.document.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setDrawerOpen(false);
  }

  function toggleSection(sectionId: string) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? true),
    }));
  }

  if (editingOn) {
    return (
      <div className="space-y-4">
        {showCreatedNotice && (
          <div className="mx-auto max-w-5xl px-4 pt-4">
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
              Course created successfully.
            </div>
          </div>
        )}
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-emerald-700">Editing mode is ON</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link href={`/facilitator/courses/${courseId}/participants`} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                Participants
              </Link>
              <Link href={`/facilitator/courses/${courseId}/announcements`} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                Announcements
              </Link>
              <Link href={`/facilitator/courses/${courseId}/gradebook`} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                Gradebook setup
              </Link>
              <Link href={`/facilitator/courses/${courseId}/reports`} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                Reports
              </Link>
              <button
                type="button"
                onClick={() => setEditingOn(false)}
                className="rounded-lg border border-emerald-400 bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-200"
              >
                Turn editing OFF
              </button>
            </div>
          </div>
        </div>
        <CourseEditor
          courseId={courseId}
          course={course}
          modules={modules}
          lessons={lessons as Array<{
            _id: string;
            title: string;
            videoUrl?: string;
            content?: string;
            module: string;
            resources?: Array<{
              name: string;
              type: "file" | "link";
              url: string;
              key?: string;
            }>;
          }>}
          quiz={quiz as {
            _id: string;
            title: string;
            description?: string;
            questions: Array<{
              type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "MATCHING" | "ESSAY";
              name?: string;
              question: string;
              marks: number;
              options?: string[];
              correctIndex?: number;
              acceptedAnswers?: string[];
              matchingPairs?: Array<{ left: string; right: string }>;
              selfMarkingGuidance?: string;
              feedback?: string;
            }>;
            passMarkPercent: number;
            openAt?: string;
            closeAt?: string;
            timeLimitMinutes?: number;
            gradeCategory?: string;
            attemptsAllowed?: number;
            questionsPerPage?: number;
            reviewOptions?: {
              showMarks?: boolean;
              showCorrectAnswers?: boolean;
              showFeedback?: boolean;
            };
          } | null}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[14px] text-slate-900">
      {showCreatedNotice && (
        <div className="mx-auto max-w-[1360px] px-4 pt-4">
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
            Course created successfully.
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-4 py-2.5">
          <Link href="/" className="text-[15px] font-semibold text-slate-800">LMS</Link>
          <nav className="hidden items-center gap-4 text-[13px] text-slate-600 md:flex">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/facilitator" className="hover:text-slate-900">Facilitator</Link>
            <Link href={`/facilitator/courses/${courseId}`} className="font-semibold text-slate-900">{course.title}</Link>
          </nav>
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="ms-auto rounded border border-slate-300 bg-white px-3 py-1.5 text-[13px] lg:hidden"
          >
            Course index
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1360px] px-4 pt-4">
        <div className="text-[13px] text-slate-600">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">&gt;</span>
          <Link href="/facilitator" className="hover:underline">Facilitator</Link>
          <span className="mx-2">&gt;</span>
          <span className="text-slate-900">{course.title}</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12">
        <aside className={`${drawerOpen ? "block" : "hidden"} lg:col-span-3 lg:block`}>
          <div className="sticky top-20 rounded border border-slate-200 bg-white p-3 shadow-sm">
            <h2 className="mb-3 text-[13px] font-semibold">Course Index</h2>
            <div className="space-y-1.5 text-[13px]">
              <button type="button" onClick={() => openSection("announcements")} className={`block w-full rounded px-2 py-1 text-left ${activeSection === "announcements" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}>
                Announcements
              </button>
              {modules.map((module, idx) => {
                const sectionId = `module-${module._id}`;
                return (
                  <button
                    key={module._id}
                    type="button"
                    onClick={() => openSection(sectionId)}
                    className={`block w-full rounded px-2 py-1 text-left ${activeSection === sectionId ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    {moduleLabel} {idx + 1}: {module.title}
                  </button>
                );
              })}
              <button type="button" onClick={() => openSection("assignments")} className={`block w-full rounded px-2 py-1 text-left ${activeSection === "assignments" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}>
                Assignments
              </button>
              <button type="button" onClick={() => openSection("quizzes")} className={`block w-full rounded px-2 py-1 text-left ${activeSection === "quizzes" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}>
                Quizzes
              </button>
              <Link href={`/facilitator/courses/${courseId}/participants`} className="block rounded px-2 py-1 text-slate-700 hover:bg-slate-50">
                Participants
              </Link>
              <Link href={`/facilitator/courses/${courseId}/announcements`} className="block rounded px-2 py-1 text-slate-700 hover:bg-slate-50">
                Manage announcements
              </Link>
              <Link href={`/facilitator/courses/${courseId}/assignments`} className="block rounded px-2 py-1 text-slate-700 hover:bg-slate-50">
                Manage assignments
              </Link>
              <Link href={`/facilitator/courses/${courseId}/reports`} className="block rounded px-2 py-1 text-slate-700 hover:bg-slate-50">
                Reports
              </Link>
            </div>
          </div>
        </aside>

        <main className="space-y-4 lg:col-span-6">
          <section className="overflow-hidden rounded border border-slate-200 bg-white">
            <div className="h-28 w-full bg-gradient-to-r from-emerald-700 to-teal-700" />
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">{course.title}</h1>
                  <p className="text-sm text-slate-600">Preview mode with facilitator controls</p>
                  <p className="text-sm text-slate-700">{course.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOn(true)}
                  className="rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
                >
                  Turn editing ON
                </button>
              </div>
            </div>
          </section>

          <section id="announcements" className="rounded border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleSection("announcements")}
                className="flex items-center gap-2 text-left"
              >
                <h2 className="text-[16px] font-semibold">Announcements</h2>
                <span className="text-[12px] text-slate-500">{openSections.announcements ? "Hide" : "Show"}</span>
              </button>
              <Link href={`/facilitator/courses/${courseId}/announcements`} className="text-[12px] text-emerald-700 hover:underline">
                Manage
              </Link>
            </div>
            {!openSections.announcements ? null : announcements.length === 0 ? (
              <p className="text-[13px] text-slate-500">No announcements yet.</p>
            ) : (
              <div className="space-y-2">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-[13px] font-semibold text-slate-900">{announcement.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-700">{announcement.message}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(announcement.createdAt).toLocaleString("en-ZA")}  {(announcement.createdBy?.name || "User")} {(announcement.createdBy?.surname || "")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {modules.map((module, idx) => {
            const moduleLessons = lessons.filter(
              (lesson) => String(lesson.module) === String(module._id)
            );
            return (
              <section key={module._id} id={`module-${module._id}`} className="rounded border border-slate-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => toggleSection(`module-${module._id}`)}
                  className="mb-2 flex w-full items-center justify-between text-left"
                >
                  <h2 className="text-[16px] font-semibold">{moduleLabel} {idx + 1} – {module.title}</h2>
                  <span className="text-[12px] text-slate-500">{openSections[`module-${module._id}`] ?? true ? "Hide" : "Show"}</span>
                </button>
                {!(openSections[`module-${module._id}`] ?? true) ? null : moduleLessons.length === 0 ? (
                  <p className="text-[13px] text-slate-500">No lesson content in this folder yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {moduleLessons.map((lesson) => (
                      <div key={lesson._id} className="rounded border border-slate-200 p-2.5">
                        <p className="text-[13px] font-semibold text-slate-900">• {lesson.title}</p>
                        {lesson.videoUrl && normalizeUrl(lesson.videoUrl) && (
                          <a
                            href={normalizeUrl(lesson.videoUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block text-[12px] text-emerald-700 hover:underline"
                          >
                            Video lecture
                          </a>
                        )}
                        {(lesson.resources || []).length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {(lesson.resources || []).map((resource, resourceIndex) => {
                              const href = resolveResourceUrl(resource);
                              return (
                                <a
                                  key={`${lesson._id}-${resource.url || resource.name || resourceIndex}`}
                                  href={href || "#"}
                                  target={href ? "_blank" : undefined}
                                  rel={href ? "noopener noreferrer" : undefined}
                                  className="block text-[12px] text-emerald-700 hover:underline"
                                >
                                  • {resource.name || "Resource"}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          <section className="rounded border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() => toggleSection("finalProject")}
              className="mb-2 flex w-full items-center justify-between text-left"
            >
              <h2 className="text-[16px] font-semibold">Final Project</h2>
              <span className="text-[12px] text-slate-500">{openSections.finalProject ? "Hide" : "Show"}</span>
            </button>
            {!openSections.finalProject ? null : sortedAssignments.filter((item) => /project/i.test(item.title)).length === 0 ? (
              <p className="text-[13px] text-slate-500">No project description added yet.</p>
            ) : (
              <div className="space-y-2">
                {sortedAssignments
                  .filter((item) => /project/i.test(item.title))
                  .map((assignment) => (
                    <div key={`project-${assignment._id}`} className="rounded border border-slate-200 p-2.5">
                      <p className="text-[13px] font-semibold text-slate-900">• {assignment.title}</p>
                      <Link href={`/facilitator/courses/${courseId}/assignments`} className="mt-1 inline-block text-[12px] text-emerald-700 hover:underline">
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
            {!openSections.assignments ? null : sortedAssignments.length === 0 ? (
              <p className="text-[13px] text-slate-500">No assignments yet.</p>
            ) : (
              <div className="space-y-2">
                {sortedAssignments.map((assignment) => (
                  <div key={assignment._id} className="rounded border border-slate-200 p-2.5">
                    <p className="text-[13px] font-semibold text-slate-900">{assignment.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {assignment.dueAt
                        ? `Due: ${new Date(assignment.dueAt).toLocaleDateString("en-ZA")}`
                        : "No due date"}
                    </p>
                  </div>
                ))}
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
                <p className="text-[13px] font-semibold text-slate-900">{quiz.title}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {quiz.questions.length} questions  Attempts: {quiz.attemptsAllowed || 1}
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">No quiz created yet.</p>
            )}
          </section>
        </main>

        <aside className="space-y-4 lg:col-span-3">
          <section className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-[13px] font-semibold">Facilitator Actions</h3>
            <div className="space-y-1.5 text-[12px]">
              <Link href={`/facilitator/courses/${courseId}/gradebook`} className="block rounded border border-slate-200 px-2 py-1.5 text-slate-700 hover:bg-slate-50">
                Gradebook setup
              </Link>
              <Link href={`/facilitator/courses/${courseId}/participants`} className="block rounded border border-slate-200 px-2 py-1.5 text-slate-700 hover:bg-slate-50">
                Participants
              </Link>
              <Link href={`/facilitator/courses/${courseId}/reports`} className="block rounded border border-slate-200 px-2 py-1.5 text-slate-700 hover:bg-slate-50">
                Reports
              </Link>
            </div>
          </section>

          <section className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-[13px] font-semibold">Course Snapshot</h3>
            <div className="space-y-1 text-[12px] text-slate-700">
              <p>Modules: {modules.length}</p>
              <p>Lessons: {lessons.length}</p>
              <p>Assignments: {assignments.length}</p>
              <p>Announcements: {announcements.length}</p>
              <p>Participants: {participantsCount}</p>
              <p>Status: {course.published ? "Published" : "Draft"}</p>
            </div>
          </section>

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
              {calendarMonth.toLocaleString("en-ZA", { month: "long", year: "numeric" })}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
              {"SMTWTFS".split("").map((d, index) => (
                <span key={`${d}-${index}`} className="py-1">{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarDays.map((dayObj, idx) => {
                if (!dayObj) return <div key={`blank-${idx}`} className="h-8 rounded" />;
                const count = eventDateCounts.get(dayObj.key) || 0;
                return (
                  <button
                    key={dayObj.key}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(dayObj.key);
                      setCalendarDrawerOpen(true);
                    }}
                    className={`h-8 rounded border px-1 py-1 text-[10px] ${count > 0 ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{dayObj.day}</span>
                      {count > 0 && <span className="rounded bg-emerald-600 px-1 text-[9px] text-white">{count}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-[13px] font-semibold">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-[12px] text-slate-500">No recent activity yet.</p>
            ) : (
              <div className="space-y-1.5">
                {recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-[12px]">
                    <p className="font-medium">{activity.label}</p>
                    <p className="text-slate-700">{activity.detail}</p>
                    <p className="text-slate-500">{new Date(activity.at).toLocaleString("en-ZA")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-[13px] font-semibold">Participants</h3>
            {participants.length === 0 ? (
              <p className="text-[12px] text-slate-500">No active participants in the last 15 minutes.</p>
            ) : (
              <div className="space-y-1.5">
                {participants.slice(0, 10).map((participant) => (
                  <div key={participant.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-[12px]">
                    <p className="font-medium text-slate-800">{participant.name}</p>
                    <p className="text-slate-500">{participant.role}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {calendarDrawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Schedule for {selectedDateKey}</h3>
              <button
                type="button"
                onClick={() => setCalendarDrawerOpen(false)}
                className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No scheduled activities for this date.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((item) => (
                  <Link
                    key={item._id}
                    href={`/facilitator/courses/${courseId}/assignments`}
                    className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.dueAt
                        ? `Due ${new Date(item.dueAt).toLocaleString("en-ZA")}`
                        : "No due date"}
                    </p>
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
