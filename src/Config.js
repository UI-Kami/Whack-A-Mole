// src/Config.js - Central Configuration and Tunable Parameters
export const CONFIG = {
    // Canvas & World
    VIEWPORT_WIDTH: 1200,
    VIEWPORT_HEIGHT: 800,
    IS_PORTRAIT: false,
    PERSPECTIVE_HORIZON_Y: 180, // Y where the 3D ground plane starts
    PERSPECTIVE_MIN_SCALE: 0.72, // Scale of objects near horizon
    PERSPECTIVE_MAX_SCALE: 1.18, // Scale of objects near bottom of screen
    
    // Infinite Scrolling Speeds (pixels per second)
    SCROLL_SPEED_BG_SKY: 5,
    SCROLL_SPEED_BG_MOUNTAINS: 12,
    SCROLL_SPEED_MIDGROUND_HILLS: 30,
    SCROLL_SPEED_GROUND: 65,      // The active gameplay terrain speed
    SCROLL_SPEED_FOREGROUND: 110,  // Floating grass / pollen / petals

    // Ground Grid & Holes
    HOLE_COLUMNS: 4,
    HOLE_ROWS: 5,
    HOLE_BASE_RADIUS_X: 62,
    HOLE_BASE_RADIUS_Y: 34,
    HOLE_VERTICAL_SPACING: 155,

    // Spawner Settings
    INITIAL_SPAWN_INTERVAL: 1.25, // seconds between spawns
    MIN_SPAWN_INTERVAL: 0.55,
    MAX_SIMULTANEOUS_MOLES: 3,
    INTENSITY_RAMP_DURATION: 180, // seconds over which pacing subtly increases
    
    // Mole Timings & Physics
    MOLE_PEEK_TIME: 0.3,       // Seconds in peek state
    MOLE_POP_DURATION: 0.18,   // Seconds to emerge to full height
    MOLE_MIN_IDLE_TIME: 1.2,   // Idle duration before ducking if not hit
    MOLE_MAX_IDLE_TIME: 2.2,
    MOLE_DUCK_DURATION: 0.2,   // Seconds to retreat underground
    MOLE_HIT_RETREAT_TIME: 0.14,// Quick reaction before disappearing
    
    // Hammer Settings
    HAMMER_SMOOTHING: 0.35,    // Pointer follow lerp factor
    HAMMER_IDLE_ANGLE: 0,      // Resting angle (degrees)
    HAMMER_ANTICIPATION_ANGLE: 26, // Cocked back & up before downward swing
    HAMMER_IMPACT_ANGLE: -68,  // Downward smash angle onto target
    HAMMER_ANTICIPATION_MS: 40, // Duration of backswing
    HAMMER_SWING_MS: 60,       // Duration of downward smash
    HAMMER_RECOVERY_MS: 150,   // Return to idle spring time
    HAMMER_HIT_RADIUS: 90,     // Forgiving hit radius
    
    // Camera Shake
    SHAKE_BASE_INTENSITY: 14,
    SHAKE_DECAY: 0.88,
    SHAKE_MAX_OFFSET: 25,
    
    // VFX & Juice
    HIT_STOP_MS: 35,           // Subtle micro-freeze on hit for impact crunch
    PARTICLE_COUNT_HIT: 28,
    PARTICLE_COUNT_DUST: 18,
    FLOATING_TEXT_ENABLED: true,
    
    // Audio
    MASTER_VOLUME: 0.85,
    SFX_VOLUME: 0.9,
    MUSIC_VOLUME: 0.45,
    
    // Themes: 'garden' | 'cheese'
    DEFAULT_THEME: 'garden'
};
