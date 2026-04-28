import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export type TimerMode = "work" | "break";
export type Theme = "dark" | "light";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Cortisol level derived from timer position.
 *  Work  → rises  0 → 1 as time elapses
 *  Break → falls  1 → 0 as time elapses
 */
function computeStress(mode: TimerMode, timeLeft: number, workDur: number, breakDur: number) {
  if (mode === "work")  return clamp(1 - timeLeft / workDur);
  return clamp(timeLeft / breakDur);
}

interface CortiTickState {
  // Timer
  timeLeft: number;
  isRunning: boolean;
  mode: TimerMode;
  workDuration: number;
  breakDuration: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setMode: (mode: TimerMode) => void;
  setWorkDuration: (seconds: number) => void;
  setBreakDuration: (seconds: number) => void;

  // Todos
  tasks: Task[];
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Cortisol (read-only – driven by timer)
  stressLevel: number;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const DEFAULT_WORK  = 25 * 60;
const DEFAULT_BREAK =  5 * 60;

export const useStore = create<CortiTickState>((set) => ({
  timeLeft: DEFAULT_WORK,
  isRunning: false,
  mode: "work",
  workDuration: DEFAULT_WORK,
  breakDuration: DEFAULT_BREAK,
  stressLevel: 0, // work session not started → stress at 0

  startTimer: () => set({ isRunning: true }),
  pauseTimer: () => set({ isRunning: false }),

  resetTimer: () =>
    set((s) => {
      const timeLeft = s.mode === "work" ? s.workDuration : s.breakDuration;
      return { isRunning: false, timeLeft, stressLevel: computeStress(s.mode, timeLeft, s.workDuration, s.breakDuration) };
    }),

  tick: () =>
    set((s) => {
      if (!s.isRunning) return {};

      if (s.timeLeft > 1) {
        const timeLeft = s.timeLeft - 1;
        return { timeLeft, stressLevel: computeStress(s.mode, timeLeft, s.workDuration, s.breakDuration) };
      }

      // Session complete – switch modes
      if (s.mode === "work") {
        const timeLeft = s.breakDuration;
        return { timeLeft, isRunning: false, mode: "break", stressLevel: computeStress("break", timeLeft, s.workDuration, s.breakDuration) };
      } else {
        const timeLeft = s.workDuration;
        return { timeLeft, isRunning: false, mode: "work", stressLevel: computeStress("work", timeLeft, s.workDuration, s.breakDuration) };
      }
    }),

  setMode: (mode) =>
    set((s) => {
      const timeLeft = mode === "work" ? s.workDuration : s.breakDuration;
      return { mode, isRunning: false, timeLeft, stressLevel: computeStress(mode, timeLeft, s.workDuration, s.breakDuration) };
    }),

  setWorkDuration: (seconds) =>
    set((s) => {
      const base = { workDuration: seconds, isRunning: false };
      if (s.mode === "work") {
        return { ...base, timeLeft: seconds, stressLevel: computeStress("work", seconds, seconds, s.breakDuration) };
      }
      return base;
    }),

  setBreakDuration: (seconds) =>
    set((s) => {
      const base = { breakDuration: seconds, isRunning: false };
      if (s.mode === "break") {
        return { ...base, timeLeft: seconds, stressLevel: computeStress("break", seconds, s.workDuration, seconds) };
      }
      return base;
    }),

  tasks: [],
  addTask: (title) =>
    set((s) => ({ tasks: [...s.tasks, { id: uuidv4(), title: title.trim(), completed: false }] })),
  toggleTask: (id) =>
    set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t) })),
  deleteTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  theme: "dark",
  setTheme: (theme) => set({ theme }),
}));
