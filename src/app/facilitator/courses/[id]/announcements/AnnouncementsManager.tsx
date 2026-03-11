"use client";

import { useCallback, useEffect, useState } from "react";

type Announcement = {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  createdBy?: { name?: string; surname?: string };
};

export default function AnnouncementsManager({ courseId }: { courseId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [createMsg, setCreateMsg] = useState("");
  const [createError, setCreateError] = useState("");

  const loadAnnouncements = useCallback(async () => {
    const res = await fetch(`/api/facilitator/courses/${courseId}/announcements`);
    if (!res.ok) return;
    const data = await res.json();
    setAnnouncements(data.announcements || []);
  }, [courseId]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setCreateMsg("");
    setCreateError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/facilitator/courses/${courseId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error || "Failed to post announcement.");
        return;
      }
      setTitle("");
      setMessage("");
      setShowCreateForm(false);
      setCreateMsg("Announcement posted successfully.");
      await loadAnnouncements();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Announcement</h2>
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            {showCreateForm ? "Close form" : "Create announcement"}
          </button>
        </div>
        {createError && (
          <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {createError}
          </p>
        )}
        {createMsg && (
          <p className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {createMsg}
          </p>
        )}
        {showCreateForm ? (
          <form onSubmit={createAnnouncement}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Message for students"
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Posting..." : "Post Announcement"}
        </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Form closed. Use &quot;Create announcement&quot; when you want to post another one.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-300">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="rounded-lg border border-gray-200 p-3 dark:border-slate-700">
                <p className="font-medium text-gray-900 dark:text-white">{announcement.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{announcement.message}</p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
                  {new Date(announcement.createdAt).toLocaleString("en-ZA")} • {(announcement.createdBy?.name || "User")} {(announcement.createdBy?.surname || "")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
