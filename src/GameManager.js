// src/GameManager.js - Central Game Orchestrator, Loop, Rendering & State Hooks
import { CONFIG } from './Config.js';
import { AudioManager } from './AudioManager.js';
import { CameraShake } from './CameraShake.js';
import { VFXManager } from './VFXManager.js';
import { ParallaxManager } from './ParallaxManager.js';
import { MoleSpawner } from './MoleSpawner.js';
import { HammerController } from './HammerController.js';
import { InputManager } from './InputManager.js';

export class GameManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = { ...CONFIG };

        // Game Loop Timers
        this.lastTime = performance.now();
        this.hitStopRemaining = 0; // Microfreeze timer
        this.isRunning = false;

        // Statistics tracking (Ready for future scoring / leaderboard system)
        this.stats = {
            totalHits: 0,
            totalMisses: 0,
            currentStreak: 0,
            highestStreak: 0,
            goldenHits: 0,
            speedyHits: 0,
            sessionTime: 0
        };

        // Loaded Assets
        this.assets = {
            moleSprite: null,
            hammerSprite: null,
            cheeseBg: null
        };

        // Subsystems
        this.audioManager = new AudioManager(this.config);
        this.cameraShake = new CameraShake(this.config);
        this.vfxManager = new VFXManager(this.config);
        this.parallaxManager = new ParallaxManager(this.config);
        this.moleSpawner = null;
        this.hammer = null;
        this.inputManager = null;

        this.init();
    }

    async init() {
        this.setupCanvasResolution();
        window.addEventListener('resize', () => this.setupCanvasResolution());
        window.addEventListener('orientationchange', () => setTimeout(() => this.setupCanvasResolution(), 120));

        // Load visual sprites
        await this.loadSprites();

        // Initialize Spawner & Hammer
        this.moleSpawner = new MoleSpawner(this.config, this.assets, this.audioManager, this.vfxManager);
        this.hammer = new HammerController(this.config, this.assets, this.audioManager, this.cameraShake, this.vfxManager);

        // Initialize Input Manager
        this.inputManager = new InputManager(
            this.canvas,
            (x, y, isTouch) => this.handlePointerMove(x, y, isTouch),
            (x, y, isTouch) => this.handlePointerDown(x, y, isTouch),
            this.config
        );

        // Center hammer initially
        this.hammer.setPointer(this.config.VIEWPORT_WIDTH / 2, this.config.VIEWPORT_HEIGHT / 2);

        // Start Loop
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));

        // Unlock WebAudio on first user interaction anywhere (fully iOS Safari and Android compatible)
        const unlockAudio = () => {
            this.audioManager.resume();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('touchend', unlockAudio);
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
        window.addEventListener('touchend', unlockAudio);
        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
    }

    async loadSprites() {
        const loadImg = (url) => new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });

        // Load extracted clean assets
        this.assets.moleSprite = await loadImg('assets/mole_clean/sprite_5.png');
        this.assets.hammerSprite = await loadImg('assets/gavel_clean/sprite_0.png');
    }

    setupCanvasResolution() {
        const container = this.canvas.parentElement || document.body;
        const rect = container.getBoundingClientRect();
        const screenW = rect.width || window.innerWidth || 1200;
        const screenH = rect.height || window.innerHeight || 800;
        const isPortrait = screenH > screenW;

        if (isPortrait) {
            // Mobile Portrait mode: width 720, height dynamically scales to exact phone screen aspect ratio
            const baseW = 720;
            const aspect = screenH / screenW;
            this.config.VIEWPORT_WIDTH = baseW;
            this.config.VIEWPORT_HEIGHT = Math.round(baseW * aspect);
            this.config.IS_PORTRAIT = true;
            this.config.PERSPECTIVE_HORIZON_Y = Math.round(this.config.VIEWPORT_HEIGHT * 0.22);
            this.config.HOLE_COLUMNS = 3;
            this.config.HOLE_ROWS = 6;
            this.config.HOLE_BASE_RADIUS_X = 66;
            this.config.HOLE_BASE_RADIUS_Y = 36;
            this.config.HOLE_VERTICAL_SPACING = Math.round((this.config.VIEWPORT_HEIGHT - this.config.PERSPECTIVE_HORIZON_Y) / 5.4);
        } else {
            // Landscape mode (Desktop or rotated tablet/mobile)
            const baseH = 800;
            const aspect = screenW / screenH;
            this.config.VIEWPORT_HEIGHT = baseH;
            this.config.VIEWPORT_WIDTH = Math.max(1200, Math.round(baseH * aspect));
            this.config.IS_PORTRAIT = false;
            this.config.PERSPECTIVE_HORIZON_Y = 180;
            this.config.HOLE_COLUMNS = 4;
            this.config.HOLE_ROWS = 5;
            this.config.HOLE_BASE_RADIUS_X = 62;
            this.config.HOLE_BASE_RADIUS_Y = 34;
            this.config.HOLE_VERTICAL_SPACING = 155;
        }

        // High-DPI Retina support while maintaining virtual coordinate space
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(this.config.VIEWPORT_WIDTH * dpr);
        this.canvas.height = Math.round(this.config.VIEWPORT_HEIGHT * dpr);
        this.ctx.resetTransform?.();
        this.ctx.scale(dpr, dpr);

        if (this.moleSpawner) {
            this.moleSpawner.rebuildGrid(this.config);
        }
        if (this.parallaxManager) {
            this.parallaxManager.resize(this.config);
        }
        if (this.inputManager) {
            this.inputManager.updateDimensions(this.config.VIEWPORT_WIDTH, this.config.VIEWPORT_HEIGHT);
        }
    }

    handlePointerMove(x, y, isTouch = false) {
        if (this.hammer) {
            this.hammer.setPointer(x, y);
        }
    }

    handlePointerDown(x, y, isTouch = false) {
        if (!this.hammer) return;
        this.audioManager.resume();

        // Immediately update hammer pointer target so anticipation centers at touch
        this.hammer.setPointer(x, y);

        // Pre-check candidate hit at the exact instant of tap
        const instantCandidate = this.moleSpawner.checkHit(x, y, isTouch, false);

        // Trigger fast hammer swing
        this.hammer.triggerSwing(x, y, (hitX, hitY) => {
            if (instantCandidate && instantCandidate.hit && !instantCandidate.mole.isHit && instantCandidate.mole.state !== 'HIDDEN') {
                const hitSuccess = instantCandidate.mole.onHit();
                if (hitSuccess) {
                    this.executeHitSuccess(instantCandidate);
                    return;
                }
            }
            this.processHit(hitX, hitY, isTouch);
        }, isTouch);
    }

    executeHitSuccess(result) {
        // Stats update
        this.stats.totalHits++;
        this.stats.currentStreak++;
        if (this.stats.currentStreak > this.stats.highestStreak) {
            this.stats.highestStreak = this.stats.currentStreak;
        }
        if (result.mole.type === 'golden') this.stats.goldenHits++;
        if (result.mole.type === 'speedy') this.stats.speedyHits++;

        // Hit Stop Crunch (microfreeze for 35ms)
        this.hitStopRemaining = this.config.HIT_STOP_MS / 1000;

        // Audio & Camera Shake
        this.audioManager.playHammerHit(result.isSpecial);
        this.cameraShake.addTrauma(result.isSpecial ? 0.85 : 0.58, 0, 1);

        // Mobile Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(result.isSpecial ? 40 : 22);
        }

        // VFX Explosion
        this.vfxManager.spawnHitVFX(result.x, result.y, result.depthScale, result.isSpecial);

        // Dispatch custom event for external hooks
        window.dispatchEvent(new CustomEvent('molehit', { detail: { ...result, stats: this.stats } }));
    }

    processHit(hitX, hitY, isTouch = false) {
        // Check if any mole was hit at impact time
        const result = this.moleSpawner.checkHit(hitX, hitY, isTouch, true);

        if (result.hit) {
            this.executeHitSuccess(result);
        } else {
            // Missed ground hit
            this.stats.totalMisses++;
            this.stats.currentStreak = 0;
            this.cameraShake.addTrauma(0.18, 0, 1);
            window.dispatchEvent(new CustomEvent('molemiss', { detail: { x: hitX, y: hitY, stats: this.stats } }));
        }
    }

    gameLoop(now) {
        if (!this.isRunning) return;

        // Delta time calculation with 0.1s cap
        const rawDt = (now - this.lastTime) / 1000;
        const dt = Math.min(rawDt, 0.1);
        this.lastTime = now;

        this.stats.sessionTime += dt;

        // Process Hit-Stop (brief game pause for impact crunch)
        if (this.hitStopRemaining > 0) {
            this.hitStopRemaining -= dt;
            // Still update camera shake during hitstop for crunch feel
            this.cameraShake.update(dt);
            this.render();
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        // 1. Update Subsystems
        this.cameraShake.update(dt);
        this.parallaxManager.update(dt);
        this.moleSpawner.update(dt, this.parallaxManager.scrollY_Ground);
        this.hammer.update(dt);
        this.vfxManager.update(dt);

        // 2. Render Scene
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        const ctx = this.ctx;
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const theme = this.parallaxManager.theme;

        ctx.clearRect(0, 0, w, h);

        // --- CAMERA SHAKE CONTAINER BEGIN ---
        ctx.save();
        this.cameraShake.apply(ctx);

        // 1. Sky & Distant Mountains
        this.parallaxManager.drawSkyLayer(ctx);

        // 2. Midground Rolling Hills & Trees
        this.parallaxManager.drawMidgroundLayer(ctx);

        // 3. 2.5D Ground Plane
        this.parallaxManager.drawGroundPlane(ctx);

        // 4. Ground VFX (expanding shockwaves)
        this.vfxManager.drawGroundLayer(ctx);

        // 5. Holes and Moles (sorted in depth order back-to-front)
        this.moleSpawner.draw(ctx, theme);

        // 6. Top VFX (impact flashes, sparks, dirt chunks, comic pop text)
        this.vfxManager.drawTopLayer(ctx);

        // 7. Player Hammer Mallet & Motion Trails
        this.hammer.draw(ctx);

        // --- CAMERA SHAKE CONTAINER END ---
        ctx.restore();

        // 8. Foreground drifting spores / ambient particles
        this.vfxManager.drawAmbientForeground(ctx);

        // 9. Foreground Corner Grass & Leaves
        this.parallaxManager.drawForegroundLayer(ctx);
    }

    // Public API controls
    setTheme(themeName) {
        this.parallaxManager.setTheme(themeName);
    }

    toggleAudio() {
        const next = !this.audioManager.isMuted;
        this.audioManager.setMuted(next);
        return !next;
    }

    toggleMusic() {
        const next = !this.audioManager.isMusicMuted;
        this.audioManager.setMusicMuted(next);
        return !next;
    }
}
