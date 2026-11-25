// src/Config.js - Central Configuration, Timeline, Single-Language Text Pools & Kiosk Settings
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

    // 90-Second Timeline Settings
    TOTAL_DURATION: 90.0,     // 1:30 in seconds
    TARGET_NORMAL_HITS: 30,   // 30 normal hits required to open Mystery Box

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

    // Bomb Penalties & Cool-Down Rules
    BOMB_TIME_PENALTY: 1.0,           // -1 second deducted on bomb hit
    COOLDOWN_CADENCE: 2,              // Trigger cool-down on every 2nd bomb hit (2, 4, 6...)
    COOLDOWN_AUTO_DURATION: 2.5,      // Auto-continues after ~2.5 seconds
    COOLDOWN_PENALTY_FULL: 3.0,       // -3 seconds for full cool-down
    COOLDOWN_PENALTY_SKIP: 1.0,       // -1 second if early "Continue" tapped

    // Hand Attack Settings
    HAND_MODE: 'combo',
    HAND_HIT_RADIUS: 145,

    // Camera Shake & Audio
    SHAKE_BASE_INTENSITY: 16,
    SHAKE_DECAY: 0.88,
    SHAKE_MAX_OFFSET: 28,
    MASTER_VOLUME: 0.85,
    SFX_VOLUME: 0.9,
    MUSIC_VOLUME: 0.40,

    // Hit Reaction & Bomb Insult Speech Bubbles
    // Strictly single-language per bubble: exclusively Urdu OR exclusively English (no duplicate translations!)
    INSULTS: [
        // Urdu Curse / Scold Bubbles
        { text: "\u0628\u06cc\u0648\u0642\u0648\u0641!", lang: "ur" },
        { text: "\u0645\u0648\u0679\u0648", lang: "ur" },
        { text: "\u0646\u06a9\u0645\u0627", lang: "ur" },
        { text: "\u06af\u062f\u06be\u0627!", lang: "ur" },
        { text: "\u0627\u0644\u0651\u0648", lang: "ur" },
        { text: "\u0688\u06be\u06a9\u0646", lang: "ur" },
        { text: "\u0628\u06be\u0648\u06a9\u0627", lang: "ur" },
        { text: "\u0628\u0633 \u0645\u0630\u0627\u0642!", lang: "ur" },
        { text: "\u0627\u062a\u0646\u06d2 \u0633\u0646\u062c\u06cc\u062f\u06c1\u061f", lang: "ur" },
        { text: "\u06af\u06be\u0631 \u06a9\u0627 \u0686\u0645\u0686\u06c1", lang: "ur" },
        { text: "\u06a9\u0686\u06be \u0646\u06c1\u06cc\u06ba \u0622\u062a\u0627", lang: "ur" },
        { text: "\u0635\u0631\u0641 \u062f\u06a9\u06be\u0627\u0648\u0627", lang: "ur" },
        { text: "\u0628\u06d2 \u06a9\u0627\u0631 \u0627\u0646\u0633\u0627\u0646", lang: "ur" },
        { text: "\u0633\u0628 \u06c1\u0646\u0633 \u0631\u06c1\u06d2 \u062a\u06be\u06d2", lang: "ur" },
        { text: "\u06af\u0646\u0648\u0627\u0631 \u06c1\u0648 \u06a9\u06cc\u0627\u061f", lang: "ur" },
        { text: "\u06a9\u0633\u06cc \u06a9\u0627\u0645 \u06a9\u0627 \u0646\u06c1\u06cc\u06ba", lang: "ur" },
        { text: "\u0646\u0627\u0644\u0627\u0626\u0642!", lang: "ur" },
        { text: "\u067e\u0627\u06af\u0644!", lang: "ur" },
        { text: "\u062c\u0627\u06c1\u0644!", lang: "ur" },

        // English Curse / Scold Bubbles
        { text: "Sensitive!", lang: "en" },
        { text: "Drama queen", lang: "en" },
        { text: "Crybaby!", lang: "en" },
        { text: "Can't take a joke?", lang: "en" },
        { text: "Too sensitive", lang: "en" },
        { text: "Just a joke!", lang: "en" },
        { text: "Idiot!", lang: "en" },
        { text: "Stupid!", lang: "en" },
        { text: "Moron!", lang: "en" },
        { text: "Loser!", lang: "en" },
        { text: "Grow up!", lang: "en" }
    ],

    // Side Emoji Reaction Bubble (single language per cycle, never duplicated)
    EMOJI_REACTION_BUBBLES: [
        { text: "\u0628\u0633 \u0645\u0630\u0627\u0642!", lang: "ur" },
        { text: "Just a joke!", lang: "en" }
    ],

    // 6 Cool-Down Reflection Lines (single language each; rotate cleanly without duplicating translations)
    REFLECTIONS: [
        { text: "Silence after laughter is an answer too.", lang: "en" },
        { text: "\u0627\u06cc\u06a9 \u0645\u0630\u0627\u0642 \u0627\u06a9\u062b\u0631 \u0628\u0639\u062f \u0645\u06cc\u06ba \u06cc\u0627\u062f \u0622\u062a\u0627 \u06c1\u06d2\u060c \u062c\u0628 \u06c1\u0646\u0633\u06cc \u062e\u062a\u0645 \u06c1\u0648 \u0686\u06a9\u06cc \u06c1\u0648\u062a\u06cc \u06c1\u06d2\u06d4", lang: "ur" },
        { text: "Words said in jest stay inside someone's heart.", lang: "en" },
        { text: "\u0622\u067e \u0646\u06d2 \u062c\u0648 \u0645\u062d\u0633\u0648\u0633 \u06a9\u06cc\u0627\u060c \u0648\u06c1 \u0628\u06be\u06cc \u0627\u06cc\u06a9 \u062c\u0648\u0627\u0628 \u06c1\u06d2\u06d4", lang: "ur" },
        { text: "When humor belittles someone, it becomes a wound.", lang: "en" },
        { text: "\u06a9\u0633\u06cc \u06a9\u06cc \u06c1\u0646\u0633\u06cc \u06a9\u0627 \u0645\u0637\u0644\u0628 \u06cc\u06c1 \u0646\u06c1\u06cc\u06ba \u06a9\u06c1 \u0627\u0633\u06d2 \u0628\u0631\u0627 \u0646\u06c1\u06cc\u06ba \u0644\u06af\u0627\u06d4", lang: "ur" }
    ],

    // 3 Cool-Down Fact Lines (paired sequentially, each rendered in ONE language only)
    FACTS: [
        { text: "75% of people have been hurt by a joke.", lang: "en" },
        { text: "\u06f4\u06f6.\u06f7 \u0641\u06cc\u0635\u062f \u0644\u0648\u06af \u0627\u0633 \u0648\u0642\u062a \u062e\u0627\u0645\u0648\u0634 \u0631\u06c1\u06d2\u06d4", lang: "ur" },
        { text: "26.7% doubted themselves instead of the joke.", lang: "en" }
    ],

    // Lose Sequence Dialogues (Alternating single-language English & Urdu line by line)
    LOSE_DIALOGUE_LINES: [
        { text: "Not even one game played properly.", lang: "en" },
        { text: "\u062a\u0645 \u0633\u06d2 \u06cc\u06c1 \u0628\u06be\u06cc \u0646\u06c1\u06cc\u06ba \u06c1\u0648\u0627\u06d4", lang: "ur" },
        { text: "The game is insulting you.", lang: "en" },
        { text: "\u0627\u062a\u0646\u0627 \u0628\u06be\u06cc \u0646\u06c1\u06cc\u06ba \u06c1\u0648 \u067e\u0627\u06cc\u0627\u061f", lang: "ur" },
        { text: "Lost? Not surprising at all.", lang: "en" },
        { text: "\u06af\u06be\u0691\u06cc \u062a\u0645\u06c1\u0627\u0631\u06cc \u0646\u06c1\u06cc\u06ba\u060c \u0645\u0630\u0627\u0642 \u06a9\u06cc \u06c1\u06d2\u06d4", lang: "ur" }
    ],
    FINAL_LOSE_INSULT: { text: "Impressive. You managed to lose to a bunch of cartoons.", lang: "en" },
    FINAL_LOSE_REFLECTION: { text: "\u06a9\u0628\u06be\u06cc \u06a9\u0628\u06be\u06cc \u062c\u0648\u06a9\u0633 \u0635\u0631\u0641 \u062c\u0648\u06a9\u0633 \u0646\u06c1\u06cc\u06ba \u06c1\u0648\u062a\u06d2\u06d4 \u06c1\u0646\u0633\u0646\u06d2 \u0633\u06d2 \u067e\u06c1\u0644\u06d2 \u062f\u06cc\u06a9\u06be \u0644\u0648 \u06a9\u0633\u06d2 \u0644\u06af \u0631\u06c1\u06cc \u06c1\u06d2\u06d4", lang: "ur" },
    LOSE_LAST_HEADING: "TIME'S UP",
    LOSE_LAST_LINE: { text: "\u067e\u06c1\u0644\u06d2 \u0631\u06a9\u0648\u060c \u067e\u06be\u0631 \u06c1\u0646\u0633\u0648\u06d4", lang: "ur" },

    // Win Sequence Dialogues (Opened Mystery Box, single language per screen)
    WIN_BOX_LINES: [
        { text: "The hurt you felt from that joke was real.", lang: "en" },
        { text: "\u0634\u0627\u06cc\u062f \u0622\u067e \u0646\u06d2 \u06a9\u0633\u06cc \u0627\u0648\u0631 \u06a9\u0648 \u0628\u06be\u06cc \u0627\u06cc\u0633\u0627 \u06c1\u06cc \u0645\u062d\u0633\u0648\u0633 \u06a9\u0631\u0627\u06cc\u0627 \u06c1\u0648\u060c \u0628\u063a\u06cc\u0631 \u062c\u0627\u0646\u06d2\u06d4", lang: "ur" },
        { text: "Think about it. Choose your words well.", lang: "en" }
    ],
    WIN_LAST_LINE: { text: "\u06c1\u0646\u0633\u06cc \u06a9\u06cc \u0628\u0627\u062a \u06c1\u06d2\u060c \u06cc\u0627 \u0627\u0646\u0635\u0627\u0641 \u06a9\u06cc\u061f", lang: "ur" }
};
