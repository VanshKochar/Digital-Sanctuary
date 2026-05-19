"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, AlertCircle, Leaf, History, Sparkles, RefreshCw } from "lucide-react";
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
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    voiceMessagesRef.current = voiceMessages;
  }, [voiceMessages]);

  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Smooth scroll to latest captions during active call
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [voiceMessages]);

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      disconnectVoice();
    };
  }, []);

  // Restore previous active session from MongoDB on browser refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSessionId = localStorage.getItem("active_voice_session_id");
      if (savedSessionId) {
        setStatus("Restoring memory...");
        fetch(`http://localhost:5000/api/voice/session/${savedSessionId}`)
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

              // Stitch raw transcript string for compatibility
              const tString = data.messages
                .filter((m: any) => m.role === "assistant")
                .map((m: any) => m.text)
                .join(" ");
              setTranscript(tString);

              setActiveSessionId(data.sessionId);
              activeSessionIdRef.current = data.sessionId;
              setStatus("Session restored from memory");
              console.log(`Successfully restored voice session ${savedSessionId} from MongoDB`);
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

  // Utility to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Utility to convert Base64 to Float32Array
  const base64ToFloat32 = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }
    return float32Data;
  };

  // Append user message cleanly to reactive array
  const appendUserMessage = (text: string) => {
    setVoiceMessages((prev) => {
      const msg: VoiceMessage = {
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      return [...prev, msg];
    });
  };

  // Append or stream AI voice transcription live
  const appendSaarthiMessage = (text: string) => {
    setVoiceMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.role === "saarthi") {
        updated[updated.length - 1] = {
          ...last,
          content: last.content + text,
        };
      } else {
        updated.push({
          role: "saarthi",
          content: text,
          timestamp: Date.now(),
        });
      }
      return updated;
    });
    setTranscript((prev) => prev + text);
  };

  // Connect to backend WebSocket and hook speech recognition
  const connectVoice = async () => {
    setErrorMsg("");
    setStatus("Connecting...");

    // Set voice capturing flag instantly to allow continuous loops
    isVoiceCapturingRef.current = true;

    // Clear live transcript buffer but preserve past session history if resuming
    if (!activeSessionIdRef.current) {
      setTranscript("");
      setVoiceMessages([]);
    } else {
      // Clear current session's live additions so it reconnects cleanly
      setTranscript("");
    }

    // Generate session ID immediately at the start of connection if not present
    let sessionId = activeSessionIdRef.current;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setActiveSessionId(sessionId);
      activeSessionIdRef.current = sessionId;
    }
    localStorage.setItem("active_voice_session_id", sessionId);

    try {
      // 1. Request microphone access
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = micStream;

      // 2. Setup past context memory parameter if activeSession is present
      let wsUrl = "ws://localhost:5000/api/voice";
      if (activeSessionIdRef.current && voiceMessagesRef.current.length > 0) {
        const pastText = voiceMessagesRef.current
          .map((m) => `${m.role === "user" ? "User" : "Saarthi"}: ${m.content}`)
          .join("\n");
        wsUrl += `?history=${encodeURIComponent(pastText)}`;
      }

      // 3. Initialize WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // 4. Initialize Playback AudioContext
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
            if (parsed.data === "connected") {
              setIsActive(true);
            }
          } else if (parsed.type === "error") {
            setErrorMsg(parsed.data);
            disconnectVoice();
          } else if (parsed.type === "text") {
            // Stream and append incoming AI transcriptions
            appendSaarthiMessage(parsed.data);
          } else if (parsed.type === "audio") {
            // Play received PCM chunks
            playAudioChunk(parsed.data, parsed.mimeType);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMsg("WebSocket connection error. Failed to connect to Saarthi Voice.");
        disconnectVoice();
      };

      ws.onclose = () => {
        disconnectVoice();
      };

    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setErrorMsg("Microphone permission denied or not found. Please verify permissions.");
      setStatus("Disconnected");
      isVoiceCapturingRef.current = false;
    }
  };

  // Capture user speaking using browser Web Speech API (webkitSpeechRecognition)
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser. Live user captions disabled.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let textResult = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            textResult += event.results[i][0].transcript;
          }
        }

        const cleanResult = textResult.trim();
        if (cleanResult) {
          appendUserMessage(cleanResult);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
      };

      recognition.onend = () => {
        // Automatically restart transcription if the session is still capturing (relies on captures flag)
        if (isVoiceCapturingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) { }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to start speech recognition node:", e);
    }
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

        const inputData = e.inputBuffer.getChannelData(0); // Float32Array [-1.0, 1.0]

        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const base64Audio = arrayBufferToBase64(pcm16.buffer);
        wsRef.current.send(
          JSON.stringify({
            type: "audio",
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000",
          })
        );
      };
    } catch (e) {
      console.error("Error setting up microphone processing node:", e);
      setErrorMsg("Failed to start voice capture pipeline.");
    }
  };

  const playAudioChunk = (base64Data: string, mimeType: string) => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

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
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + 0.05;
      }

      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
    } catch (e) {
      console.error("Error playing back received audio chunk:", e);
    }
  };

  const disconnectVoice = () => {
    // IDEMPOTENCY CHECK: If already fully disconnected, exit immediately to prevent duplicate runs
    if (!wsRef.current && !activeRef.current) return;

    setIsActive(false);
    activeRef.current = false; // Sync reference instantly
    isVoiceCapturingRef.current = false; // Turn capturing off immediately
    setStatus("Disconnected");

    // Save final dual-transcripts to localStorage & MongoDB (capped at 2 most recent)
    const currentMessages = voiceMessagesRef.current;
    if (currentMessages.length > 0) {
      try {
        const raw = localStorage.getItem("saarthi_history");
        let history = raw ? JSON.parse(raw) : [];

        // Stitch human readable transcription summary log
        const fullTranscriptLog = currentMessages
          .map((m) => `${m.role === "user" ? "You" : "Saarthi"}: ${m.content}`)
          .join("\n");

        let sessionId = activeSessionIdRef.current;
        if (!sessionId) {
          sessionId = Date.now().toString();
        }

        const titleText = `Reflections - ${new Date().toLocaleDateString([], { month: "short", day: "numeric" })} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

        const existingIndex = history.findIndex((s: any) => s.id === sessionId);

        const newSession = {
          id: sessionId,
          title: titleText,
          transcript: fullTranscriptLog,
          messages: currentMessages, // Persist array turns for full memory resumption!
          timestamp: Date.now(),
        };

        if (existingIndex > -1) {
          history[existingIndex] = newSession;
        } else {
          history = [newSession, ...history];
        }

        history.sort((a: any, b: any) => b.timestamp - a.timestamp);
        history = history.slice(0, 2);

        // Update local cache synchronously for instant responsiveness
        localStorage.setItem("saarthi_history", JSON.stringify(history));
        window.dispatchEvent(new Event("historyUpdated"));

        // Persist to MongoDB backend
        fetch("http://localhost:5000/api/voice/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            sessionId,
            title: titleText,
            messages: currentMessages.map(m => ({
              role: m.role === "user" ? "user" : "assistant",
              text: m.content,
              timestamp: m.timestamp
            })),
            emotionalSummary: ""
          })
        })
          .then(res => {
            if (res.ok) {
              console.log("Session logs persisted to MongoDB successfully");
              window.dispatchEvent(new Event("historyUpdated"));
            } else {
              console.warn("MongoDB write returned an error");
            }
          })
          .catch(err => {
            console.error("Failed to POST session log to MongoDB backend:", err);
          });

      } catch (e) {
        console.error("Failed to save persistent voice log:", e);
      }
    }

    // Stop Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) { }
      wsRef.current = null;
    }

    // Stop Microphone stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    // Disconnect script processor
    if (micProcessorRef.current) {
      try {
        micProcessorRef.current.disconnect();
      } catch (e) { }
      micProcessorRef.current = null;
    }

    // Close playback audio context
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) { }
      audioCtxRef.current = null;
    }
  };

  const toggleConnection = () => {
    if (isActive || status === "Connecting...") {
      disconnectVoice();
    } else {
      connectVoice();
    }
  };

  // Continue historical session conversation from local logs
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

  // Instantiates a brand new session, resetting IDs
  const handleNewSession = () => {
    disconnectVoice();
    setVoiceMessages([]);
    setTranscript("");
    setActiveSessionId(null);
    activeSessionIdRef.current = null;
    setStatus("Disconnected");
  };

  return (
    <main className="relative min-h-screen bg-base-bg text-text-primary flex flex-col items-center justify-between p-6 md:p-12 font-sans selection:bg-sacred-blush/30 overflow-hidden">
      <FloatingParticles />

      {/* Background Glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-sacred-blush/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-meditation-lavender/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Unified Floating Actions Header */}
      <div className="fixed top-6 left-6 z-30 flex gap-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 bg-white/50 backdrop-blur-md border border-white/60 text-text-secondary hover:text-text-primary rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
          aria-label="Open history sidebar"
        >
          <History className="w-5 h-5 text-sacred-blush" />
        </button>

        {activeSessionId && (
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/50 backdrop-blur-md border border-white/60 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none"
          >
            <RefreshCw className="w-3.5 h-3.5 text-spiritual-gold" />
            New Session
          </button>
        )}
      </div>

      {/* Accessible Header Section */}
      <header className="w-full max-w-xl flex items-center justify-between py-4 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-all text-sm font-serif italic focus:outline-none focus:ring-2 focus:ring-sacred-blush/40 rounded-lg p-1.5"
          aria-label="Return to landing page"
        >
          <ArrowLeft className="w-4 h-4 text-sacred-blush" />
          Back to Sanctuary
        </Link>
        <div className="flex items-center gap-2.5 bg-white/40 backdrop-blur-md border border-white/30 rounded-full px-3.5 py-1.5 shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${isActive
                ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse"
                : status === "Connecting..."
                  ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse"
                  : "bg-text-muted/40"
              }`}
            aria-hidden="true"
          />
          <span className="text-[10px] tracking-wider uppercase font-semibold text-text-secondary animate-fade-in" aria-live="polite">
            {status}
          </span>
        </div>
      </header>

      {/* Main Sandbox Interactive Interface */}
      <section className="flex-1 w-full max-w-xl flex flex-col items-center justify-center space-y-8 my-6 z-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-serif text-text-primary tracking-tight">Saarthi AI</h1>
          <p className="text-text-secondary italic text-base md:text-lg max-w-sm mx-auto leading-relaxed">
            "Your companion in moments of verbal reflection."
          </p>
        </div>

        {/* Central Orb / Voice Indicator */}
        <div className="relative flex items-center justify-center w-56 h-56">
          <AnimatePresence>
            {/* Multi-layered breathing soft light halos using framer-motion */}
            {isActive && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 0.7 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 4, ease: "easeInOut" }}
                  className="absolute inset-0 bg-sacred-blush/25 blur-[50px] rounded-full"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1.15, opacity: 0.8 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 3, delay: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-meditation-lavender/35 blur-[55px] rounded-full"
                />
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 0.5 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 5, delay: 1, ease: "easeInOut" }}
                  className="absolute inset-0 bg-spiritual-gold/20 blur-[60px] rounded-full"
                />
              </>
            )}

            {status === "Connecting..." && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 0.8 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 bg-spiritual-gold/15 blur-[40px] rounded-full"
              />
            )}
          </AnimatePresence>

          {/* Solid Central Sacred Orb Button */}
          <button
            onClick={toggleConnection}
            className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center border transition-all duration-700 shadow-xl focus:outline-none focus:ring-4 focus:ring-sacred-blush/30 cursor-pointer ${isActive
                ? "bg-white/90 border-sacred-blush text-sacred-blush hover:bg-white scale-105"
                : status === "Connecting..."
                  ? "bg-white/80 border-spiritual-gold/40 text-spiritual-gold cursor-wait"
                  : "bg-white/60 backdrop-blur-md border-white/60 text-text-secondary hover:border-sacred-blush/40 hover:text-text-primary hover:bg-white/80"
              }`}
            aria-label={isActive ? "Stop voice assistant call" : "Start voice assistant call"}
          >
            <div className="absolute inset-0 rounded-full bg-radial-gradient from-white/30 to-transparent pointer-events-none" />

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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                  >
                    <Leaf className="w-12 h-12 text-sacred-blush" />
                  </motion.div>
                  <span className="text-[9px] uppercase tracking-widest font-semibold mt-3 text-text-secondary">
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
                  <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-spiritual-gold animate-spin mb-1" />
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-text-muted mt-2">
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
                  <Mic className="w-12 h-12 text-text-muted hover:text-sacred-blush transition-colors" />
                  <span className="text-[9px] uppercase tracking-widest font-bold text-text-muted mt-3">
                    {activeSessionId ? "Resume Session" : "Tap to Speak"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Display past session memory resume alert if not yet active but session is loaded */}
        {activeSessionId && !isActive && voiceMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white/40 backdrop-blur-md p-4 border border-white/60 rounded-sacred flex items-center justify-between text-xs text-text-secondary shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-spiritual-gold animate-pulse" />
              <span>
                <strong>Session memory loaded.</strong> Tap the orb above to resume conversation with Saarthi.
              </span>
            </div>
          </motion.div>
        )}

        {/* Real-time dialogue transcript card */}
        <AnimatePresence>
          {(isActive || voiceMessages.length > 0) && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full glass-card p-6 shadow-sm min-h-[180px] flex flex-col justify-between max-h-[300px] overflow-hidden"
            >
              <span className="text-[10px] text-text-muted tracking-widest uppercase font-semibold block mb-3 border-b border-white/30 pb-2">
                Session Dialogue Feed
              </span>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scrollbar-hide pr-1 space-y-4"
              >
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
                      <p className={`text-sm leading-relaxed px-4 py-2 rounded-sacred select-text max-w-[85%] whitespace-pre-wrap ${m.role === "user"
                          ? "bg-sacred-blush/20 text-text-primary border border-sacred-blush/10"
                          : "bg-white/55 text-text-secondary border border-white/30 shadow-sm"
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

        {/* Error Alert Message block styled with high-quality light styling */}
        {errorMsg && (
          <div
            className="w-full bg-red-50/50 backdrop-blur-md border border-red-100/60 rounded-sacred p-4.5 flex gap-3 text-red-700 text-sm shadow-sm z-10"
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

      {/* Accessible Footer Section */}
      <footer className="w-full max-w-xl text-center py-4 z-10">
        <p className="text-text-muted text-[10px] tracking-[0.2em] uppercase">
          Saarthi Voice Sandbox • Powered by Gemini Live
        </p>
      </footer>
    </main>
  );
}
