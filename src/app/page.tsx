"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";

// ─── helpers ────────────────────────────────────────────────────────────────

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
  { color: "#22c55e" },
  { color: "#84cc16" },
  { color: "#eab308" },
  { color: "#f97316" },
  { color: "#ef4444" },
];

// ─── ThemeApplicator ────────────────────────────────────────────────────────

function ThemeApplicator() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);
  return null;
}

// ─── SettingsModal ──────────────────────────────────────────────────────────

function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { workDuration, breakDuration, theme, setWorkDuration, setBreakDuration, setTheme } = useStore();
  const [workMin, setWorkMin]   = useState(Math.round(workDuration  / 60));
  const [breakMin, setBreakMin] = useState(Math.round(breakDuration / 60));

  useEffect(() => {
    setWorkMin(Math.round(workDuration  / 60));
    setBreakMin(Math.round(breakDuration / 60));
  }, [workDuration, breakDuration, open]);

  if (!open) return null;

  const apply = () => {
    const w = Math.max(1, Math.min(120, workMin));
    const b = Math.max(1, Math.min(60,  breakMin));
    setWorkDuration(w * 60);
    setBreakDuration(b * 60);
    onClose();
  };

  const inputCls = "w-20 text-center rounded-lg px-2 py-1.5 text-sm font-semibold border outline-none focus:ring-2 focus:ring-violet-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "var(--ct-overlay)" }} onClick={onClose} />
      <div
        className="relative rounded-2xl p-6 w-80 shadow-2xl"
        style={{ background: "var(--ct-modal)", border: "1px solid var(--ct-border)", color: "var(--ct-text)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold tracking-tight">Settings</h2>
          <button id="settings-close" onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "var(--ct-muted)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Timer durations */}
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--ct-muted)" }}>Timer Durations</p>
        <div className="space-y-3 mb-5">
          {[
            { label: "Work session", value: workMin,  min: 1, max: 120, set: setWorkMin  },
            { label: "Break session", value: breakMin, min: 1, max: 60,  set: setBreakMin },
          ].map(({ label, value, min, max, set }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--ct-text)" }}>{label}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => set(Math.max(min, value - 1))} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition-colors">−</button>
                <input
                  type="number" value={value} min={min} max={max}
                  onChange={(e) => set(Number(e.target.value))}
                  className={inputCls}
                  style={{ background: "var(--ct-input-bg)", borderColor: "var(--ct-input-bd)", color: "var(--ct-text)" }}
                />
                <button onClick={() => set(Math.min(max, value + 1))} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition-colors">+</button>
                <span className="text-xs" style={{ color: "var(--ct-muted)" }}>min</span>
              </div>
            </div>
          ))}
        </div>

        {/* Theme */}
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--ct-muted)" }}>Appearance</p>
        <div className="flex gap-2 rounded-full p-1" style={{ background: "var(--ct-input-bg)" }}>
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t} id={`theme-${t}`}
              onClick={() => setTheme(t)}
              className="flex-1 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200"
              style={theme === t
                ? { background: "#7c3aed", color: "#fff" }
                : { color: "var(--ct-muted)" }}
            >
              {t === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          ))}
        </div>

        {/* Apply */}
        <button
          id="settings-apply" onClick={apply}
          className="mt-5 w-full py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ─── CortisolChart ──────────────────────────────────────────────────────────

