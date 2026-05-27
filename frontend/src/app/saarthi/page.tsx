"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, AlertCircle, Sparkles, RefreshCw, History, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FloatingParticles from "@/components/FloatingParticles";
import Sidebar, { VoiceSession } from "@/components/Sidebar";

interface VoiceMessage {
  role: "user" | "saarthi";
  content: string;
  timestamp: number;
}

export default function SaarthiVoicePage() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persistent dialog turns and session tracking
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  // Stale closure guards & continuous voice capturing flags
  const transcriptRef = useRef("");
  const voiceMessagesRef = useRef<VoiceMessage[]>([]);
  const activeRef = useRef(false);
  const isVoiceCapturingRef = useRef(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep references synced with reactive state
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { voiceMessagesRef.current = voiceMessages; }, [voiceMessages]);
  useEffect(() => { activeRef.current = isActive; }, [isActive]);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);

  // Smooth scroll to latest captions during active call
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [voiceMessages]);

  // Stop everything on unmount
  useEffect(() => { return () => { disconnectVoice(); }; }, []);

  // Restore previous active session from MongoDB on browser refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSessionId = localStorage.getItem("active_voice_session_id");
      if (savedSessionId) {
        setStatus("Restoring memory...");
        fetch(`https://digital-sanctuary-ou9k.onrender.com/api/voice/session/${savedSessionId}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error("Session not found inside MongoDB");
          })
          .then(data => {
            if (data && data.messages) {
              const restoredMessages: VoiceMessage[] = data.messages.map((m: any) => ({
                role: m.role === "user" ? "user" : "saarthi",
                content: m.text,
                timestamp: new Date(m.timestamp).getTime()
              }));
              setVoiceMessages(restoredMessages);

              const tString = data.messages
                .filter((m: any) => m.role === "assistant")
                .map((m: any) => m.text)
                .join(" ");
              setTranscript(tString);

              setActiveSessionId(data.sessionId);
              activeSessionIdRef.current = data.sessionId;
              setStatus("Session restored from memory");
            }
          })
          .catch(err => {
            console.warn("Could not auto-restore session from MongoDB:", err);
            localStorage.removeItem("active_voice_session_id");
            setStatus("Disconnected");
          });
      }
    }
  }, []);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
  };

  const base64ToFloat32 = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) { float32Data[i] = int16Data[i] / 32768.0; }
    return float32Data;
  };

  const appendUserMessage = (text: string) => {
    setVoiceMessages((prev) => {
      const msg: VoiceMessage = { role: "user", content: text, timestamp: Date.now() };
      return [...prev, msg];
    });
  };

  const appendSaarthiMessage = (text: string) => {
    setVoiceMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.role === "saarthi") {
        updated[updated.length - 1] = { ...last, content: last.content + text };
      } else {
        updated.push({ role: "saarthi", content: text, timestamp: Date.now() });
      }
      return updated;
    });
    setTranscript((prev) => prev + text);
  };

  const connectVoice = async () => {
    setErrorMsg("");
    setStatus("Connecting...");
    isVoiceCapturingRef.current = true;

    if (!activeSessionIdRef.current) {
      setTranscript("");
      setVoiceMessages([]);
    } else {
      setTranscript("");
    }

    let sessionId = activeSessionIdRef.current;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setActiveSessionId(sessionId);
      activeSessionIdRef.current = sessionId;
    }
    localStorage.setItem("active_voice_session_id", sessionId);

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = micStream;

      const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
      let wsUrl = isLocal
        ? "ws://localhost:5000/api/voice"
        : "wss://digital-sanctuary-ou9k.onrender.com/api/voice";
      if (activeSessionIdRef.current && voiceMessagesRef.current.length > 0) {
        const pastText = voiceMessagesRef.current
          .map((m) => `${m.role === "user" ? "User" : "Saarthi"}: ${m.content}`)
          .join("\n");
        wsUrl += `?history=${encodeURIComponent(pastText)}`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      ws.onopen = () => {
        setStatus("Connected. Starting session...");
        startMicrophoneCapture(micStream, audioCtx);
        startSpeechRecognition();
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "status") {
            setStatus(parsed.message || parsed.data);
            if (parsed.data === "connected") { setIsActive(true); }
          } else if (parsed.type === "error") {
            setErrorMsg(parsed.data);
            disconnectVoice();
          } else if (parsed.type === "text") {
            appendSaarthiMessage(parsed.data);
          } else if (parsed.type === "audio") {
            playAudioChunk(parsed.data, parsed.mimeType);
          }
        } catch (e) { console.error("Error parsing WebSocket message:", e); }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMsg("WebSocket connection error. Failed to connect to Saarthi Voice.");
        disconnectVoice();
      };

      ws.onclose = () => { disconnectVoice(); };

    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setErrorMsg("Microphone permission denied or not found. Please verify permissions.");
      setStatus("Disconnected");
      isVoiceCapturingRef.current = false;
    }
  };

  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobileDevice) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let textResult = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) { textResult += event.results[i][0].transcript; }
        }
        const cleanResult = textResult.trim();
        if (cleanResult) { appendUserMessage(cleanResult); }
      };

      recognition.onerror = (e: any) => { console.warn("Speech recognition error:", e); };

      recognition.onend = () => {
        if (isVoiceCapturingRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) { }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) { console.error("Failed to start speech recognition node:", e); }
  };

  const startMicrophoneCapture = (stream: MediaStream, playbackCtx: AudioContext) => {
    try {
      const recordCtx = new AudioContext({ sampleRate: 16000 });
      const source = recordCtx.createMediaStreamSource(stream);
      const processor = recordCtx.createScriptProcessor(4096, 1, 1);
      micProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(recordCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        const base64Audio = arrayBufferToBase64(pcm16.buffer);
        wsRef.current.send(JSON.stringify({ type: "audio", data: base64Audio, mimeType: "audio/pcm;rate=16000" }));
      };
    } catch (e) {
      console.error("Error setting up microphone processing node:", e);
      setErrorMsg("Failed to start voice capture pipeline.");
    }
  };

  const playAudioChunk = (base64Data: string, mimeType: string) => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") { audioCtx.resume(); }

    try {
      const float32Data = base64ToFloat32(base64Data);
      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      const buffer = audioCtx.createBuffer(1, float32Data.length, sampleRate);
      buffer.copyToChannel(float32Data, 0);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      if (nextPlayTimeRef.current < now) { nextPlayTimeRef.current = now + 0.05; }
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
    } catch (e) { console.error("Error playing back received audio chunk:", e); }
  };

  const disconnectVoice = () => {
    if (!wsRef.current && !activeRef.current) return;

    setIsActive(false);
    activeRef.current = false;
    isVoiceCapturingRef.current = false;
    setStatus("Disconnected");

    const currentMessages = voiceMessagesRef.current;
    if (currentMessages.length > 0) {
      try {
        const raw = localStorage.getItem("saarthi_history");
        let history = raw ? JSON.parse(raw) : [];

        const fullTranscriptLog = currentMessages
          .map((m) => `${m.role === "user" ? "You" : "Saarthi"}: ${m.content}`)
          .join("\n");

        let sessionId = activeSessionIdRef.current;
        if (!sessionId) { sessionId = Date.now().toString(); }

        const titleText = `Reflections - ${new Date().toLocaleDateString([], { month: "short", day: "numeric" })} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

        const existingIndex = history.findIndex((s: any) => s.id === sessionId);
        const newSession = { id: sessionId, title: titleText, transcript: fullTranscriptLog, messages: currentMessages, timestamp: Date.now() };

        if (existingIndex > -1) { history[existingIndex] = newSession; } else { history = [newSession, ...history]; }

        history.sort((a: any, b: any) => b.timestamp - a.timestamp);
        history = history.slice(0, 2);

        localStorage.setItem("saarthi_history", JSON.stringify(history));
        window.dispatchEvent(new Event("historyUpdated"));

        fetch("https://digital-sanctuary-ou9k.onrender.com/api/voice/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            title: titleText,
            messages: currentMessages.map(m => ({ role: m.role === "user" ? "user" : "assistant", text: m.content, timestamp: m.timestamp })),
            emotionalSummary: ""
          })
        })
          .then(res => { if (res.ok) { window.dispatchEvent(new Event("historyUpdated")); } })
          .catch(err => { console.error("Failed to POST session log to MongoDB backend:", err); });

      } catch (e) { console.error("Failed to save persistent voice log:", e); }
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch (e) { }
      recognitionRef.current = null;
    }
    if (wsRef.current) { try { wsRef.current.close(); } catch (e) { } wsRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach((track) => track.stop()); micStreamRef.current = null; }
    if (micProcessorRef.current) { try { micProcessorRef.current.disconnect(); } catch (e) { } micProcessorRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) { } audioCtxRef.current = null; }
  };

  const toggleConnection = () => {
    if (isActive || status === "Connecting...") { disconnectVoice(); } else { connectVoice(); }
  };

  const handleSelectVoice = (session: VoiceSession) => {
    const parsedMessages = (session as any).messages || [
      { role: "saarthi", content: session.transcript, timestamp: session.timestamp },
    ];
    setVoiceMessages(parsedMessages);
    setTranscript(session.transcript);
    setActiveSessionId(session.id);
    activeSessionIdRef.current = session.id;
    setStatus("Session loaded from memory");
    setIsActive(false);
  };

  const handleNewSession = () => {
    disconnectVoice();
    setVoiceMessages([]);
    setTranscript("");
    setActiveSessionId(null);
    activeSessionIdRef.current = null;
    setStatus("Disconnected");
  };

  return (
    <main className="relative min-h-screen bg-base-bg text-text-primary flex flex-col items-center justify-between p-6 md:p-12 font-sans selection:bg-brand-pink/30 overflow-hidden">
      <FloatingParticles />

      {/* Background Glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[55vw] h-[55vw] bg-brand-pink/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[55vw] h-[55vw] bg-brand-yellow/8 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-[40%] left-[40%] w-[30vw] h-[30vw] bg-brand-blue-light/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Floating Action Buttons (top-left) */}
      <div className="fixed top-6 left-6 z-30 flex gap-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 bg-brand-ivory/80 backdrop-blur-md border border-brand-peach text-brand-forest hover:bg-brand-ivory rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-peach/40"
          aria-label="Open history sidebar"
        >
          <History className="w-5 h-5 text-brand-forest" />
        </button>

        {activeSessionId && (
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-ivory/80 backdrop-blur-md border border-brand-peach text-xs font-semibold text-brand-forest hover:bg-brand-ivory rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-forest" />
            New Session
          </button>
        )}
      </div>

      {/* Header */}
      <header className="w-full max-w-xl flex items-center justify-between py-4 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-text-secondary hover:text-brand-forest transition-all text-sm font-serif italic focus:outline-none focus:ring-2 focus:ring-brand-peach/40 rounded-lg p-1.5"
          aria-label="Return to landing page"
        >
          <ArrowLeft className="w-4 h-4 text-brand-forest" />
          Back to Sanctuary
        </Link>

        {/* Status Pill */}
        <div className="flex items-center gap-2.5 bg-brand-ivory/80 backdrop-blur-md border border-brand-peach rounded-full px-3.5 py-1.5 shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${isActive
              ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse"
              : status === "Connecting..."
                ? "bg-brand-yellow shadow-[0_0_10px_rgba(230,226,65,0.5)] animate-pulse"
                : "bg-white/30"
              }`}
            aria-hidden="true"
          />
          <span className="text-[10px] tracking-wider uppercase font-semibold text-text-secondary" aria-live="polite">
            {status}
          </span>
        </div>
      </header>

      {/* Main Interface */}
      <section className="flex-1 w-full max-w-xl flex flex-col items-center justify-center space-y-8 my-6 z-10">
        {/* Title */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-serif text-brand-forest tracking-tight font-bold">Saarthi AI</h1>
          <p className="text-text-secondary italic text-base md:text-lg max-w-sm mx-auto leading-relaxed">
            &quot;Your companion in moments of verbal reflection.&quot;
          </p>
        </div>

        {/* Central Voice Orb */}
        <div className="relative flex items-center justify-center w-56 h-56">
          <AnimatePresence>
            {/* Active halos — neon pink + yellow glow */}
            {isActive && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.35, opacity: 0.65 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 4, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(238,18,179,0.3) 0%, transparent 70%)", filter: "blur(40px)" }}
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0.7 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 3, delay: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(230,226,65,0.25) 0%, transparent 70%)", filter: "blur(50px)" }}
                />
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.4 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 5, delay: 1, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(62,123,223,0.3) 0%, transparent 70%)", filter: "blur(60px)" }}
                />
              </>
            )}

            {status === "Connecting..." && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.15, opacity: 0.8 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(230,226,65,0.2) 0%, transparent 70%)", filter: "blur(40px)" }}
              />
            )}
          </AnimatePresence>

          {/* Orb Button */}
          <button
            onClick={toggleConnection}
            className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center border transition-all duration-700 shadow-xl focus:outline-none focus:ring-4 cursor-pointer ${isActive
              ? "bg-brand-peach/40 border-brand-peach text-brand-forest hover:bg-brand-peach/60 scale-105 focus:ring-brand-peach/40"
              : status === "Connecting..."
                ? "bg-brand-sage/40 border-brand-sage text-brand-forest cursor-wait focus:ring-brand-sage/40"
                : "bg-brand-ivory/80 backdrop-blur-md border-brand-peach text-brand-forest hover:border-brand-forest hover:bg-brand-ivory focus:ring-brand-peach/40"
              }`}
            aria-label={isActive ? "Stop voice assistant call" : "Start voice assistant call"}
          >
            {/* Inner ring decoration */}
            <div className="absolute inset-3 rounded-full border border-brand-peach/30 pointer-events-none" />

            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.div
                  key="active"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  {/* Rotating leaf for active voice */}
                  <div className="flex items-center justify-center h-12 mb-2 w-24">
                    <motion.div
                      animate={{ rotate: 360, scale: [2, 2, 2] }}
                      transition={{
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      <Leaf className="w-8 h-8 text-brand-forest" />
                    </motion.div>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-brand-forest">
                    Speaking...
                  </span>
                </motion.div>
              ) : status === "Connecting..." ? (
                <motion.div
                  key="connecting"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-brand-forest animate-spin mb-1" />
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-brand-forest mt-2">
                    Connecting
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="inactive"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <Mic className="w-12 h-12 text-brand-forest/60 hover:text-brand-forest transition-colors" />
                  <span className="text-[9px] uppercase tracking-widest font-bold text-brand-forest/60 mt-3">
                    {activeSessionId ? "Resume Session" : "Tap to Speak"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Session memory resume alert */}
        {activeSessionId && !isActive && voiceMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full glass-card p-4 flex items-center justify-between text-xs text-text-secondary"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-forest animate-pulse" />
              <span>
                <strong className="text-brand-forest">Session memory loaded.</strong> Tap the orb to resume with Saarthi.
              </span>
            </div>
          </motion.div>
        )}

        {/* Real-time dialogue transcript */}
        <AnimatePresence>
          {(isActive || voiceMessages.length > 0) && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full glass-card p-6 shadow-sm min-h-[180px] flex flex-col justify-between max-h-[300px] overflow-hidden"
              aria-label="Live voice dialogue transcript"
            >
              <span className="text-[10px] text-text-muted tracking-widest uppercase font-semibold block mb-3 border-b border-white/10 pb-2">
                Session Dialogue Feed
              </span>
              <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-4" style={{ scrollbarWidth: "none" }}>
                {voiceMessages.length === 0 ? (
                  <p className="text-text-muted text-sm italic text-center py-6">
                    Start speaking naturally, and Saarthi will listen and reply...
                  </p>
                ) : (
                  voiceMessages.map((m, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-text-muted font-bold mb-0.5 select-none">
                        {m.role === "user" ? "You" : "Saarthi"}
                      </span>
                      <p className={`text-sm leading-relaxed px-4 py-2.5 rounded-2xl select-text max-w-[85%] whitespace-pre-wrap border ${m.role === "user"
                        ? "bg-brand-forest text-brand-ivory border-brand-forest/80 shadow-md"
                        : "bg-brand-ivory/80 text-brand-forest border-brand-peach shadow-sm"
                        }`}>
                        {m.content}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.article>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        {errorMsg && (
          <div
            className="w-full bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 flex gap-3 text-red-300 text-sm shadow-sm z-10"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p className="font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}
      </section>

      {/* Unified Sidebar history drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectVoice={handleSelectVoice}
      />

      {/* Footer */}
      <footer className="w-full max-w-xl text-center py-4 z-10 border-t border-brand-forest/10 mt-4">
        <p className="text-text-muted text-[10px] tracking-[0.2em] uppercase">
          Re.Mind • Saarthi Voice Sanctuary • Powered by Gemini Live
        </p>
      </footer>
    </main>
  );
}
