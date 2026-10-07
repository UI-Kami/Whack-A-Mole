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
            bgImg: null
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
        } else {
            // Load new clean sprites
            this.assets.yellowCharacter = await loadImg('assets/clean_sprites/yellow_character.png');
            this.assets.redCharacter = await loadImg('assets/clean_sprites/red_character.png');
            this.assets.punchSprite = await loadImg('assets/clean_sprites/punch_hand.png');
            this.assets.slapSprite = await loadImg('assets/clean_sprites/slap_hand.png');
            this.assets.bgImg = await loadImg('assets/BG_NEW/Background_Seamless.jpg');
        }

        if (this.parallaxManager && this.assets.bgImg) {
            this.parallaxManager.bgImg = this.assets.bgImg;
            this.parallaxManager.calculateBounds();
            if (this.moleSpawner) {
                this.moleSpawner.updateHolePositions();
            }
        }
    }

    setupCanvasResolution() {
        const container = this.canvas.parentElement || document.body;
        const rect = container.getBoundingClientRect();
        const screenW = rect.width || window.innerWidth || 1200;
        const screenH = rect.height || window.innerHeight || 800;
        const isPortrait = screenH > screenW;

        if (isPortrait) {
            const baseW = 720;
            const aspect = screenH / screenW;
            this.config.VIEWPORT_WIDTH = baseW;
            this.config.VIEWPORT_HEIGHT = Math.round(baseW * aspect);
            this.config.IS_PORTRAIT = true;
            this.config.PERSPECTIVE_HORIZON_Y = Math.round(this.config.VIEWPORT_HEIGHT * 0.16);
            this.config.HOLE_COLUMNS = 3;
            this.config.HOLE_ROWS = 5;
            this.config.HOLE_BASE_RADIUS_X = 72;
            this.config.HOLE_BASE_RADIUS_Y = 46;
            this.config.HOLE_VERTICAL_SPACING = Math.round((this.config.VIEWPORT_HEIGHT - this.config.PERSPECTIVE_HORIZON_Y) / 4.8);
        } else {
            const baseH = 800;
            const aspect = screenW / screenH;
            this.config.VIEWPORT_HEIGHT = baseH;
            this.config.VIEWPORT_WIDTH = Math.max(1200, Math.round(baseH * aspect));
            this.config.IS_PORTRAIT = false;
            this.config.PERSPECTIVE_HORIZON_Y = 120;
            this.config.HOLE_COLUMNS = 3;
            this.config.HOLE_ROWS = 5;
            this.config.HOLE_BASE_RADIUS_X = 75;
            this.config.HOLE_BASE_RADIUS_Y = 48;
            this.config.HOLE_VERTICAL_SPACING = 185;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

        // Hit Stop Crunch (microfreeze for 35ms)
        this.hitStopRemaining = (this.config.HIT_STOP_MS || 35) / 1000;

        // Mobile Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(result.transformedToRed ? 50 : 25);
        }

        const hitsUntilRed = this.moleSpawner ? this.moleSpawner.getHitsUntilRed() : 4;

        if (result.transformedToRed) {
            // Yellow mole transformed into Red mole!
            this.audioManager.playRedEnrage();
            this.vfxManager.spawnRedEnrageVFX(result.x, result.y, result.depthScale);
            this.cameraShake.addTrauma(0.55, 0, 1);
        } else {
            // Regular hit with insult text popup and combo pitch escalation!
            if (result.hitType === 'punch') {
                this.audioManager.playPunchHit(this.stats.currentStreak);
                this.cameraShake.addTrauma(0.44, 0, 1);
            } else {
                this.audioManager.playSlapHit(this.stats.currentStreak);
                this.cameraShake.addTrauma(0.34, 0, 1);
            }

            this.vfxManager.spawnHitVFX(result.x, result.y, result.depthScale, false, result.hitType, this.stats.currentStreak);

            // Point 4: Crack VFX around hole rim and stone crack SFX
            if (result.hole) {
                this.vfxManager.spawnHoleCrackVFX(result.hole.screenX, result.hole.screenY, result.hole.radiusX, result.hole.radiusY, result.hole);
                this.audioManager.playHoleCrack();
            }
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

    handleWrongHit(result) {
        if (this.isGameOver) return;

        // Deduct 1 heart
        this.health = Math.max(0, this.health - 1);
        this.stats.currentStreak = 0;

        // Hit stop crunch
        this.hitStopRemaining = 0.06;

        // Point 5: Red mole explodes and instantly vanishes into explosion
        if (result.hole && result.hole.mole) {
            result.hole.mole.explode();
        }

        // Play heavy red explosion sound and heart lost warning
        this.audioManager.playRedExplosion();
        this.audioManager.playHeartLost();

        // Heavy camera shake
        this.cameraShake.addTrauma(1.0, 0, 1);

        if (navigator.vibrate) {
            try { navigator.vibrate([70, 40, 70]); } catch (e) {}
        }

        // Point 5: Massive Red character explosion VFX
        this.vfxManager.spawnRedExplosionVFX(result.x, result.y, result.depthScale);

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
            this.moleSpawner.spawnTimer = 0.6;
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

    processHit(hitX, hitY, isTouch = false, attackType = 'punch') {
        if (this.isGameOver) return;

        // Check if any mole was hit at impact time
        const result = this.moleSpawner.checkHit(hitX, hitY, isTouch, true, attackType);

        if (result.hit) {
            if (result.penalty) {
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
        const dt = Math.min(rawDt, 0.1);
        this.lastTime = now;

        if (!this.isGameOver) {
            this.stats.sessionTime += dt;
        }

        // Process Hit-Stop (brief game pause for impact crunch)
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
            this.moleSpawner.update(dt, this.parallaxManager.scrollY_Ground);
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

        // 1. Unified moving arena ground (Background_New.jpg)
        this.parallaxManager.drawGroundPlane(ctx);

        // 2. Ground VFX (shockwaves)
        this.vfxManager.drawGroundLayer(ctx);

        // 3. Holes and Moles (scrolling together with ground)
        this.moleSpawner.draw(ctx);

        // 4. Top VFX (impact flashes, sparks, insult comic pop text)
        this.vfxManager.drawTopLayer(ctx);

        // 5. Player Hand (Punch & Slap animations)
        this.hammer.draw(ctx);

        // 6. Ambient drifting floating dust/spores
        this.vfxManager.drawAmbientForeground(ctx);

        ctx.restore();

        // 7. Full-viewport screen impact flash (illuminates screen on hit crunch)
        this.vfxManager.drawScreenFlash(ctx);
    }

    // Hand mode switch (combo / punch / slap)
    setHandMode(mode) {
        if (this.hammer) {
            this.hammer.setHandMode(mode);
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
