"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

type PrivateFileItem = {
  _id: string;
  name: string;
  url: string;
  key: string;
  contentType?: string;
  size?: number;
  createdAt: string;
};

type Props = {
  courses: CourseOverviewItem[];
  timeline: TimelineItem[];
  badges: BadgeItem[];
};

type CourseFilter = "IN_PROGRESS" | "FUTURE" | "PAST" | "STARRED";

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatBytes(size?: number): string {
  if (!size || size <= 0) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentDashboardClient({ courses, timeline, badges }: Props) {
  const [activeFilter, setActiveFilter] = useState<CourseFilter>("IN_PROGRESS");
  const [starredCourseIds, setStarredCourseIds] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey(new Date()));

  const [privateFiles, setPrivateFiles] = useState<PrivateFileItem[]>([]);
  const [privateFilesLoading, setPrivateFilesLoading] = useState(true);
  const [uploadingPrivateFile, setUploadingPrivateFile] = useState(false);
  const [privateFileError, setPrivateFileError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "student_starred_courses";
    const raw = window.localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        setStarredCourseIds(Array.isArray(parsed) ? parsed : []);
      } catch {
        setStarredCourseIds([]);
      }
    }

    const loadPrivateFiles = async () => {
      const res = await fetch("/api/private-files");
      if (!res.ok) {
        setPrivateFilesLoading(false);
        return;
      }
      const data = await res.json();
      setPrivateFiles(data.files || []);
      setPrivateFilesLoading(false);
    };

    loadPrivateFiles();
  }, []);

  function persistStars(next: string[]) {
    setStarredCourseIds(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("student_starred_courses", JSON.stringify(next));
    }
  }

  function toggleStar(courseId: string) {
    const exists = starredCourseIds.includes(courseId);
    if (exists) {
      persistStars(starredCourseIds.filter((id) => id !== courseId));
      return;
    }
    persistStars([...starredCourseIds, courseId]);
  }

  const upcomingTimeline = useMemo(
    () => {
      const nowMs = Date.now();
      return (
      timeline
        .filter((item) => new Date(item.dueAt).getTime() >= nowMs)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      );
    },
    [timeline]
  );

  const coursesByFilter = useMemo(() => {
    if (activeFilter === "STARRED") {
      return courses.filter((item) => starredCourseIds.includes(item.courseId));
    }

    if (activeFilter === "PAST") {
      return courses.filter((item) => item.completed);
    }

    if (activeFilter === "FUTURE") {
      return courses.filter((item) => !item.completed && item.progressPercent === 0);
    }

    return courses.filter((item) => !item.completed && item.progressPercent > 0);
  }, [activeFilter, courses, starredCourseIds]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const item of timeline) {
      const key = toDateKey(new Date(item.dueAt));
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [timeline]);

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

  const selectedDateEvents = eventsByDate.get(selectedDateKey) || [];

  function isOverdue(item: TimelineItem): boolean {
    return (
      new Date(item.dueAt).getTime() < Date.now() &&
      item.submissionStatus === "NOT_SUBMITTED"
    );
  }

  function hasOverdueOnDate(dateKey: string): boolean {
    const items = eventsByDate.get(dateKey) || [];
    return items.some((item) => isOverdue(item));
  }

  async function uploadPrivateFile(file: File) {
    setPrivateFileError("");
    setUploadingPrivateFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "student-private");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        setPrivateFileError("Upload failed.");
        return;
      }

      const uploadData = await uploadRes.json();

      const createRes = await fetch("/api/private-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadData.name,
          url: uploadData.url,
          key: uploadData.key,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!createRes.ok) {
        setPrivateFileError("Failed to save file metadata.");
        return;
      }

      const created = await createRes.json();
      setPrivateFiles((prev) => [created, ...prev]);
    } finally {
      setUploadingPrivateFile(false);
    }
  }

  async function removePrivateFile(id: string) {
    const res = await fetch(`/api/private-files/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setPrivateFiles((prev) => prev.filter((file) => file._id !== id));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h2>
          {upcomingTimeline.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No upcoming deadlines.</p>
          ) : (
            <div className="space-y-3">
              {upcomingTimeline.slice(0, 8).map((item) => (
                <div key={item.assignmentId} className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/courses/${item.courseId}/learn`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline break-words">
                      {item.courseTitle}
                    </Link>
                    <div className="flex items-center gap-2">
                      {isOverdue(item) && (
                        <span className="rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-2 py-0.5 text-[10px] font-semibold">
                          OVERDUE
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-300">
                        Due {new Date(item.dueAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{item.assignmentTitle}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Course Overview</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "IN_PROGRESS", label: "In progress" },
                { key: "FUTURE", label: "Future" },
                { key: "PAST", label: "Past" },
                { key: "STARRED", label: "Starred" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveFilter(item.key as CourseFilter)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    activeFilter === item.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-200 border-gray-300 dark:border-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {coursesByFilter.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No courses in this view.</p>
          ) : (
            <div className="space-y-3">
              {coursesByFilter.map((item) => (
                <div key={item.enrollmentId} className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <Link href={`/courses/${item.courseId}/learn`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline break-words">
                      {item.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleStar(item.courseId)}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {starredCourseIds.includes(item.courseId) ? "★ Starred" : "☆ Star"}
                    </button>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-300 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
                    <span>{item.completed ? "Completed" : `${item.progressPercent}% progress`}</span>
                    {typeof item.quizScore === "number" && <span>Grade: {item.quizScore}%</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                  )
                }
                className="rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 px-2 py-1 text-xs"
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
                className="rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 px-2 py-1 text-xs"
              >
                Next
              </button>
            </div>
          </div>

          <p className="mb-2 text-xs text-gray-500 dark:text-gray-300">
            {calendarMonth.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
          </p>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500 dark:text-gray-300 mb-1">
            {"SMTWTFS".split("").map((day, index) => (
              <div key={`${day}-${index}`}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((entry, idx) => {
              if (!entry) {
                return <div key={`empty-${idx}`} className="h-8 rounded" />;
              }

              const eventsCount = (eventsByDate.get(entry.key) || []).length;
              const selected = selectedDateKey === entry.key;
              const overdueOnDate = hasOverdueOnDate(entry.key);

              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setSelectedDateKey(entry.key)}
                  className={`h-8 rounded text-xs relative ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {entry.day}
                  {eventsCount > 0 && (
                    <span
                      className={`absolute bottom-0.5 right-0.5 inline-flex h-1.5 w-1.5 rounded-full ${
                        overdueOnDate ? "bg-red-600" : "bg-rose-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-100 mb-1">
              Due on {selectedDateKey}
            </p>
            {selectedDateEvents.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-300">Nothing due.</p>
            ) : (
              <ul className="space-y-1">
                {selectedDateEvents.map((event) => (
                  <li key={event.assignmentId} className="text-xs text-gray-700 dark:text-gray-200 flex flex-wrap items-center gap-1">
                    <span className="break-words">{event.courseTitle}: {event.assignmentTitle}</span>
                    {isOverdue(event) && (
                      <span className="rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-1.5 py-0.5 text-[10px] font-semibold">
                        OVERDUE
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Latest Badges</h2>
          {badges.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">No badges yet.</p>
          ) : (
            <div className="space-y-2">
              {badges.slice(0, 4).map((badge) => (
                <a
                  key={badge.id}
                  href={badge.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2"
                >
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-200">🏅 {badge.label}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-300">
                    {new Date(badge.issuedAt).toLocaleDateString("en-ZA")}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Private Files</h2>
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-2">
            Upload a private file
          </label>
          <input
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadPrivateFile(file);
              event.currentTarget.value = "";
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          />
          {uploadingPrivateFile && <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">Uploading...</p>}
          {privateFileError && <p className="mt-2 text-xs text-red-600">{privateFileError}</p>}

          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {privateFilesLoading ? (
              <p className="text-xs text-gray-500 dark:text-gray-300">Loading files...</p>
            ) : privateFiles.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-300">No private files yet.</p>
            ) : (
              privateFiles.map((file) => (
                <div key={file._id} className="rounded-lg border border-gray-200 dark:border-slate-700 p-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {file.name}
                  </a>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-300">
                    <span>{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removePrivateFile(file._id)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
