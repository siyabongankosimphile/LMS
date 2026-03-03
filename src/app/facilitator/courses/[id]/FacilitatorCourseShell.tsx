"use client";

import Link from "next/link";
import { useState } from "react";
import CourseEditor from "./CourseEditor";

type Lesson = {
  _id: string;
  title: string;
  module: string;
  videoUrl?: string;
  resources?: Array<{ name?: string; url?: string; type?: string }>;
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
  published: boolean;
  passMarkPercent: number;
  enrollmentKeyHash: string;
};

export default function FacilitatorCourseShell({
  courseId,
  course,
  modules,
  lessons,
  quiz,
  assignments,
}: {
  courseId: string;
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  quiz: Quiz | null;
  assignments: Assignment[];
}) {
  const [editingOn, setEditingOn] = useState(true);

  if (editingOn) {
    return (
      <div className="space-y-4">
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-emerald-700">Editing mode is ON</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link href={`/facilitator/courses/${courseId}/participants`} className="text-xs text-blue-700 hover:underline">
                Participants
              </Link>
              <Link href={`/facilitator/courses/${courseId}/gradebook`} className="text-xs text-blue-700 hover:underline">
                Gradebook setup
              </Link>
              <Link href={`/facilitator/courses/${courseId}/reports`} className="text-xs text-blue-700 hover:underline">
                Reports
              </Link>
              <button
                type="button"
                onClick={() => setEditingOn(false)}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700"
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
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-xs text-gray-500">Student preview mode</p>
        </div>
        <button
          type="button"
          onClick={() => setEditingOn(true)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Turn editing ON
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 h-fit">
          <p className="text-sm font-semibold text-gray-800">Administration</p>
          <Link href={`/facilitator/courses/${courseId}`} className="block text-sm text-blue-600 hover:underline">Course settings</Link>
          <Link href={`/facilitator/courses/${courseId}/assignments`} className="block text-sm text-blue-600 hover:underline">Assignments</Link>
          <Link href={`/facilitator/courses/${courseId}/participants`} className="block text-sm text-blue-600 hover:underline">Participants</Link>
          <Link href={`/facilitator/courses/${courseId}/gradebook`} className="block text-sm text-blue-600 hover:underline">Gradebook setup</Link>
          <Link href={`/facilitator/courses/${courseId}/reports`} className="block text-sm text-blue-600 hover:underline">Reports</Link>
        </aside>

        <main className="lg:col-span-2 space-y-4">
          {modules.map((module, idx) => (
            <section key={module._id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
                <p className="text-sm font-semibold text-gray-800">Section {idx + 1}: {module.title}</p>
                <span className="text-xs text-gray-500">Read-only preview</span>
              </div>
              <div className="p-3 space-y-2">
                {lessons
                  .filter((lesson) => String(lesson.module) === String(module._id))
                  .map((lesson) => (
                    <div key={lesson._id} className="rounded-lg border border-gray-100 px-3 py-2">
                      <p className="text-sm text-gray-800">📘 {lesson.title}</p>
                      {lesson.videoUrl && <p className="text-xs text-gray-500">Video link available</p>}
                    </div>
                  ))}
                <div className="rounded-lg border border-dashed border-blue-300 px-3 py-2 text-xs text-blue-700">
                  ➕ Add an activity or resource
                </div>
              </div>
            </section>
          ))}

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Activities summary</p>
            <div className="space-y-1 text-sm text-gray-700">
              {assignments.map((assignment) => (
                <p key={assignment._id} className="break-words">📝 {assignment.title}{assignment.dueAt ? ` • due ${new Date(assignment.dueAt).toLocaleDateString()}` : ""}</p>
              ))}
              {quiz && (
                <p className="break-words">❓ {quiz.title} • {quiz.questions.length} questions • attempts {quiz.attemptsAllowed || 1}</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
