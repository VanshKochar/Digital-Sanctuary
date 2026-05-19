"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { History } from "lucide-react";
import LotusBloom from "@/components/LotusBloom";
import ChatInterface from "@/components/ChatInterface";
import FloatingParticles from "@/components/FloatingParticles";
import Sidebar, { ChatSession, ChatMessage } from "@/components/Sidebar";

export default function Home() {
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
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-24 overflow-hidden bg-base-bg">
      <FloatingParticles />
      
      {/* Background Glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-sacred-blush/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-meditation-lavender/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Floating Toggle Sidebar Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-6 left-6 z-30 p-3 bg-white/50 backdrop-blur-md border border-white/60 text-text-secondary hover:text-text-primary rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
        aria-label="Open history sidebar"
      >
        <History className="w-5 h-5 text-sacred-blush" />
      </button>

      {/* Unified History Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        activeChatId={activeSessionId}
      />

      <section className="w-full max-w-4xl flex flex-col items-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="w-full flex flex-col items-center space-y-6"
        >
          <LotusBloom />
          
          <div className="text-center space-y-3">
            <h1 className="text-5xl md:text-6xl font-serif text-text-primary tracking-tight">
              Arjuna Mode
            </h1>
            <p className="text-lg font-serif italic text-text-secondary">
              Peace begins within.
            </p>
            <div className="pt-1">
              <Link
                href="/saarthi"
                className="inline-flex items-center gap-2 bg-text-primary text-base-bg px-5 py-2.5 rounded-full hover:opacity-90 transition-all text-[10px] font-semibold tracking-widest uppercase shadow-md focus:outline-none focus:ring-2 focus:ring-text-primary"
              >
                🎙️ Saarthi AI (Voice)
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.2 }}
            className="w-full"
          >
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              activeSessionId={activeSessionId}
              setActiveSessionId={setActiveSessionId}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Footer Branding */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2, duration: 1.5 }}
        className="fixed bottom-8 text-center text-[10px] tracking-[0.2em] uppercase text-text-muted hidden md:block"
      >
        Sacred Minimalism • Digital Sanctuary
      </motion.footer>
    </main>
  );
}
