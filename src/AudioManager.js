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

    // --- SFX: Hammer Swing Whoosh ---
    playHammerSwing() {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        // White noise through an automated bandpass filter
        const bufferSize = this.ctx.sampleRate * 0.12;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 3.0;
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(1400, t + 0.07);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.12);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(t);
        noise.stop(t + 0.12);
    }

    // --- SFX: Heavy Satisfying Hammer Impact / Bonk ---
    playHammerHit(isSpecial = false) {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const pitchMod = 1 + (Math.random() * 0.2 - 0.1);

        // 1. Heavy low-frequency thump (Sine drop)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(160 * pitchMod, t);
        subOsc.frequency.exponentialRampToValueAtTime(42 * pitchMod, t + 0.14);
        subGain.gain.setValueAtTime(0.9, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(t);
        subOsc.stop(t + 0.18);

        // 2. Resonant wooden / cartoon mallet bonk (Triangle sweep)
        const bonkOsc = this.ctx.createOscillator();
        const bonkGain = this.ctx.createGain();
        bonkOsc.type = 'triangle';
        const startFreq = (isSpecial ? 540 : 420) * pitchMod;
        bonkOsc.frequency.setValueAtTime(startFreq, t);
        bonkOsc.frequency.exponentialRampToValueAtTime(120 * pitchMod, t + 0.12);
        bonkGain.gain.setValueAtTime(0.7, t);
        bonkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        bonkOsc.connect(bonkGain);
        bonkGain.connect(this.sfxGain);
        bonkOsc.start(t);
        bonkOsc.stop(t + 0.15);

        // 3. Crunchy transient crack (Click/Noise burst)
        const crackBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
        const crackData = crackBuffer.getChannelData(0);
        for (let i = 0; i < crackData.length; i++) {
            crackData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 150);
        }
        const crackSource = this.ctx.createBufferSource();
        crackSource.buffer = crackBuffer;
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(0.45, t);
        crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        crackSource.connect(crackGain);
        crackGain.connect(this.sfxGain);
        crackSource.start(t);

        // 4. Comical dizzy squeak tone
        this.playMoleBonkSqueak(pitchMod);
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
