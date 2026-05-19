"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Send, Leaf } from "lucide-react";

interface Verse {
  verseId: string;
  sanskrit: string;
  english: string;
  hindi: string;
  modernGuidance: string;
}

interface Message {
  role: "user" | "arjuna";
  content: string;
  verse?: Verse;
}

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
}

// Premium Expandable Scripture Discloser for Hidden Depth Vibe
function VerseDisclosure({ verse }: { verse: Verse }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 pt-4 border-t border-sacred-blush/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-xs font-semibold tracking-wider text-spiritual-gold hover:text-text-primary transition-colors focus:outline-none py-1.5 cursor-pointer"
      >
        <span className="flex items-center gap-1.5 font-serif italic text-spiritual-gold">
          📖 Reflect on Verse {verse.verseId}
        </span>
        <span className="text-[9px] font-sans text-text-muted uppercase tracking-wider">
          {isOpen ? "[ Hide Scripture ]" : "[ Reveal Scripture ]"}
        </span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-3 mt-3 bg-white/30 backdrop-blur-md p-4 rounded-sacred border border-white/20 italic"
          >
            <p className="text-base text-text-primary font-serif leading-relaxed text-center py-2 select-text">
              {verse.sanskrit}
            </p>
            {verse.hindi && (
              <div className="text-xs text-text-secondary leading-relaxed border-t border-white/20 pt-2 select-text">
                <span className="font-sans font-bold tracking-widest text-[9px] uppercase text-text-muted block mb-1">Hindi</span>
                {verse.hindi}
              </div>
            )}
            <div className="text-xs text-text-secondary leading-relaxed border-t border-white/20 pt-2 select-text">
              <span className="font-sans font-bold tracking-widest text-[9px] uppercase text-text-muted block mb-1">English</span>
              {verse.english}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatInterface({
  messages,
  setMessages,
  activeSessionId,
  setActiveSessionId,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height dynamically based on input length
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const saveChatSession = (id: string, msgs: Message[]) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("arjuna_history");
      let history = raw ? JSON.parse(raw) : [];

      const firstUserMsg = msgs.find((m) => m.role === "user")?.content || "Reflection journey";
      const title = firstUserMsg.length > 60 ? firstUserMsg.substring(0, 57) + "..." : firstUserMsg;

      const existingIndex = history.findIndex((s: any) => s.id === id);

      const session = {
        id,
        title,
        messages: msgs,
        timestamp: Date.now(),
      };

      if (existingIndex > -1) {
        history[existingIndex] = session;
      } else {
        history = [session, ...history];
      }

      // Sort by timestamp desc and cap at 2
      history.sort((a: any, b: any) => b.timestamp - a.timestamp);
      history = history.slice(0, 2);

      localStorage.setItem("arjuna_history", JSON.stringify(history));

      // Trigger custom event so sidebar updates instantly
      window.dispatchEvent(new Event("historyUpdated"));
    } catch (e) {
      console.error("Failed to save chat session history:", e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Get or create session ID
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setActiveSessionId(sessionId);
    }

    // Save intermediate history
    saveChatSession(sessionId, updatedMessages);

    try {
      // Pass the conversation history so Gemini is context-aware (Delayed Injection)
      const response = await axios.post("https://digital-sanctuary-ou9k.onrender.com/api/chat", {
        message: input,
        history: messages,
      });

      const arjunaMessage: Message = {
        role: "arjuna",
        content: response.data.message,
        verse: response.data.verse,
      };

      const finalMessages = [...updatedMessages, arjunaMessage];
      setMessages(finalMessages);
      saveChatSession(sessionId, finalMessages);
    } catch (error) {
      console.error("Chat error:", error);
      const errMessage: Message = {
        role: "arjuna",
        content: "I apologize, but my connection to the divine wisdom was interrupted. Please try again.",
      };
      const finalMessages = [...updatedMessages, errMessage];
      setMessages(finalMessages);
      saveChatSession(sessionId, finalMessages);
    } finally {
      setLoading(false);
    }
  };

  // Smart Enter Key Handling (Enter sends, Shift+Enter adds newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[65vh] w-full max-w-2xl mx-auto glass-card p-6 overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-8 pr-4 scrollbar-hide"
      >
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 space-y-4"
            >
              <h2 className="text-3xl font-serif text-text-secondary italic">"How is your mind feeling today?"</h2>
              <p className="text-text-muted">Share your thoughts, and Arjuna will guide you.</p>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Capped at max-w-[70%] for superior typographical reading rhythm */}
              <div
                className={`max-w-[70%] md:max-w-[75%] p-5 rounded-sacred select-text border ${
                  msg.role === "user"
                    ? "bg-sacred-blush/30 text-text-primary border-sacred-blush/20"
                    : "bg-white/60 text-text-secondary border-white/40 shadow-sm"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap select-text text-sm">
                  {msg.content}
                </p>

                {msg.verse && (
                  <VerseDisclosure verse={msg.verse} />
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/60 p-5 rounded-sacred animate-soft-breathe">
                <Leaf className="w-5 h-5 text-sacred-blush animate-spin-slow" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input container upgraded to auto-expanding multiline area */}
      <div className="mt-6 relative flex items-end gap-2 bg-white/50 border border-white/60 rounded-sacred py-3 px-5 focus-within:ring-2 focus-within:ring-sacred-blush/30 focus-within:border-white/80 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share your heart..."
          className="flex-1 bg-transparent border-0 outline-none resize-none overflow-y-auto max-h-40 placeholder:text-text-muted text-sm text-text-primary leading-relaxed py-1 scrollbar-hide focus:ring-0 focus:outline-none"
          style={{ minHeight: "24px" }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="p-2 rounded-full hover:bg-sacred-blush/20 transition-colors text-sacred-blush disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer flex-shrink-0 mb-0.5"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
