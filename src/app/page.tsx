"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, TimerMode } from "@/store/useStore";
import { MusicPlayer } from "@/components/MusicPlayer";
import { useMusicStore } from "@/store/useMusicStore";

// ─── Precision Helpers ──────────────────────────────────────────────────────

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segPath(cx: number, cy: number, ro: number, ri: number, a0: number, a1: number) {
  const f = (n: number) => n.toFixed(3);
  const os = polar(cx, cy, ro, a0), oe = polar(cx, cy, ro, a1);
  const is = polar(cx, cy, ri, a0), ie = polar(cx, cy, ri, a1);
  return `M${f(os.x)} ${f(os.y)} A${ro} ${ro} 0 0 1 ${f(oe.x)} ${f(oe.y)} L${f(ie.x)} ${f(ie.y)} A${ri} ${ri} 0 0 0 ${f(is.x)} ${f(is.y)}Z`;
}

const SEGS = [
  { color: "#10b981", label: "LOW" },
  { color: "#84cc16", label: "LOW" },
  { color: "#f59e0b", label: "NORMAL" },
  { color: "#f97316", label: "NORMAL" },
  { color: "#f43f5e", label: "HIGH" },
];

// ─── Theme Applicator ───────────────────────────────────────────────────────

function ThemeApplicator() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);
  return null;
}

// ─── Settings Modal (Preferences) ───────────────────────────────────────────

function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { workDuration, breakDuration, theme, setWorkDuration, setBreakDuration, setTheme } = useStore();
  const [workMin, setWorkMin] = useState(Math.round(workDuration / 60));
  const [breakMin, setBreakMin] = useState(Math.round(breakDuration / 60));

  useEffect(() => {
    setWorkMin(Math.round(workDuration / 60));
    setBreakMin(Math.round(breakDuration / 60));
  }, [workDuration, breakDuration, open]);

  if (!open) return null;

  const apply = () => {
    const w = Math.max(1, Math.min(120, workMin));
    const b = Math.max(1, Math.min(60, breakMin));
    setWorkDuration(w * 60);
    setBreakDuration(b * 60);
    onClose();
  };

  const inputCls = "w-20 text-center rounded-xl px-2 py-1.5 text-sm font-bold border outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: "var(--ct-overlay)" }} onClick={onClose} />
      <div
        className="relative rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl transition-all"
        style={{ background: "var(--ct-modal)", border: "1px solid var(--ct-border)", color: "var(--ct-text)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">System Preferences</h2>
              <p className="text-xs" style={{ color: "var(--ct-muted)" }}>Interval durations & appearance mode</p>
            </div>
          </div>
          <button id="settings-close" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center ct-icon-btn transition-colors" style={{ color: "var(--ct-muted)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Timer durations */}
        <div className="space-y-4 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ct-muted)" }}>Session Durations (minutes)</p>
          {[
            { label: "Work Interval", value: workMin, min: 1, max: 120, set: setWorkMin },
            { label: "Rest Break Interval", value: breakMin, min: 1, max: 60, set: setBreakMin },
          ].map(({ label, value, min, max, set }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: "var(--ct-input-bg)", border: "1px solid var(--ct-input-bd)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--ct-text)" }}>{label}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => set(Math.max(min, value - 1))} className="w-7 h-7 rounded-lg ct-btn flex items-center justify-center text-sm font-bold transition-all hover:scale-105">−</button>
                <input
                  type="number" value={value} min={min} max={max}
                  onChange={(e) => set(Number(e.target.value))}
                  className={inputCls}
                  style={{ background: "var(--ct-bg)", borderColor: "var(--ct-input-bd)", color: "var(--ct-text)" }}
                />
                <button onClick={() => set(Math.min(max, value + 1))} className="w-7 h-7 rounded-lg ct-btn flex items-center justify-center text-sm font-bold transition-all hover:scale-105">+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Theme mode */}
        <div className="space-y-2 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ct-muted)" }}>Display Mode</p>
          <div className="flex gap-2 rounded-2xl p-1" style={{ background: "var(--ct-input-bg)", border: "1px solid var(--ct-input-bd)" }}>
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t} id={`theme-${t}`}
                onClick={() => setTheme(t)}
                className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200 flex items-center justify-center gap-1.5"
                style={theme === t
                  ? { background: "var(--ct-work-accent)", color: "#000000" }
                  : { color: "var(--ct-muted)" }}
              >
                {t === "dark" ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    <span>Dark Obsidian</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                    <span>Light Ceramic</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Apply */}
        <button
          id="settings-apply" onClick={apply}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-950 transition-all hover:opacity-90 active:scale-98 shadow-md"
          style={{ background: "var(--ct-work-accent)" }}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// ─── Cortisol Strain Bio-Gauge ──────────────────────────────────────────────

