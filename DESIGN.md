# ListDock Design System

This document outlines the core design principles and tokens extracted from the **Chrome Extension (Sidebar View)**, which serves as the "Source of Truth" for the ListDock aesthetic.

## 1. Core Aesthetic: "Tactical Glassmorphism"
ListDock blends high-tech tactical elements (grids, grain) with premium glassmorphism (blur, transparency, spotlight glow).

## 2. Global Background
The background is not a solid color. It is a layered composition:
- **Base Layer**: `#050408` (Deep Abyss)
- **Overlay 1 (Tactical Grid)**: 40px tactical grid using `rgba(255, 255, 255, 0.08)`.
- **Overlay 2 (Grain Noise)**: Subtle fractal noise for texture.
- **Overlay 3 (Mesh Gradients)**: 
  - `rgba(184, 149, 177, 0.25)` (Soft Purple/Pink)
  - `rgba(62, 26, 108, 0.3)` (Deep Indigo)

## 3. Typography
- **Primary Font**: `Space Mono`, monospace.
- **Letter Spacing**: `0.02em` for body, up to `0.4em` for tactical labels.
- **Styling**: Bold, uppercase tracking for labels and headers.

## 4. Color Palette
- **Backgrounds**:
  - Main Shell: `rgba(5, 4, 8, 0.5)` (Semi-transparent to show mesh)
  - Glass Elements: `rgba(40, 40, 40, 0.2)` with `backdrop-blur(2px)`.
- **Accents**:
  - Primary Purple: `#a855f7` (Purple-500)
  - Secondary Indigo: `#6366f1` (Indigo-500)
  - Success Green: `#22c55e` (Green-500)
  - Danger Red: `#f87171` (Red-400)
- **Text**:
  - High Emphasis: `#f3f4f6` (Gray-100)
  - Medium Emphasis: `rgba(255, 255, 255, 0.6)`
  - Tactical Labels: `rgba(255, 255, 255, 0.3)`

## 5. Visual Effects
- **Spotlight Borders**: Interactive borders that glow based on mouse position using a fixed `radial-gradient` mask.
- **Shadows**: Large, soft shadows (`shadow-2xl`) with color-matched glows for selected items.
- **Borders**: Extremely subtle `1px solid rgba(255, 255, 255, 0.08)`.

## 6. Components
- **Task Cards**: Rounded (12px), glass background, active color borders.
- **SmartInput**: Glass background, mode-switching pills (blue/purple/white), centered layout.
- **Headers**: Glass bottom-only borders, bold tactical titles.

## 7. Layout Principles
- **Sidebar (Extension)**: Fixed width (max 450px), centered, semi-transparent.
- **Mobile**: Full-screen, overlay-based entry, glass bottom nav.
- **Desktop**: 3-column dashboard, mesh gradient background, extensive use of empty space.
