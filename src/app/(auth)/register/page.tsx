"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "FACILITATOR">("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      if (role === "FACILITATOR") {
        router.push(
          "/login?message=Account created. Awaiting admin approval before you can sign in as a facilitator."
        );
      } else {
        router.push("/login?message=Account created successfully. Please sign in.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-gray-500 mb-6 text-sm">Join Kayise IT LMS today</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              I want to join as
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  role === "STUDENT"
                    ? "border-[#60d6e7] bg-[#60d6e7]/20 text-slate-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("FACILITATOR")}
                className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  role === "FACILITATOR"
                    ? "border-[#60d6e7] bg-[#60d6e7]/20 text-slate-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Facilitator
              </button>
            </div>
            {role === "FACILITATOR" && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Facilitator accounts require admin approval before you can
                create courses.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-600 text-white py-2 rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#60d6e7] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
