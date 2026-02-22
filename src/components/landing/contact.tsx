export function Contact() {
  return (
    <section id="contact" className="bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">Contact us</h2>
        <p className="mt-3 max-w-2xl text-gray-600">
          Want to partner with Kayise IT or support community learning initiatives? Reach out to our team.
        </p>

        <div className="mt-8 grid gap-4 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700 sm:grid-cols-3">
          <p><span className="font-semibold text-gray-900">Email:</span> info@kayiseit.com</p>
          <p><span className="font-semibold text-gray-900">Phone:</span> +27 87 702 2625</p>
          <p><span className="font-semibold text-gray-900">Location:</span> Nelspruit, South Africa</p>
        </div>
      </div>
    </section>
  );
}
