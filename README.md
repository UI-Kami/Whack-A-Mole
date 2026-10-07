# 🥊 Whack-A-Mole 2.5D | Punch & Slap Arcade

An endless, high-energy Whack-a-Mole arcade game built with HTML5 Canvas, continuous procedural scrolling background, interactive **Punch & Slap hand controls**, predictable **Red Rage mechanics**, explosive VFX, and 100% procedural Web Audio synthesis.

## 🎮 Play Online
> Play directly in your browser: **[https://ui-kami.github.io/Whack-A-Mole/](https://ui-kami.github.io/Whack-A-Mole/)** *(Hosted via GitHub Pages)*

---

## 🌟 Major Updates & New Features

### 🟡 Yellow & 🔴 Red Character Engine
* **High-Detail Sprites**: Custom illustrated character sprites with transparent alpha masks and expressive character design.
* **Proportional Hole Scaling**: Characters are scaled up (`~90%` of hole diameter) to snugly fit the 3D silver-beveled holes.
* **Submerged Emergence Anchoring**: Authentic Whack-a-Mole emergence—characters pop out only with their head, expressive eyes, hair curl, and upper chest. Lower body and feet stay permanently submerged and clipped inside the hole cavity.
* **Dynamic Facial Expressions**:
  * **Blinking & Eye Glances**: Organic idling with gentle breathing, eyelid blinks, and pupil glances.
  * **Cartoon KO Eyes ("X X")**: Slap or punch impact knocks the yellow character dizzy with orbiting cartoon stars.
  * **Fierce Red Eyebrows & Steam Puffs**: Enraged Red mole features animated rising steam puffs and angled brows.

---

### 🥊 Punch & Slap Mode (Interactive Weapons)
* **Dual Weapon Types**: Switch between **Punch Fist** and **Slap Hand** via the HUD button or automatic combo mechanics.
* **Juicy Kinetic Animation**: Spring-damped tracking, dynamic anticipation pullback, accelerating downward smash, and impact squash.
* **Comic Hit Text (`HumanHit`)**: Authentic comic popups (*"WHACK!"*, *"SLAP!"*, *"POW!"*, *"SMACK!"*, *"BAM!"*, *"KAPOW!"*) spawned dynamically at impact sites with bouncy upward drift and rotation.

---

### 🔥 Predictable Red Mole Pattern & Explosion VFX
* **Predictable Transformation**: Every 4th hit transforms the targeted Yellow mole into an **Enraged Red Mole** (`RED_TRIGGER_COUNT = 4`).
* **HUD Predictor Counter**: Real-time rage counter in the header pill (`RAGE: NEXT: RED!` or `RAGE IN: X`) lets players strategize their hits.
* **Pre-Hit Warning Aura**: The trigger mole pulses with an elliptical warning ring and a `"WILL ENRAGE!"` indicator before being struck.
* **Detonation Hazard**: Hitting an Enraged Red mole causes a **Massive Explosion**:
  * Expanding shockwave ring and blazing fire particles.
  * Heavy camera trauma shake and full-screen crimson hurt vignette flash.
  * Deducts 1 heart from the player's 3-heart health bar.
* **Safe Dodge Reward**: Leaving the Red mole alone lets it safely duck back underground, awarding streak bonuses and updating the dodge counter.

---

### 📜 Continuous Procedural Scrolling Background
* **Uniform Orthographic Grid (1024×1200 Native)**: 6 identical rows spaced at an exact 200px vertical period across 3 columns (18 holes per repeating tile).
* **Zero Seam Tiling**: Eliminated linear perspective distortion to achieve 100% seamless infinite vertical scrolling with no stretched/normal mismatches.
* **Dynamic Hole Tracking**: Holes move continuously with the conveyor belt background; mole emergence, animations, and hitboxes are locked to the moving ground with subpixel precision.
* **Continuous Closed Polygon Hole Mask**: Custom clipping path allows heads and badges to extend upward into the air while strictly masking the lower torso against the bottom ellipse rim.
* **Stone Impact Cracks**: Striking moles spawns procedural radial fractures on the hole rims that scroll down with the stone tiles.

---

### ❤️ 3-Heart Health & Arcade Game Over System
* **HUD Heart Indicators**: Live glowing heart counters (`❤️ ❤️ ❤️`) tracking player health.
* **Penalty Handling**: Red mole explosions deduct hearts with broken-heart animation (`🖤`) and hurt vignette.
* **Session Game Over Modal**:
  * Triggers upon losing all 3 hearts.
  * Displays total hits, highest streak, red dodges, accuracy, and survival time.
  * Instant restart via button or keyboard (`Space` / `Enter`).

---

### 🔊 Procedural Web Audio Engine (Zero External Audio Files)
* 100% synthesized in real time via the Web Audio API:
  * **Punch Impact**: Deep thud with wooden crack transient.
  * **Slap Impact**: High-frequency skin-on-skin snap with resonant overtone.
  * **Explosion Blast**: Low-frequency rumble with white-noise fire dissipation.
  * **Mole Pop & Squeak**: Playful chirps and frequency slides.
  * **Danger Buzzer & Fanfare**: Arcade alerts and defeat fanfares.
  * **Background Synth Arpeggios**: Cheerful pentatonic background melody loop.

---

## 🕹️ Controls & HUD

| Control | Action |
| :--- | :--- |
| **Mouse / Touch** | Move the hand and tap/click to punch or slap emerging moles (alternates dynamically) |
| **Score Pill** | Real-time score counter tracking whacked moles |
| **Rage Predictor Pill** | Counts down hits remaining until next Red Mole transformation (`NEXT: RED!` / `IN: X`) |
| **Health Pill** | 3 remaining life hearts (`❤️ ❤️ ❤️`) |
| **SFX / Music Buttons** | Toggle synthesized audio effects and background music |
| **Stats Button** | View full game session statistics |
| **Space / Enter** | Restart immediately from the Game Over screen |
| **Fullscreen Button** | Toggle edge-to-edge immersive play |

---

## 🛠️ Architecture & Build System

* **Engine**: Modular ES6+ JavaScript (`src/GameManager.js`, `src/MoleController.js`, `src/MoleSpawner.js`, `src/HammerController.js`, `src/ParallaxManager.js`, `src/VFXManager.js`, `src/AudioManager.js`).
* **Graphics**: High-DPI HTML5 Canvas with continuous scrolling conveyor belt, 2.5D depth scaling, and single-path vector clipping.
* **Audio**: Native Web Audio API procedural synthesis.
* **Build Bundler (`build.ps1`)**: Automated PowerShell build script that bundles modular JavaScript source files, CSS stylesheets, and Base64 assets into:
  * `index.html` (Standalone, zero-dependency browser build).
  * `whack-a-mole-standalone.html` (Portable single-file distribution).

To rebuild the project:
```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```
