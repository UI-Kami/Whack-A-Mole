// src/Config.js - Central Configuration and Tunable Parameters
export const CONFIG = {
    // Canvas & World
    VIEWPORT_WIDTH: 1200,
    VIEWPORT_HEIGHT: 800,
    IS_PORTRAIT: false,

    // Fullscreen 3-Row Grid (Requirement 1: max 9 or 12 holes, 3 rows, 3 or 4 columns with padding)
    GRID_MODE: 'auto',         // 'auto' (3x3 portrait = 9, 3x4 landscape = 12) | 9 | 12
    HOLE_ROWS: 3,              // Strictly 3 rows!
    HOLE_COLUMNS: 4,           // 3 or 4 columns (max 9 or 12 holes)
    PADDING_TOP: 115,          // Padding from top (below HUD bar)
    PADDING_BOTTOM: 65,        // Padding from bottom of screen
    PADDING_HORIZONTAL: 75,    // Padding from left and right edges

    // Hole Proportions
    HOLE_BASE_RADIUS_X: 95,
    HOLE_BASE_RADIUS_Y: 50,

    // Spawner Settings
    INITIAL_SPAWN_INTERVAL: 1.15, // seconds between spawns
    MIN_SPAWN_INTERVAL: 0.50,
    MAX_SIMULTANEOUS_MOLES: 3,
    INTENSITY_RAMP_DURATION: 180, // seconds over which pacing subtly increases
    
    // Mole Timings & Physics
    MOLE_PEEK_TIME: 0.22,      // Seconds in peek state
    MOLE_POP_DURATION: 0.26,   // Seconds to emerge with juicy squash and stretch
    MOLE_MIN_IDLE_TIME: 1.1,   // Idle duration before ducking if not hit
    MOLE_MAX_IDLE_TIME: 1.8,
    MOLE_DUCK_DURATION: 0.20,  // Seconds to retreat underground
    MOLE_HIT_RETREAT_TIME: 0.20,// Reaction before disappearing
    
    // Red Mole Predictable Pattern (Requirement 3: turns red and immediately explodes)
    RED_TRIGGER_COUNT: 4,      // Every 4th hit or predictable combo cycle turns Yellow into Red!
    RED_IDLE_TIME: 1.4,        // Time Red mole stays enraged if dodged before retreating safely
    
    // Hand Attack Settings (Requirement 2 & 4)
    HAND_MODE: 'combo',        // 'combo' | 'punch' | 'slap'
    HAND_SMOOTHING: 0.45,      // Pointer follow lerp factor
    HAND_ANTICIPATION_MS: 30,  // Windup backswing duration
    HAND_STRIKE_MS: 40,        // Downward strike smash duration
    HAND_RECOVERY_MS: 120,     // Return to idle spring time
    HAND_HIT_RADIUS: 100,      // Generous hit detection radius
    
    // Camera Shake
    SHAKE_BASE_INTENSITY: 14,
    SHAKE_DECAY: 0.88,
    SHAKE_MAX_OFFSET: 25,
    
    // VFX, Juice & Mobile Optimization (Requirement 5)
    MOBILE_OPTIMIZED: true,
    HIT_STOP_MS: 20,           // Fast, crisp micro-freeze on hit without frame hitching
    PARTICLE_COUNT_HIT: 18,    // High performance particle count
    PARTICLE_COUNT_DUST: 10,
    FLOATING_TEXT_ENABLED: true,
    
    // Audio
    MASTER_VOLUME: 0.85,
    SFX_VOLUME: 0.9,
    MUSIC_VOLUME: 0.45,
    
    // Health & Penalty System
    MAX_HEALTH: 3,
    HUMAN_SPAWN_CHANCE: 0
};

