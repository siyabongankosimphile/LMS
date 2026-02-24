import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const HIGHEST_QUALIFICATIONS = [
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
] as const;

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const {
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
      age,
      phone,
      saId,
    } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const userRole =
      role === "FACILITATOR" ? "FACILITATOR" : "STUDENT";

    const studentProfile = {
      surname: normalizeOptionalString(surname),
      cityTown: normalizeOptionalString(cityTown),
      country: normalizeOptionalString(country),
      gender: normalizeOptionalString(gender),
      race: normalizeOptionalString(race),
      employmentStatus: normalizeOptionalString(employmentStatus),
      highestQualification: normalizeOptionalString(highestQualification),
      province: normalizeOptionalString(province),
      phone: normalizeOptionalString(phone),
      saId: normalizeOptionalString(saId),
      age:
        typeof age === "number" && Number.isFinite(age)
          ? age
          : typeof age === "string" && age.trim()
          ? Number(age)
          : undefined,
    };

    if (userRole === "STUDENT") {
      const requiredFields = [
        studentProfile.surname,
        studentProfile.cityTown,
        studentProfile.country,
        studentProfile.gender,
        studentProfile.race,
        studentProfile.employmentStatus,
        studentProfile.highestQualification,
        studentProfile.province,
        studentProfile.phone,
        studentProfile.saId,
      ];

      const hasMissingRequiredField = requiredFields.some((field) => !field);
      if (hasMissingRequiredField || !studentProfile.age) {
        return NextResponse.json(
          { error: "Please complete all required student profile fields" },
          { status: 400 }
        );
      }

      if (!HIGHEST_QUALIFICATIONS.includes(studentProfile.highestQualification as (typeof HIGHEST_QUALIFICATIONS)[number])) {
        return NextResponse.json(
          { error: "Invalid highest qualification selected" },
          { status: 400 }
        );
      }

      if (!Number.isInteger(studentProfile.age) || studentProfile.age < 10 || studentProfile.age > 120) {
        return NextResponse.json(
          { error: "Student age must be between 10 and 120" },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    if (studentProfile.saId) {
      const existingSaId = await User.findOne({ saId: studentProfile.saId });
      if (existingSaId) {
        return NextResponse.json(
          { error: "ID number already in use" },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      surname: studentProfile.surname,
      email: email.toLowerCase(),
      cityTown: studentProfile.cityTown,
      country: studentProfile.country,
      gender: studentProfile.gender,
      race: studentProfile.race,
      employmentStatus: studentProfile.employmentStatus,
      highestQualification: studentProfile.highestQualification,
      province: studentProfile.province,
      age: studentProfile.age,
      phone: studentProfile.phone,
      saId: studentProfile.saId,
      password: hashedPassword,
      role: userRole,
      status: userRole === "FACILITATOR" ? "PENDING_APPROVAL" : "ACTIVE",
      provider: "credentials",
    });

    return NextResponse.json(
      {
        id: String(user._id),
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "ID number already in use" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
