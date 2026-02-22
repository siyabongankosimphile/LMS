import Link from "next/link";
import {
  FaBrain,
  FaPhoneAlt,
  FaWhatsapp,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
} from "react-icons/fa";

export function Footer() {
  return (
    <footer id="contact" className="bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
              <FaBrain className="text-cyan-300" /> KayiseIT
            </h3>
            <p className="mt-3 text-slate-400">
              Empowering the next generation with emerging tech skills. Bridging the gap between youth and the digital future.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://www.facebook.com/KAYISEIT/" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:text-slate-900">
                <FaFacebookF />
              </a>
              <a href="https://za.linkedin.com/company/kayise-it" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:text-slate-900">
                <FaLinkedinIn />
              </a>
              <a href="https://www.instagram.com/kayiseit/" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:text-slate-900">
                <FaInstagram />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-slate-400">
              <li><Link href="/">About Us</Link></li>
              <li><a href="#courses">All Courses</a></li>
              <li><Link href="/register">Hire Our Grads</Link></li>
              <li><Link href="/">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">Support</h3>
            <ul className="mt-3 space-y-2 text-slate-400">
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Scholarships</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">Get in Touch</h3>
            <ul className="mt-3 space-y-2 text-slate-400">
              <li>
                <a href="tel:+27877022625" className="flex items-center gap-2 transition hover:text-cyan-300">
                  <FaPhoneAlt /> 087 702 2625
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/27693907862"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 transition hover:text-cyan-300"
                >
                  <FaWhatsapp /> 069 390 7862
                </a>
              </li>
              <li>
                <a href="mailto:info@kayiseit.com" className="flex items-center gap-2 transition hover:text-cyan-300">
                  <FaEnvelope /> info@kayiseit.com
                </a>
              </li>
              <li className="flex items-start gap-2"><FaMapMarkerAlt className="mt-1" /> Office 2, 2nd Floor, 39b Brown Str, Nelbro Building, Nelspruit, 1201</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} KayiseIT. All rights reserved. Uplifting youth through technology.
        </div>
      </div>
    </footer>
  );
}
