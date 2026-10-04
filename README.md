# 🔨 Whack-A-Mole 2.5D | Infinite Arcade

An endless, fast-paced Whack-a-Mole arcade game built with HTML5 Canvas, responsive 2.5D perspective rendering, juicy impact VFX, a 3-heart health system, innocent obstacles, and procedural Web Audio synthesis.

## 🎮 Play Online
> Play directly in your browser: **[https://ui-kami.github.io/Whack-A-Mole/](https://ui-kami.github.io/Whack-A-Mole/)** *(Hosted via GitHub Pages)*

---

## ✨ Key Features & Gameplay

### ❤️ 3-Heart Health System & Game Over
* **Health Bar in HUD**: Live glowing heart indicators (`❤️ ❤️ ❤️`) visible right in the top arcade bar.
* **Wrong Hit Penalty**: Whacking the innocent human character penalizes you by deducting **1 heart**.
* **Visual & Audio Feedback**:
  * Damaged heart shakes violently and shatters into a cracked broken heart (`🖤`).
  * Full-screen crimson hurt vignette flash (`#hurt-overlay`).
  * Comic warning floaters (*"OUCH! -1 ❤️"*, *"WRONG! -1 ❤️"*).
  * Procedural human voice "Ouch!" slide and urgent negative warning buzz.
* **Arcade Game Over Modal**:
  * Triggered after 3 wrong hits.
  * Comprehensive session breakdown: **Moles Whacked**, **Best Streak**, **Golden Whacks**, and **Time Survived**.
  * Instant **"PLAY AGAIN"** button (or press `Space` / `Enter` on keyboard) that replenishes all 3 hearts, resets stats, and kicks off a fresh round with victory chimes.

### 👦 Innocent Cartoon Human Character
* **Friendly Neighborhood Boy**: An innocent cartoon boy wearing a red baseball cap and blue shirt pops out of the holes.
* **Fair Warning**: Displays a floating `"DON'T HIT! ⚠️"` badge above his cap so players have clear visual cues to hold their hammer back.
* **Safe Passage**: If you spare him, he safely ducks back underground after a brief peek without penalty.
* **Hilarious Hurt Reaction**: If whacked by mistake, his cap goes askew, his eyes swirl into dizzy spirals, a cartoon head bandage appears, and an *"OUCH!"* speech bubble pops up!
* **Balanced Spawner**: Paced intelligently so at most one human is on screen at a time, ensuring you always have plenty of moles to whack.

### 🎨 5 Vibrant Sceneries (Environment Themes)
Switch between 5 complete environments on the fly with the **Theme** button:
1. 🌿 **Lush Garden**: Bright sunny skies, alpine mountains, emerald rolling hills, cartoon trees, and drifting green leaves.
2. 🧀 **Cheese Kingdom (Redesigned & Balanced)**:
   * Fixed the yellow wash! Replaced the monochrome yellow with a dreamy **twilight purple & apricot sunset** (`#1c1038` to `#d97706`).
   * Giant glowing **Swiss Cheese Moon** with craters and twinkling night stars.
   * Toasted cracker & pretzel mountain ridges.
   * Fresh cartoon **broccoli florets** along the hills—providing natural culinary contrast that makes the golden cheese terrain pop!
   * Warm golden Swiss cheese ground with deep 3D shaded cavity pores.
3. 🏜️ **Desert Sunset**: Dramatic Arizona canyon dusk gradient, Monument Valley sandstone mesas & buttes, iconic Saguaro cacti, and warm terracotta dunes with wind ripples.
4. 🍬 **Candy Wonderland**: Cotton candy pastel skies, sugar-frosted chocolate fudge peaks, giant swirled lollipops, and strawberry frosting ground sprinkled with rainbow confetti.
5. 🌆 **Cyber Arcade**: Retro 80s synthwave night sky, sliced neon sun, vector wireframe mountains, glowing cyber obelisks, and a dark reflective synthwave floor with glowing cyan and magenta perspective lines.

### 🔨 Physics-Driven Toy Mallet & Juicy Juice
* Responsive cursor/touch tracking with spring smoothing.
* Anticipation backswing, fast accelerating downward strike, and impact squash.
* Microfreeze hit stop (`35ms` - `60ms`) for crunch feel.
* Directional camera shake with rotational roll.
* 3D dirt pebbles, dust clouds, and comic text (*"BONK!"*, *"POW!"*, *"WHACK!"*, *"GOLDEN!"*).

### 🎵 Procedural Web Audio Engine (Zero Sound Files)
* 100% synthesized through Web Audio API:
  * Punchy wooden mallet thumps & transient cracks.
  * Mole squeaks and dirt rustle bursts.
  * Comical human vocal "Ouch!" slide & warning error buzzes.
  * Sad descending arcade defeat fanfare & cheerful revival chords.
  * Cheerful C-major pentatonic background arpeggio loop.

---

## 🕹️ Controls & HUD

* **Mouse / Touch**: Move the hammer and click or tap emerging moles to whack them.
* **Live Score Pill**: Tracks your successful mole hits in real-time.
* **Health Pill**: Displays your 3 remaining hearts (`❤️ ❤️ ❤️`).
* **Theme Button**: Cycles between all 5 sceneries (*Garden ➔ Cheese ➔ Desert ➔ Candy ➔ Cyber*).
* **SFX Button**: Toggle sound effects on/off.
* **Music Button**: Toggle background synthesizer music on/off.
* **Stats Button**: Open session statistics (hits, streaks, golden hits, play time).
* **Space / Enter Key**: Instant restart from Game Over screen.
* **Fullscreen Button**: Toggle edge-to-edge immersive gameplay.

---

## 🛠️ Tech Stack & Architecture

* **Engine**: Pure Vanilla JavaScript (ES6+ modular architecture).
* **Rendering**: High-DPI HTML5 Canvas (responsive 2.5D perspective projection & 5-layer parallax).
* **Audio**: Native Web Audio API (procedural synthesis, no audio files).
* **Styles**: Vanilla CSS (Modern glassmorphism, responsive for mobile & desktop).
* **Standalone Build**: Automated PowerShell bundler (`build_bundle.ps1`) compiles all source modules, CSS, and base64 sprites into a single-file executable `whack-a-mole-standalone.html`.
