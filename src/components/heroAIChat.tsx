import { useEffect, useRef, useState } from "react";
import { SendHorizontal, CircleX, Sparkles, InfoIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateMLCEngine, MLCEngine, ChatCompletionUserMessageParam } from "@mlc-ai/web-llm";

export const AIChat = () => {
  const [chat, setChat] = useState<{ id: string; value: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChatBox, setChatBoxView] = useState<boolean>(false);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  const [engine, setEngine] = useState<MLCEngine>();
  const [loading, setLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  // ✅ Controller to cancel loading
  const abortRef = useRef<AbortController | null>(null);

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
    if (!chatInput.trim()) return;

    setChatBoxView(true);
    const userMessage = { id: "me", value: chatInput };
    setChat((prev) => [...prev, userMessage]);

    const question = chatInput.toString();
    setChatInput("");

    const eng = await startLoading();

    await generateAIResponse(eng, question);
  };

  const stopLoading = async () => {
    await engine?.interruptGenerate();
    await engine?.unload(); // Close the engine if it was created

    setLoading(false);
    setProgress(0);
  };

  const startLoading = async () => {
    if (engine) return engine

    setLoading(true);

    try {
      const eng = await CreateMLCEngine("Qwen2.5-0.5B-Instruct-q4f16_1-MLC", {
        initProgressCallback: ({ progress }: { progress: number }) => {
          setProgress(progress);
        }
      });

      setEngine(eng);
      setLoading(false);
      setModelLoaded(true);

      return eng;
    } catch (err: any) {
      console.error("Model loading failed:", err);
      alert("Some error while loading the model in the browser");
      setLoading(false);
    }
  }

  const generateAIResponse = async (eng: MLCEngine | undefined, question: string) => {
    let aiResponse = "";

    const messages: ChatCompletionUserMessageParam[] = [
      { role: "user", content: question },
    ];

    const reply = await eng?.chat.completions.create({ messages, stream: true });

    if (reply) {
      for await (const chunk of reply) {
        const delta = chunk.choices[0]?.delta?.content || "";
        aiResponse += delta;

        setChat((prev) => {
          const updated = [...prev];
          if (updated[updated.length - 1]?.id === "ai") {
            updated[updated.length - 1] = { id: "ai", value: aiResponse };
          } else {
            updated.push({ id: "ai", value: aiResponse });
          }
          return updated;
        });
      }
    } else {
      setChat((prev) => [...prev, { id: "ai", value: "No Response" }]);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showChatBox && (
          <motion.div
            ref={chatBoxRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "12rem", scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative w-[80%] border-2 border-blue-800 rounded-3xl flex flex-col p-4 overflow-y-auto"
          >
            <div className="sticky top-0 flex justify-between items-center px-2 space-x-4 backdrop-blur-sm bg-gray-800/50 rounded-3xl">
              <InfoIcon size={20} className="text-blue-500" />
              {loading && (
                <>
                  <span className="min-w-fit text-sm">Loading Model...</span>
                  <button
                    onClick={stopLoading}
                    className="text-red-500 px-2 rounded-full hover:scale-110"
                  >
                    Stop
                  </button>
                  <div className="w-full h-2 bg-gray-700 rounded-lg overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.min(progress * 100, 100)}%` }}
                      transition={{ ease: "linear", duration: 0.1 }}
                    />
                  </div>
                </>
              )}

              {modelLoaded && (
                <>
                  <span className="min-w-fit text-sm">ML Engine is loaded</span>
                </>
              )}

              {!modelLoaded && !loading && <>
                <span className="min-w-fit text-sm">Start ML Engine loading or Say Hi</span>
                <button
                  onClick={startLoading}
                  className="text-green-500 px-2 rounded-full hover:scale-110"
                >
                  Start
                </button>
              </>}

              <button
                onClick={() => setChatBoxView(false)}
                className="text-red-500 rounded-full hover:scale-110"
              >
                <CircleX />
              </button>
            </div>

            {chat.map((dialog, index) => (
              <div
                key={index}
                className={`p-2 my-2 ${dialog.id === "me"
                  ? "self-end rounded-2xl bg-purple-600 w-fit"
                  : "bg-blue-800 rounded-2xl w-fit"
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
      </AnimatePresence>

      <form
        onSubmit={handlePromptSubmit}
        className="flex rounded-2xl border-2 px-4 border-blue-900 h-10 w-[80%] my-4"
      >
        <input
          type="text"
          placeholder="Ask anything about me from AI"
          value={chatInput}
          className="border-none outline-none w-full bg-transparent"
          onChange={(e) => setChatInput(e.target.value)}
          onFocus={() => setChatBoxView(true)}
        />
        <button>
          <SendHorizontal />
        </button>
      </form>
    </>
  );
};
