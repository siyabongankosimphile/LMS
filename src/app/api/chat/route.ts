import { NextRequest, NextResponse } from "next/server";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  role: ChatRole;
  text: string;
};

const LMS_SYSTEM_PROMPT =
  "You are the Kayese LMS assistant. Answer only questions about this LMS: courses, lessons, modules, enrollments, assignments, quizzes, certificates, dashboard, profile settings, facilitator tools, admin tools, account access, and platform usage. Keep answers practical and concise. If a question is not about the LMS, politely state you can only help with LMS topics and suggest an LMS-related question. If a question is LMS-related but unclear, ask one short clarifying question.";

function isLikelyLmsQuestion(question: string) {
  const text = question.toLowerCase();
  const lmsKeywords = [
    "lms",
    "course",
    "lesson",
    "module",
    "enroll",
    "enrollment",
    "assignment",
    "submission",
    "quiz",
    "certificate",
    "dashboard",
    "profile",
    "facilitator",
    "admin",
    "student",
    "register",
    "login",
    "password",
    "account",
    "discussion",
    "chat",
    "progress",
  ];

  return lmsKeywords.some((keyword) => text.includes(keyword));
}

function getLmsFallback(question: string) {
  const text = question.toLowerCase();

  if (!isLikelyLmsQuestion(text)) {
    return "I can only help with Kayese LMS topics like courses, enrollments, assignments, quizzes, certificates, dashboard, facilitator tools, and account access.";
  }

  if (text.includes("course") || text.includes("learn") || text.includes("module")) {
    return "You can browse all learning tracks from the Courses page, then open a course to see its modules and lessons.";
  }

  if (text.includes("enroll") || text.includes("register") || text.includes("sign up")) {
    return "To join a course, create your account first, open any course, and click Enroll.";
  }

  if (text.includes("certificate") || text.includes("cert")) {
    return "Certificates are generated after you complete all required lessons and quizzes for your enrolled course.";
  }

  if (text.includes("quiz") || text.includes("assignment") || text.includes("submission")) {
    return "Complete all course assignments and quizzes from the Learn area of your enrolled course, then submit before the deadline shown in the course flow.";
  }

  if (text.includes("dashboard") || text.includes("profile") || text.includes("settings")) {
    return "Use your dashboard to view your learning activity, and open Profile Settings to update your account details.";
  }

  if (text.includes("facilitator") || text.includes("teacher") || text.includes("instructor")) {
    return "Facilitators can create and manage courses from the facilitator dashboard after approval.";
  }

  if (text.includes("login") || text.includes("password") || text.includes("account")) {
    return "If you cannot log in, try resetting your password from the login page or register a new account.";
  }

  return "I can help with LMS questions like courses, enrollments, certificates, facilitator tools, and account access.";
}

function toOpenAIMessages(history: ChatMessage[], question: string) {
  return [
    {
      role: "system",
      content: LMS_SYSTEM_PROMPT,
    },
    ...history.map((entry) => ({ role: entry.role, content: entry.text })),
    { role: "user", content: question },
  ];
}

function extractAnswer(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const data = payload as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function POST(req: NextRequest) {
  try {
    const { question, history } = (await req.json()) as {
      question?: string;
      history?: ChatMessage[];
    };

    const cleanQuestion = question?.trim();
    if (!cleanQuestion) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    if (!isLikelyLmsQuestion(cleanQuestion)) {
      return NextResponse.json({
        answer:
          "I can only help with Kayese LMS topics. Ask me about courses, enrollments, assignments, quizzes, certificates, facilitator/admin tools, or account access.",
        fallback: true,
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ answer: getLmsFallback(cleanQuestion), fallback: true });
    }

    const response = await fetch(
      process.env.OPENAI_CHAT_URL || "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
          temperature: 0.2,
          messages: toOpenAIMessages(Array.isArray(history) ? history.slice(-8) : [], cleanQuestion),
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ answer: getLmsFallback(cleanQuestion), fallback: true });
    }

    const payload = await response.json();
    const answer = extractAnswer(payload) || getLmsFallback(cleanQuestion);

    return NextResponse.json({ answer, fallback: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { answer: "I can help with LMS questions like courses, enrollment, certificates, and account access.", fallback: true },
      { status: 200 }
    );
  }
}