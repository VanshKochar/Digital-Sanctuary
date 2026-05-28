"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import axios from "axios";
import Link from "next/link";
import { ChevronLeft, Play, Pause, RotateCcw, Volume2, VolumeX, CloudRain, Wind, Trees, Sparkles, MessageCircle, Mic, Sun, Heart, Smile, Leaf } from "lucide-react";

const MEDITATION_PRESETS = [
  { label: "3 MIN", minutes: 3 },
  { label: "5 MIN", minutes: 5 },
  { label: "10 MIN", minutes: 10 },
  { label: "15 MIN", minutes: 15 },
];

const SOUNDSCAPES = [
  { id: "rain", label: "Rainfall", icon: CloudRain },
  { id: "forest", label: "Deep Forest", icon: Trees },
  { id: "wind", label: "Soft Wind", icon: Wind },
  { id: "silence", label: "Silence", icon: Sparkles },
];

const LEFT_CARDS = [
  { title: "Breathe", desc: "Follow the rhythm and slow down", icon: Sun },
  { title: "Focus", desc: "Stay present, stay centered", icon: Wind },
  { title: "Reset", desc: "Let go and renew yourself", icon: Heart },
];

const RIGHT_CARDS = [
  { title: "Relax", desc: "Release tension and soften", icon: CloudRain }, // Using cloud as a leaf placeholder
  { title: "Be Here", desc: "In this moment, in this breath", icon: Sun },
  { title: "Feel Better", desc: "Calm mind, lighter heart", icon: Smile },
];

