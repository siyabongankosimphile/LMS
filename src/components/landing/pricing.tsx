import Link from "next/link";

export function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">Simple pricing</h2>
        <p className="mt-3 text-gray-600">Start free and upgrade only when your organization needs advanced support.</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-xl font-semibold text-gray-900">Community Plan</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">R0<span className="text-base font-medium text-gray-500"> / month</span></p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Access to core learning paths</li>
              <li>• Course quizzes and progress tracking</li>
              <li>• Certificates on completion</li>
            </ul>
            <Link href="/register" className="mt-6 inline-block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Join Free
            </Link>
          </div>

          <div className="rounded-xl border border-blue-200 bg-white p-6">
            <h3 className="text-xl font-semibold text-gray-900">Partner Plan</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">Custom</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Dedicated onboarding support</li>
              <li>• Program-level progress insights</li>
              <li>• Tailored training pathways</li>
            </ul>
            <a href="#contact" className="mt-6 inline-block rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
