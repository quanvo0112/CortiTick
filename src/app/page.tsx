"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, TimerMode } from "@/store/useStore";
import { MusicPlayer } from "@/components/MusicPlayer";
import { useMusicStore } from "@/store/useMusicStore";

// ─── Precision Helpers ──────────────────────────────────────────────────────

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

// ─── Theme Applicator ───────────────────────────────────────────────────────

function ThemeApplicator() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);
  return null;
}

// ─── Settings Modal (Preferences & Calibrations) ─────────────────────────────

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

  const inputCls = "w-16 text-center rounded-lg px-2 py-1 text-xs font-bold border outline-none font-mono focus:ring-1 focus:ring-amber-500 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: "var(--ct-overlay)" }} onClick={onClose} />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl transition-all border border-white/[0.12]"
        style={{ background: "var(--ct-modal)", color: "var(--ct-text)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 font-bold">
              ⚙
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">System Preferences</h2>
              <p className="text-[11px] text-slate-400">Hardware parameters & appearance</p>
            </div>
          </div>
          <button id="settings-close" onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center ct-icon-btn transition-colors text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Interval Duration Calibrators */}
        <div className="space-y-3 mb-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Interval Calibrations (Minutes)</p>
          {[
            { label: "Focus Work Session", value: workMin, min: 1, max: 120, set: setWorkMin },
            { label: "Restorative Break", value: breakMin, min: 1, max: 60, set: setBreakMin },
          ].map(({ label, value, min, max, set }) => (
            <div key={label} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-xs font-medium text-[var(--ct-text)]">{label}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => set(Math.max(min, value - 1))} className="w-6 h-6 rounded-md ct-btn flex items-center justify-center text-xs font-bold">−</button>
                <input
                  type="number" value={value} min={min} max={max}
                  onChange={(e) => set(Number(e.target.value))}
                  className={inputCls}
                  style={{ background: "var(--ct-bg)", borderColor: "var(--ct-input-bd)", color: "var(--ct-text)" }}
                />
                <button onClick={() => set(Math.min(max, value + 1))} className="w-6 h-6 rounded-md ct-btn flex items-center justify-center text-xs font-bold">+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Display Finish */}
        <div className="space-y-2 mb-5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Chassis Finish</p>
          <div className="flex gap-2 rounded-xl p-1 bg-white/[0.02] border border-white/[0.06]">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t} id={`theme-${t}`}
                onClick={() => setTheme(t)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 flex items-center justify-center gap-1.5"
                style={theme === t
                  ? { background: "var(--ct-work-accent)", color: "#000000" }
                  : { color: "var(--ct-muted)" }}
              >
                {t === "dark" ? "Obsidian Matte" : "Ceramic Bright"}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] mb-5 text-[11px] text-slate-400 space-y-1 font-mono">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tactile Shortcuts</div>
          <div className="flex justify-between"><span>[Space]</span><span className="text-slate-300">Start / Pause Timer</span></div>
          <div className="flex justify-between"><span>[R]</span><span className="text-slate-300">Reset Session</span></div>
          <div className="flex justify-between"><span>[W] / [B]</span><span className="text-slate-300">Switch Work / Break</span></div>
        </div>

        {/* Apply Trigger */}
        <button
          id="settings-apply" onClick={apply}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 transition-all hover:opacity-90 active:scale-98 shadow-md"
          style={{ background: "var(--ct-work-accent)" }}
        >
          Save & Apply Parameters
        </button>
      </div>
    </div>
  );
}

// ─── Master Chronometer & Session Ribbon ────────────────────────────────────

