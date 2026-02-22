import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

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
    const { name, email, role, status, password } = body as {
      name?: string;
      email?: string;
      role?: "ADMIN" | "FACILITATOR" | "STUDENT";
      status?: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
      password?: string;
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
