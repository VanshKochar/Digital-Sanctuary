"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  MessageSquare,
  Mic,
  Plus,
  ChevronRight,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Types
export interface ChatMessage {
  role: "user" | "arjuna";
  content: string;
  verse?: {
    verseId: string;
    sanskrit: string;
    english: string;
    hindi: string;
    modernGuidance: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface VoiceSession {
  id: string;
  title: string;
  transcript: string;
  timestamp: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Chat actions (Arjuna Mode)
  onSelectChat?: (session: ChatSession) => void;
  onNewChat?: () => void;
  activeChatId?: string | null;
  // Voice actions (Saarthi AI)
  onSelectVoice?: (session: VoiceSession) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  onSelectChat,
  onNewChat,
  activeChatId,
  onSelectVoice,
}: SidebarProps) {
  const pathname = usePathname();
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [voiceHistory, setVoiceHistory] = useState<VoiceSession[]>([]);
  const [selectedVoiceSession, setSelectedVoiceSession] = useState<VoiceSession | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadHistory = () => {
        const chatData = localStorage.getItem("arjuna_history");
        const voiceData = localStorage.getItem("saarthi_history");

        if (chatData) {
          try { setChatHistory(JSON.parse(chatData).slice(0, 2)); } catch (e) { console.error("Error parsing chat history:", e); }
        }
        if (voiceData) {
          try { setVoiceHistory(JSON.parse(voiceData).slice(0, 2)); } catch (e) { console.error("Error parsing voice history:", e); }
        }
      };

      loadHistory();
      window.addEventListener("storage", loadHistory);
      window.addEventListener("historyUpdated", loadHistory);
      return () => {
        window.removeEventListener("storage", loadHistory);
        window.removeEventListener("historyUpdated", loadHistory);
      };
    }
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const navLinks = [
    { href: "/arjuna", label: "Arjuna Mode" },
    { href: "/saarthi", label: "Saarthi AI" },
    { href: "/inner-atlas", label: "Inner Atlas" },
  ];

  return (
    <>
      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-brand-ivory/95 backdrop-blur-xl border-r border-brand-peach z-50 p-6 flex flex-col justify-between shadow-2xl selection:bg-brand-peach/30"
            >
              <div className="space-y-8 flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-brand-peach/60">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-brand-forest" />
                    <span className="font-serif italic text-lg text-brand-forest">
                      Sanctuary Journeys
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-brand-peach/40 text-brand-forest/60 hover:text-brand-forest transition-colors focus:outline-none focus:ring-2 focus:ring-brand-peach/40"
                    aria-label="Close history sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Navigation Links */}
                <nav className="flex flex-col gap-2">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-text-muted">
                    Navigation
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {navLinks.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className={`px-1 py-2.5 rounded-xl text-center text-[10px] font-bold tracking-wider transition-all border ${
                          pathname === href
                            ? "bg-brand-forest text-brand-ivory border-brand-forest shadow-sm"
                            : "bg-brand-ivory/50 border-brand-peach text-brand-forest/70 hover:bg-brand-peach/40 hover:text-brand-forest"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* Arjuna Mode Chat History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-text-muted">
                      Arjuna Chats (Max 2)
                    </span>
                    {onNewChat && pathname === "/arjuna" && (
                      <button
                        onClick={() => { onNewChat(); onClose(); }}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-forest hover:text-brand-forest/70 transition-colors"
                        aria-label="Start a new chat session"
                      >
                        <Plus className="w-3 h-3" /> New Chat
                      </button>
                    )}
                  </div>

                  {chatHistory.length === 0 ? (
                    <div className="text-xs italic text-brand-forest/60 bg-brand-peach/20 rounded-xl p-3 border border-brand-peach">
                      No recent chats. Share your heart with Arjuna to begin.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {chatHistory.map((session, i) => {
                        const firstUserMessage = session.messages.find(m => m.role === "user")?.content || "Reflection journey";
                        const truncatedMessage = firstUserMessage.length > 55
                          ? firstUserMessage.substring(0, 52) + "..."
                          : firstUserMessage;

                        return (
                          <button
                            key={session.id || `chat-${i}`}
                            onClick={() => { if (onSelectChat) { onSelectChat(session); } onClose(); }}
                            className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-start gap-2.5 group ${
                              activeChatId === session.id
                                ? "bg-brand-peach/40 border-brand-peach text-brand-forest shadow-sm"
                                : "bg-brand-ivory/50 hover:bg-brand-peach/20 border-brand-peach text-brand-forest/80 hover:text-brand-forest"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4 text-brand-forest flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-relaxed truncate">
                                &quot;{truncatedMessage}&quot;
                              </p>
                              <span className="text-[9px] text-text-muted block mt-1">
                                {formatDate(session.timestamp)}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Saarthi Voice History */}
                <div className="space-y-3">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-text-muted">
                    Saarthi Voice Logs (Max 2)
                  </span>

                  {voiceHistory.length === 0 ? (
                    <div className="text-xs italic text-brand-forest/60 bg-brand-peach/20 rounded-xl p-3 border border-brand-peach">
                      No recent voice call logs. Connect with Saarthi to talk.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {voiceHistory.map((session, i) => (
                        <button
                          key={session.id || `voice-${i}`}
                          onClick={() => {
                            if (onSelectVoice) { onSelectVoice(session); } else { setSelectedVoiceSession(session); }
                          }}
                          className="w-full text-left p-3.5 rounded-xl bg-brand-ivory/50 hover:bg-brand-peach/20 border border-brand-peach text-brand-forest/80 hover:text-brand-forest transition-all flex items-start gap-2.5 group"
                        >
                          <Mic className="w-4 h-4 text-brand-forest flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {session.title}
                            </p>
                            <p className="text-[10px] text-text-muted truncate mt-0.5">
                              {session.transcript}
                            </p>
                            <span className="text-[9px] text-text-muted block mt-1">
                              {formatDate(session.timestamp)}
                            </span>
                          </div>
                          <BookOpen className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="pt-4 border-t border-brand-peach/60 text-center">
                <span className="text-[9px] tracking-widest uppercase text-brand-forest/50 block">
                  Re.Mind • History • Capped 2 Sessions
                </span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Voice Transcript Modal (Fallback Viewer) */}
      <AnimatePresence>
        {selectedVoiceSession && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVoiceSession(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-ivory w-full max-w-lg rounded-[24px] p-6 shadow-2xl border border-brand-peach relative z-10"
            >
              <button
                onClick={() => setSelectedVoiceSession(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-brand-peach/40 text-brand-forest/60 hover:text-brand-forest transition-colors focus:outline-none"
                aria-label="Close voice transcript modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-forest">
                  <Mic className="w-5 h-5 animate-pulse" />
                  <h3 className="font-serif italic text-xl text-brand-forest">
                    {selectedVoiceSession.title}
                  </h3>
                </div>
                <span className="text-[10px] text-brand-forest/50 uppercase tracking-wider block">
                  Logged on {new Date(selectedVoiceSession.timestamp).toLocaleString()}
                </span>

                <div className="border-t border-brand-peach/60 pt-4 max-h-60 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  <p className="text-brand-forest/80 text-sm italic leading-relaxed whitespace-pre-wrap">
                    &quot;{selectedVoiceSession.transcript}&quot;
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
