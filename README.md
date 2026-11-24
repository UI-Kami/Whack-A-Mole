# 🎭 Mazaaq Tha (مذاق تھا) | Anti-Bullying Interactive Kiosk Game

> *"Jo baat hansi mein kahi jaati hai, woh kisi ke dil mein reh jaati hai."*  
> *"The hurt you felt from that joke was real. You've probably made someone else feel it too, without realizing."*

**Mazaaq Tha** is an interactive, narrative-driven arcade game designed for portrait kiosk installations (1080 × 1920) and mobile/desktop browsers. Built with HTML5 Canvas, responsive CSS, and procedural Web Audio, it transforms the familiar mechanics of Whack-a-Mole into a thought-provoking anti-bullying installation. Instead of simply being told that verbal bullying disguised as "just a joke" hurts, players *feel* the emotional impact directly through escalating gameplay, disguised traps, and reflective bilingual narratives.

---

## 🎮 Play Online & Live Demo
* **Live GitHub Pages Build**: [https://ui-kami.github.io/Whack-A-Mole/](https://ui-kami.github.io/Whack-A-Mole/)
* **Offline Standalone Kiosk Distribution**: Open `whack-a-mole-standalone.html` directly in any Chromium or modern web browser (100% self-contained single file with all Base64-embedded assets and zero network requirements).

---

## 🌟 Core Gameplay & Narrative Architecture

### 1. ⏱️ 90-Second Timeline (`1:30` Countdown)
The game runs on an uninterrupted 90-second master countdown timer that paces the emotional arc across four distinct phases:
* **`0:00–0:20` (Warm-up)**: Slow, predictable pop-ups with **no bombs**. The player builds confidence, rhythm, and accumulates normal hits.
* **`0:20–0:50` (Middle)**: Pop-up speed ramps up; the **first 2 disguised bombs** appear. Striking the 2nd bomb drains the health bar to empty and triggers the **first Cool-down pop-up**.
* **`0:50–1:20` (Pressure)**: Maximum density of pop-ups and disguised bombs. The speed gauge steadily climbs, and the timer pressure intensifies.
* **`1:20–1:30` (Final Push)**: Peak gameplay speed, maximum conveyor velocity, and the final bomb contact before the clock expires.

---

### 2. 💣 Disguised Bombs & Cinematic Slow-Motion
* **Deceptive Appearance**: Bombs visually disguise themselves as cheerful laughing mouths.
* **Cinematic Slow-Mo**: Striking a disguised bomb drops the simulation to **22% speed (`timeScale = 0.22`)** for 1.2 seconds before easing smoothly back to normal, highlighting the emotional impact of the "joke".
* **Bomb Impact Sequence**:
  1. Full-screen crimson flash overlay (`hurtOverlay`).
  2. Heavy procedural camera shake and twin explosion shockwaves.
  3. Immediate **-1 second** deduction from the master timer.
  4. Game speed increase (+0.14 factor) and speed gauge advancement.
  5. **4 to 6 bilingual insult speech bubbles** burst radially outward from the hit site toward the player, randomly selected from a pool of 22 non-repeating insults.
  6. Health bar drops one level. Every 2nd bomb hit triggers the **Cool-Down pop-up**.

---

### 3. ❤️ 3-Stage Pixel-Art Health Bar Progression
Extracted directly from authentic arcade UI elements (`Game_Button_Elements assets.png`) and scaled with crisp pixel rendering (`image-rendering: pixelated`):
* **Full Health (Start of Game)**: Full green energy bar on the left with the pixel heart anchored at the far right.
* **Half Health (1st Bomb Hit)**: Half-green / half-empty energy bar with the pixel heart centered in the middle, accompanied by a pulsing damage glow.
* **Empty / Zero Health (2nd Bomb Hit)**: All empty ticks on the right with the pixel heart on the far left, seamlessly initiating the Cool-Down sequence.
* **Cool-Down Restoration**: Concluding the cool-down reflection restores the health bar back to Full for the next cycle.

---

### 4. 🧘 Cool-Down Pop-Up & Continuous Timer
Triggered on every 2nd bomb hit (2nd, 4th, 6th, etc.):
* **Glitch Background**: Full-screen CRT glitch backdrop (`coolDownBg`) covers the playfield while gameplay interaction is paused.
* **Calm Reflection & Facts**: Displays one reflective insight paired with an empirical fact:
  * *Reflection*: *"Hansi ke baad ka sannata bhi ek jawab hai. Silence is an answer too. / ہنسی کے بعد کا سناٹا بھی ایک جواب ہے۔"*
  * *Fact*: *"75% people have been hurt by a joke. / ۷۵ فیصد لوگوں کو مذاق سے تکلیف پہنچی ہے۔"*
* **Uninterrupted Clock & Skip Mechanic**:
  * The master countdown timer **never pauses** during cool-downs.
  * Auto-continues after ~2 seconds and penalizes the clock by **-3 seconds** (displayed as a pulsing red `"-3s"` badge).
  * Tapping the **Continue** button skips early, costing only **-1 second**.

---

### 5. 📦 Win & Lose Sequences

#### 🏆 Win Condition: Mystery Box Opened (30 Normal Hits)
* Filling the progress bar with 30 normal hits before time runs out unlocks the Mystery Box.
* Sequential dialogue sequence:
  1. *"The hurt you felt from that joke was real. / وہ تکلیف سچی تھی۔"*
  2. *"You've probably made someone else feel it too, without realizing. / شاید آپ نے کسی اور کو بھی ایسا ہی محسوس کرایا ہو، بغیر جانے۔"*
  3. *"Think about it. Choose your words well. / سوچیے۔ الفاظ سوچ کر چنیں۔"*
  4. Final Screen: *"Is it funny, or is it fair? / ہنسی کی بات ہے، یا انصاف کی؟"*
* **Private Personal Best Board**: Displays fastest completion time and bomb contacts **only if a new personal record was achieved** (`localStorage`). Kept private so nobody is publicly shamed for losing.

#### ⌛ Lose Condition: Time's Up (`0:00`)
* If the timer runs out before 30 hits, the game addresses the player directly with progressive dialogue:
  1. *"Ek game bhi nahi khela gaya. / One game, not even played properly."*
  2. *"Tumse ye bhi nahi hua. / You couldn't even manage this."*
  3. *"The game is insulting you. / گیم تمہیں ہی بے عزت کر رہا ہے۔"*
  4. *"Itna bhi nahi ho paya? / اتنا بھی نہیں ہو پایا؟"*
  5. *"Haar gaye? Shock nahi, asal mein. / Lost? Not surprising at all."*
  6. *"Clock tumhara nahi, mazaaq ka hai. / The clock was never yours, it belongs to the joke."*
  7. Final Reflection: *"Kabhi kabhi jokes sirf jokes nahi hote... Hansne se pehle, dekh lo kise lag rahi hai."*
  8. Final Screen: *"Time's up — Pehle ruko, phir hanso. / پہلے رکو، پھر ہنسو۔"* + **Play Again** button.

---

### 6. 😈 Animated Side Emoji Interaction (`EmojiDetail`)
An unobtrusive comic detail featuring three animated characters (`😈` Devil, `😢` Crying, `😆` Laughing):
* Sits at `X = 105`, `Y ≈ 380–660` with dedicated breathing room away from active hole hitboxes.
* Pops up and projects a 186 × 74 px comic speech bubble: *"Bas mazaaq! / بس مذاق"* back and forth while the crying emoji reacts in the center.

---

### 7. 🔄 Complete Subsystem Restart Architecture
When restarting from the Win or Lose screen, all game subsystems are reset from scratch:
* **Background Conveyor (`ParallaxManager.reset()`)**: Snaps all three repeating tiles back to `[-1920, 0, 1920]` and resets `speedMultiplier = 1.0` so the game starts at the very top.
* **Mole Spawner (`MoleSpawner.reset()`)**: Despawns all active moles, resets rising animations, and aligns holes to the top parallax tiles.
* **VFX Engine (`VFXManager.reset()`)**: Clears all floating insult bubbles, smoke particles, shockwaves, red flashes, and resets side emoji reaction states.
* **Camera & Pointer (`CameraShake.reset()`, `HammerController.reset()`)**: Restores camera trauma, angle, and weapon idle state.
* **Game State (`GameManager.restartGame()`)**: Restores 90s countdown, resets hits to 0, bombs to 0, speed factor to 1.0, health bar to Full, and synchronizes `lastTime = performance.now()` to prevent delta-time spikes.

---

## 📐 Display & Portrait Kiosk Specifications

Built specifically to adhere to `kioske dimension potrait.pdf`:
* **Target Native Kiosk Resolution**: **1080 × 1920** (9:16 Portrait Aspect Ratio).
* **Safe Margins & Viewport Adaptation**:
  * Dynamic letterboxing and centering on non-9:16 aspect ratios.
  * CSS viewport-safe anchoring (`vh`/`vw`/`vmin`) preventing HUD or modal clipping.
  * Touch & click coordinates are dynamically mapped to Canvas world units (`canvas.getBoundingClientRect()` with subpixel scale compensation).

---

## 🛠️ Technology Stack & Build Pipeline

* **Rendering Engine**: Pure HTML5 Canvas 2D with subpixel precision and closed polygon clipping masks for hole emergence.
* **Scripting**: Modular ES6+ JavaScript (`src/GameManager.js`, `src/MoleController.js`, `src/MoleSpawner.js`, `src/ParallaxManager.js`, `src/VFXManager.js`, `src/AudioManager.js`, `src/CameraShake.js`, `src/HammerController.js`, `src/Config.js`).
* **Audio Engine**: 100% procedural Web Audio synthesis (zero external audio file dependencies; synthesizes hits, explosions, chimes, and fanfares dynamically).
* **Typography & Bidi Engine**: Native Urdu Nastaliq font fallback stack (`Noto Nastaliq Urdu`, `Jameel Noori Nastaleeq`, `Noto Sans Arabic`) with automated RTL/LTR Unicode isolation preventing glyph disconnection or flipped punctuation.
* **Build Bundler (`build.ps1`)**:
  * Bundles all scripts, stylesheets, and Base64-encoded assets from `assets/normalized/assets_base64.json`.
  * Generates zero-dependency production files:
    * `index.html` (Web distribution)
    * `whack-a-mole-standalone.html` (Single-file offline kiosk executable)

### Rebuilding the Project:
```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

---

## 📁 Repository Directory Structure

```text
Whack-A-Mole/
├── assets/
│   ├── NewAssets/                    # Raw art assets & UI elements
│   ├── normalized/                   # Normalized sprites & 1080x1920 backgrounds
│   │   ├── ui/                       # Pixel-art buttons, windows, and health bars
│   │   └── assets_base64.json        # Compiled Base64 asset dictionary
│   └── kioske dimension potrait.pdf  # Kiosk hardware specifications
├── src/                              # Modular ES6 game source code
│   ├── AudioManager.js               # Web Audio procedural synthesis
│   ├── CameraShake.js                # Decay-based trauma camera shaker
│   ├── Config.js                     # Game balance, timeline, & bilingual text pools
│   ├── GameManager.js                # Core game loop, timeline, & subsystem coordination
│   ├── HammerController.js           # Interactive hand / punch / slap controller
│   ├── InputManager.js               # Multi-touch & pointer event normalizer
│   ├── MoleController.js             # Mole state machine (peek, push, sink, KO)
│   ├── MoleSpawner.js                # Timeline spawner & hole tracking
│   ├── ObjectPool.js                 # High-performance object pooling
│   ├── ParallaxManager.js            # Seamless 3-tile vertical conveyor belt
│   └── VFXManager.js                 # Explosions, insult speech bubbles, & emojis
├── scratch/                          # Automated CDP test suites & tools
├── build.ps1                         # Production PowerShell bundler
├── index.html                        # Standard production build
├── whack-a-mole-standalone.html      # Portable offline kiosk distribution
├── style.css                         # UI styling & responsive kiosk layouts
└── README.md                         # Project documentation
```

---

## 📜 License & Credits
Designed and developed for the **"Mazaaq Tha"** anti-bullying campaign and interactive showcase. All character art, game mechanics, and narrative dialogues are proprietary to the project.
