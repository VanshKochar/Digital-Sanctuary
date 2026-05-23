"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import axios from "axios";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Sparkles, Check, RefreshCw,
  Info, X, Plus, Minus, Camera, Moon, Heart, TrendingUp,
  BarChart2, Activity, Star, Dumbbell, Download, BookOpen,
} from "lucide-react";
import FloatingParticles from "@/components/FloatingParticles";

/* ─────────────────────────────────────────────
   API Helper
───────────────────────────────────────────── */
const getApiUrl = (endpoint: string) => {
  const isLocal =
    typeof window !== "undefined" && window.location.hostname === "localhost";
  const base = isLocal
    ? "http://localhost:5000/api/inner-atlas"
    : "https://digital-sanctuary-ou9k.onrender.com/api/inner-atlas";
  return `${base}${endpoint}`;
};

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface Exercise { name: string; duration: number }
interface SleepData { bedTime: string; wakeTime: string }

interface AtlasLog {
  _id?: string;
  sessionId: string;
  date: string;
  mood: string;
  emotions: string[];
  hobbies: string[];
  relationship: string[];
  selfCare: string[];
  health: string[];
  people: string[];
  music: string;
  weather: string;
  steps: number;
  exercises: Exercise[];
  sleep: SleepData;
  note: string;
  gratitude: string[];
  activities?: string[];
  createdAt?: string;
}

/* ─────────────────────────────────────────────
   Data Constants
───────────────────────────────────────────── */
const KITTEN_MOODS = [
  { id: "happy",     label: "Happy",     emoji: "😺", bg: "#FFFBEB", border: "#F0C060" },
  { id: "loved",     label: "Loved",     emoji: "😻", bg: "#FFF0F3", border: "#F09CB0" },
  { id: "excited",   label: "Excited",   emoji: "😸", bg: "#FFF3E0", border: "#F0A040" },
  { id: "playful",   label: "Playful",   emoji: "😹", bg: "#EDFDF5", border: "#60C880" },
  { id: "calm",      label: "Calm",      emoji: "😽", bg: "#EFF8FF", border: "#70B8F0" },
  { id: "proud",     label: "Proud",     emoji: "😼", bg: "#F5F0FF", border: "#A070E0" },
  { id: "okay",      label: "Okay",      emoji: "🐱", bg: "#F5F5F5", border: "#B0B0B0" },
  { id: "tired",     label: "Tired",     emoji: "🐈",  bg: "#F0EDF8", border: "#9080C0" },
  { id: "sad",       label: "Sad",       emoji: "😿", bg: "#EEF2FF", border: "#7080C0" },
  { id: "anxious",   label: "Anxious",   emoji: "🙀", bg: "#FFFBEB", border: "#D0A030" },
  { id: "angry",     label: "Angry",     emoji: "😾", bg: "#FFF0F0", border: "#E06060" },
  { id: "refreshed", label: "Refreshed", emoji: "🐈‍⬛", bg: "#E0FAF8", border: "#40C0C0" },
];

const EMOTIONS = [
  "excited","relaxed","proud","hopeful","happy","enthusiastic",
  "pit-a-pat","refreshed","calm","grateful","depressed","lonely",
  "anxious","sad","angry","pressured","annoyed","tired","stressed","bored",
];

const HOBBIES = [
  { id: "exercise",    label: "Exercise",      emoji: "🏋️" },
  { id: "tv",          label: "TV & Content",  emoji: "📺" },
  { id: "movie",       label: "Movie",         emoji: "🎬" },
  { id: "gaming",      label: "Gaming",        emoji: "🎮" },
  { id: "reading",     label: "Reading",       emoji: "📚" },
  { id: "walk",        label: "Walk",          emoji: "🚶" },
  { id: "music",       label: "Music",         emoji: "🎵" },
  { id: "drawing",     label: "Drawing",       emoji: "✏️" },
];

const RELATIONSHIPS = [
  { id: "date",        label: "Date",          emoji: "💕" },
  { id: "anniversary", label: "Anniversary",   emoji: "🥂" },
  { id: "gift",        label: "Gift",          emoji: "🎁" },
  { id: "conflict",    label: "Conflict",      emoji: "⚡" },
];

const SELF_CARE = [
  { id: "shower",      label: "Shower",        emoji: "🚿" },
  { id: "brush_teeth", label: "Brush Teeth",   emoji: "🦷" },
  { id: "wash_face",   label: "Wash Face",     emoji: "🧴" },
  { id: "drink_water", label: "Drink Water",   emoji: "💧" },
];

const HEALTH = [
  { id: "sick",        label: "Sick",          emoji: "🤒" },
  { id: "hospital",    label: "Hospital",      emoji: "🏥" },
  { id: "checkup",     label: "Checkup",       emoji: "🩺" },
  { id: "medicine",    label: "Medicine",      emoji: "💊" },
];

const PEOPLE = [
  { id: "friends",     label: "Friends",       emoji: "👫" },
  { id: "family",      label: "Family",        emoji: "👨‍👩‍👧" },
  { id: "partner",     label: "Partner",       emoji: "💑" },
  { id: "none",        label: "Solo Day",      emoji: "🌙" },
];

