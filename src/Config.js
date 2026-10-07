// src/Config.js - Central Configuration and Tunable Parameters
export const CONFIG = {
    // Canvas & World
    VIEWPORT_WIDTH: 1200,
    VIEWPORT_HEIGHT: 800,
    IS_PORTRAIT: false,
    PERSPECTIVE_HORIZON_Y: 100, // Y where the perspective ground plane starts
    PERSPECTIVE_MIN_SCALE: 0.75, // Scale of objects near horizon
    PERSPECTIVE_MAX_SCALE: 1.15, // Scale of objects near bottom of screen
    
    // Unified Ground & Hole Scrolling Speed (pixels per second)
    SCROLL_SPEED_GROUND: 55, // Unified speed for both the ground and the holes

    // Ground Grid & Holes (Calibrated to Background_New.jpg 3-column perspective layout)
    HOLE_COLUMNS: 3,
    HOLE_ROWS: 5,
    HOLE_BASE_RADIUS_X: 75,
    HOLE_BASE_RADIUS_Y: 48,
    HOLE_VERTICAL_SPACING: 185,

    // Spawner Settings
    INITIAL_SPAWN_INTERVAL: 1.25, // seconds between spawns
    MIN_SPAWN_INTERVAL: 0.55,
    MAX_SIMULTANEOUS_MOLES: 3,
    INTENSITY_RAMP_DURATION: 180, // seconds over which pacing subtly increases
    
    // Mole Timings & Physics
    MOLE_PEEK_TIME: 0.24,      // Seconds in peek state
    MOLE_POP_DURATION: 0.28,   // Seconds to emerge with juicy squash and stretch
    MOLE_MIN_IDLE_TIME: 1.2,   // Idle duration before ducking if not hit
    MOLE_MAX_IDLE_TIME: 2.0,
    MOLE_DUCK_DURATION: 0.22,  // Seconds to retreat underground
    MOLE_HIT_RETREAT_TIME: 0.22,// Reaction before disappearing
    
    // Red Mole Predictable Pattern (Requirement 5)
    RED_TRIGGER_COUNT: 4,      // Every 4th hit or predictable combo cycle turns Yellow into Red!
    RED_IDLE_TIME: 1.4,        // Time Red mole stays enraged before retreating safely
    
    // Hand Attack Settings (Requirement 2)
    HAND_MODE: 'combo',        // 'combo' | 'punch' | 'slap'
    HAND_SMOOTHING: 0.4,       // Pointer follow lerp factor
    HAND_ANTICIPATION_MS: 35,  // Windup backswing duration
    HAND_STRIKE_MS: 50,        // Downward strike smash duration
    HAND_RECOVERY_MS: 140,     // Return to idle spring time
    HAND_HIT_RADIUS: 95,       // Generous hit detection radius
    
    // Camera Shake
    SHAKE_BASE_INTENSITY: 14,
    SHAKE_DECAY: 0.88,
    SHAKE_MAX_OFFSET: 25,
    
    // VFX & Juice
    HIT_STOP_MS: 35,           // Micro-freeze on hit for impact crunch
    PARTICLE_COUNT_HIT: 28,
    PARTICLE_COUNT_DUST: 16,
    FLOATING_TEXT_ENABLED: true,
    
    // Audio
    MASTER_VOLUME: 0.85,
    SFX_VOLUME: 0.9,
    MUSIC_VOLUME: 0.45,
    
    // Health & Penalty System
    MAX_HEALTH: 3,
    HUMAN_SPAWN_CHANCE: 0      // Red Human is never spawned separately; Yellow turns Red via pattern!
};

