import { FaQuoteLeft, FaUserCircle } from "react-icons/fa";

const testimonials = [
  {
    quote: "Kayise's AI program gave me the skills to land a job as a junior data scientist. The mentors were incredible!",
    author: "Lindiwe Nkosi",
    role: "AI Graduate, now at DataTech",
  },
  {
    quote: "I had zero coding experience. After 6 months in the Full Stack track, I built my own web app and got hired.",
    author: "Themba Dlamini",
    role: "Web Developer at Innova",
  },
  {
    quote: "The cybersecurity course was intense and practical. I'm now a security analyst, thanks to Kayise.",
    author: "Fatima Daniels",
    role: "Cybersecurity Analyst",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl font-bold text-slate-900">
          Success <span className="border-b-4 border-cyan-300">Stories</span>
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.author} className="relative rounded-2xl bg-slate-100 p-7">
              <div className="text-3xl text-cyan-300/60">
                <FaQuoteLeft />
              </div>
              <p className="mt-2 text-slate-700 italic">{item.quote}</p>
              <footer className="mt-5 flex items-center gap-3">
                <span className="text-3xl text-slate-700">
                  <FaUserCircle />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.author}</p>
                  <p className="text-sm text-cyan-700">{item.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
