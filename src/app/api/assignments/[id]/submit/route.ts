import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import Enrollment from "@/models/Enrollment";
import AssignmentSubmission from "@/models/AssignmentSubmission";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { content, attachment } = (await req.json()) as {
      content?: string;
      attachment?: {
        url?: string;
        key?: string;
        name?: string;
        contentType?: string;
        size?: number;
      };
    };

    const trimmedContent = content?.trim() || "";
    const hasAttachment = !!(attachment?.url && attachment?.key && attachment?.name);

    if (!trimmedContent && !hasAttachment) {
      return NextResponse.json(
        { error: "Submission text or file is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const assignment = await Assignment.findById(id).lean();
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const enrollment = await Enrollment.findOne({
      student: session.user.id,
      course: assignment.course,
    }).lean();

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: assignment._id, student: session.user.id },
      {
        $set: {
          content: trimmedContent || undefined,
          attachment: hasAttachment
            ? {
                url: attachment!.url,
                key: attachment!.key,
                name: attachment!.name,
                contentType: attachment!.contentType,
                size: attachment!.size,
              }
            : undefined,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
        $unset: {
          score: "",
          feedback: "",
          gradedAt: "",
          gradedBy: "",
        },
        $setOnInsert: {
          course: assignment.course,
        },
      },
      {
        new: true,
        upsert: true,
      }
    ).lean();

    return NextResponse.json({ submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
