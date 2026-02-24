import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      surname,
      email,
      password,
      role,
      status,
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
      surname?: string;
      email?: string;
      password?: string;
      role?: "ADMIN" | "FACILITATOR" | "STUDENT";
      status?: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
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

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.trim().length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const userRole: "ADMIN" | "FACILITATOR" | "STUDENT" =
      role === "ADMIN" || role === "FACILITATOR" || role === "STUDENT"
        ? role
        : "STUDENT";

    const userStatus: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED" =
      status === "ACTIVE" || status === "PENDING_APPROVAL" || status === "REJECTED"
        ? status
        : userRole === "FACILITATOR"
        ? "PENDING_APPROVAL"
        : "ACTIVE";

    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const normalizedSaId = typeof saId === "string" ? saId.trim() : "";
    if (normalizedSaId) {
      const existingSaId = await User.findOne({ saId: normalizedSaId });
      if (existingSaId) {
        return NextResponse.json({ error: "ID number already in use" }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const user = await User.create({
      name: name.trim(),
      surname: typeof surname === "string" ? surname.trim() || undefined : undefined,
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      status: userStatus,
      provider: "credentials",
      cityTown: typeof cityTown === "string" ? cityTown.trim() || undefined : undefined,
      country: typeof country === "string" ? country.trim() || undefined : undefined,
      gender: typeof gender === "string" ? gender.trim() || undefined : undefined,
      race: typeof race === "string" ? race.trim() || undefined : undefined,
      employmentStatus:
        typeof employmentStatus === "string" ? employmentStatus.trim() || undefined : undefined,
      highestQualification:
        typeof highestQualification === "string"
          ? highestQualification.trim() || undefined
          : undefined,
      province: typeof province === "string" ? province.trim() || undefined : undefined,
      age: typeof age === "number" && Number.isFinite(age) ? age : undefined,
      phone: typeof phone === "string" ? phone.trim() || undefined : undefined,
      saId: normalizedSaId || undefined,
    });

    return NextResponse.json(
      {
        user: {
          _id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Duplicate unique field (email or ID number)" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
