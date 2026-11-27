// src/Config.js - Central Configuration, Continuous Piano Tiles Pacing Curve & Text Pools
export const WIN_HITS = 50;

export function computePacingCurve(elapsedSec = 0, hits = 0) {
    const elapsed = Math.min(90.0, Math.max(0.0, elapsedSec));
    const safeHits = Math.max(0, hits || 0);
    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpCurve = (start, mid, end, t) => (
        t <= 0.5 ? lerp(start, mid, t * 2.0) : lerp(mid, end, (t - 0.5) * 2.0)
    );

    // Continuous "Piano Tiles" intensity factor combining elapsed time (78%) + hit momentum (22%)
    const timeP = Math.min(1.0, Math.max(0.0, elapsed / 90.0));
    const hitP = Math.min(1.0, Math.max(0.0, safeHits / WIN_HITS));
    const intensity = Math.min(1.0, 0.78 * timeP + 0.22 * hitP);

    // High-tempo continuous curves across 0.0 (1:30 start) -> 0.5 (mid-round) -> 1.0 (0:00 climax)
    const scrollMultiplier   = lerpCurve(1.90, 3.80, 6.50, intensity);
    const popDuration        = lerpCurve(0.22, 0.14, 0.07, intensity);
    const holdDuration       = lerpCurve(0.68, 0.42, 0.18, intensity);
    const duckDuration       = lerpCurve(0.20, 0.13, 0.07, intensity);
    const spawnInterval      = lerpCurve(0.62, 0.38, 0.20, intensity);
    const redRetreatDuration = Math.max(0.20, duckDuration);
    const maxSimultaneous    = (intensity < 0.28) ? 3 : ((intensity < 0.62) ? 4 : 5);

    // Bomb spawn schedule: 18% -> 35% (cap 2) in first 45s, 50% -> 62% (cap 3) in final 45s
    const isFirstHalf = elapsed <= 45.0;
    const p1 = isFirstHalf ? (elapsed / 45.0) : 1.0;
    const p2 = isFirstHalf ? 0.0 : ((elapsed - 45.0) / 45.0);
    const bombProb = isFirstHalf ? lerp(0.18, 0.35, p1) : lerp(0.50, 0.62, p2);
    const maxActiveBombs = isFirstHalf ? 2 : 3;

    return {
        phase: isFirstHalf ? 1 : 2,
        phaseProgress: isFirstHalf ? p1 : p2,
        timeP,
        hitP,
        intensity,
        scrollMultiplier,
        popDuration,
        holdDuration,
        duckDuration,
        redRetreatDuration,
        spawnInterval,
        bombProb,
        maxActiveBombs,
        maxSimultaneous
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
    TOTAL_DURATION: 90.0,         // 1:30 in seconds
    TARGET_NORMAL_HITS: WIN_HITS, // 50 normal hits required to open Mystery Box
    SCROLL_SPEED: 110,            // Base downward px/s (1.9x -> 3.8x -> 6.5x continuous curve)

    // Timeline Phases (Seconds elapsed from start 0:00 to 1:30)
    PHASE_WARMUP_END: 20.0,
    PHASE_MIDDLE_END: 50.0,
    PHASE_PRESSURE_END: 80.0,
    PHASE_FINAL_END: 90.0,

    // Spawning Rates along Continuous Curve
    SPAWN_INTERVAL_WARMUP: 0.62,
    SPAWN_INTERVAL_MIDDLE: 0.38,
    SPAWN_INTERVAL_PRESSURE: 0.26,
    SPAWN_INTERVAL_FINAL: 0.20,

    // Disguised Bomb Probabilities (18% -> 35% Phase 1, 50% -> 62% Phase 2)
    SAFE_PHASE_DURATION: 12.0,
    BOMB_PROB_SAFE: 0.18,
    BOMB_PROB_START: 0.18,
    BOMB_PROB_MAX: 0.62,
    BOMB_PROB_WARMUP: 0.18,
    BOMB_PROB_MIDDLE: 0.35,
    BOMB_PROB_PRESSURE: 0.50,
    BOMB_PROB_FINAL: 0.62,

    // Mole 3-Phase Smooth Eased Animation Timings (Clamped dt <= 0.05s)
    MOLE_PEEK_TIME: 0.22,         // Brisk initial pop-out
    MOLE_POP_DURATION: 0.22,      // Unified initial pop-out duration
    MOLE_IDLE_WARMUP: 0.68,       // Initial hold
    MOLE_IDLE_MIDDLE: 0.42,
    MOLE_IDLE_PRESSURE: 0.28,
    MOLE_IDLE_FINAL: 0.18,
    MOLE_DUCK_DURATION: 0.20,     // Brisk initial pop-in retreat
    MOLE_HIT_RETREAT_TIME: 0.20,
    MOLE_RED_EXPLODE_TIME: 0.42,
    MOLE_RED_RETREAT_TIME: 0.20,
    MOLE_MISS_WINDUP_TIME: 0.40,  // Clickable wind-up window across Frames 1-3 (0.13 + 0.14 + 0.13; 0.36s-0.40s scaled)
    MOLE_MISS_THROW_TIME: 0.50,   // Full 4-frame throw sequence (0.40s wind-up + 0.10s Frame 4 release)
    MISS_THROW_PROBABILITY: 0.33, // ~1-in-3 chance per eligible missed character to launch a ball attack
    MISS_BALL_FLIGHT_TIME: 0.14,  // Clean 2D pop-up arc flight to center screen (~0.14s)
    MISS_SPLASH_BURST_MS: 130,    // Frame 7 Screen Impact Burst duration (~0.13s)
    MISS_SPLASH_SPLAT_MS: 600,    // Frame 8 Splatted Ball smooth opacity fade (~0.60s)

    // Bomb Penalties & 2-Hit Heart Cool-Down Rules (-3s only after 2-hit heart empties post-safe phase)
    BOMB_TIME_PENALTY: 0.0,           // No immediate -1s deduction on bomb hit
    COOLDOWN_CADENCE: 2,              // Open Cool-Down modal on 2nd active-phase bomb hit (Full -> Half -> Empty)
    COOLDOWN_OPEN_DELAY: 0.32,        // 0.28s-0.35s delay so red character + explosion render BEFORE cooldown opens
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
