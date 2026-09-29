---
name: CortiTick
description: Bio-Chronograph & Precision Focus Audio Console
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
  video-bg: "#000000"
typography:
  display:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 3.5rem)"
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
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.06em"
  caption:
    fontFamily: "var(--font-inter), system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

# Design System: CortiTick

## Overview

**Creative North Star: "The Bio-Chronograph & Audio Console"**

CortiTick is reimagined as a tactile, precision focus cockpit inspired by high-end timepieces and analog Hi-Fi hardware. The design abandons generic purple SaaS gradients in favor of an authentic dark obsidian chassis with warm amber chronometer accents, crisp biometric emerald recovery meters, and tactile controls.

### Key Characteristics:
- **Analog-Digital Precision**: Instrumental semicircular dials, tabular clock typography, and physical-feeling recessed bezels.
- **Warm Vacuum-Tube Amber Accents**: Focus intervals glow with a warm amber-gold illumination that relieves eye strain during late-night concentration.
- **Continuous Hi-Fi Audio Deck**: Integrated continuous playback queue with live wave equalizer, queue shuffle/loop toggles, and compact/expanded video frames.
- **Universal English Copy**: Professional, clear, concise language suited for international focus workstations.

## Colors

The system uses a volcanic obsidian substrate, anodized card bezels, and deliberate functional illumination.

### Primary
- **Chrono Amber** (#f59e0b): High-energy focus intervals, primary triggers, and active audio meters.

### Secondary
- **Bio-Emerald** (#10b981): Recovery break countdowns, completed ledger items, and low-strain homeostasis.

### Neutral
- **Volcanic Obsidian** (#090a0f): Base dark background minimizing optical fatigue.
- **Console Surface** (#11131a): Inset card panels providing tactile dimension.
- **High-Contrast Slate** (#f8fafc): Primary textual clarity.
- **Secondary Slate** (#94a3b8): Secondary data labels maintaining >= 4.5:1 accessible contrast.

### Named Rules
**The Instrument Restraint Rule.** Color is reserved exclusively for state: Amber for focus, Emerald for recovery, Crimson for biological strain alerts. Backgrounds and text never compete for attention.

## Typography

**Primary Font:** Inter with system sans fallback. Tabular numbers enabled for time and metrics.

### Hierarchy
- **Display** (800, 3rem, line-height 1): Chronometer countdown and strain percentages.
- **Headline** (700, 1.125rem, line-height 1.3): Major console headers.
- **Title** (600, 0.9375rem, line-height 1.4): Active track names and task ledger rows.
- **Body** (400, 0.875rem, line-height 1.5): Status descriptions and guidance copy.
- **Label** (700, 0.75rem, tracking 0.06em, uppercase): Status chips, mode pills, and steppers.

### Named Rules
**The Tabular Rule.** Every timer digit, gauge percentage, and index marker must render with `tabular-nums` to eliminate jitter during continuous ticking.

## Layout

A dual-wing instrument console:
- **Left Wing (Physiological & Chrono)**: Cortisol Strain Gauge on top, Session Chronograph below.
- **Right Wing (Acoustic & Operational)**: Focus Audio Deck with Library Queue on top, Task Ledger below.
- **Header Band**: Sticky technical status bar displaying brand mark, live audio playback pill, current strain badge, and settings trigger.

## Elevation & Depth

Surfaces rely on subtle inset shadows and luminous razor-thin borders (`1px solid var(--ct-border)`).

## Shapes

- Chassis containers: 24px smoothed corners (`rounded-3xl`).
- Buttons & Controls: 12px rounded elements or full-pill badges (`rounded-full`).

## Components

### Buttons
- **Primary**: Bold amber background with slate-950 typography, subtle hover scale (1.05) and active press (0.95).
- **Secondary / Stepper**: Inset dark button with crisp hover border.

### Focus Audio Deck & Library Queue
- Full Hi-Fi console with live animated VU meters, queue auto-advance, shuffle, loop, and expandable video frame.

### Task Ledger
- Clean checkbox rows with completed strikes and hover action controls.

## Do's and Don'ts

### Do:
- **Do** keep all UI copy in English.
- **Do** maintain strict tabular numeral alignment for all timer seconds and percentages.
- **Do** allow continuous sequential playback across all saved YouTube tracks in the library.
- **Do** ensure all text maintains >= 4.5:1 contrast against dark/light card backgrounds.

### Don't:
- **Don't** use decorative gradient text that harms scanability.
- **Don't** use unicode emojis in place of clean SVG stroke icons.
- **Don't** use generic purple SaaS color schemes.
