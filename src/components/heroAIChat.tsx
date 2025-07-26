"use client"

import { Input } from "./ui/Input"
import { useRef, useState } from "react"
import { SendHorizontal } from 'lucide-react';
import { CircleX, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AIChat = () => {

  const [chat, setChat] = useState([
    { id: "me", value:"Hi How are you ?" },
    { id:"ai", value: `Key Features:
No handleChange: Values are fetched directly from the FormData object during form submission.
Cleaner Inputs: Inputs don't require state binding.
FormData API: Automatically handles input values without the need for a handleChange function.
How It Works:
FormData API: Fetches values from the form fields by their name attributes.
Dynamic Submission: You access the values only during submission.
Optional Reset: The form.reset() function clears the input fields after submission, making the form ready for new data.
This method is great for simple forms and avoids the need for explicitly tracking input changes.`}
  ]);

  const [ chatInput, setChatInput ] = useState("");
  const [showChatBox, setChatBoxView] = useState<Boolean>(false);

  const handlePromptSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChatBoxView(true);
    setChat([...chat, {id:"me", value:chatInput}]);
    setChatInput("");
  }

  return <>
    <AnimatePresence>
      { showChatBox &&
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "12rem", scale: 1 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className=" w-[80%] border-2 border-blue-800 rounded-3xl flex flex-col p-2 overflow-y-auto">
          <button
            onClick={()=> setChatBoxView(false)}
            className="self-end mb-2 text-red-500 hover:scale-110"
            >
            <CircleX />
          </button>
          { chat.map( (dialog, index) =>
            <div key={index} className={`p-2 my-2 ${dialog.id=="me" && "self-end rounded-3xl bg-slate-600 w-fit"}`}>
              <p className="flex gap-2"> { dialog.id == 'ai' && <Sparkles size={40} className="inline" /> } {dialog.value} </p>
            </div>
          )}
        </motion.div>
      }
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
          onChange={(e)=> setChatInput(e.target.value)}
          // onFocus={() => setChatBoxView(true)}
        />
        <button className="peer-focus:text-slate-700" >
          <SendHorizontal />
        </button>
      </form>
  </>
}