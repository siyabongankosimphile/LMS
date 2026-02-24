"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 to-slate-800 text-white shadow-md">
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-wide">
          <Image
            src="/download.png"
            alt="Kayise IT logo"
            width={34}
            height={34}
            className="h-8 w-8 rounded-sm object-cover"
          />
          <span>
            Kayise<span className="text-cyan-300 font-light">IT</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-lg md:flex">
          <a href="#home" className="transition-colors hover:text-cyan-300">Home</a>
          <a href="#courses" className="transition-colors hover:text-cyan-300">Courses</a>
          <a href="#why" className="transition-colors hover:text-cyan-300">Why Us</a>
          <a href="#testimonials" className="transition-colors hover:text-cyan-300">Success</a>
          <a href="#contact" className="transition-colors hover:text-cyan-300">Contact</a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="text-3xl md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden">
          <div className="space-y-4 bg-slate-900 px-4 py-6 text-center text-lg shadow-lg">
            <a href="#home" onClick={closeMenu} className="block transition-colors hover:text-cyan-300">Home</a>
            <a href="#courses" onClick={closeMenu} className="block transition-colors hover:text-cyan-300">Courses</a>
            <a href="#why" onClick={closeMenu} className="block transition-colors hover:text-cyan-300">Why Us</a>
            <a href="#testimonials" onClick={closeMenu} className="block transition-colors hover:text-cyan-300">Success</a>
            <a href="#contact" onClick={closeMenu} className="block transition-colors hover:text-cyan-300">Contact</a>
          </div>
        </div>
      )}
    </header>
  );
}