function CortisolChart() {
  const stressLevel = useStore((s) => s.stressLevel);
  const theme = useStore((s) => s.theme);
  const pct = Math.round(stressLevel * 100);
  const hue = Math.round((1 - stressLevel) * 120);
  const lumVal = theme === "light" ? "38%" : "70%";
  const cx = 100, cy = 108, ro = 82, ri = 52, gap = 2.5;
  const step = 180 / SEGS.length;
  const needleDeg = 180 + stressLevel * 180;

  const isLow = stressLevel < 0.35;
  const isMed = stressLevel >= 0.35 && stressLevel < 0.65;
  const stressLabel = isLow ? "LOW" : isMed ? "NORMAL" : "HIGH";

  const tipText = isLow
    ? "Optimal neuro-clarity. Ideal for sustained deep work."
    : isMed
    ? "Metabolic strain accumulating steadily. Rest interval approaching."
    : "Cortisol threshold exceeded. Step away, hydrate, and breathe.";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight" style={{ color: "var(--ct-text)" }}>
              Cortisol Strain Gauge
            </h2>
            <p className="text-xs" style={{ color: "var(--ct-muted)" }}>
              Real-time physiological load simulation
            </p>
          </div>
        </div>

        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
          style={{
            background: isLow ? "rgba(16, 185, 129, 0.15)" : isMed ? "rgba(245, 158, 11, 0.15)" : "rgba(244, 63, 94, 0.15)",
            color: isLow ? "#34d399" : isMed ? "#fbbf24" : "#fb7185",
            border: `1px solid ${isLow ? "rgba(16, 185, 129, 0.3)" : isMed ? "rgba(245, 158, 11, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
          }}
        >
          {stressLabel} STRAIN
        </span>
      </div>

      {/* SVG Semicircle Dial */}
      <div className="relative w-full max-w-[280px]">
        <svg viewBox="-22 0 244 116" className="w-full">
          <defs>
            <filter id="dial-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Semicircle Color Segments */}
          {SEGS.map((seg, i) => (
            <path key={i} d={segPath(cx, cy, ro, ri, 180 + i * step + gap / 2, 180 + (i + 1) * step - gap / 2)} fill={seg.color} opacity={0.88} />
          ))}

          {/* Scale Labels */}
          {([
            { label: "LOW", deg: 205 },
            { label: "NORMAL", deg: 270 },
            { label: "HIGH", deg: 335 },
          ] as const).map(({ label, deg }) => {
            const p = polar(cx, cy, ro + 14, deg);
            return (
              <text key={label} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="7.5" fontWeight="700" letterSpacing="0.8" fill="var(--ct-muted)">
                {label}
              </text>
            );
          })}

          {/* Needle Indicator with Pivot Counterweight */}
          <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${needleDeg}deg)`, transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <polygon points={`${cx},${cy - 3.5} ${cx + 74},${cy} ${cx},${cy + 3.5}`} fill="var(--ct-needle-main)" filter="url(#dial-shadow)" />
            <polygon points={`${cx},${cy - 2.5} ${cx - 15},${cy} ${cx},${cy + 2.5}`} fill="var(--ct-needle-tail)" />
          </g>

          {/* Center Instrument Pivot */}
          <circle cx={cx} cy={cy} r={10} fill="var(--ct-bg)" stroke="var(--ct-border)" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={5} fill={isLow ? "#10b981" : isMed ? "#f59e0b" : "#f43f5e"} />
        </svg>

        {/* Percentage Readout & Clinical Tip */}
        <div className="flex flex-col items-center -mt-2">
          <span className="text-3xl font-extrabold tabular-nums tracking-tight leading-none" style={{ color: `hsl(${hue},85%,${lumVal})` }}>
            {pct}%
          </span>
          <p className="text-xs font-medium text-center mt-1.5 max-w-[250px]" style={{ color: "var(--ct-muted)" }}>
            {tipText}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Pomodoro Chronograph ───────────────────────────────────────────────────

function Timer() {
  const { timeLeft, isRunning, mode, workDuration, breakDuration, startTimer, pauseTimer, resetTimer, setMode } = useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleStartPause = () => {
    if (isRunning) {
      pauseTimer();
      clearTick();
    } else {
      startTimer();
      intervalRef.current = setInterval(() => {
        useStore.getState().tick();
        if (!useStore.getState().isRunning) clearTick();
      }, 1000);
    }
  };

  useEffect(() => () => clearTick(), []);

  const total = mode === "work" ? workDuration : breakDuration;
  const prog = ((total - timeLeft) / total) * 100;
  const accent = mode === "work" ? "var(--ct-work-accent)" : "var(--ct-break-accent)";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header with Mode Switcher */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
              <path strokeLinecap="round" strokeWidth="1.8" d="M12 7v5l3 3" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight" style={{ color: "var(--ct-text)" }}>
              Session Chronograph
            </h2>
            <p className="text-xs" style={{ color: "var(--ct-muted)" }}>
              {mode === "work" ? "Active Deep Work Session" : "Restorative Recovery Break"}
            </p>
          </div>
        </div>

        {/* Pill Mode Switcher */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--ct-input-bg)", border: "1px solid var(--ct-input-bd)" }}>
          {(["work", "break"] as const).map((m) => (
            <button
              key={m}
              id={`timer-mode-${m}`}
              onClick={() => { clearTick(); setMode(m); }}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200"
              style={mode === m ? { background: accent, color: mode === "work" ? "#000000" : "#ffffff" } : { color: "var(--ct-muted)" }}
            >
              {m === "work" ? "Work" : "Break"}
            </button>
          ))}
        </div>
      </div>

      {/* Circular Progress Face */}
      <div className="relative" style={{ width: 196, height: 196 }}>
        <svg className="absolute inset-0 -rotate-90" width="196" height="196">
          <circle cx="98" cy="98" r="88" fill="none" stroke="var(--ct-ring-bg)" strokeWidth="8" />
          <circle
            cx="98" cy="98" r="88" fill="none" stroke={accent} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - prog / 100)}`}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold tabular-nums tracking-tight" style={{ color: accent }}>
            {fmt(timeLeft)}
          </span>
          <span className="text-[11px] font-semibold mt-1 uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20" style={{ color: "var(--ct-muted)" }}>
            {mode === "work" ? "Work Interval" : "Break Interval"}
          </span>
        </div>
      </div>

      {/* Tactile Timer Triggers */}
      <div className="flex items-center gap-3">
        <button
          id="timer-start-pause"
          onClick={handleStartPause}
          className="px-7 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          style={{ background: accent, color: mode === "work" ? "#000000" : "#ffffff" }}
        >
          {isRunning ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              <span>Pause</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              <span>Start Session</span>
            </>
          )}
        </button>

        <button
          id="timer-reset"
          onClick={() => { clearTick(); resetTimer(); }}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold ct-btn transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
          style={{ color: "var(--ct-muted)" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}

// ─── Task Ledger (Objective Manager) ────────────────────────────────────────

function TodoList() {
  const { tasks, addTask, toggleTask, deleteTask } = useStore();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inp = e.currentTarget.elements.namedItem("task") as HTMLInputElement;
    if (inp.value.trim()) {
      addTask(inp.value);
      inp.value = "";
    }
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const displayedTasks =
    filter === "pending" ? pending : filter === "completed" ? completed : tasks;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight" style={{ color: "var(--ct-text)" }}>
              Task Ledger
            </h2>
            <p className="text-xs" style={{ color: "var(--ct-muted)" }}>
              {pending.length} pending • {completed.length} completed
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--ct-input-bg)", border: "1px solid var(--ct-input-bd)" }}>
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all"
              style={filter === f ? { background: "var(--ct-work-accent)", color: "#000000" } : { color: "var(--ct-muted)" }}
            >
              {f === "all" ? "All" : f === "pending" ? "Pending" : "Done"}
            </button>
          ))}
        </div>
      </div>

      {/* Task Input */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="todo-input"
            name="task"
            type="text"
            placeholder="Add an objective to the ledger…"
            className="w-full rounded-xl pl-4 pr-16 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors"
            style={{ background: "var(--ct-input-bg)", border: "1px solid var(--ct-input-bd)", color: "var(--ct-text)" }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] hidden sm:block font-medium" style={{ color: "var(--ct-dim)" }}>
            Enter
          </span>
        </div>
        <button
          id="todo-add"
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add</span>
        </button>
      </form>

      {/* Task Ledger List */}
      <div className="flex-1 flex flex-col overflow-y-auto space-y-2 pr-1 min-h-[300px] max-h-[540px]">
        {displayedTasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl ct-btn transition-all duration-200"
            style={{
              background: "var(--ct-input-bg)",
              opacity: task.completed ? 0.6 : 1,
            }}
          >
            {/* Custom Checkbox */}
            <button
              id={`task-toggle-${task.id}`}
              onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                task.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-500 hover:border-amber-400"
              }`}
            >
              {task.completed && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <span
              className={`flex-1 text-xs sm:text-sm font-medium ${
                task.completed ? "line-through text-slate-400" : "text-[var(--ct-text)]"
              }`}
            >
              {task.title}
            </span>

            {/* Delete button */}
            <button
              id={`task-delete-${task.id}`}
              onClick={() => deleteTask(task.id)}
              title="Remove task"
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
              style={{ color: "var(--ct-muted)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}

        {displayedTasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center my-auto" style={{ color: "var(--ct-muted)" }}>
            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xs font-semibold">No objectives found</p>
            <p className="text-[11px] mt-0.5">Enter a task in the field above to start your focus session</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Header Live Status Badges ──────────────────────────────────────────────

function StressBadge() {
  const stressLevel = useStore((s) => s.stressLevel);
  const pct = Math.round(stressLevel * 100);
  const hue = Math.round((1 - stressLevel) * 120);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: "var(--ct-input-bg)",
        border: "1px solid var(--ct-input-bd)",
        color: `hsl(${hue},85%,68%)`,
      }}
    >
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: `hsl(${hue},85%,55%)` }} />
      <span>Strain {pct}%</span>
    </div>
  );
}

