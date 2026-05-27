"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { History, ChevronLeft } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import FloatingParticles from "@/components/FloatingParticles";
import Sidebar, { ChatSession, ChatMessage } from "@/components/Sidebar";

export default function ArjunaModePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSelectChat = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center p-4 md:p-12 overflow-hidden bg-base-bg">
      <FloatingParticles />
      
      {/* Background Glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-brand-pink/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-meditation-lavender/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 border-b border-brand-peach/40 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 bg-brand-peach/10 hover:bg-brand-peach/20 border border-brand-peach/30 text-brand-forest rounded-full shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-peach/40"
            aria-label="Return home"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif text-brand-forest tracking-tight">Arjuna Mode</h1>
            <p className="text-xs text-brand-forest/70">Textual AI reflections for the restless mind.</p>
          </div>
        </div>

        {/* History Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-peach/10 hover:bg-brand-peach/20 border border-brand-peach/30 text-brand-forest hover:text-brand-forest/80 rounded-full shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-peach/40"
          aria-label="Open history sidebar"
        >
          <History className="w-4 h-4 text-brand-forest" />
          <span className="text-xs font-semibold">History</span>
        </button>
      </header>

      {/* Unified History Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        activeChatId={activeSessionId}
      />

      {/* Chat Section */}
      <section className="w-full max-w-4xl flex-1 flex flex-col justify-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0 }}
          className="w-full"
        >
          <ChatInterface
            messages={messages}
            setMessages={setMessages}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
          />
        </motion.div>
      </section>

      {/* Footer Branding */}
      <footer className="w-full text-center text-[10px] tracking-[0.2em] uppercase text-text-muted py-8 mt-8 border-t border-white/5">
        Re.Mind • Digital Sanctuary
      </footer>
    </main>
  );
}
