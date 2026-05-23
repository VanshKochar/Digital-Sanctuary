"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Send, Leaf, Copy, Check } from "lucide-react";

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

// Minimal Premium Copy Button appearing on hover
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg bg-white/70 hover:bg-white border border-white/50 shadow-sm text-text-secondary hover:text-text-primary transition-all duration-255 focus:outline-none flex items-center gap-1.5 cursor-pointer active:scale-95"
        title="Copy response"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="copied"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-sans font-semibold text-emerald-600 pr-0.5">Copied!</span>
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center"
            >
              <Copy className="w-3.5 h-3.5 text-sacred-blush hover:text-text-primary transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const saveChatSession = (id: string, msgs: Message[]) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("arjuna_history");
      interface LocalChatSession {
        id: string;
        title: string;
        messages: Message[];
        timestamp: number;
      }
      let history: LocalChatSession[] = raw ? JSON.parse(raw) : [];

      const firstUserMsg = msgs.find((m) => m.role === "user")?.content || "Reflection journey";
      const title = firstUserMsg.length > 60 ? firstUserMsg.substring(0, 57) + "..." : firstUserMsg;

      const existingIndex = history.findIndex((s: LocalChatSession) => s.id === id);

      const session: LocalChatSession = {
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
      history.sort((a: LocalChatSession, b: LocalChatSession) => b.timestamp - a.timestamp);
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

  // Smooth scroll logic to latest message bubbles
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[74vh] w-full max-w-3xl mx-auto glass-card p-6 md:p-8 overflow-hidden transition-all duration-500 shadow-md hover:shadow-lg">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 md:space-y-8 pr-2 scrollbar-hide scroll-smooth"
      >
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 space-y-4"
            >
              <h2 className="text-3xl md:text-4xl font-serif text-text-secondary italic leading-snug">&quot;How is your mind feeling today?&quot;</h2>
              <p className="text-text-muted text-sm md:text-base">Share your thoughts, and Arjuna will guide you.</p>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.9 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Spacious, premium message bubbles capped for superior reading rhythm */}
              <div
                className={`relative group max-w-[75%] md:max-w-[80%] p-5 md:p-6 rounded-sacred select-text border transition-all duration-300 hover:shadow-sm ${
                  msg.role === "user"
                    ? "bg-sacred-blush/30 text-text-primary border-sacred-blush/20 hover:bg-sacred-blush/35"
                    : "bg-white/60 text-text-secondary border-white/40 shadow-sm hover:bg-white/70"
                }`}
              >
                {msg.role === "arjuna" && (
                  <CopyButton text={msg.content} />
                )}

                <p className="leading-relaxed whitespace-pre-wrap select-text text-sm md:text-base pr-4">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-start"
            >
              <div className="bg-white/60 p-5 rounded-sacred animate-soft-breathe">
                <Leaf className="w-5 h-5 text-sacred-blush animate-spin-slow" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input container upgraded to auto-expanding premium area */}
      <div className="mt-6 relative flex items-end gap-3 bg-white/60 border border-white/70 rounded-sacred py-3.5 px-5.5 focus-within:ring-2 focus-within:ring-sacred-blush/30 focus-within:border-white/90 shadow-sm transition-all duration-300">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share your heart..."
          className="flex-1 bg-transparent border-0 outline-none resize-none overflow-y-auto max-h-48 placeholder:text-text-muted text-sm md:text-base text-text-primary leading-relaxed py-1 scrollbar-hide focus:ring-0 focus:outline-none"
          style={{ minHeight: "26px" }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className={`p-2.5 rounded-full transition-all duration-300 flex-shrink-0 mb-0.5 flex items-center justify-center ${
            loading || !input.trim()
              ? "bg-black/[0.03] text-text-muted/65 cursor-not-allowed"
              : "bg-sacred-blush text-white shadow-md shadow-sacred-blush/25 hover:bg-sacred-blush/90 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer"
          }`}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
