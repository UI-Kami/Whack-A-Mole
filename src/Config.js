// src/Config.js - Central Configuration, Timeline, Bilingual Pools & Kiosk Settings
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
    // 0:00 - 0:20 (0 to 20s): Warm-up, slow pop-ups, NO bombs
    // 0:20 - 0:50 (20 to 50s): Middle, faster, first 2 bombs appear, 1st cool-down after 2nd hit
    // 0:50 - 1:20 (50 to 80s): Pressure, high density, bombs more frequent, speed bar climbs
    // 1:20 - 1:30 (80 to 90s): Final push, fastest speed, last bomb, max clock pressure
    PHASE_WARMUP_END: 20.0,
    PHASE_MIDDLE_END: 50.0,
    PHASE_PRESSURE_END: 80.0,
    PHASE_FINAL_END: 90.0,

    // Spawning Rates by Phase
    SPAWN_INTERVAL_WARMUP: 1.30,
    SPAWN_INTERVAL_MIDDLE: 0.95,
    SPAWN_INTERVAL_PRESSURE: 0.70,
    SPAWN_INTERVAL_FINAL: 0.52,

    // Mole Lifetimes by Phase
    MOLE_PEEK_TIME: 0.20,
    MOLE_POP_DURATION: 0.24,
    MOLE_IDLE_WARMUP: 1.5,
    MOLE_IDLE_MIDDLE: 1.2,
    MOLE_IDLE_PRESSURE: 0.9,
    MOLE_IDLE_FINAL: 0.7,
    MOLE_DUCK_DURATION: 0.18,
    MOLE_HIT_RETREAT_TIME: 0.20,

    // Bomb Penalties & Cool-Down Rules
    BOMB_TIME_PENALTY: 1.0,           // -1 second deducted on bomb hit
    COOLDOWN_CADENCE: 2,              // Trigger cool-down on every 2nd bomb hit (2, 4, 6...)
    COOLDOWN_AUTO_DURATION: 2.2,      // Auto-continues after ~2 seconds
    COOLDOWN_PENALTY_FULL: 3.0,       // -3 seconds for full cool-down
    COOLDOWN_PENALTY_SKIP: 1.0,       // -1 second if early "Continue" tapped

    // Hand Attack Settings
    HAND_MODE: 'combo',               // Alternate punch and slap
    HAND_HIT_RADIUS: 140,

    // Camera Shake & Audio
    SHAKE_BASE_INTENSITY: 16,
    SHAKE_DECAY: 0.88,
    SHAKE_MAX_OFFSET: 28,
    MASTER_VOLUME: 0.85,
    SFX_VOLUME: 0.9,
    MUSIC_VOLUME: 0.40,

    // 22 Bomb Insult Speech Bubbles (Short, Two Words, Strong)
    INSULTS: [
        // Short (10)
        "Bewakoof / \u0628\u06cc\u0648\u0642\u0648\u0641",
        "Motu / \u0645\u0648\u0679\u0648",
        "Nikamma / \u0646\u06a9\u0645\u0627",
        "Gadha / \u06af\u062f\u06be\u0627",
        "Ullu / \u0627\u0644\u0651\u0648",
        "Dhakkan / \u0688\u06be\u06a9\u0646",
        "Sensitive / \u062d\u0633\u0627\u0633",
        "Drama queen / \u0688\u0631\u0627\u0645\u06d2 \u0628\u0627\u0632",
        "Crybaby / \u0631\u0648\u0646\u06cc \u0635\u0648\u0631\u062a",
        "Bhookha / \u0628\u06be\u0648\u06a9\u0627",
        // Two words (6)
        "Bas mazaaq / \u0628\u0633 \u0645\u0630\u0627\u0642",
        "Relax karo / \u0631\u06cc\u0644\u06cc\u06a9\u0633 \u06a9\u0631\u0648",
        "Itna serious? / \u0627\u062a\u0646\u06d2 \u0633\u0646\u062c\u06cc\u062f\u06c1\u061f",
        "Can't joke? / \u0645\u0630\u0627\u0642 \u0628\u06be\u06cc \u0628\u0631\u062f\u0627\u0634\u062a \u0646\u06c1\u06cc\u06ba\u061f",
        "Too sensitive / \u0628\u06c1\u062a \u062d\u0633\u0627\u0633",
        "Ghar ka chamcha / \u06af\u06be\u0631 \u06a9\u0627 \u0686\u0645\u0686\u06c1",
        // Strong (6)
        "Kuch nahi aata / \u06a9\u0686\u06be \u0646\u06c1\u06cc\u06ba \u0622\u062a\u0627",
        "Sirf dikhava / \u0635\u0631\u0641 \u062f\u06a9\u06be\u0627\u0648\u0627",
        "Bekaar insaan / \u0628\u06d2 \u06a9\u0627\u0631 \u0627\u0646\u0633\u0627\u0646",
        "Sab hans rahe the / \u0633\u0628 \u06c1\u0646\u0633 \u0631\u06c1\u06d2 \u062a\u06be\u06d2",
        "Gawaar ho kya / \u06af\u0646\u0648\u0627\u0631 \u06c1\u0648 \u06a9\u06cc\u0627",
        "Kisi kaam ka nahi / \u06a9\u0633\u06cc \u06a9\u0627\u0645 \u06a9\u0627 \u0646\u06c1\u06cc\u06ba"
    ],

    // 6 Cool-Down Reflection Lines (Never repeat back-to-back)
    REFLECTIONS: [
        "Hansi ke baad ka sannata bhi ek jawab hai. Silence is an answer too. / \u06c1\u0646\u0633\u06cc \u06a9\u06d2 \u0628\u0639\u062f \u06a9\u0627 \u0633\u0646\u0627\u0679\u0627 \u0628\u06be\u06cc \u0627\u06cc\u06a9 \u062c\u0648\u0627\u0628 \u06c1\u06d2\u06d4",
        "Ek mazaaq aksar baad mein yaad aata hai, jab hansi khatam ho chuki hoti hai. / \u0627\u06cc\u06a9 \u0645\u0630\u0627\u0642 \u0627\u06a9\u062b\u0631 \u0628\u0639\u062f \u0645\u06cc\u06ba \u06cc\u0627\u062f \u0622\u062a\u0627 \u06c1\u06d2\u06d4",
        "Jo baat hansi mein kahi jaati hai, woh kisi ke dil mein reh jaati hai. / \u062c\u0648 \u0628\u0627\u062a \u06c1\u0646\u0633\u06cc \u0645\u06cc\u06ba \u06a9\u06c1\u06cc \u062c\u0627\u062a\u06cc \u06c1\u06d2\u060c \u0648\u06c1 \u06a9\u0633\u06cc \u06a9\u06d2 \u062f\u0644 \u0645\u06cc\u06ba \u0631\u06c1 \u062c\u0627\u062a\u06cc \u06c1\u06d2\u06d4",
        "Aap ne jo mehsoos kiya, woh bhi ek jawab hai. / \u0622\u067e \u0646\u06d2 \u062c\u0648 \u0645\u062d\u0633\u0648\u0633 \u06a9\u06cc\u0627\u060c \u0648\u06c1 \u0628\u06be\u06cc \u0627\u06cc\u06a9 \u062c\u0648\u0627\u0628 \u06c1\u06d2\u06d4",
        "Mazaaq kisi ko chota kare to mazaaq nahi rehta, takleef ban jaata hai. / \u0645\u0630\u0627\u0642 \u06a9\u0633\u06cc \u06a9\u0648 \u0686\u06be\u0648\u0679\u0627 \u06a9\u0631\u06d2 \u062a\u0648 \u0645\u0630\u0627\u0642 \u0646\u06c1\u06cc\u06ba \u0631\u06c1\u062a\u0627\u060c \u062a\u06a9\u0644\u06cc\u0641 \u0628\u0646 \u062c\u0627\u062a\u0627 \u06c1\u06d2\u06d4",
        "Kisi ki hansi ka matlab ye nahi ke usay bura nahi laga. / \u06a9\u0633\u06cc \u06a9\u06cc \u06c1\u0646\u0633\u06cc \u06a9\u0627 \u0645\u0637\u0644\u0628 \u06cc\u06c1 \u0646\u06c1\u06cc\u06ba \u06a9\u06c1 \u0627\u0633\u06d2 \u0628\u0631\u0627 \u0646\u06c1\u06cc\u06ba \u0644\u06af\u0627\u06d4"
    ],

    // 3 Cool-Down Fact Lines (Displayed directly under reflection line)
    FACTS: [
        "75% people have been hurt by a joke. / \u06f7\u06f5 \u0641\u06cc\u0635\u062f \u0644\u0648\u06af\u0648\u06ba \u06a9\u0648 \u0645\u0630\u0627\u0642 \u0633\u06d2 \u062a\u06a9\u0644\u06cc\u0641 \u067e\u06c1\u0646\u0686\u06cc \u06c1\u06d2\u06d4",
        "46.7% stayed quiet when it happened. / \u06f4\u06f6.\u06f7 \u0641\u06cc\u0635\u062f \u062e\u0627\u0645\u0648\u0634 \u0631\u06c1\u06d2\u06d4",
        "26.7% doubted themselves instead of the joke. / \u06f2\u06f6.\u06f7 \u0641\u06cc\u0635\u062f \u0646\u06d2 \u062e\u0648\u062f \u067e\u0631 \u0634\u06a9 \u06a9\u06cc\u0627\u06d4"
    ],

    // Lose Sequence Dialogues (Rude, alternating English/Urdu line by line)
    LOSE_DIALOGUE_LINES: [
        "Ek game bhi nahi khela gaya. / One game, not even played properly.",
        "Tumse ye bhi nahi hua. / You couldn't even manage this.",
        "The game is insulting you. / \u06af\u06cc\u0645 \u062a\u0645\u06c1\u06cc\u06ba \u06c1\u06cc \u0628\u06d2 \u0639\u0632\u062a \u06a9\u0631 \u0631\u06c1\u0627 \u06c1\u06d2\u06d4",
        "Itna bhi nahi ho paya? / \u0627\u062a\u0646\u0627 \u0628\u06be\u06cc \u0646\u06c1\u06cc\u06ba \u06c1\u0648 \u067e\u0627\u06cc\u0627\u061f",
        "Haar gaye? Shock nahi, asal mein. / Lost? Not surprising at all.",
        "Clock tumhara nahi, mazaaq ka hai. / The clock was never yours, it belongs to the joke."
    ],
    FINAL_LOSE_INSULT: "Impressive. You managed to lose to a bunch of cartoons.",
    FINAL_LOSE_REFLECTION: "Kabhi kabhi jokes sirf jokes nahi hote. Woh kisi ke liye aisi chot ban jaate hain jo der tak rehti hai. Hansne se pehle, dekh lo kise lag rahi hai. / \u06a9\u0628\u06be\u06cc \u06a9\u0628\u06be\u06cc \u062c\u0648\u06a9\u0633 \u0635\u0631\u0641 \u062c\u0648\u06a9\u0633 \u0646\u06c1\u06cc\u06ba \u06c1\u0648\u062a\u06d2\u06d4 \u06c1\u0646\u0633\u0646\u06d2 \u0633\u06d2 \u067e\u06c1\u0644\u06d2 \u062f\u06cc\u06a9\u06be \u0644\u0648 \u06a9\u0633\u06d2 \u0644\u06af \u0631\u06c1\u06cc \u06c1\u06d2\u06d4",
    LOSE_LAST_HEADING: "Time's up",
    LOSE_LAST_LINE: "Pehle ruko, phir hanso. / \u067e\u06c1\u0644\u06d2 \u0631\u06a9\u0648\u060c \u067e\u06be\u0631 \u06c1\u0646\u0633\u0648\u06d4",

    // Win Sequence Dialogues (Opened Mystery Box)
    WIN_BOX_LINES: [
        "The hurt you felt from that joke was real. / \u0648\u06c1 \u062a\u06a9\u0644\u06cc\u0641 \u0633\u0686\u06cc \u062a\u06be\u06cc\u06d4",
        "You've probably made someone else feel it too, without realizing. / \u0634\u0627\u06cc\u062f \u0622\u067e \u0646\u06d2 \u06a9\u0633\u06cc \u0627\u0648\u0631 \u06a9\u0648 \u0628\u06be\u06cc \u0627\u06cc\u0633\u0627 \u06c1\u06cc \u0645\u062d\u0633\u0648\u0633 \u06a9\u0631\u0627\u06cc\u0627 \u06c1\u0648\u060c \u0628\u063a\u06cc\u0631 \u062c\u0627\u0646\u06d2\u06d4",
        "Think about it. Choose your words well. / \u0633\u0648\u0686\u06cc\u06d2\u06d4 \u0627\u0644\u0641\u0627\u0638 \u0633\u0648\u0686 \u06a9\u0631 \u0686\u0646\u06cc\u06ba\u06d4"
    ],
    WIN_LAST_LINE: "Is it funny, or is it fair? / \u06c1\u0646\u0633\u06cc \u06a9\u06cc \u0628\u0627\u062a \u06c1\u06d2\u060c \u06cc\u0627 \u0627\u0646\u0635\u0627\u0641 \u06a9\u06cc\u061f"
};
