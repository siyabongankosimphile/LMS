import Link from "next/link";
import { FaChartLine } from "react-icons/fa";

export function Hero() {
  return (
    <section id="home" className="bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Uplifting Youth with <span className="border-b-4 border-cyan-300 text-cyan-300">Emerging Tech</span> Skills
          </h1>
          <p className="mt-6 text-lg text-slate-100/90">
            Join Kayise and master AI, Blockchain, Cloud, Cybersecurity and more. Practical training for the digital future.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="#courses" className="rounded-full bg-cyan-300 px-8 py-3 font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5 hover:bg-cyan-200">
              Explore Programs
            </Link>
            <Link href="/register" className="rounded-full border-2 border-cyan-300 px-8 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-300 hover:text-slate-900">
              Get Started
            </Link>
          </div>
        </div>
        <div className="flex justify-center text-cyan-300/90">
          <FaChartLine className="text-[7rem] md:text-[10rem]" />
        </div>
      </div>
    </section>
  );
}