const WEATHER_OPTIONS = [
  { id: "sunny",  label: "Sunny",   emoji: "☀️" },
  { id: "cloudy", label: "Cloudy",  emoji: "⛅" },
  { id: "rainy",  label: "Rainy",   emoji: "🌧️" },
  { id: "stormy", label: "Stormy",  emoji: "⛈️" },
  { id: "windy",  label: "Windy",   emoji: "💨" },
  { id: "snowy",  label: "Snowy",   emoji: "❄️" },
  { id: "foggy",  label: "Foggy",   emoji: "🌫️" },
  { id: "hot",    label: "Hot",     emoji: "🌡️" },
];

const EXERCISES = [
  "Walking","Strength Training","Basketball","Dance","Running","Hiking",
  "Football","Yoga","Swimming","Cycling","Pilates","Ballet","Badminton",
  "Cardio","Soccer","Boxing","Table Tennis","Tennis","Cricket","Hockey","Martial Arts",
];

const emptyForm = () => ({
  mood:         "",
  emotions:     [] as string[],
  hobbies:      [] as string[],
  relationship: [] as string[],
  selfCare:     [] as string[],
  health:       [] as string[],
  people:       [] as string[],
  music:        "",
  weather:      "",
  steps:        0,
  exercises:    [] as Exercise[],
  sleep:        { bedTime: "", wakeTime: "" } as SleepData,
  note:         "",
  gratitude:    ["", "", "", "", ""],
});

