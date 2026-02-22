import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action } = await req.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user || user.role !== "FACILITATOR") {
      return NextResponse.json(
        { error: "Facilitator not found" },
        { status: 404 }
      );
    }

    user.status = action === "approve" ? "ACTIVE" : "REJECTED";
    await user.save();

    return NextResponse.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      status: user.status,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
