"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: number;
  role: ChatRole;
  text: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getLmsReply(question: string) {
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

export function ChatBoard() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hi! Ask me anything about Kayese LMS.",
    },
  ]);

  const welcomeSpoken = useRef(false);

  const speechRecognition = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const speechWindow = window as typeof window & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor;
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    };

    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  }, []);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleOpenToggle = () => {
    setOpen((prev) => {
      const next = !prev;

      if (next) {
        const welcomeText = "Welcome to Kayese LMS";
        speak(welcomeText);

        if (!welcomeSpoken.current) {
          setMessages((old) => [
            ...old,
            { id: Date.now(), role: "assistant", text: `${welcomeText}. How can I help you today?` },
          ]);
          welcomeSpoken.current = true;
        }
      }

      return next;
    });
  };

  const sendMessage = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = { id: Date.now(), role: "user", text: trimmed };
    const historyPayload = messages.slice(-8).map(({ role, text }) => ({ role, text }));

    setMessages((old) => [...old, userMessage]);
    setInput("");

    try {
      setIsSending(true);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmed,
          history: historyPayload,
        }),
      });

      const payload = (await response.json()) as { answer?: string };
      const assistantText = payload.answer?.trim() || getLmsReply(trimmed);

      setMessages((old) => [
        ...old,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: assistantText,
        },
      ]);
    } catch {
      setMessages((old) => [
        ...old,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: getLmsReply(trimmed),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleVoiceInput = () => {
    if (!speechRecognition) {
      setMessages((old) => [
        ...old,
        {
          id: Date.now(),
          role: "assistant",
          text: "Voice input is not supported in this browser.",
        },
      ]);
      return;
    }

    setIsListening(true);
    const recognition = new speechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      void sendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="mb-3 h-[430px] w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <p className="text-sm font-semibold">Kayese LMS Assistant</p>
            <button
              type="button"
              onClick={handleOpenToggle}
              className="rounded-md px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              Close
            </button>
          </div>

          <div className="h-[300px] space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "assistant"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "ml-auto bg-cyan-500 text-white"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about courses, enrollment..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className="rounded-lg border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-100"
            >
              {isListening ? "..." : "🎤"}
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="rounded-lg bg-cyan-500 px-3 text-sm font-semibold text-white hover:bg-cyan-600"
            >
              {isSending ? "..." : "Send"}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleOpenToggle}
        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
      >
        Chat Board
      </button>
    </div>
  );
}