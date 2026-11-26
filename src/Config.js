// src/Config.js - Central Configuration, Two-Phase Pacing Curve & Text Pools
export function computePacingCurve(elapsedSec = 0) {
    const elapsed = Math.min(90.0, Math.max(0.0, elapsedSec));
    const lerp = (a, b, t) => a + (b - a) * t;

    // Phase 1 (0s..45s | 1:30..0:45): Gradual gentle build-up
    if (elapsed <= 45.0) {
        const p1 = elapsed / 45.0;
        const duck = lerp(0.36, 0.28, p1);
        return {
            phase: 1,
            phaseProgress: p1,
            scrollMultiplier: lerp(1.0, 1.60, p1),
            popDuration: lerp(0.42, 0.32, p1),
            holdDuration: lerp(1.15, 0.85, p1),
            duckDuration: duck,
            redRetreatDuration: Math.max(0.24, duck),
            spawnInterval: lerp(1.10, 0.80, p1)
        };
    }

    // Phase 2 (45s..90s | 0:45..0:00): Rapid escalating ease-in scroll & mole speed
    const p2 = (elapsed - 45.0) / 45.0;
    const accel = 0.35 * p2 + 0.65 * Math.pow(p2, 1.75);
    const duck = lerp(0.28, 0.13, accel);
    return {
        phase: 2,
        phaseProgress: p2,
        accel: accel,
        scrollMultiplier: lerp(1.60, 5.00, accel),
        popDuration: lerp(0.32, 0.14, accel),
        holdDuration: lerp(0.85, 0.32, accel),
        duckDuration: duck,
        redRetreatDuration: Math.max(0.24, duck),
        spawnInterval: lerp(0.80, 0.38, accel)
    };
}

