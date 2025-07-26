import { useEffect, useRef, useState } from "react";
import { SendHorizontal, CircleX, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AIChat = () => {
  const [chat, setChat] = useState([
    { id: "me", value: "Hi How are you ?" },
    {
      id: "ai",
      value: `Key Features:
      ...`,
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [showChatBox, setChatBoxView] = useState<boolean>(false);

  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth", // <-- adds animation
      });
    }
  }, [chat]);

  const handlePromptSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatInput.trim()) return; // Prevent empty messages
    setChatBoxView(true);
    setChat((prev) => [...prev, { id: "me", value: chatInput }]);
    setChatInput("");
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
            <div className="sticky top-0 flex justify-end p-0">
              <button
                onClick={() => setChatBoxView(false)}
                className="text-red-500 backdrop-blur-sm rounded-full hover:scale-120"
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
        className="flex rounded-2xl border-2 px-4 border-blue-900 h-10 has-[:focus]:bg-slate-900 has-[:focus]:border-blue-400 shadow-lg shadow-fuchsia-800 w-[80%] my-4 peer"
      >
        <input
          type="text"
          placeholder="Ask anything about me from AI"
          value={chatInput}
          className="border-none outline-none w-full bg-transparent"
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button className="peer-focus:text-slate-700">
          <SendHorizontal />
        </button>
      </form>
    </>
  );
};
