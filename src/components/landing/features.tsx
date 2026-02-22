import {
  FaRobot,
  FaLink,
  FaCloudUploadAlt,
  FaShieldAlt,
  FaCode,
  FaDatabase,
} from "react-icons/fa";

const tracks = [
  { icon: FaRobot, title: "AI & Machine Learning", description: "From Python to neural networks - build intelligent systems and become an AI specialist." },
  { icon: FaLink, title: "Blockchain Development", description: "Understand decentralized tech, smart contracts, and build dApps for the future." },
  { icon: FaCloudUploadAlt, title: "Cloud Computing", description: "AWS, Azure, GCP - master cloud architecture, deployment, and DevOps practices." },
  { icon: FaShieldAlt, title: "Cybersecurity", description: "Learn ethical hacking, network security, and how to protect digital assets." },
  { icon: FaCode, title: "Full Stack Development", description: "Build modern web apps with React, Node.js, and databases. From frontend to backend." },
  { icon: FaDatabase, title: "Data Science & Analytics", description: "Turn data into insights with Python, SQL, and visualization tools." },
];

export function Features() {
  return (
    <section id="courses" className="bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl font-bold text-slate-900">
          Our <span className="border-b-4 border-cyan-300 text-slate-800">Tech Tracks</span>
        </h2>

        <div className="mt-12 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {tracks.map((track) => (
            <article key={track.title} className="rounded-2xl border-b-4 border-transparent bg-white px-6 py-8 text-center shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition hover:-translate-y-2 hover:border-cyan-300 hover:shadow-[0_20px_35px_rgba(0,0,0,0.1)]">
              <div className="mb-4 flex justify-center text-5xl text-slate-800">
                <track.icon />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900">{track.title}</h3>
              <p className="mt-4 text-slate-600">{track.description}</p>
              <a href="/courses" className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                Learn More
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
