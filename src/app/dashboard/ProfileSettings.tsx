"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { FaUser } from "react-icons/fa";

export default function ProfileSettings({
  initialName,
  initialEmail,
  role,
  status,
}: {
  initialName: string;
  initialEmail: string;
  role: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    function onOutsideClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload: {
        name?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      if (name.trim() && name.trim() !== initialName) {
        payload.name = name.trim();
      }

      if (email.trim() && email.trim() !== initialEmail) {
        payload.email = email.trim();
      }
      if (newPassword.trim()) {
        payload.newPassword = newPassword.trim();
        payload.currentPassword = currentPassword;
      }

      if (!payload.name && !payload.email && !payload.newPassword) {
        setError("No changes to save.");
        return;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setSuccess("Profile updated. Please sign in again with your new details.");
      setCurrentPassword("");
      setNewPassword("");

      if (payload.email || payload.newPassword) {
        setTimeout(() => {
          signOut({ callbackUrl: "/login" });
        }, 900);
      }
    } catch {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        <FaUser />
        Profile
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">My Profile</h2>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-300">
            Review and update your registration details.
          </p>

          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-300">Role</p>
                <p className="mt-1 rounded-md bg-gray-100 px-2 py-1 text-gray-800 dark:bg-slate-800 dark:text-gray-200">{role}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-300">Status</p>
                <p className="mt-1 rounded-md bg-gray-100 px-2 py-1 text-gray-800 dark:bg-slate-800 dark:text-gray-200">{status}</p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required for password change"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
