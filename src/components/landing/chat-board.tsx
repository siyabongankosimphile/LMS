"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: number;
  role: ChatRole;
  text: string;
  source?: "live" | "fallback";
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous?: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    text: "Hi! Ask me anything about Kayise Agency LMS.",
  },
];

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

function normalizeAnswer(answer: string, fallback: string) {
  const cleaned = answer.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return fallback;
  }

  return cleaned;
}

type ChatStreamEvent =
  | { type: "meta"; fallback: boolean }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

async function requestAssistantAnswerStream(
  question: string,
  history: Array<{ role: ChatRole; text: string }>,
  handlers: {
    onMeta: (event: { fallback: boolean }) => void;
    onDelta: (event: { text: string }) => void;
  }
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        history,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Request failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const rawBlock = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        const dataLines = rawBlock
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"));

        for (const line of dataLines) {
          const payload = line.slice(5).trim();
          if (!payload) {
            continue;
          }

          let event: ChatStreamEvent;
          try {
            event = JSON.parse(payload) as ChatStreamEvent;
          } catch {
            continue;
          }

          if (event.type === "meta") {
            handlers.onMeta({ fallback: event.fallback });
            continue;
          }

          if (event.type === "delta") {
            handlers.onDelta({ text: event.text });
            continue;
          }

          if (event.type === "error") {
            throw new Error(event.message || "Streaming failed");
          }

          if (event.type === "done") {
            return;
          }
        }

        separatorIndex = buffer.indexOf("\n\n");
      }
    }
  } finally {
    window.clearTimeout(timeout);
  }
}

