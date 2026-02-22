import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, currentPassword, newPassword } = (await req.json()) as {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    if (!name && !email && !newPassword) {
      return NextResponse.json(
        { error: "Provide name, email and/or new password" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name && name.trim().length > 0) {
      user.name = name.trim();
    }

    if (email && email !== user.email) {
      const duplicate = await User.findOne({ email: email.toLowerCase() });
      if (duplicate && String(duplicate._id) !== String(user._id)) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      user.email = email.toLowerCase();
    }

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      if (user.password) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required" },
            { status: 400 }
          );
        }
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      user.password = await bcrypt.hash(newPassword.trim(), 10);
      user.provider = "credentials";
    }

    await user.save();

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
