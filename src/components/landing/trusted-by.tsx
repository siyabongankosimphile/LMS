export function TrustedBy() {
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-gray-500">Trusted by learners and community partners</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm font-medium text-gray-600 sm:grid-cols-4">
          <div className="rounded-md border border-gray-200 py-3">Kayise IT</div>
          <div className="rounded-md border border-gray-200 py-3">Youth Hubs</div>
          <div className="rounded-md border border-gray-200 py-3">Community Labs</div>
          <div className="rounded-md border border-gray-200 py-3">Local Mentors</div>
        </div>
      </div>
    </section>
  );
}
