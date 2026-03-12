import { NextRequest, NextResponse } from "next/server";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  role: ChatRole;
  text: string;
};

const LMS_SYSTEM_PROMPT =
  "You are the Kayese LMS assistant. Follow these rules exactly: (1) Answer only Kayese LMS topics: courses, lessons, modules, enrollments, assignments, quizzes, certificates, dashboard, profile settings, facilitator tools, admin tools, account access, and platform usage. (2) Keep answers accurate, practical, and consistent with previous context. (3) Use South African English in wording and spelling. (4) If the question is not LMS-related, politely say you can only help with LMS topics and suggest one LMS-related question. (5) If the request is unclear but LMS-related, ask one short clarifying question.";

const MAX_HISTORY = 10;

type ChatStreamEvent =
  | { type: "meta"; fallback: boolean }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

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

function normaliseText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normaliseHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((entry): entry is { role?: unknown; text?: unknown } => Boolean(entry && typeof entry === "object"))
    .map((entry) => {
      const role = entry.role === "assistant" ? "assistant" : "user";
      const text = typeof entry.text === "string" ? normaliseText(entry.text) : "";

      return { role, text };
    })
    .filter((entry) => entry.text.length > 0)
    .slice(-MAX_HISTORY);
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
    choices?: { message?: { content?: string | Array<{ type?: string; text?: string }> } }[];
  };

  const first = data.choices?.[0]?.message?.content;

  if (typeof first === "string") {
    return normaliseText(first);
  }

  if (Array.isArray(first)) {
    const text = first
      .filter((item) => item && item.type === "text" && typeof item.text === "string")
      .map((item) => item.text as string)
      .join(" ");

    return normaliseText(text);
  }

  return "";
}

function extractDelta(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const data = payload as {
    choices?: { delta?: { content?: string | Array<{ type?: string; text?: string }> } }[];
  };

  const content = data.choices?.[0]?.delta?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter((item) => item && item.type === "text" && typeof item.text === "string")
      .map((item) => item.text as string)
      .join("");
  }

  return "";
}

function toSseEvent(event: ChatStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function callOpenAI(cleanQuestion: string, history: ChatMessage[], apiKey: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
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
            temperature: 0.1,
            top_p: 0.9,
            messages: toOpenAIMessages(history, cleanQuestion),
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        if (attempt === 1) {
          return "";
        }

        continue;
      }

      const payload = await response.json();
      return extractAnswer(payload);
    } catch {
      if (attempt === 1) {
        return "";
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return "";
}

function createFallbackStreamResponse(text: string) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(toSseEvent({ type: "meta", fallback: true })));
        controller.enqueue(encoder.encode(toSseEvent({ type: "delta", text })));
        controller.enqueue(encoder.encode(toSseEvent({ type: "done" })));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );
}

function createStreamingResponse(cleanQuestion: string, history: ChatMessage[], apiKey: string) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        const fallbackAnswer = getLmsFallback(cleanQuestion);
        const emit = (event: ChatStreamEvent) => {
          controller.enqueue(encoder.encode(toSseEvent(event)));
        };

        for (let attempt = 0; attempt < 2; attempt += 1) {
          const abortController = new AbortController();
          const timeout = setTimeout(() => abortController.abort(), 15000);

          try {
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
                  temperature: 0.1,
                  top_p: 0.9,
                  stream: true,
                  messages: toOpenAIMessages(history, cleanQuestion),
                }),
                signal: abortController.signal,
              }
            );

            if (!response.ok || !response.body) {
              if (attempt === 1) {
                emit({ type: "meta", fallback: true });
                emit({ type: "delta", text: fallbackAnswer });
                emit({ type: "done" });
                controller.close();
                return;
              }

              continue;
            }

            emit({ type: "meta", fallback: false });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                emit({ type: "done" });
                controller.close();
                return;
              }

              buffer += decoder.decode(value, { stream: true });

              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() ?? "";

              for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line.startsWith("data:")) {
                  continue;
                }

                const payload = line.slice(5).trim();
                if (!payload) {
                  continue;
                }

                if (payload === "[DONE]") {
                  emit({ type: "done" });
                  controller.close();
                  return;
                }

                let parsed: unknown;
                try {
                  parsed = JSON.parse(payload);
                } catch {
                  continue;
                }

                const delta = extractDelta(parsed);
                if (delta) {
                  emit({ type: "delta", text: delta });
                }
              }
            }
          } catch {
            if (attempt === 1) {
              emit({ type: "meta", fallback: true });
              emit({ type: "delta", text: fallbackAnswer });
              emit({ type: "done" });
              controller.close();
              return;
            }
          } finally {
            clearTimeout(timeout);
          }
        }

        emit({ type: "meta", fallback: true });
        emit({ type: "delta", text: fallbackAnswer });
        emit({ type: "done" });
        controller.close();
      },
      cancel() {
        return;
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { question, history, stream } = (await req.json()) as {
      question?: string;
      history?: unknown;
      stream?: boolean;
    };

    const cleanQuestion = normaliseText(question || "");
    if (!cleanQuestion) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const wantsStream = stream === true;
    const normalisedHistory = normaliseHistory(history);

    if (!isLikelyLmsQuestion(cleanQuestion)) {
      if (wantsStream) {
        return createFallbackStreamResponse(
          "I can only help with Kayese LMS topics. Ask me about courses, enrollments, assignments, quizzes, certificates, facilitator/admin tools, or account access."
        );
      }

      return NextResponse.json({
        answer:
          "I can only help with Kayese LMS topics. Ask me about courses, enrollments, assignments, quizzes, certificates, facilitator/admin tools, or account access.",
        fallback: true,
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      if (wantsStream) {
        return createFallbackStreamResponse(getLmsFallback(cleanQuestion));
      }

      return NextResponse.json({ answer: getLmsFallback(cleanQuestion), fallback: true });
    }

    if (wantsStream) {
      return createStreamingResponse(cleanQuestion, normalisedHistory, apiKey);
    }

    const modelAnswer = await callOpenAI(cleanQuestion, normalisedHistory, apiKey);
    const fallback = !modelAnswer;
    const answer = modelAnswer || getLmsFallback(cleanQuestion);

    return NextResponse.json({ answer, fallback });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { answer: "I can help with LMS questions like courses, enrollment, certificates, and account access.", fallback: true },
      { status: 200 }
    );
  }
}