function SessionChronometer() {
  const {
    timeLeft,
    isRunning,
    mode,
    workDuration,
    breakDuration,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    setWorkDuration,
    tasks,
    activeTaskId,
  } = useStore();

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

  // Quick duration adjust (+/- 5m)
  const adjustWorkMinutes = (deltaMin: number) => {
    if (isRunning) return;
    const curMin = Math.round(workDuration / 60);
    const nextMin = Math.max(1, Math.min(120, curMin + deltaMin));
    setWorkDuration(nextMin * 60);
  };

  const total = mode === "work" ? workDuration : breakDuration;
  const elapsed = total - timeLeft;
  const progressPct = Math.min(100, Math.max(0, (elapsed / total) * 100));

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="flex flex-col justify-between h-full gap-4">
      {/* Instrument Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: mode === "work" ? "#f59e0b" : "#10b981" }} />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            {mode === "work" ? "Deep Work Interval" : "Restorative Recovery"}
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08]">
            CHRONO
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-1 rounded-lg p-1 bg-black/40 border border-white/[0.08]">
          <button
            onClick={() => { clearTick(); setMode("work"); }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold font-mono transition-all ${
              mode === "work"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            WORK
          </button>
          <button
            onClick={() => { clearTick(); setMode("break"); }}
            className={`px-3 py-1 rounded-md text-[11px] font-bold font-mono transition-all ${
              mode === "break"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            BREAK
          </button>
        </div>
      </div>

      {/* Main Digits Face with Ghost Phosphor Layer */}
      <div className="relative py-2 flex flex-col items-center justify-center">
        {/* Ghost background segment layer */}
        <span className="absolute text-6xl sm:text-7xl font-extrabold font-mono tracking-tight text-white/[0.04] select-none pointer-events-none tabular-nums">
          88:88
        </span>

        {/* Live Active Clock Digits */}
        <span
          className="relative text-6xl sm:text-7xl font-extrabold font-mono tracking-tight tabular-nums transition-colors"
          style={{
            color: mode === "work" ? "var(--ct-work-accent)" : "var(--ct-break-accent)",
            textShadow: mode === "work" ? "0 0 24px rgba(245, 158, 11, 0.25)" : "0 0 24px rgba(16, 185, 129, 0.25)",
          }}
        >
          {fmt(timeLeft)}
        </span>

        {/* Active Target Banner */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 max-w-sm truncate text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">TARGET:</span>
          {activeTask ? (
            <span className="font-semibold text-slate-200 truncate">{activeTask.title}</span>
          ) : (
            <span className="italic text-slate-500">General Focus Session</span>
          )}
        </div>
      </div>

      {/* Tactile Control Panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {/* Main Action Trigger */}
          <button
            id="timer-start-pause"
            onClick={handleStartPause}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 ${
              mode === "work"
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            }`}
          >
            {isRunning ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                <span>ENGAGE FOCUS</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            id="timer-reset"
            onClick={() => { clearTick(); resetTimer(); }}
            title="Reset to interval start"
            className="p-2.5 rounded-xl ct-btn text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Quick Steppers (-5m / +5m) */}
        {!isRunning && mode === "work" && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustWorkMinutes(-5)}
              className="px-2 py-1 rounded-lg ct-btn text-[11px] font-mono text-slate-400 hover:text-white"
              title="Decrease interval by 5 min"
            >
              -5M
            </button>
            <button
              onClick={() => adjustWorkMinutes(5)}
              className="px-2 py-1 rounded-lg ct-btn text-[11px] font-mono text-slate-400 hover:text-white"
              title="Increase interval by 5 min"
            >
              +5M
            </button>
          </div>
        )}
      </div>

      {/* ── Chrono Ribbon (Continuous Timeline Track) ── */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
          <span>00:00</span>
          <span>{Math.round(progressPct)}% ELAPSED</span>
          <span>{fmt(total)}</span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-black/60 border border-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: mode === "work" ? "var(--ct-work-accent)" : "var(--ct-break-accent)",
              boxShadow: mode === "work" ? "0 0 8px rgba(245, 158, 11, 0.5)" : "0 0 8px rgba(16, 185, 129, 0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Physiological Cortisol Barometer ───────────────────────────────────────

function CortisolBarometer() {
  const stressLevel = useStore((s) => s.stressLevel);
  const mode = useStore((s) => s.mode);

  const pct = Math.round(stressLevel * 100);

  // 4 Clinical Zones
  let zoneTitle = "HOMEOSTASIS";
  let zoneColor = "#10b981";
  let advice = "Optimal autonomic balance. Prime neural state for deep analytical work.";

  if (pct >= 80) {
    zoneTitle = "EXHAUSTION THRESHOLD";
    zoneColor = "#f43f5e";
    advice = "Elevated cortisol load detected. Disengage immediately. Hydrate & initiate 4-7-8 breathing.";
  } else if (pct >= 55) {
    zoneTitle = "ELEVATED STRAIN";
    zoneColor = "#f97316";
    advice = "Cognitive friction accumulating. Wrap up active objective and prepare for restorative break.";
  } else if (pct >= 25) {
    zoneTitle = "OPTIMAL FLOW";
    zoneColor = "#f59e0b";
    advice = "Active focus engagement. Neuro-metabolic demand within sustainable flow parameters.";
  }

  // 12-segment tension ladder
  const totalSegments = 12;
  const activeSegments = Math.round((pct / 100) * totalSegments);

  return (
    <div className="flex flex-col justify-between h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: zoneColor }} />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Physiological Load
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08]">
            TELEMETRY
          </span>
        </div>

        {/* Zone Badge */}
        <span
          className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded border tracking-wider"
          style={{
            background: `${zoneColor}15`,
            color: zoneColor,
            borderColor: `${zoneColor}35`,
          }}
        >
          {zoneTitle}
        </span>
      </div>

      {/* Main Strain Index & Digital Readout */}
      <div className="flex items-baseline justify-between py-1 px-1">
        <div className="flex flex-col">
          <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight tabular-nums" style={{ color: zoneColor }}>
            {pct}%
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
            CORTISOL STRAIN INDEX
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase">
            {mode === "work" ? "METABOLIC ACCUMULATION" : "PARASYMPATHETIC FLUSH"}
          </span>
          <p className="text-[10px] text-slate-400">
            {mode === "work" ? "Rises across active interval" : "Dissipates during break"}
          </p>
        </div>
      </div>

      {/* 12-Segment LED Tension Bar Ladder */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-12 gap-1.5 h-4 p-1 rounded-lg bg-black/60 border border-white/[0.06]">
          {Array.from({ length: totalSegments }).map((_, i) => {
            const isActive = i < activeSegments;
            let segColor = "#10b981";
            if (i >= 9) segColor = "#f43f5e";
            else if (i >= 6) segColor = "#f97316";
            else if (i >= 3) segColor = "#f59e0b";

            return (
              <div
                key={i}
                className="h-full rounded-xs transition-all duration-300"
                style={{
                  background: isActive ? segColor : "rgba(255,255,255,0.04)",
                  boxShadow: isActive ? `0 0 6px ${segColor}80` : "none",
                }}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase">
          <span>0% Baseline</span>
          <span>50% Midpoint</span>
          <span>100% Critical</span>
        </div>
      </div>

      {/* Dynamic Clinical Recovery Advice */}
      <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-slate-300 flex items-start gap-2.5">
        <span className="text-amber-400 font-bold font-mono text-xs flex-shrink-0 mt-0.5">ℹ</span>
        <p className="text-[11px] leading-relaxed text-slate-300">
          {advice}
        </p>
      </div>
    </div>
  );
}

// ─── Objective Flight Ledger (Task Manager) ─────────────────────────────────

function TaskFlightLedger() {
  const { tasks, addTask, toggleTask, deleteTask, activeTaskId, setActiveTaskId } = useStore();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [title, setTitle] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTask(title);
      setTitle("");
    }
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const displayedTasks =
    filter === "pending" ? pending : filter === "completed" ? completed : tasks;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Ledger Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--ct-text)]">
              Objective Flight Ledger
            </h2>
            <p className="text-[11px] text-slate-400">
              {pending.length} Pending • {completed.length} Completed
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 rounded-lg p-1 bg-black/40 border border-white/[0.08]">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all ${
                filter === f
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "ALL" : f === "pending" ? "ACTIVE" : "DONE"}
            </button>
          ))}
        </div>
      </div>

      {/* Task Fast Input Field */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="todo-input"
            type="text"
            placeholder="Log target objective for current cycle..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl pl-4 pr-14 py-2.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            style={{
              background: "var(--ct-input-bg)",
              border: "1px solid var(--ct-input-bd)",
              color: "var(--ct-text)",
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hidden sm:block">
            ENTER
          </span>
        </div>
        <button
          id="todo-add"
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-transform hover:scale-105 active:scale-95 flex items-center gap-1 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          <span>Log</span>
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px] max-h-[380px]">
        {displayedTasks.map((task) => {
          const isTarget = activeTaskId === task.id;

          return (
            <div
              key={task.id}
              className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                isTarget
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
              }`}
              style={{ opacity: task.completed ? 0.6 : 1 }}
            >
              {/* Custom Mechanical Checkbox */}
              <button
                id={`task-toggle-${task.id}`}
                onClick={() => toggleTask(task.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                  task.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-500 hover:border-amber-400 bg-black/40"
                }`}
              >
                {task.completed && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Title */}
              <span
                className={`flex-1 text-xs font-medium ${
                  task.completed ? "line-through text-slate-400" : "text-[var(--ct-text)]"
                }`}
              >
                {task.title}
              </span>

              {/* Focus Target Trigger */}
              {!task.completed && (
                <button
                  onClick={() => setActiveTaskId(isTarget ? null : task.id)}
                  title={isTarget ? "Active focus target" : "Set as active focus target"}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    isTarget
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "opacity-0 group-hover:opacity-100 bg-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {isTarget ? "TARGET" : "SET TARGET"}
                </button>
              )}

              {/* Delete button */}
              <button
                id={`task-delete-${task.id}`}
                onClick={() => deleteTask(task.id)}
                title="Remove task"
                className="p-1 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}

        {displayedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <svg className="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xs font-bold text-slate-400">No objectives logged</p>
            <p className="text-[11px] mt-0.5">Enter a target above to initiate deep work</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Header Live Status Badges ──────────────────────────────────────────────

function HeaderAudioPill() {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const currentTitle = useMusicStore((s) => s.currentTrack.title);
  const playbackMode = useMusicStore((s) => s.playbackMode);
  const libraryIndex = useMusicStore((s) => s.libraryIndex);
  const savedCount = useMusicStore((s) => s.savedTracks.length);

  return (
    <div
      className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono transition-all"
      style={{
        background: isPlaying ? "rgba(245, 158, 11, 0.12)" : "var(--ct-input-bg)",
        border: isPlaying ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid var(--ct-input-bd)",
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
          <span className="max-w-[140px] truncate font-sans text-xs">{currentTitle}</span>
          {playbackMode === "library" && (
            <span className="text-[10px] text-amber-300">
              [{libraryIndex + 1}/{savedCount}]
            </span>
          )}
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>DECK STANDBY</span>
        </>
      )}
    </div>
  );
}

function HeaderStrainPill() {
  const stressLevel = useStore((s) => s.stressLevel);
  const pct = Math.round(stressLevel * 100);
  const hue = Math.round((1 - stressLevel) * 120);

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold"
      style={{
        background: "var(--ct-input-bg)",
        border: "1px solid var(--ct-input-bd)",
        color: `hsl(${hue},85%,68%)`,
      }}
    >
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: `hsl(${hue},85%,55%)` }} />
      <span>STRAIN {pct}%</span>
    </div>
  );
}

// ─── Main Application Hardware Console ──────────────────────────────────────

export default function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isRunning, startTimer, pauseTimer, resetTimer, setMode } = useStore();

  // Global tactile keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (isRunning) pauseTimer();
        else startTimer();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetTimer();
      } else if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        setMode("work");
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setMode("break");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, startTimer, pauseTimer, resetTimer, setMode]);

  return (
    <>
      <ThemeApplicator />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div className="min-h-screen flex flex-col">
        {/* ── Master Technical Rail (Header) ── */}
        <header
          className="sticky top-0 z-30 border-b backdrop-blur-md transition-colors"
          style={{ background: "var(--ct-header)", borderColor: "var(--ct-border)" }}
        >
          <div className="mx-auto max-w-[1560px] px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Brand Logo & Hardware Model Mark */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm font-mono">
                CT
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-tight" style={{ color: "var(--ct-text)" }}>
                  CortiTick
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  BIO-CHRONO STUDIO CONSOLE
                </span>
              </div>
            </div>

            {/* Live Status Telemetry & Preferences Trigger */}
            <div className="flex items-center gap-2 sm:gap-3">
              <HeaderAudioPill />
              <HeaderStrainPill />

              <button
                id="open-settings"
                onClick={() => setSettingsOpen(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center ct-btn transition-colors text-slate-400 hover:text-white"
                title="System Preferences & Calibrations"
                aria-label="System Preferences"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* ── Unified Instrument Deck (Master Chassis) ── */}
        <main className="mx-auto max-w-[1560px] w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col gap-6">
          {/* Top Master Bay: Panoramic Chronometer & Bio-Barometer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Bay (7 Cols): Session Chronometer */}
            <div className="lg:col-span-7 rounded-2xl p-5 sm:p-6 ct-chassis-bay flex flex-col">
              <SessionChronometer />
            </div>

            {/* Right Bay (5 Cols): Physiological Cortisol Barometer */}
            <div className="lg:col-span-5 rounded-2xl p-5 sm:p-6 ct-chassis-bay flex flex-col">
              <CortisolBarometer />
            </div>
          </div>

          {/* Bottom Operational Decks: Objective Flight Ledger & Focus Acoustic Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Operational Deck (6 Cols): Objective Flight Ledger */}
            <div className="lg:col-span-6 rounded-2xl p-5 sm:p-6 ct-chassis-bay flex flex-col min-h-[460px]">
              <TaskFlightLedger />
            </div>

            {/* Right Operational Deck (6 Cols): Focus Acoustic Deck */}
            <div className="lg:col-span-6 rounded-2xl p-5 sm:p-6 ct-chassis-bay flex flex-col min-h-[460px]">
              <MusicPlayer />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
