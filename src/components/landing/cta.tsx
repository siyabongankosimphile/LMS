import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-gradient-to-r from-slate-950 to-slate-700 text-center text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold">Ready to Start Your Tech Journey?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-100/90">
          Join hundreds of youth who have transformed their careers with Kayise.
        </p>
        <Link href="/register" className="mt-8 inline-block rounded-full bg-cyan-300 px-10 py-4 text-lg font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5 hover:bg-cyan-200">
          Enroll Now
        </Link>
      </div>
    </section>
  );
}
