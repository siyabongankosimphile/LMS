import { connectDB } from "@/lib/db";
import Certificate from "@/models/Certificate";

interface Props {
  params: Promise<{ certificateId: string }>;
}

export default async function CertificateVerificationPage({ params }: Props) {
  const { certificateId } = await params;

  await connectDB();

  const certificate = await Certificate.findOne({ certificateId })
    .populate("student", "name surname")
    .populate("course", "title")
    .lean();

  if (!certificate) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-red-600">
            The certificate ID could not be verified.
          </p>
        </div>
      </main>
    );
  }

  const student = certificate.student as unknown as { name?: string; surname?: string };
  const course = certificate.course as unknown as { title?: string };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-emerald-700">VERIFIED CERTIFICATE</p>
        <h1 className="mt-2 text-3xl font-bold text-emerald-900">Kayise IT Certificate Verification</h1>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Certificate ID</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{certificate.certificateId}</dd>
          </div>

          <div className="rounded-xl bg-white p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Issued On</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">
              {new Date(certificate.issuedAt).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>

          <div className="rounded-xl bg-white p-4 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Learner</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">
              {`${student?.name || "Learner"} ${student?.surname || ""}`.trim()}
            </dd>
          </div>

          <div className="rounded-xl bg-white p-4 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Course</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{course?.title || "N/A"}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
