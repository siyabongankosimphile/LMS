"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import LogoutButton from "@/components/LogoutButton";
import DashboardMenu from "@/components/DashboardMenu";

type ToolName =
  | "grade"
  | "message"
  | "private-file"
  | "preference"
  | "filter"
  | "calendar";

function toolTitle(tool: ToolName) {
  if (tool === "grade") return "Grade";
  if (tool === "message") return "Message";
  if (tool === "private-file") return "Private File";
  if (tool === "preference") return "Preference";
  if (tool === "filter") return "Filter";
  return "Calendar";
}

export default function AdminToolPageClient({
  tool,
  pendingFacilitators,
}: {
  tool: ToolName;
  pendingFacilitators: number;
}) {
  const router = useRouter();

  const [gradeSearch, setGradeSearch] = useState("");

  const [question, setQuestion] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageReply, setMessageReply] = useState("");
  const [messageError, setMessageError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSummary, setImportSummary] = useState<
    | {
        created: number;
        updated: number;
        skipped: number;
        errors?: string[];
      }
    | null
  >(null);

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

    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const normalizedName = file.name.toLowerCase();
    const isAllowedSpreadsheet = allowedExtensions.some((extension) =>
      normalizedName.endsWith(extension)
    );

    if (!isAllowedSpreadsheet) {
      setUploadError("Please upload a spreadsheet file (.csv, .xlsx, .xls).");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("context", "admin-private-user-backups");

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

  async function handleUserImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setImportError("");
    setImportSummary(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("importFile") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setImportError("Please select a CSV backup file.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportError("Only CSV imports are currently supported.");
      return;
    }

    setImporting(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/users/import", {
        method: "POST",
        body,
      });

      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || "Import failed.");
        return;
      }

      setImportSummary({
        created: data.created || 0,
        updated: data.updated || 0,
        skipped: data.skipped || 0,
        errors: Array.isArray(data.errors) ? data.errors : [],
      });
      form.reset();
    } catch {
      setImportError("Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function savePreferences() {
    window.localStorage.setItem("admin_default_view", defaultAdminView);
    router.push(defaultAdminView);
  }

  return (
    <div className="dashboard-theme max-w-7xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{toolTitle(tool)}</h1>
          <p className="text-gray-500 dark:text-gray-400">Admin tool page</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardMenu
            items={[
              { label: "Admin Dashboard", href: "/admin" },
              { label: "Operations", href: "/admin/operations" },
              { label: "Certificates", href: "/admin/certificates" },
              { label: "Activity", href: "/admin/activity" },
              { label: "Grade", href: "/admin/tools/grade" },
              { label: "Message", href: "/admin/tools/message" },
              { label: "Private File", href: "/admin/tools/private-file" },
              { label: "Preference", href: "/admin/tools/preference" },
              { label: "Filter", href: "/admin/tools/filter" },
              { label: "Calendar", href: "/admin/tools/calendar" },
              { label: "Users", href: "/admin/users" },
              { label: "Facilitators", href: "/admin/facilitators" },
            ]}
          />
          <DarkModeToggle />
          <LogoutButton />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        {tool === "grade" && (
          <>
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
          </>
        )}

        {tool === "message" && (
          <>
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
          </>
        )}

        {tool === "private-file" && (
          <>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-300">
              Upload user-details backup spreadsheets for recovery if the system is down.
            </p>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Allowed formats: .csv, .xlsx, .xls
            </p>
            <form onSubmit={handlePrivateUpload} className="space-y-2">
              <input
                name="privateFile"
                type="file"
                accept=".csv,.xlsx,.xls"
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
            <a
              href="/api/admin/reports/students"
              className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Download current student details as CSV
            </a>

            <div className="mt-5 border-t border-gray-200 pt-4 dark:border-slate-700">
              <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Import user backup CSV
              </p>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Use this to restore student records if the system was down.
              </p>
              <form onSubmit={handleUserImport} className="space-y-2">
                <input
                  name="importFile"
                  type="file"
                  accept=".csv"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={importing}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Import Users"}
                </button>
              </form>
              {importError && <p className="mt-2 text-sm text-red-600">{importError}</p>}
              {importSummary && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <p>
                    Created: {importSummary.created} | Updated: {importSummary.updated} | Skipped: {importSummary.skipped}
                  </p>
                  {importSummary.errors && importSummary.errors.length > 0 && (
                    <ul className="mt-2 list-disc pl-4 text-xs">
                      {importSummary.errors.slice(0, 5).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
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
          </>
        )}

        {tool === "preference" && (
          <>
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
                <option value="/admin/tools/grade">Grade</option>
                <option value="/admin/tools/message">Message</option>
                <option value="/admin/tools/private-file">Private File</option>
                <option value="/admin/tools/filter">Filter</option>
                <option value="/admin/tools/calendar">Calendar</option>
              </select>
              <button
                type="button"
                onClick={savePreferences}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          </>
        )}

        {tool === "filter" && (
          <>
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
          </>
        )}

        {tool === "calendar" && (
          <>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-300">Track an admin date for planning and reviews.</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Selected: {formattedSelectedDate}</p>
          </>
        )}
      </div>
    </div>
  );
}
