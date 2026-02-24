import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      email,
      role,
      status,
      password,
      surname,
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
    } = body as {
      name?: string;
      email?: string;
      role?: "ADMIN" | "FACILITATOR" | "STUDENT";
      status?: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
      password?: string;
      surname?: string;
      cityTown?: string;
      country?: string;
      gender?: string;
      race?: string;
      employmentStatus?: string;
      highestQualification?: string;
      province?: string;
      age?: number | string;
      phone?: string;
      saId?: string;
    };

    await connectDB();

    const existing = await User.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (email && email !== existing.email) {
      const duplicate = await User.findOne({ email });
      if (duplicate) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      existing.email = email.toLowerCase();
    }

    if (name) existing.name = name;
    if (role) existing.role = role;
    if (status) existing.status = status;

    const parsedAge =
      typeof age === "number" && Number.isFinite(age)
        ? age
        : typeof age === "string" && age.trim().length > 0
        ? Number(age)
        : undefined;

    const profileUpdates = {
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
    };

    if (
      profileUpdates.highestQualification &&
      !HIGHEST_QUALIFICATIONS.includes(
        profileUpdates.highestQualification as (typeof HIGHEST_QUALIFICATIONS)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid highest qualification selected" },
        { status: 400 }
      );
    }

    if (profileUpdates.saId && profileUpdates.saId !== existing.saId) {
      const duplicateSaId = await User.findOne({ saId: profileUpdates.saId, _id: { $ne: id } });
      if (duplicateSaId) {
        return NextResponse.json({ error: "ID number already in use" }, { status: 409 });
      }
    }

    if (parsedAge !== undefined) {
      if (!Number.isInteger(parsedAge) || parsedAge < 10 || parsedAge > 120) {
        return NextResponse.json(
          { error: "Student age must be between 10 and 120" },
          { status: 400 }
        );
      }
      existing.age = parsedAge;
    }

    existing.surname = profileUpdates.surname;
    existing.cityTown = profileUpdates.cityTown;
    existing.country = profileUpdates.country;
    existing.gender = profileUpdates.gender;
    existing.race = profileUpdates.race;
    existing.employmentStatus = profileUpdates.employmentStatus;
    existing.highestQualification = profileUpdates.highestQualification;
    existing.province = profileUpdates.province;
    existing.phone = profileUpdates.phone;
    existing.saId = profileUpdates.saId;

    if (password && password.trim().length > 0) {
      if (password.trim().length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      existing.password = await bcrypt.hash(password.trim(), 10);
      existing.provider = "credentials";
    }

    await existing.save();

    const sanitized = await User.findById(id).select("-password").lean();
    return NextResponse.json({ user: sanitized });
  } catch (error) {
    console.error(error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json({ error: "ID number already in use" }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account" },
        { status: 400 }
      );
    }

    const existing = await User.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existing.role === "ADMIN") {
      const adminCount = await User.countDocuments({ role: "ADMIN" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin account" },
          { status: 400 }
        );
      }
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
