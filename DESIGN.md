---
name: CortiTick
description: Unified Hardware Studio Console (Braun x Teenage Engineering Instrument Deck)
colors:
  primary: "#f59e0b"
  primary-hover: "#d97706"
  accent-break: "#10b981"
  accent-stress-low: "#10b981"
  accent-stress-med: "#f59e0b"
  accent-stress-high: "#f43f5e"
  neutral-bg: "#090a0f"
  neutral-card: "#11131a"
  neutral-card-sub: "#161822"
  neutral-border: "rgba(255, 255, 255, 0.08)"
  neutral-text: "#f8fafc"
  neutral-muted: "#94a3b8"
  video-bg: "#06070a"
typography:
  display:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "clamp(3rem, 6vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-inter), system-ui, monospace, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.06em"
  caption:
    fontFamily: "var(--font-inter), system-ui, monospace, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "28px"
---

# Design System: CortiTick Unified Hardware Studio Console

## Overview

**Creative North Star: "The Studio Hardware Console (Braun x Teenage Engineering)"**

CortiTick abandons disconnected floating web cards in favor of a cohesive, machined hardware chassis. Inspired by Dieter Rams Braun audio equipment and Teenage Engineering portable instruments (OP-1 / TP-7), the entire interface is unified into an authentic studio focus deck.

### Key Characteristics:
- **Unified Hardware Chassis**: Panoramic bays with milled hairline borders (`border border-white/[0.08]`) and recessed bevels (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]`).
- **Ghost-Backlit Chronometer**: Large tabular digits (`tabular-nums`) with faint 5% opacity ghost segment backlighting (`88:88`), continuous linear Chrono Ribbon progress track, and tactile duration steppers (`[-5m]`, `[+5m]`).
- **Physiological Barometer**: Clinical 12-segment illuminated LED tension ladder with 4 biological zones (*Homeostasis*, *Optimal Flow*, *Elevated Strain*, *Exhaustion Threshold*) and real-time guidance.
- **Integrated Objective Flight Ledger**: Tactile checklist with inline target pinning that binds tasks directly to the ticking chronometer.
- **Focus Acoustic Deck & Tape Machine**: Dual-spool cassette visualizer with animated spinning reels and stereo VU meter needle bars, one-click toggle to Video Stage (16:9 monitor), master tape transport, and continuous auto-advancing saved library queue.

## Colors

- **Chrono Amber** (`#f59e0b`): High-energy deep work intervals, active audio transport, and primary focus triggers.
- **Bio-Emerald** (`#10b981`): Restorative break intervals, completed flight ledger targets, and baseline homeostasis.
- **Strain Crimson** (`#f43f5e`): Exhaustion threshold and parasympathetic overload alerts.
- **Volcanic Obsidian Chassis** (`#090a0f` base, `#11131a` bay face, `#06070a` screen well).

## Typography & Tabular Precision

- Font: Inter with system sans fallback and monospace accents for telemetry and digital meters.
- Every clock numeral, percentage, and index marker strictly enforces `tabular-nums` to guarantee zero layout jitter during continuous ticking.
- No gradient text; contrast ratio $\ge 4.5:1$ across all surfaces.

## Tactile Keyboard Navigation

- `[Space]`: Toggle Start / Pause Focus Interval.
- `[R]`: Reset active session interval.
- `[W]`: Switch to Deep Work Mode.
- `[B]`: Switch to Rest Recovery Mode.
