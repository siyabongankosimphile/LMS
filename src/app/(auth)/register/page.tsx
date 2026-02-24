"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const highestQualificationOptions = [
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Certificate",
  "Diploma",
  "Bachelor",
  "Honors",
  "Master",
  "PhD",
  "N1",
  "N2",
  "N3",
  "N4",
];

const provinceOptions = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const countryOptions = [
  "South Africa",
  "Botswana",
  "Eswatini",
  "Lesotho",
  "Mozambique",
  "Namibia",
  "Zimbabwe",
  "Other",
];

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];

const raceOptions = [
  "Black",
  "Coloured",
  "Indian/Asian",
  "White",
  "Other",
  "Prefer not to say",
];

const employmentStatusOptions = [
  "Unemployed",
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Student",
  "Other",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cityTown, setCityTown] = useState("");
  const [country, setCountry] = useState("South Africa");
  const [gender, setGender] = useState("");
  const [race, setRace] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [province, setProvince] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [saId, setSaId] = useState("");
  const [role, setRole] = useState<"STUDENT" | "FACILITATOR">("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          surname,
          email,
          password,
          role,
          cityTown,
          country,
          gender,
          race,
          employmentStatus,
          highestQualification,
          province,
          age: age ? Number(age) : undefined,
          phone,
          saId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      if (role === "FACILITATOR") {
        router.push(
          "/login?message=Account created. Awaiting admin approval before you can sign in as a facilitator."
        );
      } else {
        router.push("/login?message=Account created successfully. Please sign in.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
        <p className="text-gray-500 mb-6 text-sm">Join Kayise IT LMS today</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surname
              </label>
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required={role === "STUDENT"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your surname"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min. 8 characters"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              I want to join as
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  role === "STUDENT"
                    ? "border-[#60d6e7] bg-[#60d6e7]/20 text-slate-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("FACILITATOR")}
                className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  role === "FACILITATOR"
                    ? "border-[#60d6e7] bg-[#60d6e7]/20 text-slate-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Facilitator
              </button>
            </div>
            {role === "FACILITATOR" && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Facilitator accounts require admin approval before you can
                create courses.
              </p>
            )}
          </div>

          {role === "STUDENT" && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-800">Student Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City/Town</label>
                  <input
                    type="text"
                    value={cityTown}
                    onChange={(e) => setCityTown(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select country</option>
                    {countryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Race</label>
                  <select
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select race</option>
                    {raceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select employment status</option>
                    {employmentStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
                  <select
                    value={highestQualification}
                    onChange={(e) => setHighestQualification(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select qualification</option>
                    {highestQualificationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select province</option>
                    {provinceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Age</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SA ID</label>
                  <input
                    type="text"
                    value={saId}
                    onChange={(e) => setSaId(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-600 text-white py-2 rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#60d6e7] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