function CortisolChart() {
  const stressLevel = useStore((s) => s.stressLevel);
  const pct = Math.round(stressLevel * 100);
  const hue = Math.round((1 - stressLevel) * 120);
  const cx = 100, cy = 108, ro = 80, ri = 50, gap = 2.5;
  const step = 180 / SEGS.length;
  const needleDeg = 180 + stressLevel * 180;
  const stressLabel = stressLevel < 0.35 ? "LOW" : stressLevel < 0.65 ? "NORMAL" : "HIGH";

  return (
    <div className="flex flex-col items-center gap-1">
      <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--ct-muted)" }}>Cortisol Level</h2>
      <svg viewBox="-22 0 244 115" className="w-full max-w-[280px]">
        <defs>
          <filter id="ns" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>
        {SEGS.map((seg, i) => (
          <path key={i} d={segPath(cx, cy, ro, ri, 180 + i * step + gap / 2, 180 + (i + 1) * step - gap / 2)} fill={seg.color} opacity={0.9} />
        ))}
        {([
          { label: "LOW",    deg: 205, anchor: "middle" },
          { label: "NORMAL", deg: 270, anchor: "middle" },
          { label: "HIGH",   deg: 335, anchor: "middle" },
        ] as const).map(({ label, deg, anchor }) => {
          const p = polar(cx, cy, ro + 14, deg);
          return (
            <text key={label} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
              fontSize="7.5" fontWeight="700" letterSpacing="0.8" fill="rgba(255,255,255,0.45)" fontFamily="sans-serif">
              {label}
            </text>
          );
        })}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${needleDeg}deg)`, transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <polygon points={`${cx},${cy - 3.5} ${cx + 72},${cy} ${cx},${cy + 3.5}`} fill="#e2e8f0" filter="url(#ns)" />
          <polygon points={`${cx},${cy - 2.5} ${cx - 14},${cy} ${cx},${cy + 2.5}`} fill="#94a3b8" />
        </g>
        <circle cx={cx} cy={cy} r={10} fill="#1e1b4b" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={5}  fill="#a78bfa" />
      </svg>
      <div className="flex flex-col items-center -mt-1">
        <span className="text-3xl font-bold tabular-nums leading-none" style={{ color: `hsl(${hue},80%,65%)` }}>{pct}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: `hsl(${hue},70%,55%)` }}>{stressLabel} Stress</span>
      </div>
    </div>
  );
}

// ─── Timer ──────────────────────────────────────────────────────────────────

function Timer() {
  const { timeLeft, isRunning, mode, workDuration, breakDuration, startTimer, pauseTimer, resetTimer, setMode } = useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

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

  const total  = mode === "work" ? workDuration : breakDuration;
  const prog   = ((total - timeLeft) / total) * 100;
  const accent = mode === "work" ? "#a78bfa" : "#34d399";

  return (
    <div className="flex flex-col items-center gap-5">
      <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--ct-muted)" }}>Pomodoro Timer</h2>
      <div className="flex gap-2 rounded-full p-1" style={{ background: "var(--ct-input-bg)" }}>
        {(["work", "break"] as const).map((m) => (
          <button key={m} id={`timer-mode-${m}`} onClick={() => { clearTick(); setMode(m); }}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
            style={mode === m ? { background: "rgba(255,255,255,0.15)", color: "#fff" } : { color: "var(--ct-muted)" }}>
            {m === "work" ? "Work" : "Break"}
          </button>
        ))}
      </div>

      {/* Ring with progress */}
      <div className="relative" style={{ width: 180, height: 180 }}>
        <svg className="absolute inset-0 -rotate-90" width="180" height="180">
          <circle cx="90" cy="90" r="82" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="90" cy="90" r="82" fill="none" stroke={accent} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 82}`}
            strokeDashoffset={`${2 * Math.PI * 82 * (1 - prog / 100)}`}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums" style={{ color: accent }}>{fmt(timeLeft)}</span>
          <p className="text-xs mt-1" style={{ color: "var(--ct-muted)" }}>{mode === "work" ? "Work" : "Break"} session</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button id="timer-start-pause" onClick={handleStartPause}
          className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: accent }}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button id="timer-reset" onClick={() => { clearTick(); resetTimer(); }}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-white/10"
          style={{ background: "var(--ct-input-bg)", color: "var(--ct-muted)" }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── TodoList ────────────────────────────────────────────────────────────────

function TodoList() {
  const { tasks, addTask, toggleTask, deleteTask } = useStore();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inp = e.currentTarget.elements.namedItem("task") as HTMLInputElement;
    if (inp.value.trim()) { addTask(inp.value); inp.value = ""; }
  };

  const pending = tasks.filter((t) => !t.completed);
  const done    = tasks.filter((t) =>  t.completed);

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--ct-muted)" }}>Task List</h2>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input id="todo-input" name="task" type="text" placeholder="Add a new task…"
          className="flex-1 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors"
          style={{ background: "var(--ct-input-bg)", border: "1px solid var(--ct-input-bd)", color: "var(--ct-text)" }} />
        <button id="todo-add" type="submit"
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95">
          Add
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {[{ label: "Pending", items: pending }, { label: "Completed", items: done }].map(({ label, items }) =>
          items.length > 0 && (
            <div key={label} className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ct-dim)" }}>{label} ({items.length})</p>
              {items.map((task) => (
                <div key={task.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                  style={{ background: "var(--ct-input-bg)", border: "1px solid var(--ct-input-bd)", opacity: task.completed ? 0.55 : 1 }}>
                  <button id={`task-toggle-${task.id}`} onClick={() => toggleTask(task.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? "bg-emerald-500 border-emerald-500" : "border-white/30 hover:border-violet-400"}`}>
                    {task.completed && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" /></svg>}
                  </button>
                  <span className={`flex-1 text-sm ${task.completed ? "line-through" : ""}`} style={{ color: task.completed ? "var(--ct-dim)" : "var(--ct-text)" }}>{task.title}</span>
                  <button id={`task-delete-${task.id}`} onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                    style={{ color: "var(--ct-muted)" }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )
        )}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--ct-dim)" }}>
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StressBadge ─────────────────────────────────────────────────────────────

function StressBadge() {
  const stressLevel = useStore((s) => s.stressLevel);
  const pct = Math.round(stressLevel * 100);
  const hue = Math.round((1 - stressLevel) * 120);
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: "var(--ct-input-bg)", border: "1px solid var(--ct-input-bd)", color: `hsl(${hue},80%,65%)` }}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: `hsl(${hue},80%,55%)` }} />
      Stress {pct}%
    </div>
  );
}

// ─── HomePage ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <ThemeApplicator />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className="min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-20 border-b backdrop-blur-md" style={{ background: "var(--ct-header)", borderColor: "var(--ct-border)" }}>
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M12 7v5l3 3" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">CortiTick</span>
            </div>
            <div className="flex items-center gap-3">
              <StressBadge />
              {/* Settings button */}
              <button id="open-settings" onClick={() => setSettingsOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ border: "1px solid var(--ct-border)", color: "var(--ct-muted)" }}
                aria-label="Open settings">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Grid */}
        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <section className="rounded-2xl p-6 backdrop-blur-sm" style={{ background: "var(--ct-card)", border: "1px solid var(--ct-border)" }}>
                <CortisolChart />
              </section>
              <section className="rounded-2xl p-6 backdrop-blur-sm" style={{ background: "var(--ct-card)", border: "1px solid var(--ct-border)" }}>
                <Timer />
              </section>
            </div>
            <section className="rounded-2xl p-6 backdrop-blur-sm lg:min-h-[520px]" style={{ background: "var(--ct-card)", border: "1px solid var(--ct-border)" }}>
              <TodoList />
            </section>
          </div>
        </main>

      </div>
    </>
  );
}
