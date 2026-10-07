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

        // Health & Game Over State
        this.maxHealth = this.config.MAX_HEALTH || 3;
        this.health = this.maxHealth;
        this.isGameOver = false;

        // Statistics tracking
        this.stats = {
            totalHits: 0,
            totalMisses: 0,
            currentStreak: 0,
            highestStreak: 0,
            redDodges: 0,
            sessionTime: 0
        };

        // Loaded Assets
        this.assets = {
            yellowCharacter: null,
            redCharacter: null,
            punchSprite: null,
            slapSprite: null,
            bgImg: null,
            holePad: null,
            holeRim: null
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

        // Pass loaded bgImg to parallaxManager
        if (this.assets.bgImg) {
            this.parallaxManager.bgImg = this.assets.bgImg;
        }

        // Initialize Spawner & Hand Controller
        this.moleSpawner = new MoleSpawner(this.config, this.assets, this.audioManager, this.vfxManager, this.parallaxManager);
        this.hammer = new HammerController(this.config, this.assets, this.audioManager, this.cameraShake, this.vfxManager);

        // Initialize Input Manager
        this.inputManager = new InputManager(
            this.canvas,
            (x, y, isTouch) => this.handlePointerMove(x, y, isTouch),
            (x, y, isTouch) => this.handlePointerDown(x, y, isTouch),
            this.config
        );

        // Center hand initially
        this.hammer.setPointer(this.config.VIEWPORT_WIDTH / 2, this.config.VIEWPORT_HEIGHT / 2);

        // Start Loop
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));

        // Unlock WebAudio on first user interaction anywhere
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
            if (!url) return resolve(null);
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });

        if (typeof ASSETS_DATA !== 'undefined' && ASSETS_DATA) {
            this.assets.yellowCharacter = await loadImg(ASSETS_DATA.yellow);
            this.assets.redCharacter = await loadImg(ASSETS_DATA.red);
            this.assets.punchSprite = await loadImg(ASSETS_DATA.punch);
            this.assets.slapSprite = await loadImg(ASSETS_DATA.slap);
            this.assets.bgImg = await loadImg(ASSETS_DATA.bg);
            this.assets.holePad = await loadImg(ASSETS_DATA.hole);
            this.assets.holeRim = await loadImg(ASSETS_DATA.holeRim);
        } else {
            this.assets.yellowCharacter = await loadImg('assets/clean_sprites/yellow_character.png');
            this.assets.redCharacter = await loadImg('assets/clean_sprites/red_character.png');
            this.assets.punchSprite = await loadImg('assets/clean_sprites/punch_hand.png');
            this.assets.slapSprite = await loadImg('assets/clean_sprites/slap_hand.png');
            this.assets.bgImg = await loadImg('assets/BG_NEW/Background_New.jpg');
            this.assets.holePad = await loadImg('assets/clean_sprites/hole_pad.png');
            this.assets.holeRim = await loadImg('assets/clean_sprites/hole_front_rim.png');
        }

        if (this.parallaxManager && this.assets.bgImg) {
            this.parallaxManager.bgImg = this.assets.bgImg;
            this.parallaxManager.calculateBounds();
        }
    }

    setupCanvasResolution() {
        const container = this.canvas.parentElement || document.body;
        const rect = container.getBoundingClientRect();
        const screenW = rect.width || window.innerWidth || 1200;
        const screenH = rect.height || window.innerHeight || 800;
        const isPortrait = screenH > screenW;
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (screenW <= 768);

        if (isPortrait) {
            const baseW = 720;
            const aspect = screenH / screenW;
            this.config.VIEWPORT_WIDTH = baseW;
            this.config.VIEWPORT_HEIGHT = Math.round(baseW * aspect);
            this.config.IS_PORTRAIT = true;
            this.config.HOLE_COLUMNS = 3; // 3 columns in portrait = 9 holes
            this.config.HOLE_ROWS = 3;    // 3 rows
            this.config.PADDING_TOP = 110;
            this.config.PADDING_BOTTOM = 55;
            this.config.PADDING_HORIZONTAL = 50;
        } else {
            const baseH = 800;
            const aspect = screenW / screenH;
            this.config.VIEWPORT_HEIGHT = baseH;
            this.config.VIEWPORT_WIDTH = Math.max(1200, Math.round(baseH * aspect));
            this.config.IS_PORTRAIT = false;
            this.config.HOLE_COLUMNS = 3; // 3 columns in landscape = 9 holes
            this.config.HOLE_ROWS = 3;    // 3 rows
            this.config.PADDING_TOP = 110;
            this.config.PADDING_BOTTOM = 55;
            this.config.PADDING_HORIZONTAL = 75;
        }

        // Mobile performance optimization: clamp DPR to 1.5 on mobile to avoid fillrate lag
        const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
        this.canvas.width = Math.round(this.config.VIEWPORT_WIDTH * dpr);
        this.canvas.height = Math.round(this.config.VIEWPORT_HEIGHT * dpr);
        this.ctx.resetTransform?.();
        this.ctx.scale(dpr, dpr);

        if (this.parallaxManager) {
            this.parallaxManager.resize(this.config);
        }
        if (this.moleSpawner) {
            this.moleSpawner.rebuildGrid(this.config);
        }
    }

    handlePointerMove(x, y, isTouch) {
        if (!isTouch && this.hammer) {
            this.hammer.setPointer(x, y);
        }
    }

    handlePointerDown(x, y, isTouch) {
        if (!this.hammer) return;

        // Trigger Punch / Slap attack
        this.hammer.triggerSwing(x, y, (hitX, hitY, attackType) => {
            this.processHit(hitX, hitY, isTouch, attackType);
        }, isTouch);
    }

    executeHitSuccess(result) {
        // Stats update
        this.stats.totalHits++;
        this.stats.currentStreak++;
        if (this.stats.currentStreak > this.stats.highestStreak) {
            this.stats.highestStreak = this.stats.currentStreak;
        }

        // Snappy hit stop (20ms) without frame hitching
        this.hitStopRemaining = (this.config.HIT_STOP_MS || 20) / 1000;

        // Mobile Haptic Feedback
        if (navigator.vibrate) {
            try { navigator.vibrate(25); } catch (e) {}
        }

        const hitsUntilRed = this.moleSpawner ? this.moleSpawner.getHitsUntilRed() : 4;

        // Regular hit with insult text popup and combo pitch escalation
        if (result.hitType === 'punch') {
            this.audioManager.playPunchHit(this.stats.currentStreak);
            this.cameraShake.addTrauma(0.42, 0, 1);
        } else {
            this.audioManager.playSlapHit(this.stats.currentStreak);
            this.cameraShake.addTrauma(0.32, 0, 1);
        }

        this.vfxManager.spawnHitVFX(result.x, result.y, 1.0, false, result.hitType, this.stats.currentStreak);

        // Crack VFX around hole rim
        if (result.hole) {
            this.vfxManager.spawnHoleCrackVFX(result.hole.screenX, result.hole.screenY, result.hole.radiusX, result.hole.radiusY, result.hole);
            this.audioManager.playHoleCrack();
        }

        window.dispatchEvent(new CustomEvent('molehit', {
            detail: {
                ...result,
                stats: this.stats,
                health: this.health,
                hitsUntilRed: hitsUntilRed,
                handMode: this.hammer?.handMode || 'combo'
            }
        }));
    }

    // Requirement 3: Immediate Red Explosion without needing a second touch!
    handleWrongHit(result) {
        if (this.isGameOver) return;

        // Deduct 1 heart
        this.health = Math.max(0, this.health - 1);
        this.stats.currentStreak = 0;

        // Hit stop crunch
        this.hitStopRemaining = 0.04;

        // Instantly vanish mole on explosion
        if (result.hole && result.hole.mole) {
            result.hole.mole.explode();
        }

        // Heavy red explosion sound
        this.audioManager.playRedExplosion();
        this.audioManager.playHeartLost();

        // Heavy camera trauma shake
        this.cameraShake.addTrauma(1.3, 0, 1);

        if (navigator.vibrate) {
            try { navigator.vibrate([70, 40, 70]); } catch (e) {}
        }

        // Requirement 3: Massive FULL-SCREEN Explosion VFX covering whole screen!
        this.vfxManager.spawnFullScreenExplosionVFX(result.x, result.y);

        const hitsUntilRed = this.moleSpawner ? this.moleSpawner.getHitsUntilRed() : 4;

        window.dispatchEvent(new CustomEvent('playerhurt', {
            detail: {
                health: this.health,
                maxHealth: this.maxHealth,
                stats: this.stats,
                result: result,
                hitsUntilRed: hitsUntilRed
            }
        }));

        if (this.health <= 0) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.audioManager.playGameOver();

        window.dispatchEvent(new CustomEvent('gameover', {
            detail: {
                stats: this.stats
            }
        }));
    }

    restartGame() {
        this.health = this.maxHealth;
        this.isGameOver = false;

        // Reset stats
        this.stats.totalHits = 0;
        this.stats.totalMisses = 0;
        this.stats.currentStreak = 0;
        this.stats.redDodges = 0;
        this.stats.sessionTime = 0;

        // Reset holes & moles
        if (this.moleSpawner) {
            this.moleSpawner.hitCount = 0;
            this.moleSpawner.holes.forEach(h => {
                h.mole.state = 'HIDDEN';
                h.mole.riseProgress = 0;
                h.mole.isHit = false;
                h.mole.type = 'yellow';
            });
            this.moleSpawner.spawnTimer = 0.5;
            this.moleSpawner.gameTime = 0;
        }

        this.audioManager.playGameRestart();

        window.dispatchEvent(new CustomEvent('gamerestart', {
            detail: {
                health: this.health,
                maxHealth: this.maxHealth,
                stats: this.stats,
                hitsUntilRed: this.moleSpawner ? this.moleSpawner.getHitsUntilRed() : 4
            }
        }));
    }

    // Process player strike (punch or slap)
    processHit(hitX, hitY, isTouch = false, attackType = 'punch') {
        if (this.isGameOver) return;

        const result = this.moleSpawner.checkHit(hitX, hitY, isTouch, true, attackType);

        if (result.hit) {
            // Requirement 3: The yellow character that turns red IMMEDIATELY EXPLODES without needing a second touch!
            if (result.penalty || result.transformedToRed) {
                this.handleWrongHit(result);
            } else {
                this.executeHitSuccess(result);
            }
        } else {
            // Missed ground hit
            this.stats.totalMisses++;
            this.stats.currentStreak = 0;
            this.audioManager.playMissThud();
            this.cameraShake.addTrauma(0.12, 0, 1);
            window.dispatchEvent(new CustomEvent('molemiss', {
                detail: {
                    x: hitX,
                    y: hitY,
                    stats: this.stats,
                    hitsUntilRed: this.moleSpawner ? this.moleSpawner.getHitsUntilRed() : 4
                }
            }));
        }
    }

    gameLoop(now) {
        if (!this.isRunning) return;

        const rawDt = (now - this.lastTime) / 1000;
        const dt = Math.min(rawDt, 0.05); // Capped delta time for buttery smooth pacing
        this.lastTime = now;

        if (!this.isGameOver) {
            this.stats.sessionTime += dt;
        }

        // Process Hit-Stop (brief microfreeze without frame drops)
        if (this.hitStopRemaining > 0) {
            this.hitStopRemaining -= dt;
            this.cameraShake.update(dt);
            this.render();
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        // 1. Update Subsystems
        this.cameraShake.update(dt);
        this.parallaxManager.update(dt);
        if (!this.isGameOver) {
            this.moleSpawner.update(dt);
            this.hammer.update(dt);
        }
        this.vfxManager.update(dt);

        // 2. Render Scene
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        const ctx = this.ctx;
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;

        ctx.clearRect(0, 0, w, h);

        ctx.save();
        this.cameraShake.apply(ctx);

        // 1. Clean fullscreen arena ground plane
        this.parallaxManager.drawGroundPlane(ctx);

        // 2. Ground VFX (shockwaves, cracks)
        this.vfxManager.drawGroundLayer(ctx);

        // 3. Holes (with hole pad, emerging mole, front rim, and gripping paws!)
        this.moleSpawner.draw(ctx);

        // 4. Top VFX (impact flashes, sparks)
        this.vfxManager.drawTopLayer(ctx);

        // 5. Player Hand (Punch & Slap animations)
        this.hammer.draw(ctx);

        // 6. REQUIREMENT 4: Floating Insult Text Messages (Idiot, Namoona, Chomu, etc.)
        // ALWAYS DRAWN IN FRONT OF THE HAND!
        this.vfxManager.drawFloatingTexts(ctx);

        // 7. Ambient drifting dust/spores
        this.vfxManager.drawAmbientForeground(ctx);

        ctx.restore();

        // 8. Full-viewport screen impact flash & whole-screen explosion vignette (Requirement 3)
        this.vfxManager.drawScreenFlash(ctx);
    }

    setHandMode(mode) {
        if (this.hammer) {
            this.hammer.setHandMode(mode);
        }
    }

    setGridMode(mode) {
        if (mode === 9 || mode === 12 || mode === 'auto') {
            this.config.GRID_MODE = mode;
            this.setupCanvasResolution();
        }
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
