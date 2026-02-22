"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = session?.user?.role;

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Kayise IT LMS
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-4">
            {status === "authenticated" && (
              <>
                <Link href="/dashboard" className="hover:text-blue-200 transition-colors">
                  Dashboard
                </Link>
                <Link href="/courses" className="hover:text-blue-200 transition-colors">
                  Courses
                </Link>
                {role === "FACILITATOR" && (
                  <Link href="/facilitator" className="hover:text-blue-200 transition-colors">
                    My Courses
                  </Link>
                )}
                {role === "ADMIN" && (
                  <Link href="/admin" className="hover:text-blue-200 transition-colors">
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-blue-200">
                    {session.user.name}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
            {status === "unauthenticated" && (
              <>
                <Link href="/login" className="hover:text-blue-200 transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-800 px-4 py-3 space-y-2">
          {status === "authenticated" && (
            <>
              <Link href="/dashboard" className="block hover:text-blue-200">Dashboard</Link>
              <Link href="/courses" className="block hover:text-blue-200">Courses</Link>
              {role === "FACILITATOR" && (
                <Link href="/facilitator" className="block hover:text-blue-200">My Courses</Link>
              )}
              {role === "ADMIN" && (
                <Link href="/admin" className="block hover:text-blue-200">Admin</Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="block text-left text-sm hover:text-blue-200"
              >
                Sign out ({session.user.name})
              </button>
            </>
          )}
          {status === "unauthenticated" && (
            <>
              <Link href="/login" className="block hover:text-blue-200">Sign in</Link>
              <Link href="/register" className="block hover:text-blue-200">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
