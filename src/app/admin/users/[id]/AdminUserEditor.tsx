"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "ADMIN" | "FACILITATOR" | "STUDENT";
type UserStatus = "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";

type CourseOption = {
  _id: string;
  title: string;
};

type EnrollmentItem = {
  _id: string;
  progressPercent: number;
  completed: boolean;
  course: {
    title: string;
  };
};

type UserPayload = {
  _id: string;
  name: string;
  surname?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  cityTown?: string;
  country?: string;
  gender?: string;
  race?: string;
  employmentStatus?: string;
  highestQualification?: string;
  province?: string;
  age?: number;
  phone?: string;
  saId?: string;
};

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

export default function AdminUserEditor({
  user,
  courses,
  enrollments,
}: {
  user: UserPayload;
  courses: CourseOption[];
  enrollments: EnrollmentItem[];
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [surname, setSurname] = useState(user.surname || "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [cityTown, setCityTown] = useState(user.cityTown || "");
  const [country, setCountry] = useState(user.country || "");
  const [gender, setGender] = useState(user.gender || "");
  const [race, setRace] = useState(user.race || "");
  const [employmentStatus, setEmploymentStatus] = useState(user.employmentStatus || "");
  const [highestQualification, setHighestQualification] = useState(user.highestQualification || "");
  const [province, setProvince] = useState(user.province || "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saId, setSaId] = useState(user.saId || "");
  const [password, setPassword] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);

  const completedCount = useMemo(
    () => enrollments.filter((item) => item.completed).length,
    [enrollments]
  );

  const inProgressCount = Math.max(enrollments.length - completedCount, 0);

  async function onSave() {
    setMessage("");
    setError("");
    setSaveLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          surname,
          email,
          role,
          status,
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
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update user");
        return;
      }

      setPassword("");
      setMessage("User details updated successfully.");
    } catch {
      setError("Failed to update user.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function onManualEnroll() {
    if (!courseId) {
      setError("Please select a course to enroll student.");
      return;
    }

    setMessage("");
    setError("");
    setEnrollLoading(true);

    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user._id, courseId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to enroll student");
        return;
      }

      setMessage("Student enrolled successfully. Refresh to see updated progress.");
      setCourseId("");
    } catch {
      setError("Failed to enroll student.");
    } finally {
      setEnrollLoading(false);
    }
  }

  async function onDeleteUser() {
    const confirmed = window.confirm(
      "Delete this user account permanently? This action cannot be undone."
    );
    if (!confirmed) return;

    setMessage("");
    setError("");
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete user");
        return;
      }

      router.push("/admin/users");
      router.refresh();
    } catch {
      setError("Failed to delete user.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-green-300 bg-green-50 text-green-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit Account Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Full Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Surname</label>
            <input
              value={surname}
              onChange={(event) => setSurname(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option value="STUDENT">STUDENT</option>
              <option value="FACILITATOR">FACILITATOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as UserStatus)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Reset Password (optional)</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Leave empty to keep current password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">City/Town</label>
            <input
              value={cityTown}
              onChange={(event) => setCityTown(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Country</label>
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Gender</label>
            <input
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Race</label>
            <input
              value={race}
              onChange={(event) => setRace(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Employment Status</label>
            <input
              value={employmentStatus}
              onChange={(event) => setEmploymentStatus(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Highest Qualification</label>
            <select
              value={highestQualification}
              onChange={(event) => setHighestQualification(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
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
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Province</label>
            <select
              value={province}
              onChange={(event) => setProvince(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
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
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Student Age</label>
            <input
              type="number"
              min={10}
              max={120}
              value={age}
              onChange={(event) => setAge(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Phone</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">SA ID</label>
            <input
              value={saId}
              onChange={(event) => setSaId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saveLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saveLoading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onDeleteUser}
            disabled={deleteLoading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteLoading ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </div>

      {role === "STUDENT" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-gray-500 dark:text-gray-300">Enrolled</p>
              <p className="text-2xl font-bold text-blue-600">{enrollments.length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-gray-500 dark:text-gray-300">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-gray-500 dark:text-gray-300">In Progress</p>
              <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Bypass Enrollment (Admin)</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">
              Use this when a student made a registration mistake and needs manual enrollment.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onManualEnroll}
                disabled={enrollLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {enrollLoading ? "Enrolling..." : "Enroll Student"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Student Progress</h2>
            {enrollments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-300">No enrollments yet.</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((item) => (
                  <div key={item._id} className="rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">{item.course.title}</p>
                      <p className="text-gray-500 dark:text-gray-300">{item.progressPercent}%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.progressPercent}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-medium text-green-600">
                      {item.completed ? "Completed" : "In progress"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
