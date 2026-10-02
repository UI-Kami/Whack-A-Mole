# 🔨 Whack-A-Mole 2.5D | Infinite Arcade

An endless, fast-paced Whack-a-Mole arcade game built with HTML5 Canvas, responsive 2.5D perspective rendering, juicy VFX, and procedural Web Audio synthesis.

## 🎮 Play Online
> Play directly in your browser: **[https://ui-kami.github.io/Whack-A-Mole/](https://ui-kami.github.io/Whack-A-Mole/)** *(Enable GitHub Pages in repository settings)*

---

## ✨ Features

* **Infinite Upward Parallax Environment**: 5 distinct scrolling depth layers (sky, distant mountains, midground hills, 2.5D ground plane, and drifting foreground particles).
* **2.5D Depth Perspective**: Holes and moles scale dynamically with perspective (`0.72x` to `1.18x`), featuring realistic burrow rim lighting and ground drop shadows.
* **Physics-Driven Toy Mallet**:
  * Responsive cursor/touch tracking with spring smoothing.
  * Anticipation backswing, fast accelerating downward strike, and impact squash.
  * Curved motion blur swoosh arcs.
* **Juicy Impact Feedback**:
  * Snappy mole squash-and-stretch with dizzy spinning stars.
  * Instant subterranean retreat on hit (`0.14s`).
  * Directional camera shake with rotational roll.
  * 3D dirt pebbles, dust clouds, and comic text (*"BONK!"*, *"POW!"*, *"WHACK!"*).
* **Procedural Web Audio Engine**: Zero external audio files required! Synthesizes punchy mallet thwacks, mole squeaks, dirt rustles, and a cheerful C-major pentatonic background music loop.
* **Two Playable Themes**:
  * 🌿 **Lush Garden**: Emerald turf with dirt mounds and wildflowers.
  * 🧀 **Cheese Valley**: Swiss cheese landscape with cheese craters.
* **Zero Dependencies**: Self-contained, lightweight, and runs at a buttery 60+ FPS on PC and mobile.

---

## 🕹️ Controls

* **Mouse / Touch**: Move hammer and click or tap emerging moles to bonk them.
* **SFX Button**: Toggle sound effects.
* **Music Button**: Toggle background music.
* **Theme Button**: Switch between Garden 🌿 and Cheese 🧀 environments.
* **Stats Button**: View moles whacked, current/best streak, and play time.
* **Fullscreen Button**: Toggle full-screen mode.

---

## 🛠️ Tech Stack

* HTML5 Canvas
* Vanilla JavaScript (ES6+ modular architecture)
* Web Audio API
* Vanilla CSS (Glassmorphism UI)
