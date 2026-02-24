import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import AdminToolPageClient from "../AdminToolPageClient";

const VALID_TOOLS = [
  "grade",
  "message",
  "private-file",
  "preference",
  "filter",
  "calendar",
] as const;

type ToolName = (typeof VALID_TOOLS)[number];

function isToolName(value: string): value is ToolName {
  return (VALID_TOOLS as readonly string[]).includes(value);
}

type Props = {
  params: Promise<{ tool: string }>;
};

export default async function AdminToolPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { tool } = await params;
  if (!isToolName(tool)) redirect("/admin");

  await connectDB();
  const pendingFacilitators = await User.countDocuments({
    role: "FACILITATOR",
    status: "PENDING_APPROVAL",
  });

  return (
    <AdminToolPageClient
      tool={tool}
      pendingFacilitators={pendingFacilitators}
    />
  );
}