export default function Sanctuary() {
  const prefersReducedMotion = useReducedMotion();
  const [sessionId, setSessionId] = useState("");
  
  // Timer State
  const [selectedMinutes, setSelectedMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Breathing Text State
  const [breathPhase, setBreathPhase] = useState("Inhale...");
  
  // Sound State
  const [selectedSound, setSelectedSound] = useState("silence");
  const [isMuted, setIsMuted] = useState(false);

  // Syncing State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("atlas_session_id");
      if (!id) {
        id = `session_${Date.now()}`;
        localStorage.setItem("atlas_session_id", id);
      }
      setSessionId(id);
    }

    // Initialize audio
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Manage Audio Playback
  useEffect(() => {
    if (!audioRef.current) return;

    if (selectedSound === "silence") {
      audioRef.current.pause();
    } else {
      let src = "";
      if (selectedSound === "rain") src = "https://actions.google.com/sounds/v1/water/rain_on_roof.ogg";
      if (selectedSound === "forest") src = "https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg";
      if (selectedSound === "wind") src = "https://actions.google.com/sounds/v1/weather/strong_wind.ogg";
      
      if (audioRef.current.src !== src) {
        audioRef.current.src = src;
      }
      
      if (isActive && !isMuted) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [selectedSound, isActive, isMuted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      setIsCompleted(true);
      handleMeditationComplete();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);
  
  // Breathing phase logic
  useEffect(() => {
    let breathInterval: NodeJS.Timeout;
    if (isActive && !isCompleted) {
      let phases = ["Inhale...", "Hold...", "Exhale...", "Hold..."];
      let i = 0;
      breathInterval = setInterval(() => {
        i = (i + 1) % phases.length;
        setBreathPhase(phases[i]);
      }, 4000); // 4-4-4-4 box breathing pattern
    } else {
      setBreathPhase("Inhale...");
    }
    return () => clearInterval(breathInterval);
  }, [isActive, isCompleted]);

  const handlePresetChange = (minutes: number) => {
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setIsActive(false);
    setIsCompleted(false);
    setSyncStatus("idle");
  };

  const toggleTimer = () => {
    if (isCompleted) {
      handlePresetChange(selectedMinutes);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(selectedMinutes * 60);
    setIsCompleted(false);
    setSyncStatus("idle");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleMeditationComplete = async () => {
    if (!sessionId) return;
    try {
      setIsSyncing(true);
      const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
      const base = isLocal ? "http://localhost:5000/api/inner-atlas" : "https://digital-sanctuary-ou9k.onrender.com/api/inner-atlas";
      
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      
      await axios.post(`${base}/meditation`, {
        sessionId,
        date: todayStr,
        minutes: selectedMinutes
      });
      
      setSyncStatus("success");
    } catch (error) {
      console.error("Failed to sync meditation:", error);
      setSyncStatus("error");
    } finally {
      setIsSyncing(false);
    }
  };

  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const progress = ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * circumference;

  return (
    <main className="relative min-h-screen flex flex-col font-sans overflow-y-auto overflow-x-hidden bg-[#EAEBE6]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url('/Calm.png')` }}
      />
      
      {/* Light overlay for readability if needed, but the image seems bright enough */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-0" />

      {/* Header */}
      <header className="relative z-10 w-full flex items-center justify-between p-6 lg:p-8">
        <Link
          href="/"
          className="w-12 h-12 flex items-center justify-center bg-white/70 hover:bg-white border border-white/60 text-brand-forest rounded-full backdrop-blur-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-forest/30"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        
        <div className="text-center">
          <h1 className="text-3xl lg:text-4xl font-serif text-brand-forest tracking-tight">The Sanctuary</h1>
          <p className="text-[10px] text-brand-forest/70 uppercase tracking-widest font-bold mt-2">A Space to Breathe</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/arjuna"
            className="w-12 h-12 flex items-center justify-center bg-white/70 hover:bg-white border border-white/60 text-brand-forest rounded-full backdrop-blur-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-forest/30 group"
            title="Arjuna Mode"
          >
            <MessageCircle className="w-5 h-5" />
          </Link>
          <Link
            href="/saarthi"
            className="w-12 h-12 flex items-center justify-center bg-white/70 hover:bg-white border border-white/60 text-brand-forest rounded-full backdrop-blur-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-forest/30 group"
            title="Saarthi AI"
          >
            <Mic className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 lg:px-8">
        
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-0 mt-8 lg:mt-0">
          
          {/* Left Cards */}
          <div className="hidden lg:flex flex-col gap-6 w-72">
            {LEFT_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  key={card.title} 
                  className="bg-white/60 backdrop-blur-md border border-white/40 p-4 rounded-3xl flex items-center gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-sage/20 flex items-center justify-center text-brand-forest">
                    <Icon className="w-5 h-5 opacity-70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-forest">{card.title}</h3>
                    <p className="text-[10px] text-brand-forest/60 mt-0.5 leading-tight">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Central Timer */}
          <div className="flex flex-col items-center justify-center relative shrink-0 mb-8 lg:mb-0">
            <div className="relative flex items-center justify-center w-[340px] h-[340px] lg:w-[400px] lg:h-[400px]">
              
              {/* Soft pulsing glow behind timer */}
              {isActive && !prefersReducedMotion && (
                <motion.div 
                  className="absolute inset-0 bg-white/40 blur-[40px] rounded-full pointer-events-none"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Glass Circle Base */}
              <div className="absolute inset-4 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.05)]" />
              
              {/* Inner Circle for contrast */}
              <div className="absolute inset-8 rounded-full bg-white/50 backdrop-blur-md shadow-inner" />

              {/* SVG Progress */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-sm">
                <circle
                  cx="50%" cy="50%" r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50%" cy="50%" r={radius}
                  fill="none"
                  stroke="#5F8D70" // Brand forest-ish green from the image
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
                {/* Glow dot on the progress stroke could be added but SVG makes it tricky, let's keep it clean */}
              </svg>

              {/* Timer Text Content */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center mt-2">
                <Leaf className="w-8 h-8 text-brand-forest/40 mb-4" /> {/* Lotus/Leaf icon substitute */}
                <span className="text-6xl lg:text-7xl font-sans font-medium text-brand-forest tabular-nums tracking-tight">
                  {formatTime(timeLeft)}
                </span>
                
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-col items-center">
                      <span className="text-xs font-bold text-brand-forest uppercase tracking-widest">Session Complete</span>
                      {isSyncing && <span className="text-[9px] text-brand-forest/50 mt-1 uppercase">Saving...</span>}
                      {syncStatus === "success" && <span className="text-[9px] text-green-600 mt-1 uppercase font-bold">Logged</span>}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-col items-center gap-4">
                      <span className="text-[10px] text-brand-forest/60 tracking-[0.2em] uppercase font-bold">
                        {isActive ? "Focus on your breath" : "Ready when you are"}
                      </span>
                      <div className="h-[1px] w-8 bg-brand-forest/20" />
                      <AnimatePresence mode="wait">
                        {isActive ? (
                          <motion.span 
                            key={breathPhase}
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 1 }}
                            className="text-sm font-serif text-brand-forest italic"
                          >
                            {breathPhase}
                          </motion.span>
                        ) : (
                          <span className="text-sm font-serif text-brand-forest italic">
                            Inhale...
                          </span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Play/Pause Controls */}
            <div className="flex items-center justify-center gap-6 mt-12 mb-4 z-10">
              <button
                onClick={resetTimer}
                disabled={timeLeft === selectedMinutes * 60 && !isCompleted}
                className="w-12 h-12 flex items-center justify-center bg-white/70 hover:bg-white text-brand-forest rounded-full backdrop-blur-md shadow-sm transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <button
                onClick={toggleTimer}
                className="w-16 h-16 bg-[#5F8D70] hover:bg-[#4E765D] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-12 h-12 flex items-center justify-center bg-white/70 hover:bg-white text-brand-forest rounded-full backdrop-blur-md shadow-sm transition-all"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Right Cards */}
          <div className="hidden lg:flex flex-col gap-6 w-72">
            {RIGHT_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  key={card.title} 
                  className="bg-white/60 backdrop-blur-md border border-white/40 p-4 rounded-3xl flex items-center gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-sage/20 flex items-center justify-center text-brand-forest">
                    <Icon className="w-5 h-5 opacity-70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-forest">{card.title}</h3>
                    <p className="text-[10px] text-brand-forest/60 mt-0.5 leading-tight">{card.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </section>

      {/* Bottom Controls */}
      <div className="relative z-10 flex flex-col items-center justify-end pb-8 lg:pb-12 mt-auto w-full gap-6 shrink-0">
        
        {/* Time Presets Pill */}
        <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-full p-1.5 flex items-center gap-1 shadow-sm">
          {MEDITATION_PRESETS.map((preset) => (
            <button
              key={preset.minutes}
              onClick={() => handlePresetChange(preset.minutes)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${
                selectedMinutes === preset.minutes && !isActive && !isCompleted
                  ? "bg-[#5F8D70] text-white shadow-md"
                  : "text-brand-forest hover:bg-white/50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Soundscapes Selector */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[32px] p-2 flex items-center shadow-lg">
          {SOUNDSCAPES.map((sound, idx) => {
            const Icon = sound.icon;
            const isSelected = selectedSound === sound.id;
            return (
              <div key={sound.id} className="flex items-center">
                <button
                  onClick={() => setSelectedSound(sound.id)}
                  className={`flex flex-col items-center justify-center gap-2 w-28 py-3 rounded-[24px] transition-all ${
                    isSelected
                      ? "bg-[#F3F4ED] text-brand-forest shadow-sm border border-white"
                      : "text-brand-forest/50 hover:text-brand-forest hover:bg-white/30"
                  }`}
                >
                  <Icon className="w-6 h-6 opacity-80" />
                  <span className="text-[10px] font-bold">{sound.label}</span>
                </button>
                {/* Separator */}
                {idx < SOUNDSCAPES.length - 1 && (
                  <div className="w-[1px] h-10 bg-brand-forest/10 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
