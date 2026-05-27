"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import FloatingParticles from "@/components/FloatingParticles";

export default function PurposePage() {
  const [activeTab, setActiveTab] = useState<"arjuna" | "saarthi" | "atlas" | null>(null);

  const toggleTab = (tab: "arjuna" | "saarthi" | "atlas") => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <main className="relative min-h-screen flex flex-col font-sans bg-[#EFF2EA] overflow-x-hidden selection:bg-brand-sage selection:text-brand-forest">
      <FloatingParticles />

      {/* Header */}
      <header className="relative z-20 w-full max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-3 text-sm font-medium text-brand-forest/60 hover:text-brand-forest transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Home
        </Link>
      </header>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-32">
        <motion.article 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-brand-forest"
        >
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight mb-12">
            The Purpose of Re.Mind
          </h1>

          {/* General Info */}
          <section className="space-y-6 text-brand-forest/80 leading-relaxed text-base md:text-lg font-light mb-20">
            <p>
              In a world that constantly demands our attention, we rarely find the time to sit quietly and process how we actually feel. The digital spaces we inhabit are often loud, chaotic, and built for endless consumption rather than reflection.
            </p>
            <p>
              Re.Mind was built as an antidote to this noise. 
            </p>
            <p>
              It is a deliberately slow, quiet digital sanctuary. Every interaction, color, and sound inside Re.Mind has been chosen to help lower your cortisol, slow your breathing, and give you a safe, private space to unpack your mind without judgment. 
            </p>
            <p>
              Whether you are feeling burnt out, anxious, or simply looking to understand your own patterns better, Re.Mind offers three distinct pathways to support your journey.
            </p>
          </section>

          {/* Minimalist Accordion Section */}
          <section className="space-y-6">
            <h2 className="text-sm uppercase tracking-widest font-bold text-brand-forest/50 mb-8">
              The Three Pathways
            </h2>

            {/* Arjuna Accordion */}
            <div className="border-b border-brand-forest/10 pb-6">
              <button
                onClick={() => toggleTab("arjuna")}
                className="w-full flex items-center justify-between text-left focus:outline-none group"
              >
                <span className="font-serif text-2xl text-brand-forest group-hover:text-brand-forest/70 transition-colors">Arjuna Mode</span>
                {activeTab === "arjuna" ? (
                  <Minus className="w-5 h-5 text-brand-forest/40" />
                ) : (
                  <Plus className="w-5 h-5 text-brand-forest/40" />
                )}
              </button>
              <AnimatePresence>
                {activeTab === "arjuna" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 text-base font-light text-brand-forest/70 leading-relaxed space-y-4">
                      <p>
                        Arjuna Mode acts as your deeply empathetic 2 AM friend. It is a text-based journaling space where you can pour out your thoughts, vent your frustrations, and slowly discover subtle, ancient wisdom naturally woven into the conversation. 
                      </p>
                      <p>
                        Unlike a clinical therapist bot, Arjuna is designed to listen first, analyze your emotional state, and help you untangle your feelings without judging or rushing to "fix" you.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Saarthi Accordion */}
            <div className="border-b border-brand-forest/10 pb-6 pt-2">
              <button
                onClick={() => toggleTab("saarthi")}
                className="w-full flex items-center justify-between text-left focus:outline-none group"
              >
                <span className="font-serif text-2xl text-brand-forest group-hover:text-brand-forest/70 transition-colors">Saarthi AI</span>
                {activeTab === "saarthi" ? (
                  <Minus className="w-5 h-5 text-brand-forest/40" />
                ) : (
                  <Plus className="w-5 h-5 text-brand-forest/40" />
                )}
              </button>
              <AnimatePresence>
                {activeTab === "saarthi" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 text-base font-light text-brand-forest/70 leading-relaxed space-y-4">
                      <p>
                        Sometimes, typing feels like too much effort when your mind is racing. Saarthi is your vocal guide—an advanced conversational AI designed for real-time emotional processing. 
                      </p>
                      <p>
                        Speak your mind aloud, vent your frustrations, or simply narrate your day. Saarthi will respond with a grounded, comforting, and synthesized voice, holding space for your feelings and helping you navigate anxiety or loneliness through natural conversation.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Inner Atlas Accordion */}
            <div className="border-b border-brand-forest/10 pb-6 pt-2">
              <button
                onClick={() => toggleTab("atlas")}
                className="w-full flex items-center justify-between text-left focus:outline-none group"
              >
                <span className="font-serif text-2xl text-brand-forest group-hover:text-brand-forest/70 transition-colors">Inner Atlas</span>
                {activeTab === "atlas" ? (
                  <Minus className="w-5 h-5 text-brand-forest/40" />
                ) : (
                  <Plus className="w-5 h-5 text-brand-forest/40" />
                )}
              </button>
              <AnimatePresence>
                {activeTab === "atlas" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 text-base font-light text-brand-forest/70 leading-relaxed space-y-4">
                      <p>
                        Inner Atlas is your emotional landscape, beautifully mapped out over time. It is a rich daily tracker that connects your sleep, activities, and feelings.
                      </p>
                      <p>
                        As you log your days, its AI engine works in the background to discover subtle patterns—revealing how your habits influence your mental health. From these insights, Inner Atlas gently guides you toward balance, generating weekly reflection letters and actionable correlations to help you thrive.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </section>
        </motion.article>
      </div>
    </main>
  );
}
