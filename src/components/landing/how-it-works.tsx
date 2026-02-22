import {
  FaUserGraduate,
  FaLaptopCode,
  FaChalkboardTeacher,
  FaBriefcase,
} from "react-icons/fa";

const reasons = [
  { icon: FaUserGraduate, title: "Industry-Ready Curriculum", detail: "Courses designed with tech partners to meet current job market demands." },
  { icon: FaLaptopCode, title: "Hands-On Projects", detail: "Build real-world projects and a portfolio that stands out to employers." },
  { icon: FaChalkboardTeacher, title: "Expert Mentors", detail: "Learn from experienced professionals passionate about teaching youth." },
  { icon: FaBriefcase, title: "Career Support", detail: "CV workshops, interview prep, and connections to our hiring partners." },
];

export function HowItWorks() {
  return (
    <section id="why" className="bg-slate-200/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl font-bold text-slate-900">
          Why Choose <span className="border-b-4 border-cyan-300">Kayise?</span>
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => (
            <article key={reason.title} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-3xl text-cyan-700">
                <reason.icon />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{reason.title}</h3>
              <p className="mt-2 text-slate-600">{reason.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
