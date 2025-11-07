import { useEffect, useRef, useState } from "react";
import { SendHorizontal, CircleX, Sparkles, InfoIcon, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import Popover from "./ui/popover";

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
  const pendingAIRequestId = useRef<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createAiMessage = (value: string, requestId?: string): ChatEntry => ({
    id: "ai",
    value,
    requestId,
  });
  const generateRequestId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat]);

  const handlePromptSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typing) return;
    if (!chatInput.trim()) return;

    setChatBoxView(true);
    setErrorMessage(null);
    const question = chatInput.trim();
    const userMessage: ChatEntry = { id: "me", value: question };
    const historySnapshot = [...chat, userMessage];
    setChat((prev) => [...prev, userMessage]);
    setChatInput("");
    await generateAIResponse(question, historySnapshot);
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
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

    const requestId = generateRequestId();
    setChat((prev) => [...prev, createAiMessage("", requestId)]);
    pendingAIRequestId.current = requestId;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      let aiResponse = "";

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
            aiResponse += payload.token;
            updateLatestAiMessage(aiResponse, requestId);
          }

          if (payload.type === "error") {
            throw new Error(payload.message ?? "Gemini stream failed.");
          }
        }
      }

      if (!aiResponse) {
        updateLatestAiMessage(
          "I could not generate a response right now.",
          requestId
        );
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        updateLatestAiMessage("Stopped generating the reply.", requestId);
      } else {
        console.error("AI chat error", error);
        updateLatestAiMessage(
          "Something went wrong while talking to Devbot.",
          requestId
        );
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to reach Devbot."
        );
      }
    } finally {
      abortControllerRef.current = null;
      pendingAIRequestId.current = null;
      setTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showChatBox && (
          <motion.div
            ref={chatBoxRef}
            initial={{ opacity: 0, height: 0, position: 'absolute' }}
            animate={{ opacity: 1, height: "auto", position: 'relative' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative md:w-[80%] w-auto md:mx-32 mx-4 md:mt-1 mt-4 border-2 border-blue-800 rounded-3xl flex flex-col overflow-y-auto max-h-[20rem]"
          >
            <div className="sticky top-0 flex justify-between items-center p-2 space-x-4 backdrop-blur-sm bg-gray-800/50 rounded-3xl">
              <Popover
                event="click"
                content={
                  <div className="text-sm text-white space-y-2 max-w-xs">
                    <p><strong>Devbot</strong> streams responses from Google Gemini via a secure backend API.</p>
                    <p>Each answer is grounded in Adesh&rsquo;s portfolio context and politely declines unrelated questions.</p>
                    <p>Your prompts never leave the encrypted serverless function beyond Gemini.</p>
                  </div>
                }
              >
                <InfoIcon size={20} className="text-blue-500" />
              </Popover>
              <div className="flex flex-1 items-center justify-end gap-3 text-sm">
                {typing ? (
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Sparkles size={16} /> Streaming from Devbot...
                  </span>
                ) : (
                  <span className="text-gray-200">Ask Devbot anything about Adesh.</span>
                )}
                {typing && (
                  <button
                    onClick={stopStreaming}
                    className="text-red-500 px-2 rounded-full hover:scale-110 transition"
                  >
                    Stop
                  </button>
                )}
              </div>

              <button
                onClick={() => setChatBoxView(false)}
                className="text-red-500 rounded-full hover:scale-110"
              >
                <CircleX />
              </button>
            </div>

            {errorMessage && (
              <div className="px-4 text-sm text-red-400">
                {errorMessage}
              </div>
            )}

            {chat.map((dialog, index) => (
              <div
                key={index}
                className={`p-2 m-2 ${dialog.id === "me"
                  ? "self-end rounded-2xl bg-purple-600 w-fit ml-10"
                  : "bg-blue-800 rounded-2xl w-fit mr-10"
                  }`}
              >
                <p className="flex gap-2">
                  {dialog.id === "ai" && <Sparkles size={20} className="inline" />}
                  {dialog.value}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence >

      <form
        onSubmit={handlePromptSubmit}
        className={twMerge("flex rounded-2xl border-2 px-4 border-blue-900 h-10 md:w-[80%] w-auto md:mx-32 mx-4 my-4", typing && "bg-gray-600/25 backdrop-blur-sm")}
      >
        <input
          type="text"
          placeholder={"Ask anything about me from AI"}
          value={chatInput}
          className="border-none outline-none w-full bg-transparent"
          onChange={(e) => setChatInput(e.target.value)}
          onFocus={() => setChatBoxView(true)}
        />
        <button
          type={typing ? "button" : "submit"}
          onClick={typing ? stopStreaming : undefined}
        >
          {typing ? <StopCircle /> : <SendHorizontal />}
        </button>
      </form>
    </>
  );
};
