"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, User, PlayCircle, MessageCircle, Mic, Compass, Sparkles, ChevronDown, Leaf } from "lucide-react";
import FloatingParticles from "@/components/FloatingParticles";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col font-sans bg-[#EFF2EA] overflow-x-hidden">
      <FloatingParticles />

      {/* Absolute Full Width Background Image for Hero */}
      <div className="absolute top-0 left-0 w-full h-[95vh] z-0 overflow-hidden pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Main_image2.png"
          alt="Re.Mind Background"
          className="w-full h-full object-cover object-top opacity-100"
        />
        {/* Gradient overlay to seamlessly blend the bottom edge into the solid background color */}
        <div className="absolute bottom-0 left-0 w-full h-18 bg-gradient-to-t from-[#EFF2EA] to-transparent" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between z-20 gap-4"
      >
        <Link href="/" className="text-2xl font-bold tracking-tight text-brand-forest font-serif z-10 w-full md:w-auto text-center md:text-left">
          Re.Mind
        </Link>

        {/* Pill Nav */}
        <nav className="hidden md:flex items-center gap-8 bg-white/40 backdrop-blur-md px-8 py-3 rounded-full shadow-sm border border-white/60">
          <Link href="/" className="text-[13px] font-bold tracking-wide text-brand-forest hover:text-brand-forest/70 transition-colors">Home</Link>
          <Link 
            href="/purpose"
            className="text-[13px] font-bold tracking-wide text-brand-forest/70 hover:text-brand-forest transition-colors cursor-pointer"
          >
            Purpose of Re.Mind
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
          <Link href="/arjuna" className="px-6 py-2.5 bg-brand-forest text-white font-bold rounded-full text-[13px] hover:bg-brand-forest/90 transition-all shadow-md">
            Get Started
          </Link>
          <button className="p-2.5 bg-white/40 backdrop-blur-md rounded-full text-brand-forest border border-white/60 hover:bg-white/60 transition-all focus:outline-none focus:ring-2 focus:ring-brand-forest/20">
            <User className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-12 md:pt-32 pb-32 md:pb-48 flex flex-col md:flex-row justify-between items-center z-10 min-h-[85vh]">
        {/* Left Content */}
        <div className="max-w-xl space-y-6 relative mt-12 md:mt-0">

          {/* Floating Widgets removed as they are part of the background image or no longer needed */}

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-forest/60">
              WELCOME TO RE.MIND
            </p>
            <h1 className="text-5xl md:text-7xl font-serif text-brand-forest tracking-tight leading-[1.1] mt-2 mb-4">
              Your Digital<br />Sanctuary
            </h1>
            <p className="text-base text-brand-forest/80 max-w-sm leading-relaxed">
              Thoughtfully designed to calm your nervous system and support your mental wellness.
            </p>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-6">
              <Link href="/arjuna" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-forest text-white font-bold rounded-full text-xs transition-transform hover:scale-105 shadow-lg shadow-brand-forest/20">
                Begin Your Journey <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/sanctuary" className="inline-flex items-center gap-2 text-xs font-bold text-brand-forest/90 hover:text-brand-forest transition-colors hover:bg-white/20 px-4 py-2 rounded-full">
                <Leaf className="w-5 h-5 text-brand-forest/70" /> Calm
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Down Arrow */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer flex flex-col items-center gap-2 text-brand-forest/60 hover:text-brand-forest transition-colors z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{
            opacity: { delay: 1, duration: 1 },
            y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
          }}
          onClick={() => document.getElementById('cards-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-[9px] uppercase tracking-widest font-bold">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* Cards Section Wrapper for Full-Width Background */}
      <div className="relative w-full z-20">
        {/* Subtle Background Glow behind cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-r from-orange-200/20 via-brand-forest/10 to-blue-200/20 blur-[80px] rounded-full pointer-events-none -z-10" />

        {/* Falling Leaves Animation just for cards section */}
        <div className="absolute inset-0 w-full overflow-hidden pointer-events-none -z-10">
          {[...Array(15)].map((_, i) => {
            const startX = (i * 23) % 100; // deterministic pseudo-random distribution 0 to 100
            return (
              <motion.div
                key={i}
                className="absolute text-brand-forest/20"
                initial={{ top: "-10%", left: `${startX}%`, rotate: 0, opacity: 0 }}
                animate={{
                  top: ["-10%", "110%"],
                  x: [0, 20, -20, 10, 0],
                  rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                  opacity: [0, 0.4, 0.6, 0],
                  scale: [0.8, 1, 0.9, 1],
                }}
                transition={{
                  duration: 15 + (i % 5) * 2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: (i % 5) * 2,
                }}
              >
                <Leaf className={`w-${4 + (i % 3)} h-${4 + (i % 3)} md:w-${6 + (i % 3)} md:h-${6 + (i % 3)}`} />
              </motion.div>
            );
          })}
        </div>

        {/* Cards Content */}
        <section id="cards-section" className="w-full max-w-7xl mx-auto px-6 pb-24 relative pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Arjuna Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-8 text-center flex flex-col items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-6 shadow-sm">
                <MessageCircle className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-brand-forest uppercase tracking-wider mb-3">Arjuna Mode</h3>
              <p className="text-[11px] text-brand-forest/70 leading-relaxed mb-8 px-2 font-medium">
                Text-based reflections to share your heart and seek clarity through ancient wisdom.
              </p>
              <Link href="/arjuna" className="w-full py-4 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-[10px] uppercase tracking-widest rounded-full transition-colors inline-flex items-center justify-center gap-2">
                Enter Arjuna <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>

            {/* Saarthi AI Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-[#EBF1E5] backdrop-blur-xl border border-white/60 rounded-[32px] p-8 text-center flex flex-col items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-2 transition-transform duration-300 relative lg:-translate-y-6"
            >
              <div className="absolute top-5 right-5 px-3 py-1 bg-brand-forest/10 text-brand-forest text-[8px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Featured
              </div>
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                <Mic className="w-7 h-7 text-brand-forest" />
              </div>
              <h3 className="text-lg font-bold text-brand-forest uppercase tracking-wider mb-3">Saarthi AI</h3>
              <p className="text-[11px] text-brand-forest/70 leading-relaxed mb-4 px-2 font-medium">
                A calm emotional space that listens. Speak aloud and connect with your voice guide.
              </p>
              {/* Waveform graphic mock */}
              <div className="flex items-center gap-[3px] justify-center h-8 mb-6 opacity-60">
                {[2, 4, 3, 5, 7, 4, 2, 3, 7, 5, 3, 4, 2, 3].map((v, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-brand-forest rounded-full"
                    animate={{ height: [`${v * 2.5}px`, `${v * 4.5}px`, `${v * 2.5}px`] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1, ease: "easeInOut" }}
                  />
                ))}
              </div>
              <Link href="/saarthi" className="w-full py-4 bg-brand-forest hover:bg-brand-forest/90 text-white font-bold text-[10px] uppercase tracking-widest rounded-full transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-brand-forest/20">
                Speak with Saarthi <Sparkles className="w-3 h-3" />
              </Link>
            </motion.div>

            {/* Inner Atlas Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-8 text-center flex flex-col items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-sm">
                <Compass className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-brand-forest uppercase tracking-wider mb-3">Inner Atlas</h3>
              <p className="text-[11px] text-brand-forest/70 leading-relaxed mb-8 px-2 font-medium">
                Your emotional landscape, mapped in silence. Calendar, graphs, and daily mood entries.
              </p>
              <Link href="/inner-atlas" className="w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[10px] uppercase tracking-widest rounded-full transition-colors inline-flex items-center justify-center gap-2">
                Explore Atlas <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>

          </div>
        </section>
      </div>

      {/* Simplified Footer matching new design vibe */}
      <footer className="w-full py-8 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 border-t border-brand-forest/10 pt-8">
          <div className="text-[10px] text-brand-forest/50 font-medium">
            © 2026 Re.Mind. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-[10px] text-brand-forest/60 font-bold">
            <Link href="/arjuna" className="hover:text-brand-forest transition-colors">Arjuna</Link>
            <Link href="/saarthi" className="hover:text-brand-forest transition-colors">Saarthi</Link>
            <Link href="/inner-atlas" className="hover:text-brand-forest transition-colors">Atlas</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
