"use client";

import { useMemo, useState } from "react";

type Author = {
  name?: string;
  surname?: string;
};

type Post = {
  _id: string;
  message: string;
  createdAt: string;
  parentPost?: string | null;
  author?: Author;
};

type Props = {
  courseId: string;
  initialPosts: Post[];
};

export default function ForumClient({ courseId, initialPosts }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newDiscussion, setNewDiscussion] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const { topics, repliesByTopic } = useMemo(() => {
    const topLevel = posts
      .filter((post) => !post.parentPost)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const replies = new Map<string, Post[]>();
    posts
      .filter((post) => post.parentPost)
      .forEach((post) => {
        const parentId = String(post.parentPost);
        const existing = replies.get(parentId) || [];
        existing.push(post);
        replies.set(parentId, existing);
      });

    replies.forEach((value, key) => {
      value.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      replies.set(key, value);
    });

    return { topics: topLevel, repliesByTopic: replies };
  }, [posts]);

  async function createPost(message: string, parentPostId?: string) {
    const text = message.trim();
    if (!text) return;

    setSending(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/discussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, parentPostId }),
      });

      if (!res.ok) return;
      const data = await res.json();
      if (data.post) {
        setPosts((prev) => [...prev, data.post]);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Start a discussion
        </label>
        <textarea
          rows={3}
          value={newDiscussion}
          onChange={(event) => setNewDiscussion(event.target.value)}
          placeholder="Write your topic here"
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={async () => {
            await createPost(newDiscussion);
            setNewDiscussion("");
          }}
          disabled={sending}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? "Posting..." : "Post discussion"}
        </button>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-gray-500 dark:text-gray-300">
          No discussions yet.
        </div>
      ) : (
        topics.map((topic) => {
          const replies = repliesByTopic.get(topic._id) || [];
          return (
            <div key={topic._id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <p className="text-sm text-gray-800 dark:text-gray-100">{topic.message}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                {(topic.author?.name || "User") + " " + (topic.author?.surname || "")} • {new Date(topic.createdAt).toLocaleString("en-ZA")}
              </p>

              <div className="mt-3 space-y-2 border-l-2 border-gray-100 dark:border-slate-700 pl-3">
                {replies.map((reply) => (
                  <div key={reply._id} className="rounded-lg bg-gray-50 dark:bg-slate-900 p-2">
                    <p className="text-sm text-gray-800 dark:text-gray-100">{reply.message}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                      {(reply.author?.name || "User") + " " + (reply.author?.surname || "")} • {new Date(reply.createdAt).toLocaleString("en-ZA")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <textarea
                  rows={2}
                  value={replyDrafts[topic._id] || ""}
                  onChange={(event) =>
                    setReplyDrafts((prev) => ({ ...prev, [topic._id]: event.target.value }))
                  }
                  placeholder="Reply to this discussion"
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const replyText = replyDrafts[topic._id] || "";
                    await createPost(replyText, topic._id);
                    setReplyDrafts((prev) => ({ ...prev, [topic._id]: "" }));
                  }}
                  disabled={sending}
                  className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