/* ─────────────────────────────────────────────
   Chip Group Component
───────────────────────────────────────────── */
function ChipGroup({
  items, selected, onToggle, label, emoji,
}: {
  items: { id: string; label: string; emoji: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  label: string;
  emoji: string;
}) {
  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
        <span>{emoji}</span> {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const sel = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              aria-pressed={sel}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/30 ${
                sel
                  ? "bg-text-primary text-base-bg border-text-primary shadow-sm font-semibold"
                  : "bg-white/40 border-white/60 text-text-secondary hover:bg-white/80"
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function InnerAtlas() {
  const prefersReducedMotion = useReducedMotion();
  const [sessionId, setSessionId] = useState("");
  const [historyLogs, setHistoryLogs] = useState<AtlasLog[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [weeklyLetter, setWeeklyLetter] = useState("");

  /* Calendar navigation */
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  /* Check-in drawer */
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [activeExerciseInput, setActiveExerciseInput] = useState<string | null>(null);
  const [customExerciseInput, setCustomExerciseInput] = useState("");
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  /* Letter overlay */
  const [isLetterOpen, setIsLetterOpen] = useState(false);

  /* Loading / error */
  const [loadingHistory,  setLoadingHistory]  = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingLetter,   setLoadingLetter]   = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [logSuccess,      setLogSuccess]      = useState(false);
  const [errorText,       setErrorText]       = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── helpers ── */
  // Memoized so it doesn't recalculate on every render; safe across midnight
  // because the user would refresh the page in a new day anyway
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  /* ── Init session ── */
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("atlas_session_id");
      if (!id) { id = `session_${Date.now()}`; localStorage.setItem("atlas_session_id", id); }
      setSessionId(id);
    }
  }, []);

  useEffect(() => {
    if (sessionId) { fetchLogs(); fetchInsights(); }
  }, [sessionId]);

  /* ── API calls ── */
  const fetchLogs = useCallback(async () => {
    if (!sessionId) return;       // guard against empty sessionId on first render
    try {
      setLoadingHistory(true);
      const res = await axios.get(getApiUrl(`/logs?sessionId=${sessionId}`));
      setHistoryLogs(res.data);
    } catch (e) { console.error("Logs error:", e); }
    finally { setLoadingHistory(false); }
  }, [sessionId]);

  const insightsLoadingRef = useRef(false);  // ref-based guard avoids stale closure
  const fetchInsights = useCallback(async () => {
    if (!sessionId || insightsLoadingRef.current) return;
    try {
      insightsLoadingRef.current = true;
      setLoadingInsights(true);
      const res = await axios.get(getApiUrl(`/insights?sessionId=${sessionId}`));
      setInsights(res.data.insights || []);
    } catch (e) { console.error("Insights error:", e); }
    finally { insightsLoadingRef.current = false; setLoadingInsights(false); }
  }, [sessionId]);

  const fetchWeeklyLetter = useCallback(async () => {
    if (!sessionId || loadingLetter) return;
    try {
      setLoadingLetter(true);
      const res = await axios.get(getApiUrl(`/weekly?sessionId=${sessionId}`));
      setWeeklyLetter(res.data.letter || "");
      setIsLetterOpen(true);
    } catch (e) {
      console.error("Letter error:", e);
      setErrorText("Unable to compile your weekly report. Try again shortly.");
    } finally { setLoadingLetter(false); }
  }, [sessionId, loadingLetter]);

  /* ── Open check-in modal for a date ── */
  const openCheckIn = (dateStr: string) => {
    const existing = historyLogs.find((l) => l.date === dateStr);
    if (existing) {
      setForm({
        mood:         existing.mood         || "",
        emotions:     existing.emotions     || [],
        hobbies:      existing.hobbies      || [],
        relationship: existing.relationship || [],
        selfCare:     existing.selfCare     || [],
        health:       existing.health       || [],
        people:       existing.people       || [],
        music:        existing.music        || "",
        weather:      existing.weather      || "",
        steps:        existing.steps        || 0,
        exercises:    existing.exercises    || [],
        sleep:        existing.sleep        || { bedTime: "", wakeTime: "" },
        note:         existing.note         || "",
        gratitude:    existing.gratitude?.length === 5 ? existing.gratitude : ["", "", "", "", ""],
      });
    } else {
      setForm(emptyForm());
    }
    setPhotos([]);
    setLogSuccess(false);
    setCheckInDate(dateStr);
    setIsCheckInOpen(true);
  };

  /* ── Form helpers ── */
  // Restrict to known array-only fields to keep type safety
  type ArrayField = "emotions" | "hobbies" | "relationship" | "selfCare" | "health" | "people";
  const toggle = (field: ArrayField, value: string) => {
    setForm((prev) => {
      const arr = (prev[field] as string[]);
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const handleExerciseClick = (name: string) => {
    const exists = form.exercises.find((e) => e.name === name);
    if (exists) {
      setForm((prev) => ({ ...prev, exercises: prev.exercises.filter((e) => e.name !== name) }));
      if (activeExerciseInput === name) setActiveExerciseInput(null);
    } else {
      setForm((prev) => ({ ...prev, exercises: [...prev.exercises, { name, duration: 0 }] }));
      setActiveExerciseInput(name);
    }
  };

  const updateExerciseDuration = (name: string, duration: number) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.name === name ? { ...e, duration } : e)),
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 2 - photos.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setPhotos((prev) => [...prev, ev.target!.result as string].slice(0, 2));
      };
      reader.readAsDataURL(file);
    });
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.mood) return;
    try {
      setIsSubmitting(true);
      setErrorText(null);
      await axios.post(getApiUrl("/log"), {
        sessionId,
        date:         checkInDate,
        mood:         form.mood,
        emotions:     form.emotions,
        hobbies:      form.hobbies,
        relationship: form.relationship,
        selfCare:     form.selfCare,
        health:       form.health,
        people:       form.people,
        music:        form.music,
        weather:      form.weather,
        steps:        form.steps,
        exercises:    form.exercises,
        sleep:        form.sleep,
        note:         form.note,
        gratitude:    form.gratitude.filter((g) => g.trim()),
        activities:   [...form.hobbies, ...form.emotions, ...form.selfCare],
      });
      setLogSuccess(true);
      await fetchLogs();
      await fetchInsights();
      setTimeout(() => { setIsCheckInOpen(false); setLogSuccess(false); }, 1800);
    } catch (e) {
      console.error("Submit error:", e);
      setErrorText("Could not save your entry. Please try again.");
    } finally { setIsSubmitting(false); }
  };

  /* ── Sleep duration display — computed once and reused ── */
  const sleepDurationText = useMemo(() => {
    if (!form.sleep.bedTime || !form.sleep.wakeTime) return null;
    const [bh, bm] = form.sleep.bedTime.split(":").map(Number);
    const [wh, wm] = form.sleep.wakeTime.split(":").map(Number);
    let mins = wh * 60 + wm - (bh * 60 + bm);
    if (mins < 0) mins += 24 * 60;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }, [form.sleep.bedTime, form.sleep.wakeTime]);

  /* ═══════════════════════════════════════════
     CALENDAR RENDER
  ═══════════════════════════════════════════ */
  const renderCalendar = () => {
    const firstDay  = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const monthName = new Date(calendarYear, calendarMonth).toLocaleString("default", { month: "long" });
    const weekdays  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const cells: (null | { d: number; dateStr: string; log?: AtlasLog; isToday: boolean; isFuture: boolean; moodConf?: typeof KITTEN_MOODS[0] })[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
      // YYYY-MM-DD string comparison works correctly for same-year months
      const dateStr  = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const log      = historyLogs.find((l) => l.date === dateStr);
      const moodConf = log ? KITTEN_MOODS.find((m) => m.id === log.mood) : undefined;
      // isFuture: string comparison works because format is always YYYY-MM-DD
      cells.push({ d, dateStr, log, isToday: dateStr === todayStr, isFuture: dateStr > todayStr, moodConf });
    }

    return (
      <div className="space-y-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); } else setCalendarMonth((m) => m - 1); }}
            className="p-2 hover:bg-white/60 rounded-full transition-colors text-text-secondary hover:text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-serif font-semibold text-text-primary">{monthName}</h2>
            <p className="text-[10px] text-text-muted tracking-widest uppercase">{calendarYear}</p>
          </div>
          <button
            onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); } else setCalendarMonth((m) => m + 1); }}
            className="p-2 hover:bg-white/60 rounded-full transition-colors text-text-secondary hover:text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((w) => (
            <div key={w} className="text-[10px] font-bold text-text-muted uppercase py-1">{w}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, idx) => {
            if (!cell) return <div key={`e-${idx}`} />;
            const { d, dateStr, isToday, isFuture, moodConf } = cell;

            return (
              <motion.button
                key={dateStr}
                onClick={() => !isFuture && openCheckIn(dateStr)}
                whileHover={!isFuture && !prefersReducedMotion ? { scale: 1.1 } : {}}
                whileTap={!isFuture && !prefersReducedMotion ? { scale: 0.95 } : {}}
                disabled={isFuture}
                style={moodConf ? { backgroundColor: moodConf.bg, borderColor: moodConf.border } : {}}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all cursor-pointer disabled:cursor-default disabled:opacity-25 border focus:outline-none focus:ring-2 focus:ring-sacred-blush/40 ${
                  isToday ? "ring-2 ring-spiritual-gold ring-offset-2 ring-offset-base-bg shadow-lg" : ""
                } ${!moodConf ? "border-white/40 bg-white/30 hover:bg-white/60" : "shadow-sm"}`}
                title={isToday ? "Today — tap to check in 🐾" : dateStr}
                aria-label={`${dateStr}${isToday ? " (today)" : ""}${moodConf ? ` — ${moodConf.label}` : ""}`}
              >
                {moodConf ? (
                  <>
                    <span className="text-xl leading-none">{moodConf.emoji}</span>
                    <span className="text-[8px] text-gray-500 mt-0.5 font-medium">{d}</span>
                  </>
                ) : (
                  <span className={`font-medium ${isToday ? "text-spiritual-gold font-bold text-sm" : "text-text-secondary"}`}>{d}</span>
                )}
                {isToday && !moodConf && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-spiritual-gold rounded-full animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Mood legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-3 border-t border-sacred-blush/20">
          {KITTEN_MOODS.map((m) => (
            <div key={m.id} className="flex items-center gap-1 text-[9px] text-text-muted">
              <span>{m.emoji}</span><span>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     ANALYTICS RENDER
  ═══════════════════════════════════════════ */
  const renderAnalytics = () => {
    if (historyLogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
          <Activity className="w-10 h-10 text-sacred-blush/30" />
          <p className="text-sm font-serif italic text-text-secondary">Start logging to see your patterns come alive.</p>
        </div>
      );
    }

    /* Mood frequency */
    const moodCounts: Record<string, number> = {};
    historyLogs.forEach((l) => { moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1; });
    const maxMood = Math.max(...Object.values(moodCounts), 1);

    /* Top activities */
    const actCounts: Record<string, number> = {};
    historyLogs.forEach((l) => {
      [...(l.hobbies || []), ...(l.selfCare || []), ...(l.emotions || [])].forEach((a) => {
        actCounts[a] = (actCounts[a] || 0) + 1;
      });
    });
    const topActs = Object.entries(actCounts).sort(([, a], [, b]) => b - a).slice(0, 6);

    /* Exercise */
    const exCounts: Record<string, number> = {};
    historyLogs.forEach((l) => (l.exercises || []).forEach((e) => { exCounts[e.name] = (exCounts[e.name] || 0) + 1; }));
    const topEx = Object.entries(exCounts).sort(([, a], [, b]) => b - a)[0];

    /* Sleep */
    const sleepLogs = historyLogs.filter((l) => l.sleep?.bedTime && l.sleep?.wakeTime);
    const latestSleep = sleepLogs[sleepLogs.length - 1]?.sleep;

    /* Music */
    const musicLogs = historyLogs.filter((l) => l.music);

    return (
      <div className="space-y-6">
        {/* Mood frequency */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-sacred-blush" /> Mood Flow
          </h3>
          <div className="space-y-2">
            {Object.entries(moodCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([mood, count]) => {
              const conf = KITTEN_MOODS.find((m) => m.id === mood);
              return (
                <div key={mood} className="flex items-center gap-2">
                  <span className="text-base w-6 shrink-0">{conf?.emoji ?? "🐱"}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxMood) * 100}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-sacred-blush to-meditation-lavender"
                    />
                  </div>
                  <span className="text-[10px] text-text-muted w-5 shrink-0">{count}d</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top activities */}
        {topActs.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-spiritual-gold" /> Frequent Activities
            </h3>
            <div className="flex flex-wrap gap-2">
              {topActs.map(([act, count]) => (
                <span key={act} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/50 border border-white/60 rounded-full text-[10px] text-text-secondary capitalize">
                  {act} <span className="text-spiritual-gold font-bold ml-0.5">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Favourite exercise */}
        {topEx && (
          <div className="flex items-center gap-3 bg-white/40 border border-white/60 rounded-sacred p-3.5">
            <Dumbbell className="w-5 h-5 text-spiritual-gold shrink-0" />
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted">Favourite Exercise</p>
              <p className="text-sm font-serif text-text-primary">{topEx[0]}</p>
            </div>
            <span className="ml-auto text-xs font-bold text-spiritual-gold">{topEx[1]}×</span>
          </div>
        )}

        {/* Latest sleep */}
        {latestSleep && (
          <div className="flex items-center gap-3 bg-white/40 border border-white/60 rounded-sacred p-3.5">
            <Moon className="w-5 h-5 text-meditation-lavender shrink-0" />
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted">Latest Sleep</p>
              <p className="text-sm font-serif text-text-primary">🛏 {latestSleep.bedTime} → ☀️ {latestSleep.wakeTime}</p>
            </div>
          </div>
        )}

        {/* Music */}
        {musicLogs.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-2">
              🎵 Recent Music
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(musicLogs.slice(-5).map((l) => l.music))].map((m) => (
                <span key={m} className="px-2.5 py-1 bg-white/50 border border-white/60 rounded-full text-[10px] text-text-secondary italic">🎵 {m}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <main className="relative min-h-screen p-4 md:p-8 overflow-hidden bg-base-bg selection:bg-sacred-blush/30">
      <FloatingParticles />

      {/* Atmospheric glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-sacred-blush/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-meditation-lavender/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-[40%] left-[30%] w-[40vw] h-[40vw] bg-spiritual-gold/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sacred-blush/20 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2.5 bg-white/50 hover:bg-white border border-white/60 text-text-secondary hover:text-text-primary rounded-full shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
              aria-label="Return home"
            >
              <ChevronLeft className="w-5 h-5 text-sacred-blush" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-text-primary tracking-tight">🗺️ Inner Atlas</h1>
              <p className="text-xs font-serif italic text-text-secondary mt-0.5">Your emotional landscape, mapped in silence.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCheckIn(todayStr)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-text-primary text-base-bg text-[10px] font-bold tracking-widest uppercase shadow-md hover:opacity-90 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-text-primary"
            >
              <Sparkles className="w-3.5 h-3.5 text-sacred-blush" />
              Log Today
            </button>
            <button
              onClick={fetchWeeklyLetter}
              disabled={loadingLetter}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-sacred-blush bg-white/60 hover:bg-white text-[10px] font-bold text-text-primary tracking-widest uppercase transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
            >
              <Download className="w-3.5 h-3.5 text-sacred-blush" />
              {loadingLetter ? "Compiling..." : "Weekly Report"}
            </button>
          </div>
        </header>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {errorText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              role="alert"
              className="bg-sacred-blush/20 border border-sacred-blush text-text-primary px-4 py-3 rounded-sacred text-xs flex items-center gap-2"
            >
              <Info className="w-4 h-4 text-sacred-blush shrink-0" />
              <span>{errorText}</span>
              <button onClick={() => setErrorText(null)} className="ml-auto font-bold uppercase text-[10px] text-text-secondary hover:text-text-primary cursor-pointer">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Calendar */}
          <section className="lg:col-span-7">
            <article className="glass-card p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif text-text-primary">Mood Calendar</h2>
                  <p className="text-[10px] text-text-muted mt-0.5">Click any day to check in 🐾</p>
                </div>
              </div>
              {loadingHistory ? (
                <div className="flex justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-sacred-blush animate-spin" />
                </div>
              ) : renderCalendar()}
            </article>
          </section>

          {/* RIGHT: AI Insights + Analytics */}
          <section className="lg:col-span-5 space-y-6">
            {/* AI Pattern Intelligence */}
            <article className="glass-card p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-spiritual-gold/15 blur-2xl rounded-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-text-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-spiritual-gold" /> AI Insights
                </h2>
                <button
                  onClick={fetchInsights}
                  disabled={loadingInsights}
                  className="p-1.5 hover:bg-white/40 rounded-full transition-colors cursor-pointer disabled:opacity-40 focus:outline-none"
                  title="Refresh insights"
                  aria-label="Refresh AI insights"
                >
                  <RefreshCw className={`w-4 h-4 text-sacred-blush ${loadingInsights ? "animate-spin" : ""}`} />
                </button>
              </div>
              {loadingInsights ? (
                <div className="space-y-2.5 py-2">
                  {[75, 90, 60, 80].map((w, i) => (
                    <div key={i} className="h-2.5 bg-white/50 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : insights.length === 0 ? (
                <p className="text-xs italic font-serif text-text-secondary">Log a few days to unlock AI pattern correlations.</p>
              ) : (
                <ul className="space-y-3">
                  {insights.map((insight, i) => (
                    <motion.li
                      key={i}
                      initial={prefersReducedMotion ? {} : { opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="text-xs text-text-secondary leading-relaxed font-serif flex items-start gap-2"
                    >
                      <span className="text-spiritual-gold mt-0.5 shrink-0">✦</span>
                      <span>{insight}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </article>

            {/* Analytics dashboard */}
            <article className="glass-card p-6 space-y-5">
              <h2 className="text-xl font-serif text-text-primary flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sacred-blush" /> Patterns
              </h2>
              {loadingHistory
                ? <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-sacred-blush animate-spin" /></div>
                : renderAnalytics()}
            </article>
          </section>

        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CHECK-IN DRAWER
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {isCheckInOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCheckInOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="relative w-full max-w-2xl bg-[#FAF9F5] rounded-t-[32px] md:rounded-[32px] max-h-[92vh] overflow-y-auto shadow-2xl border border-white/60"
              role="dialog"
              aria-modal="true"
              aria-label="Daily check-in form"
            >

              {/* Sticky header */}
              <div className="sticky top-0 z-10 bg-[#FAF9F5]/95 backdrop-blur-md px-6 pt-5 pb-4 border-b border-sacred-blush/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-serif text-text-primary">
                      {checkInDate === todayStr
                        ? "Today's Check-in ✨"
                        : `Check-in — ${new Date(checkInDate + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}`}
                    </h2>
                    <p className="text-[10px] text-text-muted mt-0.5">Fill what resonates. Only your mood is required.</p>
                  </div>
                  <button
                    onClick={() => setIsCheckInOpen(false)}
                    className="p-2 hover:bg-white/60 rounded-full transition-colors text-text-secondary hover:text-text-primary cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
                    aria-label="Close check-in"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-10 space-y-8 pt-6">

                {/* 1 ── HOW'S YOUR DAY (Kitten moods) */}
                <section aria-label="How's your day mood selection">
                  <p className="text-sm font-serif font-semibold text-text-primary mb-4">How&apos;s your day? 🐾</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {KITTEN_MOODS.map((mood) => {
                      const sel = form.mood === mood.id;
                      return (
                        <motion.button
                          key={mood.id}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, mood: mood.id }))}
                          whileHover={prefersReducedMotion ? {} : { scale: 1.06 }}
                          whileTap={prefersReducedMotion ? {} : { scale: 0.96 }}
                          style={sel ? { backgroundColor: mood.bg, borderColor: mood.border, borderWidth: 2 } : {}}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/40 ${
                            sel ? "shadow-md" : "border-transparent bg-white/50 hover:bg-white/80"
                          }`}
                          aria-pressed={sel}
                          aria-label={mood.label}
                        >
                          <span className="text-2xl sm:text-3xl leading-none">{mood.emoji}</span>
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-text-secondary text-center leading-tight">{mood.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* 2 ── EMOTIONS */}
                <section aria-label="Emotion multi-select">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                    💭 Emotions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((emotion) => {
                      const sel = form.emotions.includes(emotion);
                      return (
                        <button
                          key={emotion}
                          type="button"
                          onClick={() => toggle("emotions", emotion)}
                          aria-pressed={sel}
                          className={`px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer capitalize focus:outline-none focus:ring-2 focus:ring-meditation-lavender/60 ${
                            sel
                              ? "bg-meditation-lavender/60 border-meditation-lavender text-text-primary font-semibold shadow-sm"
                              : "bg-white/40 border-white/60 text-text-secondary hover:bg-white/80"
                          }`}
                        >
                          {emotion}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 3 ── HOBBIES */}
                <ChipGroup label="Hobbies" emoji="🎨" items={HOBBIES} selected={form.hobbies} onToggle={(v) => toggle("hobbies", v)} />

                {/* 4 ── RELATIONSHIP */}
                <ChipGroup label="Relationship" emoji="💖" items={RELATIONSHIPS} selected={form.relationship} onToggle={(v) => toggle("relationship", v)} />

                {/* 5 ── SELF CARE */}
                <ChipGroup label="Self Care" emoji="🧴" items={SELF_CARE} selected={form.selfCare} onToggle={(v) => toggle("selfCare", v)} />

                {/* 6 ── HEALTH */}
                <ChipGroup label="Health" emoji="🩺" items={HEALTH} selected={form.health} onToggle={(v) => toggle("health", v)} />

                {/* 7 ── PEOPLE */}
                <ChipGroup label="People" emoji="👥" items={PEOPLE} selected={form.people} onToggle={(v) => toggle("people", v)} />
                {/* 8 ── MUSIC */}
                <section>
                  <label htmlFor="music-input" className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5 block">
                    🎵 Music Playing
                  </label>
                  <input
                    id="music-input"
                    type="text"
                    value={form.music}
                    onChange={(e) => setForm((p) => ({ ...p, music: e.target.value }))}
                    placeholder="What did you listen to today?"
                    className="w-full px-4 py-3 rounded-sacred bg-white/50 border border-white/60 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-sacred-blush/40 transition-all"
                  />
                </section>

                {/* 9 ── WEATHER */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                    🌤️ Weather Today
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WEATHER_OPTIONS.map((w) => {
                      const sel = form.weather === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, weather: sel ? "" : w.id }))}
                          aria-pressed={sel}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/30 ${
                            sel
                              ? "bg-sky-50 border-sky-300 text-sky-800 font-semibold shadow-sm"
                              : "bg-white/40 border-white/60 text-text-secondary hover:bg-white/80"
                          }`}
                        >
                          <span>{w.emoji}</span> {w.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 10 ── STEPS */}
                <section>
                  <label htmlFor="steps-input" className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2.5 flex items-center gap-1.5 block">
                    👟 Steps Today
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, steps: Math.max(0, p.steps - 500) }))}
                      className="p-2.5 bg-white/50 border border-white/60 rounded-full hover:bg-white/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
                      aria-label="Decrease steps by 500"
                    >
                      <Minus className="w-4 h-4 text-text-secondary" />
                    </button>
                    <input
                      id="steps-input"
                      type="number"
                      value={form.steps}
                      onChange={(e) => setForm((p) => ({ ...p, steps: parseInt(e.target.value) || 0 }))}
                      min={0}
                      className="flex-1 text-center px-4 py-3 rounded-sacred bg-white/50 border border-white/60 text-base font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, steps: p.steps + 500 }))}
                      className="p-2.5 bg-white/50 border border-white/60 rounded-full hover:bg-white/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
                      aria-label="Increase steps by 500"
                    >
                      <Plus className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                </section>

                {/* 11 ── EXERCISE */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                    🏋️ Exercise — tap to log, then enter duration
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...EXERCISES, ...customExercises].map((ex) => {
                      const exData = form.exercises.find((e) => e.name === ex);
                      const sel = !!exData;
                      return (
                        <div key={ex} className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleExerciseClick(ex)}
                            aria-pressed={sel}
                            className={`px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-spiritual-gold/40 ${
                              sel
                                ? "bg-spiritual-gold/20 border-spiritual-gold text-text-primary font-semibold shadow-sm"
                                : "bg-white/40 border-white/60 text-text-secondary hover:bg-white/80"
                            }`}
                          >
                            {ex}
                          </button>
                          <AnimatePresence>
                            {sel && activeExerciseInput === ex && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-1.5 bg-white/70 border border-spiritual-gold/30 rounded-full px-3 py-1.5"
                              >
                                <input
                                  type="number"
                                  placeholder="mins"
                                  value={exData?.duration || ""}
                                  onChange={(e) => updateExerciseDuration(ex, parseInt(e.target.value) || 0)}
                                  className="w-14 text-center text-xs bg-transparent focus:outline-none text-text-primary font-semibold"
                                  autoFocus
                                  aria-label={`Duration for ${ex} in minutes`}
                                />
                                <span className="text-[9px] text-text-muted">min</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveExerciseInput(null)}
                                  className="text-text-muted hover:text-text-primary cursor-pointer"
                                  aria-label="Confirm duration"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {/* Add custom */}
                    <input
                      type="text"
                      placeholder="Add your own..."
                      value={customExerciseInput}
                      onChange={(e) => setCustomExerciseInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customExerciseInput.trim()) {
                          setCustomExercises((prev) => [...prev, customExerciseInput.trim()]);
                          setCustomExerciseInput("");
                        }
                      }}
                      className="px-3 py-1.5 rounded-full border border-dashed border-text-muted/40 bg-transparent text-xs text-text-muted placeholder:text-text-muted/50 focus:outline-none focus:border-spiritual-gold w-32"
                      aria-label="Add custom exercise"
                    />
                  </div>

                  {/* Exercise summary */}
                  {form.exercises.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.exercises.map((e) => (
                        <span key={e.name} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-spiritual-gold/10 border border-spiritual-gold/30 rounded-full text-[9px] text-text-secondary">
                          🏃 {e.name} {e.duration > 0 ? `· ${e.duration}m` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* 12 ── SLEEP */}
                <section aria-label="Sleep tracker">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                    🌙 Sleep
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 border border-white/60 rounded-sacred p-4 text-center space-y-2">
                      <div className="text-2xl">🛏️</div>
                      <label htmlFor="bed-time" className="block text-[9px] uppercase tracking-widest text-text-muted font-bold">Went to Bed</label>
                      <input
                        id="bed-time"
                        type="time"
                        value={form.sleep.bedTime}
                        onChange={(e) => setForm((p) => ({ ...p, sleep: { ...p.sleep, bedTime: e.target.value } }))}
                        className="w-full text-center text-lg font-serif font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div className="bg-white/50 border border-white/60 rounded-sacred p-4 text-center space-y-2">
                      <div className="text-2xl">☀️</div>
                      <label htmlFor="wake-time" className="block text-[9px] uppercase tracking-widest text-text-muted font-bold">Woke Up</label>
                      <input
                        id="wake-time"
                        type="time"
                        value={form.sleep.wakeTime}
                        onChange={(e) => setForm((p) => ({ ...p, sleep: { ...p.sleep, wakeTime: e.target.value } }))}
                        className="w-full text-center text-lg font-serif font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                  {sleepDurationText && (
                    <p className="text-center text-xs text-text-secondary mt-2 font-serif italic">
                      ✨ {sleepDurationText} of rest
                    </p>
                  )}
                </section>

                {/* 13 ── TODAY'S NOTE */}
                <section>
                  <label htmlFor="todays-note" className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2.5 flex items-center gap-1.5 block">
                    <BookOpen className="w-3.5 h-3.5" /> Today&apos;s Note
                  </label>
                  <textarea
                    id="todays-note"
                    value={form.note}
                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    rows={3}
                    placeholder="Write anything... what happened, how you felt, what you noticed..."
                    className="w-full px-4 py-3 rounded-sacred bg-white/50 border border-white/60 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-sacred-blush/40 transition-all resize-none"
                  />
                </section>

                {/* 14 ── PHOTOS */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Today&apos;s Photos
                    <span className="text-text-muted/50 normal-case font-normal tracking-normal">(max 2)</span>
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/60 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt={`Today's photo ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70 cursor-pointer focus:outline-none"
                          aria-label={`Remove photo ${i + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 2 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-28 h-28 rounded-2xl border-2 border-dashed border-sacred-blush/40 flex flex-col items-center justify-center gap-2 text-text-muted hover:bg-white/50 hover:border-sacred-blush transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
                        aria-label="Add photo"
                      >
                        <Camera className="w-6 h-6 text-sacred-blush/50" />
                        <span className="text-[9px] tracking-wide">Add Photo</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      aria-label="Upload photos"
                    />
                  </div>
                </section>

                {/* 15 ── GRATITUDE JOURNAL */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1.5 flex items-center gap-1.5">
                    🙏 Gratitude Journal
                  </p>
                  <p className="text-[10px] text-text-muted italic mb-3">5 things that happened today you&apos;re thankful for...</p>
                  <div className="space-y-2.5">
                    {form.gratitude.map((g, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-sacred-blush/20 text-sacred-blush text-[10px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          value={g}
                          onChange={(e) => {
                            const arr = [...form.gratitude];
                            arr[i] = e.target.value;
                            setForm((p) => ({ ...p, gratitude: arr }));
                          }}
                          placeholder="I'm grateful for..."
                          aria-label={`Gratitude ${i + 1}`}
                          className="flex-1 px-3 py-2 rounded-xl bg-white/50 border border-white/60 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-sacred-blush/30 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── SUBMIT ── */}
                <div className="pt-4 border-t border-sacred-blush/20">
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !form.mood}
                    whileHover={!prefersReducedMotion && !isSubmitting && form.mood ? { scale: 1.02 } : {}}
                    whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                    className={`w-full py-4 rounded-sacred text-sm font-bold tracking-widest uppercase shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-sacred-blush/40 ${
                      logSuccess
                        ? "bg-emerald-400 text-white"
                        : "bg-text-primary text-base-bg hover:opacity-90 disabled:opacity-40"
                    }`}
                    aria-label="Save today's journal entry"
                  >
                    {isSubmitting ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Sealing entry...</>
                    ) : logSuccess ? (
                      <><Check className="w-5 h-5" /> Journal Done! 🐾</>
                    ) : (
                      <><Sparkles className="w-4 h-4 text-sacred-blush" /> Seal Today&apos;s Entry</>
                    )}
                  </motion.button>
                  {!form.mood && (
                    <p className="text-center text-[10px] text-text-muted mt-2 italic">Choose your mood kitten to seal the entry 🐾</p>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          WEEKLY LETTER OVERLAY
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {isLetterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }}
              onClick={() => setIsLetterOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              aria-hidden="true"
            />
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative max-w-2xl w-full bg-[#FAF9F5] border border-white/60 p-8 md:p-12 rounded-[32px] shadow-2xl max-h-[85vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Weekly wellness report"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-sacred-blush/20 blur-3xl rounded-full pointer-events-none" />
              <button
                onClick={() => setIsLetterOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/60 hover:bg-white rounded-full shadow-sm transition-all cursor-pointer border border-white/50 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-sacred-blush/40"
                aria-label="Close report"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center space-y-1 border-b border-sacred-blush/20 pb-5 mb-6">
                <div className="inline-flex items-center justify-center p-2.5 bg-sacred-blush/10 rounded-full mb-1">
                  <Heart className="w-5 h-5 text-sacred-blush" />
                </div>
                <h2 className="text-2xl font-serif italic text-text-primary">Your Weekly Wellness Report</h2>
                <p className="text-[9px] tracking-widest text-text-muted uppercase">Compiled by Saarthi · Inner Atlas</p>
              </div>
              <div className="text-sm font-serif text-text-secondary leading-relaxed whitespace-pre-line italic text-justify px-2">
                {weeklyLetter || "Dear Traveler,\n\nI was unable to retrieve your letter. Continue logging and I'll have your report ready soon.\n\nWarmly,\nYour Saarthi"}
              </div>
              <div className="border-t border-sacred-blush/20 pt-4 text-center mt-6">
                <p className="text-[9px] tracking-wider text-text-muted uppercase">Inner Atlas • Sanctuary Memory Continuum</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="w-full text-center text-[10px] tracking-[0.2em] uppercase text-text-muted py-8 mt-12 border-t border-sacred-blush/10">
        Inner Atlas • Spiritual Self-Awareness Continuum
      </footer>
    </main>
  );
}