function MusicHeaderBadge() {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const currentTitle = useMusicStore((s) => s.currentTrack.title);
  const playbackMode = useMusicStore((s) => s.playbackMode);
  const libraryIndex = useMusicStore((s) => s.libraryIndex);
  const savedCount = useMusicStore((s) => s.savedTracks.length);

  const scrollToMusic = () => {
    const el = document.getElementById("focus-music-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <button
      onClick={scrollToMusic}
      title={isPlaying ? `Now Playing: ${currentTitle}` : "Focus Audio Deck"}
      className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
      style={{
        background: isPlaying ? "rgba(245, 158, 11, 0.16)" : "var(--ct-input-bg)",
        border: isPlaying ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid var(--ct-input-bd)",
        color: isPlaying ? "#fbbf24" : "var(--ct-muted)",
      }}
    >
      {isPlaying ? (
        <>
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 bg-amber-400 rounded-full ct-eq-bar-1" />
            <span className="w-0.5 bg-orange-400 rounded-full ct-eq-bar-2" />
            <span className="w-0.5 bg-emerald-400 rounded-full ct-eq-bar-3" />
          </div>
          <span className="max-w-[130px] truncate font-medium">{currentTitle}</span>
          {playbackMode === "library" && (
            <span className="text-[10px] opacity-75 font-mono">
              [{libraryIndex + 1}/{savedCount}]
            </span>
          )}
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
          <span>Audio Deck</span>
        </>
      )}
    </button>
  );
}

// ─── Main Instrument Console Cockpit ────────────────────────────────────────

export default function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <ThemeApplicator />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div className="min-h-screen flex flex-col">
        {/* Navigation & Status Header */}
        <header
          className="sticky top-0 z-30 border-b backdrop-blur-md transition-colors"
          style={{ background: "var(--ct-header)", borderColor: "var(--ct-border)" }}
        >
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            {/* Brand Mark */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth="2.2" />
                  <path strokeLinecap="round" strokeWidth="2.2" d="M12 7v5l3 3" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight" style={{ color: "var(--ct-text)" }}>
                  CortiTick
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ct-muted)" }}>
                  Precision Focus & Strain Console
                </span>
              </div>
            </div>

            {/* Live Status Indicators & Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <MusicHeaderBadge />
              <StressBadge />

              {/* Settings button */}
              <button
                id="open-settings"
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center ct-btn transition-colors"
                style={{ color: "var(--ct-muted)" }}
                aria-label="System Preferences"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Tri-Deck Mission Control Cockpit */}
        <main className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Column 1: Bio-Strain Gauge & Session Chronograph */}
            <div className="flex flex-col gap-6">
              <section
                className="rounded-3xl p-6 sm:p-7 shadow-lg transition-all"
                style={{ background: "var(--ct-card)", border: "1px solid var(--ct-border)" }}
              >
                <CortisolChart />
              </section>

              <section
                className="rounded-3xl p-6 sm:p-7 shadow-lg transition-all"
                style={{ background: "var(--ct-card)", border: "1px solid var(--ct-border)" }}
              >
                <Timer />
              </section>
            </div>

            {/* Column 2: Task Ledger (High Visibility Center Stage) */}
            <div className="flex flex-col">
              <section
                className="rounded-3xl p-6 sm:p-7 shadow-lg transition-all flex flex-col min-h-[580px] xl:min-h-[640px]"
                style={{ background: "var(--ct-card)", border: "1px solid var(--ct-border)" }}
              >
                <TodoList />
              </section>
            </div>

            {/* Column 3: Focus Audio Deck */}
            <div className="flex flex-col">
              <section
                id="focus-music-section"
                className="rounded-3xl p-6 sm:p-7 shadow-lg transition-all"
                style={{ background: "var(--ct-card)", border: "1px solid var(--ct-border)" }}
              >
                <MusicPlayer />
              </section>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
