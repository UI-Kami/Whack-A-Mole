// src/AudioManager.js - Procedural Web Audio API sound & music engine
export class AudioManager {
    constructor(config) {
        this.config = config;
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.isMuted = false;
        this.isMusicMuted = false;
        this.initialized = false;
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            // Master gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.config.MASTER_VOLUME, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // SFX bus
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.config.SFX_VOLUME, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            // Music bus
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.config.MUSIC_VOLUME, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.initialized = true;
            this.startBackgroundMusic();
        } catch (e) {
            console.warn("Web Audio API not supported or blocked", e);
        }
    }

    resume() {
        if (!this.initialized) {
            this.init();
        } else if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(muted ? 0 : this.config.MASTER_VOLUME, this.ctx.currentTime, 0.05);
        }
    }

    setMusicMuted(muted) {
        this.isMusicMuted = muted;
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setTargetAtTime(muted ? 0 : this.config.MUSIC_VOLUME, this.ctx.currentTime, 0.05);
        }
    }

    // Helper: random pitch variation
    randomPitch(base, variance = 0.12) {
        return base * (1 + (Math.random() * 2 - 1) * variance);
    }

    // --- SFX: Punch Swing Whoosh ---
    playPunchSwing() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.10;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + 0.1);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.1);
    }

    // --- SFX: Heavy Punch Crunch / Thud with Combo Pitch Escalation ---
    playPunchHit(comboStreak = 1) {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const comboPitch = Math.min(1.8, 1.0 + Math.max(0, comboStreak - 1) * 0.07);
        const pitchMod = comboPitch * (1 + (Math.random() * 0.16 - 0.08));

        // 1. Deep low-end bass gut punch (sub-bass drop)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(220 * pitchMod, t);
        subOsc.frequency.exponentialRampToValueAtTime(35 * pitchMod, t + 0.15);
        subGain.gain.setValueAtTime(1.0, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(t);
        subOsc.stop(t + 0.18);

        // 2. Punch crunch burst
        const crackBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.06, this.ctx.sampleRate);
        const crackData = crackBuffer.getChannelData(0);
        for (let i = 0; i < crackData.length; i++) {
            crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 200);
        }
        const crackSource = this.ctx.createBufferSource();
        crackSource.buffer = crackBuffer;
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(0.65, t);
        crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        crackSource.connect(crackGain);
        crackGain.connect(this.sfxGain);
        crackSource.start(t);

        this.playMoleBonkSqueak(pitchMod * 0.95);

        // Celebratory combo chime on milestones
        if (comboStreak === 3 || comboStreak === 5 || comboStreak === 10 || (comboStreak > 10 && comboStreak % 5 === 0)) {
            this.playComboChime(comboStreak);
        }
    }

    // --- SFX: Slap Fast High Whoosh ---
    playSlapSwing() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.09;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(1800, t + 0.05);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.09);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.09);
    }

    // --- SFX: Crisp Comic Slap / Smack with Combo Pitch Escalation ---
    playSlapHit(comboStreak = 1) {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const comboPitch = Math.min(1.85, 1.0 + Math.max(0, comboStreak - 1) * 0.07);
        const pitchMod = comboPitch * (1 + (Math.random() * 0.16 - 0.08));

        // 1. Sharp high-frequency stinging slap crack
        const slapBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const slapData = slapBuffer.getChannelData(0);
        for (let i = 0; i < slapData.length; i++) {
            slapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 110);
        }
        const slapSource = this.ctx.createBufferSource();
        slapSource.buffer = slapBuffer;
        const slapGain = this.ctx.createGain();
        slapGain.gain.setValueAtTime(0.85, t);
        slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        slapSource.connect(slapGain);
        slapGain.connect(this.sfxGain);
        slapSource.start(t);

        // 2. Resonant skin slap pop tone
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(750 * pitchMod, t);
        popOsc.frequency.exponentialRampToValueAtTime(180 * pitchMod, t + 0.08);
        popGain.gain.setValueAtTime(0.55, t);
        popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        popOsc.connect(popGain);
        popGain.connect(this.sfxGain);
        popOsc.start(t);
        popOsc.stop(t + 0.1);

        this.playMoleBonkSqueak(pitchMod * 1.25);

        // Celebratory combo chime on milestones
        if (comboStreak === 3 || comboStreak === 5 || comboStreak === 10 || (comboStreak > 10 && comboStreak % 5 === 0)) {
            this.playComboChime(comboStreak);
        }
    }

    // --- SFX: Harmonic Sparkling Combo Chime Arpeggio ---
    playComboChime(streak = 3) {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const notes = streak >= 5 ? [523.25, 659.25, 783.99, 1046.50] : [587.33, 880.00];
        notes.forEach((freq, idx) => {
            const noteTime = t + idx * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteTime);
            gain.gain.setValueAtTime(0.001, noteTime);
            gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(noteTime);
            osc.stop(noteTime + 0.28);
        });
    }

    // --- SFX: Swing Miss Thud / Floor Impact ---
    playMissThud() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(115, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
    }

    // --- SFX: Red Mole Enraged Screech / Warning ---
    playRedEnrage() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Angry rising steam synth siren
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.linearRampToValueAtTime(580, t + 0.12);
        osc.frequency.linearRampToValueAtTime(380, t + 0.28);
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    // --- SFX: Hammer Swing Whoosh ---
    playHammerSwing() {
        this.playPunchSwing();
    }

    // --- SFX: Heavy Satisfying Hammer Impact / Bonk ---
    playHammerHit(isSpecial = false) {
        this.playPunchHit();
    }

    // --- SFX: Mole Squeak on Bonk ---
    playMoleBonkSqueak(pitchMod = 1.0) {
        if (!this.initialized || this.isMuted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 * pitchMod, t + 0.02);
        osc.frequency.linearRampToValueAtTime(1100 * pitchMod, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(450 * pitchMod, t + 0.22);
        
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + 0.02);
        osc.stop(t + 0.22);
    }

    // --- SFX: Mole Emerging / Dirt Rustle ---
    playMolePop() {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const pitchMod = 1 + (Math.random() * 0.25 - 0.12);

        // Cute chirpy pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320 * pitchMod, t);
        osc.frequency.exponentialRampToValueAtTime(640 * pitchMod, t + 0.08);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);

        // Soft dirt rustle
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.15;
        }
        const rustle = this.ctx.createBufferSource();
        rustle.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        rustle.connect(filter);
        filter.connect(this.sfxGain);
        rustle.start(t);
    }

    // --- SFX: UI Click ---
    playUIClick() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(950, t + 0.04);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    // --- SFX: Human "Ouch!" Vocal Tone & Error Buzz ---
    // --- SFX: Massive Red Mole Explosion Blast (Point 5) ---
    playRedExplosion() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;

        // 1. Deep Sub-Bass Impact Boom
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(140, t);
        subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.45);
        subGain.gain.setValueAtTime(0.9, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(t);
        subOsc.stop(t + 0.5);

        // 2. Heavy White Noise Explosion Wave
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(150, t + 0.4);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.85, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);

        // 3. Crunchy Debris Crackle
        const crackBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
        const crackData = crackBuffer.getChannelData(0);
        for (let i = 0; i < crackData.length; i++) {
            crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
        }
        const crack = this.ctx.createBufferSource();
        crack.buffer = crackBuffer;
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(0.6, t);
        crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        crack.connect(crackGain);
        crackGain.connect(this.sfxGain);
        crack.start(t);
    }

    // --- SFX: Wrong Hit Alias (fixes freeze bug) ---
    playWrongHit() {
        this.playRedExplosion();
    }

    // --- SFX: Hole Stone Crack Sound (Point 4) ---
    playHoleCrack() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Sharp stone snap / fracturing transient
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.07);
    }

    playHumanHit() {
        this.playRedExplosion();
    }

    // --- SFX: Lost Heart Warning Buzz ---
    playHeartLost() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;

        // Double urgent buzz
        [0, 0.11].forEach((delay, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140 - i * 25, t + delay);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, t + delay);

            gain.gain.setValueAtTime(0.35, t + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.09);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + delay);
            osc.stop(t + delay + 0.09);
        });
    }

    // --- SFX: Game Over Fanfare (Sad Descending Chimes) ---
    playGameOver() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const notes = [349.23, 329.63, 311.13, 293.66]; // F4, E4, Eb4, D4

        notes.forEach((freq, idx) => {
            const start = t + idx * 0.2;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.01, start);
            gain.gain.linearRampToValueAtTime(0.4, start + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, start + (idx === 3 ? 0.7 : 0.22));

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + (idx === 3 ? 0.7 : 0.22));
        });
    }

    // --- SFX: Game Restart / Revive Chime ---
    playGameRestart() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        const t = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

        notes.forEach((freq, idx) => {
            const start = t + idx * 0.07;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.01, start);
            gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + 0.18);
        });
    }

    // --- Ambient / Arcade Background Music Synthesizer ---
    startBackgroundMusic() {
        if (this.bgmPlaying || !this.ctx) return;
        this.bgmPlaying = true;
        this.bgmStep = 0;

        // Friendly arcade chord progression in C major pentatonic (C - G - Am - F)
        // Bass notes + arpeggiated bells
        const chords = [
            { bass: 130.81, notes: [261.63, 329.63, 392.00, 523.25] }, // C
            { bass: 98.00,  notes: [196.00, 246.94, 293.66, 392.00] }, // G
            { bass: 110.00, notes: [220.00, 261.63, 329.63, 440.00] }, // Am
            { bass: 87.31,  notes: [174.61, 220.00, 261.63, 349.23] }  // F
        ];

        const stepTime = 0.22; // Seconds per 16th note

        const scheduleNote = () => {
            if (!this.bgmPlaying || !this.ctx) return;
            const t = this.ctx.currentTime;
            const chordIdx = Math.floor(this.bgmStep / 8) % chords.length;
            const subStep = this.bgmStep % 8;
            const chord = chords[chordIdx];

            // Bass note on steps 0 and 4
            if (subStep === 0 || subStep === 4) {
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = 'sine';
                bassOsc.frequency.setValueAtTime(chord.bass, t);
                bassGain.gain.setValueAtTime(0.18, t);
                bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                bassOsc.connect(bassGain);
                bassGain.connect(this.musicGain);
                bassOsc.start(t);
                bassOsc.stop(t + 0.35);
            }

            // Melodic pluck
            const noteIdx = [0, 1, 2, 3, 2, 1, 3, 0][subStep];
            const freq = chord.notes[noteIdx];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.06, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(t);
            osc.stop(t + 0.24);

            this.bgmStep++;
            this.bgmTimer = setTimeout(scheduleNote, stepTime * 1000);
        };

        scheduleNote();
    }

    stopBackgroundMusic() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}
