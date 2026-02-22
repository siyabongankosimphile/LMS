import { NextRequest, NextResponse } from "next/server";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  role: ChatRole;
  text: string;
};

function getLmsFallback(question: string) {
  const text = question.toLowerCase();

  if (text.includes("course") || text.includes("learn") || text.includes("module")) {
    return "You can browse all learning tracks from the Courses page, then open a course to see its modules and lessons.";
  }

  if (text.includes("enroll") || text.includes("register") || text.includes("sign up")) {
    return "To join a course, create your account first, open any course, and click Enroll.";
  }

  if (text.includes("certificate") || text.includes("cert")) {
    return "Certificates are generated after you complete all required lessons and quizzes for your enrolled course.";
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
      content:
        "You are a helpful assistant for Kayese LMS. Answer only LMS-related questions clearly and briefly. If the user asks unrelated questions, politely redirect to LMS help topics.",
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