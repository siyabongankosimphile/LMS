"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AdminToolsPanelProps = {
  pendingFacilitators: number;
};

export default function AdminToolsPanel({ pendingFacilitators }: AdminToolsPanelProps) {
  const router = useRouter();

  const [gradeSearch, setGradeSearch] = useState("");

  const [question, setQuestion] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageReply, setMessageReply] = useState("");
  const [messageError, setMessageError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  const [defaultAdminView, setDefaultAdminView] = useState("/admin");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const savedView = window.localStorage.getItem("admin_default_view");
    if (savedView) {
      setDefaultAdminView(savedView);
    }
  }, []);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return "No date selected";
    return new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  function goToGrades() {
    const search = gradeSearch.trim();
    const href = search
      ? `/admin/users?q=${encodeURIComponent(search)}`
      : "/admin/users";
    router.push(href);
  }

  async function handleAskMessageAssistant(e: React.FormEvent) {
    e.preventDefault();
    setMessageReply("");
    setMessageError("");

    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setMessageError("Please type a message first.");
      return;
    }

    setMessageLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, history: [] }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessageError(data.error || "Failed to send message.");
        return;
      }

      setMessageReply(data.answer || "No reply returned.");
    } catch {
      setMessageError("Failed to send message.");
    } finally {
      setMessageLoading(false);
    }
  }

  async function handlePrivateUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    setUploadedFileUrl("");

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("privateFile") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setUploadError("Please select a file.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("context", "admin-private");

      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed.");
        return;
      }

      setUploadedFileUrl(data.url || "");
      form.reset();
    } catch {
      setUploadError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function savePreferences() {
    window.localStorage.setItem("admin_default_view", defaultAdminView);
    router.push(defaultAdminView);
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div id="grade" className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Grade</h3>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-300">Search a student to open grade/progress details.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={gradeSearch}
            onChange={(e) => setGradeSearch(e.target.value)}
            placeholder="Name, surname, ID number"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={goToGrades}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open
          </button>
        </div>
      </div>

      <div id="message" className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Message</h3>
        <form onSubmit={handleAskMessageAssistant} className="space-y-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Type an admin message/question"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={messageLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {messageLoading ? "Sending..." : "Send"}
          </button>
        </form>
        {messageError && <p className="mt-2 text-sm text-red-600">{messageError}</p>}
        {messageReply && <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{messageReply}</p>}
      </div>

      <div id="private-file" className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Private File</h3>
        <form onSubmit={handlePrivateUpload} className="space-y-2">
          <input
            name="privateFile"
            type="file"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        {uploadedFileUrl && (
          <a
            href={uploadedFileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Open uploaded file
          </a>
        )}
      </div>

      <div id="preference" className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Preference</h3>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-300">Set your default admin landing page.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={defaultAdminView}
            onChange={(e) => setDefaultAdminView(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="/admin">Admin Dashboard</option>
            <option value="/admin/users">Users</option>
            <option value="/admin/facilitators">Facilitators</option>
          </select>
          <button
            type="button"
            onClick={savePreferences}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save
          </button>
        </div>
      </div>

      <div id="filter" className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Filter</h3>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-300">Quick filters for common admin views.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users?q=student" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700">
            Students
          </Link>
          <Link href="/admin/users?q=active" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700">
            Active
          </Link>
          <Link href="/admin/facilitators?q=pending" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700">
            Pending Facilitators ({pendingFacilitators})
          </Link>
          <Link href="/admin/users" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700">
            Clear
          </Link>
        </div>
      </div>

      <div id="calendar" className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Calendar</h3>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-300">Track an admin date for planning and reviews.</p>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Selected: {formattedSelectedDate}</p>
      </div>
    </div>
  );
}
