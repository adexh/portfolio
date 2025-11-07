import { useEffect, useRef, useState } from "react";
import {
  SendHorizontal,
  CircleX,
  Sparkles,
  InfoIcon,
  StopCircle,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import Popover from "./ui/popover";

const CLIENT_FINGERPRINT_HEADER = "x-devbot-client";
const REQUEST_SIGNATURE_HEADER = "x-devbot-request";
const CLIENT_RATE_LIMIT_WINDOW_MS = 45_000;
const CLIENT_RATE_LIMIT_MAX = 3;
const CLIENT_RATE_LIMIT_COOLDOWN_MS = 30_000;
type NavigatorWithActivation = Navigator & {
  userActivation?: {
    isActive: boolean;
    hasBeenActive: boolean;
  };
};

const createFallbackFingerprint = () => {
  const seed =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return seed.replace(/[^a-f0-9]/gi, "").padEnd(32, "0").slice(0, 64);
};

type ChatEntry = {
  id: "me" | "ai";
  value: string;
  requestId?: string;
};

export const AIChat = () => {
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChatBox, setChatBoxView] = useState<boolean>(false);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [typing, setTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fingerprintReady, setFingerprintReady] = useState(false);
  const fingerprintRef = useRef<string>("");
  const [cooldownMs, setCooldownMs] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rateLimitWindowRef = useRef<{ start: number; count: number }>({
    start: 0,
    count: 0,
  });
  const [trapTriggered, setTrapTriggered] = useState(false);
  const userInteractedRef = useRef(false);
  const createAiMessage = (value: string, requestId?: string): ChatEntry => ({
    id: "ai",
    value,
    requestId,
  });
  const generateRequestId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  const typingBufferRef = useRef<string>("");
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiResponseRef = useRef<string>("");

  const renderAiContent = (value: string) => {
    const segments = value.split("**");
    return segments.map((segment, index) => {
      const key = `ai-segment-${index}`;
      if (index % 2 === 1) {
        return (
          <span
            key={key}
            className="bg-gradient-to-r from-cyan-200 via-sky-400 to-fuchsia-400 bg-clip-text font-semibold text-transparent drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]"
          >
            {segment}
          </span>
        );
      }
      return (
        <span key={key}>
          {segment}
        </span>
      );
    });
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat]);

  useEffect(() => {
    let cancelled = false;
    const storageKey = "devbot:fingerprint";

    const initializeFingerprint = async () => {
      if (typeof window === "undefined") {
        fingerprintRef.current = createFallbackFingerprint();
        setFingerprintReady(true);
        return;
      }

      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        fingerprintRef.current = stored;
        setFingerprintReady(true);
        return;
      }

      try {
        const encoder = new TextEncoder();
        const material = [
          window.navigator.userAgent,
          Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown",
          window.screen?.width ?? 0,
          window.screen?.height ?? 0,
          window.location.hostname,
          crypto.randomUUID(),
        ].join("|");

        const digest = await crypto.subtle.digest(
          "SHA-256",
          encoder.encode(material)
        );

        if (cancelled) {
          return;
        }

        const fingerprint = Array.from(new Uint8Array(digest))
          .map((value) => value.toString(16).padStart(2, "0"))
          .join("");

        fingerprintRef.current = fingerprint;
        window.localStorage.setItem(storageKey, fingerprint);
      } catch (error) {
        console.error("Failed to initialize Devbot fingerprint", error);
        fingerprintRef.current = createFallbackFingerprint();
      } finally {
        if (!cancelled) {
          setFingerprintReady(true);
        }
      }
    };

    initializeFingerprint();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    },
    []
  );

  const markUserInteraction = () => {
    userInteractedRef.current = true;
  };

  const hasRecentUserActivation = () => {
    if (typeof navigator === "undefined") return true;
    const navigatorWithActivation = navigator as NavigatorWithActivation;
    const activation = navigatorWithActivation.userActivation;
    if (!activation) return true;
    return activation.isActive || activation.hasBeenActive;
  };

  const startCooldown = (duration: number) => {
    if (duration <= 0) return;
    setCooldownMs(duration);
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setInterval(() => {
      setCooldownMs((prev) => {
        if (prev <= 1000) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  const enforceClientRateLimit = () => {
    const now = Date.now();
    const windowData = rateLimitWindowRef.current;
    if (now - windowData.start > CLIENT_RATE_LIMIT_WINDOW_MS) {
      windowData.start = now;
      windowData.count = 0;
    }
    windowData.count += 1;
    if (windowData.count > CLIENT_RATE_LIMIT_MAX) {
      startCooldown(CLIENT_RATE_LIMIT_COOLDOWN_MS);
      throw new Error("CLIENT_RATE_LIMITED");
    }
  };

  const createRequestSignature = async () => {
    if (typeof window === "undefined" || typeof crypto === "undefined") {
      return createFallbackFingerprint();
    }

    if (!fingerprintRef.current) {
      return createFallbackFingerprint();
    }

    try {
      const encoder = new TextEncoder();
      const material = [
        fingerprintRef.current,
        crypto.randomUUID(),
        Date.now().toString(),
      ].join("|");

      const digest = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(material)
      );

      return Array.from(new Uint8Array(digest))
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
    } catch (error) {
      console.error("Failed to generate request signature", error);
      return fingerprintRef.current || createFallbackFingerprint();
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    markUserInteraction();
    if (typing) return;
    if (!chatInput.trim()) return;
    if (!fingerprintReady || !fingerprintRef.current) {
      setErrorMessage("Initializing secure chat channel. Please try again in a moment.");
      return;
    }
    if (trapTriggered) {
      setErrorMessage("Automated submissions are not allowed.");
      return;
    }
    if (cooldownMs > 0) {
      setErrorMessage(
        `Too many rapid prompts. Please wait ${Math.ceil(
          cooldownMs / 1000
        )}s before trying again.`
      );
      return;
    }
    if (!userInteractedRef.current) {
      setErrorMessage("Please interact with the chat input before submitting.");
      return;
    }
    if (!hasRecentUserActivation()) {
      setErrorMessage("Real user interaction is required before sending a prompt.");
      return;
    }
    try {
      enforceClientRateLimit();
    } catch {
      setErrorMessage(
        "You have reached the temporary chat limit. Please wait before sending another prompt."
      );
      return;
    }

    setChatBoxView(true);
    setErrorMessage(null);
    const question = chatInput.trim();
    const userMessage: ChatEntry = { id: "me", value: question };
    const historySnapshot = [...chat, userMessage];
    setChat((prev) => [...prev, userMessage]);
    setChatInput("");
    await generateAIResponse(question, historySnapshot);
  };

  const stopTypingInterval = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const waitForTypingToFlush = () =>
    new Promise<void>((resolve) => {
      const poll = () => {
        if (
          typingBufferRef.current.length === 0 &&
          !typingIntervalRef.current
        ) {
          resolve();
          return;
        }
        setTimeout(poll, 16);
      };
      poll();
    });

  const enqueueTypingCharacters = (chunk: string, requestId: string) => {
    if (!chunk) return;
    typingBufferRef.current += chunk;
    if (!typingIntervalRef.current) {
      typingIntervalRef.current = setInterval(() => {
        if (!typingBufferRef.current.length) {
          stopTypingInterval();
          return;
        }
        const nextChar = typingBufferRef.current[0];
        typingBufferRef.current = typingBufferRef.current.slice(1);
        aiResponseRef.current += nextChar;
        updateLatestAiMessage(aiResponseRef.current, requestId);
      }, 18);
    }
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopTypingInterval();
    typingBufferRef.current = "";
  };

  const updateLatestAiMessage = (value: string, requestId: string) => {
    setChat((prev) => {
      const index = prev.findIndex((message) => message.requestId === requestId);
      if (index === -1) {
        return [...prev, createAiMessage(value, requestId)];
      }
      const updated = [...prev];
      updated[index] = createAiMessage(value, requestId);
      return updated;
    });
  };

  const generateAIResponse = async (question: string, historySnapshot: ChatEntry[]) => {
    setTyping(true);
    setErrorMessage(null);
    stopTypingInterval();
    typingBufferRef.current = "";
    aiResponseRef.current = "";

    const requestId = generateRequestId();
    setChat((prev) => [...prev, createAiMessage("", requestId)]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const requestSignature = await createRequestSignature();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [CLIENT_FINGERPRINT_HEADER]: fingerprintRef.current,
          [REQUEST_SIGNATURE_HEADER]: requestSignature,
        },
        body: JSON.stringify({ prompt: question, history: historySnapshot }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const message = await response.text();
        throw new Error(message || "Gemini API error.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const segments = buffer.split("\n");
        buffer = segments.pop() ?? "";

        for (const segment of segments) {
          if (!segment.trim()) continue;
          let payload: { type: string; token?: string; message?: string };
          try {
            payload = JSON.parse(segment);
          } catch {
            continue;
          }

          if (payload.type === "token" && payload.token) {
            enqueueTypingCharacters(payload.token, requestId);
          }

          if (payload.type === "error") {
            throw new Error(payload.message ?? "Gemini stream failed.");
          }
        }
      }

      await waitForTypingToFlush();

      if (!aiResponseRef.current) {
        updateLatestAiMessage(
          "I could not generate a response right now.",
          requestId
        );
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        stopTypingInterval();
        typingBufferRef.current = "";
        updateLatestAiMessage("Stopped generating the reply.", requestId);
      } else {
        console.error("AI chat error", error);
        stopTypingInterval();
        typingBufferRef.current = "";
        updateLatestAiMessage(
          "Something went wrong while talking to Devbot.",
          requestId
        );
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to reach Devbot."
        );
      }
    } finally {
      await waitForTypingToFlush();
      abortControllerRef.current = null;
      setTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showChatBox && (
          <motion.div
            ref={chatBoxRef}
            initial={{ opacity: 0, height: 0, y: 24 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 24 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative md:w-[80%] w-auto md:mx-32 mx-4 md:mt-3 mt-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-800/40 shadow-[0_20px_60px_-30px_rgba(15,118,255,0.75)] backdrop-blur-3xl"
          >
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white shadow-inner shadow-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 text-lg font-semibold">
                    DT
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/60">
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">Devbot</p>
                    <p className="text-xs text-slate-300">
                      Your Gemini-powered Adesh guide
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[13px]">
                  <Popover
                    event="click"
                    content={
                      <div className="text-sm text-white space-y-2 max-w-xs">
                        <p>
                          <strong>Devbot</strong> streams responses from Google
                          Gemini via a secure backend API.
                        </p>
                        <p>
                          Each answer is grounded in Adesh&rsquo;s portfolio
                          context and politely declines unrelated questions.
                        </p>
                        <p>
                          Your prompts stay within the encrypted serverless
                          edge before reaching Gemini.
                        </p>
                      </div>
                    }
                  >
                    <InfoIcon size={18} className="text-cyan-300" />
                  </Popover>
                  <div className="flex items-center gap-1 text-emerald-300">
                    <Sparkles size={16} />
                    <span>{typing ? "Streaming..." : "Standing by"}</span>
                  </div>
                  <button
                    onClick={() => setChatBoxView(false)}
                    className="rounded-full border border-white/20 p-1 text-white/80 transition hover:scale-110 hover:border-white"
                  >
                    <CircleX size={18} />
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="relative flex max-h-[22rem] flex-col gap-3 overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-3">
                <div className="pointer-events-none absolute inset-x-3 top-3 h-16 rounded-2xl bg-gradient-to-b from-white/15 to-transparent blur-xl" />
                {chat.length === 0 && (
                  <div className="relative mx-auto flex max-w-md flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-5 text-center text-sm text-slate-200">
                    <ShieldCheck size={22} className="text-cyan-300" />
                    <p className="font-semibold text-white">
                      Ask anything about Adesh
                    </p>
                    <p>
                      Devbot uses curated embeddings to give precise answers
                      about experience, projects, and impact.
                    </p>
                  </div>
                )}

                {chat.map((dialog, index) => {
                  const isAi = dialog.id === "ai";
                  return (
                    <div
                      key={`${dialog.id}-${index}-${dialog.requestId ?? "static"}`}
                      className={twMerge(
                        "relative max-w-[85%] rounded-3xl text-sm leading-relaxed shadow-lg shadow-black/30",
                        isAi
                          ? "mr-auto bg-slate-950/80 border border-cyan-500/40"
                          : "ml-auto text-white"
                      )}
                    >
                      {isAi ? (
                        <>
                          <div className="overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-slate-900 via-slate-900/50 to-slate-900/20 p-[1px]">
                            <div className="rounded-[26px] bg-slate-950/80 p-4">
                              <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-[11px] text-slate-900">
                                    DB
                                  </span>
                                  Devbot Insight
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-normal text-slate-400">
                                  <Sparkles size={12} /> Gemini Stream
                                </div>
                              </div>
                              <p className="whitespace-pre-wrap text-slate-100">
                                {renderAiContent(dialog.value)}
                              </p>
                              <div className="mt-4 flex items-center gap-2 text-[11px] text-cyan-200/70">
                                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan-300" />
                                Verified against Adesh&rsquo;s portfolio context
                              </div>
                            </div>
                          </div>
                          <div className="pointer-events-none absolute -left-5 top-5 h-20 w-px bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent" />
                        </>
                      ) : (
                        <>
                          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 p-[1px] shadow-[0_10px_40px_rgba(162,64,228,0.45)]">
                            <div className="relative rounded-[30px] bg-slate-950/70 px-4 py-4 backdrop-blur-xl">
                              <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-fuchsia-100/80">
                                <div className="flex items-center gap-2 tracking-[0.25em]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300 shadow-[0_0_8px_rgba(232,121,249,0.95)]" />
                                  <span className="flex h-5 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 text-[11px] text-white shadow-lg shadow-fuchsia-500/40">
                                    You
                                  </span>
                                </div>
                              </div>
                              <span className="pointer-events-none absolute -right-12 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-3xl -z-10" aria-hidden="true" />
                              <span className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)] opacity-60" aria-hidden="true" />
                              <p className="relative whitespace-pre-wrap text-base text-slate-100">
                                {dialog.value}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handlePromptSubmit}
        className={twMerge(
          "group flex items-center rounded-3xl border border-white/20 bg-slate-900/60 px-3 py-2 text-white shadow-[0_10px_40px_rgba(2,6,23,0.65)] transition focus-within:border-cyan-400 md:w-[80%] w-auto md:mx-32 mx-4 my-4 backdrop-blur",
          typing && "bg-slate-900/80"
        )}
      >
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="devbot-topic">Leave this field empty</label>
          <input
            id="devbot-topic"
            name="topic"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            onChange={() => {
              setTrapTriggered(true);
              setErrorMessage("Automated submissions detected and blocked.");
              startCooldown(CLIENT_RATE_LIMIT_COOLDOWN_MS * 2);
            }}
          />
        </div>
        <input
          type="text"
          placeholder={"Ask anything about me from AI"}
          value={chatInput}
          className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
          onChange={(e) => {
            markUserInteraction();
            setChatInput(e.target.value);
          }}
          onFocus={() => {
            markUserInteraction();
            setChatBoxView(true);
          }}
          onKeyDown={markUserInteraction}
        />
        <button
          type={typing ? "button" : "submit"}
          onClick={typing ? stopStreaming : undefined}
          onMouseDown={markUserInteraction}
          onTouchStart={markUserInteraction}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/40 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={
            (!chatInput.trim() && !typing) ||
            (!typing && (cooldownMs > 0 || !fingerprintReady))
          }
        >
          {typing ? <StopCircle /> : <SendHorizontal />}
        </button>
      </form>
      {cooldownMs > 0 && (
        <p className="text-xs text-amber-200 md:mx-32 mx-4 -mt-2">
          Temporarily throttled for security. Please wait {Math.ceil(cooldownMs / 1000)}s.
        </p>
      )}
    </>
  );
};
