"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  type: "ANNOUNCEMENT" | "FORUM_REPLY" | "GRADED";
  title: string;
  detail: string;
  at: string;
  href: string;
};

export default function MessagesClient({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  useEffect(() => {
    const loadReadState = async () => {
      const res = await fetch("/api/dashboard/notifications/read-state");
      if (!res.ok) return;
      const data = await res.json();
      setReadIds(Array.isArray(data.readIds) ? data.readIds : []);
    };

    loadReadState();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readIds.includes(item.id)).length,
    [notifications, readIds]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "UNREAD") {
      return notifications.filter((item) => !readIds.includes(item.id));
    }
    return notifications;
  }, [filter, notifications, readIds]);

  async function patchReadState(ids: string[], read: boolean) {
    if (ids.length === 0) return;

    setReadIds((prev) => {
      if (read) return Array.from(new Set([...prev, ...ids]));
      return prev.filter((id) => !ids.includes(id));
    });

    await fetch("/api/dashboard/notifications/read-state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, read }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Messages & Notifications</h1>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
            {unreadCount} unread
          </span>
          <div className="ml-auto flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`rounded border px-2 py-1 ${
                filter === "ALL"
                  ? "border-blue-600 text-blue-600"
                  : "border-gray-300 text-gray-600 dark:border-slate-600 dark:text-gray-300"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("UNREAD")}
              className={`rounded border px-2 py-1 ${
                filter === "UNREAD"
                  ? "border-blue-600 text-blue-600"
                  : "border-gray-300 text-gray-600 dark:border-slate-600 dark:text-gray-300"
              }`}
            >
              Unread
            </button>
            <button
              type="button"
              onClick={() => void patchReadState(notifications.map((item) => item.id), true)}
              className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              Mark all read
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300">
            No notifications in this view.
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isRead = readIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-xl border px-3 py-3 ${
                  isRead
                    ? "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    : "border-blue-200 bg-blue-50/70 dark:border-blue-600/50 dark:bg-blue-500/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.detail}</p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">{new Date(item.at).toLocaleString("en-ZA")}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => void patchReadState([item.id], !isRead)}
                      className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      {isRead ? "Mark unread" : "Mark read"}
                    </button>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (!isRead) void patchReadState([item.id], true);
                      }}
                      className="rounded border border-blue-600 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