export const CONFIG = {
    // Exact Portrait Kiosk Target Resolution (1080 x 1920, 9:16 Aspect Ratio)
    VIEWPORT_WIDTH: 1080,
    VIEWPORT_HEIGHT: 1920,
    ASPECT_RATIO: 9 / 16,
    IS_PORTRAIT: true,

    // Hole Grid Configuration (3 Columns x 3 Rows, Centered for 9:16 Kiosk)
    GRID_MODE: 9,
    HOLE_ROWS: 3,
    HOLE_COLUMNS: 3,
    PADDING_TOP: 280,         // Safe zone below top HUD
    PADDING_BOTTOM: 200,      // Safe zone above bottom progress bar
    PADDING_HORIZONTAL: 80,   // Safe margin from screen sides

    // Hole Proportions
    HOLE_BASE_RADIUS_X: 130,
    HOLE_BASE_RADIUS_Y: 65,

    // 90-Second Timeline & Scroll Base Speed Settings
    TOTAL_DURATION: 90.0,     // 1:30 in seconds
    TARGET_NORMAL_HITS: 30,   // 30 normal hits required to open Mystery Box
    SCROLL_SPEED: 110,        // Base downward px/s (scales 1.0x -> 1.6x Phase 1, 1.6x -> 5.0x Phase 2)

    // Timeline Phases (Seconds elapsed from start 0:00 to 1:30)
    PHASE_WARMUP_END: 20.0,
    PHASE_MIDDLE_END: 50.0,
    PHASE_PRESSURE_END: 80.0,
    PHASE_FINAL_END: 90.0,

    // Spawning Rates by Phase (Balanced for achievable 30 hits in 90s)
    SPAWN_INTERVAL_WARMUP: 0.95,
    SPAWN_INTERVAL_MIDDLE: 0.72,
    SPAWN_INTERVAL_PRESSURE: 0.56,
    SPAWN_INTERVAL_FINAL: 0.45,

    // Disguised Bomb Probabilities (Higher frequency so hidden bombs challenge player often)
    BOMB_PROB_START: 0.35,
    BOMB_PROB_MAX: 0.55,
    BOMB_PROB_WARMUP: 0.35,
    BOMB_PROB_MIDDLE: 0.43,
    BOMB_PROB_PRESSURE: 0.50,
    BOMB_PROB_FINAL: 0.55,

    // Mole 3-Phase Smooth Eased Animation Timings (Clamped dt <= 0.05s)
    MOLE_PEEK_TIME: 0.42,         // Phase 1: Pop-out rise duration (cubic ease-out, ~0.38-0.45s)
    MOLE_POP_DURATION: 0.42,      // Unified Pop-out duration
    MOLE_IDLE_WARMUP: 1.28,       // Phase 2: Hold duration (~0.95-1.30s)
    MOLE_IDLE_MIDDLE: 1.18,
    MOLE_IDLE_PRESSURE: 1.06,
    MOLE_IDLE_FINAL: 0.96,
    MOLE_DUCK_DURATION: 0.36,     // Phase 3: Pop-in retreat duration (cubic ease-in, ~0.32-0.40s)
    MOLE_HIT_RETREAT_TIME: 0.34,  // Phase 3: Hit squash retreat (~0.32-0.40s)
    MOLE_RED_EXPLODE_TIME: 0.40,  // Bomb exploding duration before smooth popping-in (~0.35-0.45s)
    MOLE_RED_RETREAT_TIME: 0.38,  // Bomb popping-in retreat duration after explosion (~0.35-0.40s)

    // Bomb Penalties & Cool-Down Rules (-3s only on cooldown exit; zero -1s immediate hit deduction)
    BOMB_TIME_PENALTY: 0.0,           // No immediate -1s deduction on bomb hit
    COOLDOWN_CADENCE: 1,              // Open Cool-Down modal for 3.0s on bomb hit
    COOLDOWN_AUTO_DURATION: 3.0,      // Auto-dismiss after exactly 3.0 seconds (3000ms)
    COOLDOWN_PENALTY_FULL: 3.0,       // Sole -3 seconds penalty deducted when cooldown completes
    COOLDOWN_PENALTY_SKIP: 3.0,

    // Hand Attack Settings
    HAND_MODE: 'combo',
    HAND_HIT_RADIUS: 145,

    // Camera Shake Disabled (Keep background/container stationary) & Audio
    SHAKE_BASE_INTENSITY: 0,
    SHAKE_DECAY: 1.0,
    SHAKE_MAX_OFFSET: 0,
    MASTER_VOLUME: 0.85,
    SFX_VOLUME: 0.9,
    MUSIC_VOLUME: 0.40,

    // Floating playfield insult bubbles disabled per client feedback
    INSULTS: [],
    EMOJI_REACTION_BUBBLES: [],

    // Cool-Down English-Only Rotating Reflection Lines (1 shown per hit, paired with FACTS[idx])
    REFLECTIONS: [
        "Silence after laughter is an answer too.",
        "A joke is often remembered long after the laughter fades.",
        "Words said in jest stay inside someone's heart.",
        "What you felt is also an answer.",
        "When humor belittles someone, it becomes a wound.",
        "Someone else's laugh does not mean it didn't hurt."
    ],

    // Cool-Down English-Only Facts (paired sequentially 1-to-1 with REFLECTIONS)
    FACTS: [
        "75% of people have been hurt by a joke.",
        "46.7% stayed silent in that moment.",
        "26.7% doubted themselves instead of the joke.",
        "75% of people have been hurt by a joke.",
        "46.7% stayed silent in that moment.",
        "26.7% doubted themselves instead of the joke."
    ],

    // End-of-Game Lose Messages (1 English message shown per finished game, persistent rotation)
    LOSE_MESSAGES: [
        "Sometimes jokes aren't just jokes \u2014 notice who gets hurt before you laugh.",
        "Pause first, then laugh. Careless words leave lasting marks.",
        "When humor punches down, the sting outlasts the punchline.",
        "Even a quick game of laughs reminds us how heavy words can feel."
    ],

    // End-of-Game Win Messages (1 English message shown per finished game, persistent rotation)
    WIN_MESSAGES: [
        "The hurt you felt from that joke was real.",
        "You've probably made someone else feel it too, without realizing.",
        "Think about it. Choose your words well.",
        "Is it really a matter of laughter, or of fairness?"
    ]
};