export function ChatBoard() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasReceivedChunk, setHasReceivedChunk] = useState(false);
  const [isReceivingChunks, setIsReceivingChunks] = useState(false);
  const [activeAssistantMessageId, setActiveAssistantMessageId] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [techNotice, setTechNotice] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const welcomeSpoken = useRef(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const latestVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const messageCounterRef = useRef(2);
  const streamTokenRef = useRef(0);
  const chunkIndicatorTimeoutRef = useRef<number | null>(null);

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

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, open]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const assignPreferredVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      latestVoiceRef.current =
        voices.find((voice) => voice.lang.toLowerCase().startsWith("en-za")) ||
        voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb")) ||
        voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
        null;
    };

    assignPreferredVoice();
    window.speechSynthesis.onvoiceschanged = assignPreferredVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-ZA";

    if (latestVoiceRef.current) {
      utterance.voice = latestVoiceRef.current;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.02;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  const addMessage = (message: Omit<ChatMessage, "id">, shouldSpeak = false) => {
    const withId: ChatMessage = {
      id: messageCounterRef.current,
      ...message,
    };

    messageCounterRef.current += 1;
    setMessages((old) => [...old, withId]);

    if (shouldSpeak && message.role === "assistant") {
      speak(message.text);
    }

    return withId.id;
  };

  const updateMessage = (id: number, patch: Partial<Pick<ChatMessage, "text" | "source">>) => {
    setMessages((old) => old.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const clearChunkIndicatorTimer = () => {
    if (chunkIndicatorTimeoutRef.current !== null) {
      window.clearTimeout(chunkIndicatorTimeoutRef.current);
      chunkIndicatorTimeoutRef.current = null;
    }
  };

  const pulseChunkIndicator = () => {
    setIsReceivingChunks(true);
    clearChunkIndicatorTimer();

    chunkIndicatorTimeoutRef.current = window.setTimeout(() => {
      setIsReceivingChunks(false);
      chunkIndicatorTimeoutRef.current = null;
    }, 350);
  };

  const resetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setIsListening(false);
    setIsSending(false);
    setHasReceivedChunk(false);
    setIsReceivingChunks(false);
    setActiveAssistantMessageId(null);
    setTechNotice("");
    streamTokenRef.current += 1;
    welcomeSpoken.current = false;
    messageCounterRef.current = 2;
    clearChunkIndicatorTimer();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleOpenToggle = () => {
    if (open) {
      setOpen(false);
      resetConversation();
      return;
    }

    setOpen(true);
    const welcomeText = "Welcome to Kayise Agency. How can I help you today?";

    if (!welcomeSpoken.current) {
      addMessage({ role: "assistant", text: welcomeText }, true);
      welcomeSpoken.current = true;
    } else {
      speak("Welcome back.");
    }
  };

  const sendMessage = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isSending) {
      return;
    }

    const historyPayload = messages.slice(-8).map(({ role, text }) => ({ role, text }));

    addMessage({ role: "user", text: trimmed });
    setInput("");
    setTechNotice("");

    try {
      setIsSending(true);
      setHasReceivedChunk(false);
      setIsReceivingChunks(false);

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new Error("You are offline");
      }

      const assistantId = addMessage({ role: "assistant", text: "", source: "live" });
      setActiveAssistantMessageId(assistantId);
      const streamToken = streamTokenRef.current + 1;
      streamTokenRef.current = streamToken;
      let completeAnswer = "";

      await requestAssistantAnswerStream(trimmed, historyPayload, {
        onMeta: ({ fallback }) => {
          if (streamToken !== streamTokenRef.current) {
            return;
          }

          updateMessage(assistantId, { source: fallback ? "fallback" : "live" });
        },
        onDelta: ({ text }) => {
          if (streamToken !== streamTokenRef.current) {
            return;
          }

          setHasReceivedChunk(true);
          pulseChunkIndicator();
          completeAnswer += text;
          updateMessage(assistantId, { text: completeAnswer });
        },
      });

      const normalized = normalizeAnswer(completeAnswer, getLmsReply(trimmed));
      updateMessage(assistantId, { text: normalized });
      clearChunkIndicatorTimer();
      setIsReceivingChunks(false);
      setActiveAssistantMessageId(null);
      speak(normalized);
    } catch (error) {
      const fallbackText = getLmsReply(trimmed);
      const isTimeout =
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "AbortError";

      const issueText = isTimeout
        ? "Network is slow. I answered with local knowledge and kept your chat running."
        : "A technical error happened. I answered with local knowledge and stayed consistent.";

      setTechNotice(issueText);
      clearChunkIndicatorTimer();
      setIsReceivingChunks(false);
      setActiveAssistantMessageId(null);
      addMessage({ role: "assistant", text: fallbackText, source: "fallback" }, true);
    } finally {
      clearChunkIndicatorTimer();
      setIsReceivingChunks(false);
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleVoiceInput = () => {
    setTechNotice("");

    if (!speechRecognition) {
      addMessage(
        {
          role: "assistant",
          text: "Voice input is not supported in this browser.",
        },
        true
      );
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const recognition = new speechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-ZA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      recognitionRef.current = null;
      void sendMessage(transcript);
    };

    recognition.onerror = (event) => {
      const reason = event.error || "unknown";
      setTechNotice(`Voice input error: ${reason}. You can keep typing your question.`);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };

  useEffect(() => {
    return () => {
      streamTokenRef.current += 1;
      clearChunkIndicatorTimer();

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="mb-3 h-[470px] w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Image
                src="/kayise-agency-face.svg"
                alt="Kayise Agency logo"
                width={24}
                height={24}
                className="rounded-full bg-white/10"
              />
              <p className="text-sm font-semibold">Kayise Agency</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setVoiceEnabled((old) => !old);
                  if (voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="rounded-md px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
              >
                {voiceEnabled ? "Voice On" : "Voice Off"}
              </button>
              <button
                type="button"
                onClick={handleOpenToggle}
                className="rounded-md px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>

          <div ref={messagesContainerRef} className="h-[320px] space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "assistant"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "ml-auto bg-cyan-500 text-white"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="mb-1 flex items-center gap-1.5">
                    <Image
                      src="/kayise-agency-face.svg"
                      alt="Kayise Agency logo"
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    <span className="text-[11px] font-semibold text-slate-500">Kayise Agency</span>
                  </div>
                ) : null}
                {message.role === "assistant" && message.source === "fallback" ? (
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-amber-600">Backup answer</span>
                ) : null}
                {message.text}
                {message.role === "assistant" && message.id === activeAssistantMessageId && isReceivingChunks ? (
                  <span className="ml-1 inline-block animate-pulse font-semibold text-cyan-500">|</span>
                ) : null}
              </div>
            ))}

            {isSending && !hasReceivedChunk ? (
              <div className="max-w-[85%] rounded-xl bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                Thinking...
              </div>
            ) : null}
          </div>

          {techNotice ? <p className="border-t border-slate-200 px-3 pt-2 text-xs text-amber-700">{techNotice}</p> : null}

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
              {isListening ? "Stop" : "Mic"}
            </button>
            <button
              type="submit"
              disabled={isSending || !input.trim()}
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
        Kayise Agency
      </button>
    </div>
  );
}