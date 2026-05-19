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

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadHistory = () => {
        const chatData = localStorage.getItem("arjuna_history");
        const voiceData = localStorage.getItem("saarthi_history");

        if (chatData) {
          try {
            const parsed = JSON.parse(chatData);
            // Cap at recent 2
            setChatHistory(parsed.slice(0, 2));
          } catch (e) {
            console.error("Error parsing chat history:", e);
          }
        }
        if (voiceData) {
          try {
            const parsed = JSON.parse(voiceData);
            // Cap at recent 2
            setVoiceHistory(parsed.slice(0, 2));
          } catch (e) {
            console.error("Error parsing voice history:", e);
          }
        }
      };

      loadHistory();
      // Listen for local storage updates across windows/tabs
      window.addEventListener("storage", loadHistory);
      // Listen for custom history update events triggered in-app
      window.addEventListener("historyUpdated", loadHistory);

      return () => {
        window.removeEventListener("storage", loadHistory);
        window.removeEventListener("historyUpdated", loadHistory);
      };
    }
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
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
              className="fixed top-0 left-0 bottom-0 w-80 bg-white/70 backdrop-blur-xl border-r border-white/30 z-50 p-6 flex flex-col justify-between shadow-2xl selection:bg-sacred-blush/30"
            >
              <div className="space-y-8 flex-1 overflow-y-auto scrollbar-hide">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-sacred-blush/20">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-sacred-blush" />
                    <span className="font-serif italic text-lg text-text-primary">
                      Sanctuary Journeys
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-sacred-blush/10 text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
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
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Link
                      href="/"
                      onClick={onClose}
                      className={`px-3 py-2.5 rounded-sacred text-center text-xs font-semibold tracking-wider transition-all border ${
                        pathname === "/"
                          ? "bg-text-primary text-base-bg border-text-primary"
                          : "bg-white/40 border-white/50 text-text-secondary hover:bg-white/80"
                      }`}
                    >
                      Arjuna Chat
                    </Link>
                    <Link
                      href="/saarthi"
                      onClick={onClose}
                      className={`px-3 py-2.5 rounded-sacred text-center text-xs font-semibold tracking-wider transition-all border ${
                        pathname === "/saarthi"
                          ? "bg-text-primary text-base-bg border-text-primary"
                          : "bg-white/40 border-white/50 text-text-secondary hover:bg-white/80"
                      }`}
                    >
                      Saarthi Voice
                    </Link>
                  </div>
                </nav>

                {/* Arjuna Mode History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-text-muted">
                      Arjuna Chats (Max 2)
                    </span>
                    {onNewChat && pathname === "/" && (
                      <button
                        onClick={() => {
                          onNewChat();
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-sacred-blush hover:text-text-primary transition-colors"
                        aria-label="Start a new chat session"
                      >
                        <Plus className="w-3 h-3" /> New Chat
                      </button>
                    )}
                  </div>

                  {chatHistory.length === 0 ? (
                    <div className="text-xs italic text-text-muted bg-white/20 rounded-sacred p-3 border border-white/30">
                      No recent chats. Share your heart with Arjuna to begin.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {chatHistory.map((session) => {
                        const firstUserMessage = session.messages.find(m => m.role === "user")?.content || "Reflection journey";
                        const truncatedMessage = firstUserMessage.length > 55 
                          ? firstUserMessage.substring(0, 52) + "..." 
                          : firstUserMessage;

                        return (
                          <button
                            key={session.id}
                            onClick={() => {
                              if (onSelectChat) {
                                onSelectChat(session);
                              }
                              onClose();
                            }}
                            className={`w-full text-left p-3.5 rounded-sacred transition-all border flex items-start gap-2.5 group ${
                              activeChatId === session.id
                                ? "bg-sacred-blush/20 border-sacred-blush/40 text-text-primary"
                                : "bg-white/35 hover:bg-white/60 border-white/40 text-text-secondary"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4 text-sacred-blush/80 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-relaxed truncate group-hover:text-text-primary">
                                "{truncatedMessage}"
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
                    Saarthi Voice logs (Max 2)
                  </span>

                  {voiceHistory.length === 0 ? (
                    <div className="text-xs italic text-text-muted bg-white/20 rounded-sacred p-3 border border-white/30">
                      No recent voice call logs. Connect with Saarthi to talk.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {voiceHistory.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            if (onSelectVoice) {
                              onSelectVoice(session);
                            } else {
                              setSelectedVoiceSession(session);
                            }
                          }}
                          className="w-full text-left p-3.5 rounded-sacred bg-white/35 hover:bg-white/60 border border-white/40 text-text-secondary transition-all flex items-start gap-2.5 group"
                        >
                          <Mic className="w-4 h-4 text-sacred-blush/80 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate group-hover:text-text-primary">
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
              <div className="pt-4 border-t border-sacred-blush/10 text-center">
                <span className="text-[9px] tracking-widest uppercase text-text-muted block">
                  Sacred History • Capped 2 Searches
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
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVoiceSession(null)}
              className="fixed inset-0 bg-black"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-base-bg w-full max-w-lg rounded-sacred p-6 shadow-2xl border border-white/50 relative z-10 glass-card"
            >
              <button
                onClick={() => setSelectedVoiceSession(null)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-sacred-blush/10 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close voice transcript modal"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sacred-blush">
                  <Mic className="w-5 h-5 animate-pulse" />
                  <h3 className="font-serif italic text-xl text-text-primary">
                    {selectedVoiceSession.title}
                  </h3>
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                  Logged on {new Date(selectedVoiceSession.timestamp).toLocaleString()}
                </span>
                
                <div className="border-t border-sacred-blush/20 pt-4 max-h-60 overflow-y-auto scrollbar-hide">
                  <p className="text-text-secondary text-sm italic leading-relaxed whitespace-pre-wrap">
                    "{selectedVoiceSession.transcript}"
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
