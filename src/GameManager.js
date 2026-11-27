// src/GameManager.js - Central Game Orchestrator, Two-Phase 90s Timeline, Bomb Sequence & UI
import { CONFIG, computePacingCurve } from './Config.js';
import { buildFrontThrowSpriteAssets } from './MissThrowSprites.js';
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

        // 90-Second Timeline Clock
        this.totalDuration = this.config.TOTAL_DURATION || 90.0;
        this.gameTimeRemaining = this.totalDuration;
        this.lastTime = performance.now();
        this.isStarted = false;
        this.isRunning = true;
        this.isPaused = false;

        // Gameplay Metrics
        this.normalHits = 0;          // Progress toward 50 normal hits (WIN_HITS)
        this.targetHits = this.config.TARGET_NORMAL_HITS || 50;
        this.bombHits = 0;            // Total bomb hits during round
        this.bombHitsInCycle = 0;     // 0 = full, 1 = half heart, 2 = empty -> cooldown -> reset 0
        this.heartCrackLevel = 0;     // Mirrors bombHitsInCycle: 0 = full, 1 = half, 2 = empty
        this.speedFactor = 1.9;
        this.speedPercent = 0;        // 0 to 100% for Speed bar

        // End Game & Cool-Down States
        this.isGameOver = false;
        this.isWin = false;
        this.isLose = false;
        this.isCoolingDown = false;
        this.cooldownTimer = 0;
        this.cooldownAutoTime = this.config.COOLDOWN_AUTO_DURATION || 3.0;
        this.lastReflectionIndex = -1;
        this.factIndex = 0;

        // Assets Container (Cleanly separated playfield background + standalone hole assets)
        this.assets = {
            yellowCharacter: null,
            redCharacter: null,
            yellow_peek: null,
            yellow_push: null,
            yellow_idle: null,
            yellow_retract: null,
            yellow_hit: null,
            red_peek: null,
            red_push: null,
            red_idle: null,
            red_sink: null,
            punchSprite: null,
            slapSprite: null,
            speechBubble: null,
            blast1: null,
            blast2: null,
            mysteryClosed: null,
            mysteryOpen: null,
            btnPlay: null,
            btnStop: null,
            btnPause: null,
            btnSound: null,
            heartClean: null,
            heartCrack1: null,
            heartCrack2: null,
            bgImg: null,
            holeLimeImg: null,
            holePinkImg: null
        };

        // Subsystems
        this.audioManager = new AudioManager(this.config);
        this.cameraShake = new CameraShake(this.config);
        this.vfxManager = new VFXManager(this.config);
        this.parallaxManager = new ParallaxManager(this.config);
        this.moleSpawner = null;
        this.hammer = null;
        this.inputManager = null;

        // Cinematic Slow-Motion System for Bomb Explosions
        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.slowMoDuration = 0;
        this.pendingCoolDown = false;
        this.pendingCoolDownTimer = 0;
        this.pendingCoolDownDeadline = 0;
        this.pendingCoolDownHole = null;
        this.redFrameRenderedCount = 0;
        this.pendingEndType = null;
        this.pendingEndTimer = 0;

        this.init();
    }

    async init() {
        this.setupCanvasResolution();
        window.addEventListener('resize', () => this.setupCanvasResolution());
        window.addEventListener('orientationchange', () => setTimeout(() => this.setupCanvasResolution(), 120));

        await this.loadSprites();

        if (this.parallaxManager) {
            this.parallaxManager.setAssets(this.assets.bgImg, this.assets.holeLimeImg, this.assets.holePinkImg);
        }
        this.vfxManager.setAssets(this.assets);

        this.moleSpawner = new MoleSpawner(this.config, this.assets, this.audioManager, this.vfxManager, this.parallaxManager);
        this.moleSpawner.onMissThrow = (hole) => this.handleMissSplash(hole);
        this.hammer = new HammerController(this.config, this.assets, this.audioManager, this.cameraShake, this.vfxManager);

        this.inputManager = new InputManager(
            this.canvas,
            (x, y, isTouch) => this.handlePointerMove(x, y, isTouch),
            (x, y, isTouch) => this.handlePointerDown(x, y, isTouch),
            this.config
        );

        this.hammer.setPointer(this.config.VIEWPORT_WIDTH / 2, this.config.VIEWPORT_HEIGHT / 2);

        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));

        // Unlock audio on interaction
        const unlock = () => {
            this.audioManager.resume();
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('click', unlock);
        };
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('touchstart', unlock);
        window.addEventListener('click', unlock);
    }

    async loadSprites() {
        const loadImg = (url) => new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });

        if (typeof ASSETS_DATA !== 'undefined' && ASSETS_DATA) {
            this.assets.yellow_peek    = await loadImg(ASSETS_DATA.yellow_peek);
            this.assets.yellow_push    = await loadImg(ASSETS_DATA.yellow_push || ASSETS_DATA.yellow_idle);
            this.assets.yellow_idle    = await loadImg(ASSETS_DATA.yellow_idle);
            this.assets.yellow_retract = await loadImg(ASSETS_DATA.yellow_retract || ASSETS_DATA.yellow_hit);
            this.assets.yellow_hit     = await loadImg(ASSETS_DATA.yellow_hit);
            this.assets.yellow         = await loadImg(ASSETS_DATA.yellow);

            this.assets.red_peek    = await loadImg(ASSETS_DATA.red_peek);
            this.assets.red_push    = await loadImg(ASSETS_DATA.red_push);
            this.assets.red_idle    = await loadImg(ASSETS_DATA.red_idle);
            this.assets.red_sink    = await loadImg(ASSETS_DATA.red_sink);
            this.assets.red         = await loadImg(ASSETS_DATA.red);

            this.assets.punchSprite = await loadImg(ASSETS_DATA.punch);
            this.assets.slapSprite  = await loadImg(ASSETS_DATA.slap);
            this.assets.speechBubble= await loadImg(ASSETS_DATA.speechBubble);
            this.assets.blast1      = await loadImg(ASSETS_DATA.blast1);
            this.assets.blast2      = await loadImg(ASSETS_DATA.blast2);

            this.assets.mysteryClosed = await loadImg(ASSETS_DATA.mysteryClosed);
            this.assets.mysteryOpen   = await loadImg(ASSETS_DATA.mysteryOpen);

            this.assets.heartClean  = await loadImg(ASSETS_DATA.heartClean);
            this.assets.heartCrack1 = await loadImg(ASSETS_DATA.heartCrack1);
            this.assets.heartCrack2 = await loadImg(ASSETS_DATA.heartCrack2);

            this.assets.bgImg       = await loadImg(ASSETS_DATA.playfieldBg || ASSETS_DATA.bg);
            this.assets.holeLimeImg = await loadImg(ASSETS_DATA.holeLime || ASSETS_DATA.holeRing);
            this.assets.holePinkImg = await loadImg(ASSETS_DATA.holePink || ASSETS_DATA.holeRing);

            for (let f = 1; f <= 8; f++) {
                this.assets[`splashFrame${f}`] = ASSETS_DATA[`splashFrame${f}`] ? await loadImg(ASSETS_DATA[`splashFrame${f}`]) : null;
            }
            this.assets.splashBurst = ASSETS_DATA.splashBurst ? await loadImg(ASSETS_DATA.splashBurst) : this.assets.splashFrame7;
            this.assets.splashSplat = ASSETS_DATA.splashSplat ? await loadImg(ASSETS_DATA.splashSplat) : this.assets.splashFrame8;
            this.assets.splashBall  = ASSETS_DATA.splashBall  ? await loadImg(ASSETS_DATA.splashBall)  : this.assets.splashSplat;
        } else {
            // Direct file fallbacks
            this.assets.yellow_peek    = await loadImg('assets/normalized/lime_peek.png');
            this.assets.yellow_push    = await loadImg('assets/normalized/lime_hit.png');
            this.assets.yellow_idle    = await loadImg('assets/normalized/lime_hit.png');
            this.assets.yellow_retract = await loadImg('assets/normalized/lime_idle.png');
            this.assets.yellow_hit     = await loadImg('assets/normalized/lime_idle.png');
            this.assets.yellow         = await loadImg('assets/normalized/lime_hit.png');

            this.assets.red_peek    = await loadImg('assets/normalized/red_peek.png');
            this.assets.red_push    = await loadImg('assets/normalized/red_push.png');
            this.assets.red_idle    = await loadImg('assets/normalized/red_idle.png');
            this.assets.red_sink    = await loadImg('assets/normalized/red_sink.png');
            this.assets.red         = await loadImg('assets/normalized/red_idle.png');

            this.assets.punchSprite = await loadImg('assets/normalized/punch_hand.png');
            this.assets.slapSprite  = await loadImg('assets/normalized/slap_hand.png');
            this.assets.speechBubble= await loadImg('assets/normalized/speech_bubble.png');
            this.assets.blast1      = await loadImg('assets/normalized/blast_1.png');
            this.assets.blast2      = await loadImg('assets/normalized/blast_2.png');

            this.assets.mysteryClosed = await loadImg('assets/normalized/mystery_box_closed.png');
            this.assets.mysteryOpen   = await loadImg('assets/normalized/mystery_box_open.png');

            this.assets.heartClean  = await loadImg('assets/normalized/heart_clean.png');
            this.assets.heartCrack1 = await loadImg('assets/normalized/heart_cracked_light.png');
            this.assets.heartCrack2 = await loadImg('assets/normalized/heart_cracked_heavy.png');

            this.assets.bgImg       = await loadImg('assets/normalized/bg_field_1080.png');
            this.assets.holeLimeImg = await loadImg('assets/normalized/hole_lime.png');
            this.assets.holePinkImg = await loadImg('assets/normalized/hole_pink.png');

            for (let f = 1; f <= 8; f++) {
                this.assets[`splashFrame${f}`] = await loadImg(`assets/normalized/ui/splash_frame_${f}.png`);
            }
            this.assets.splashBurst = await loadImg('assets/normalized/ui/splash_burst.png');
            this.assets.splashSplat = await loadImg('assets/normalized/ui/splash_splat.png');
            this.assets.splashBall  = await loadImg('assets/normalized/ui/splash_ball.png');
        }

        // Generate 4 cohesive 2D front-facing throw sprite frames + matching 2D ball onto offscreen canvases at startup
        if (typeof buildFrontThrowSpriteAssets === 'function') {
            const generated = buildFrontThrowSpriteAssets();
            if (generated) {
                if (typeof ASSETS_DATA !== 'undefined' && ASSETS_DATA) {
                    ASSETS_DATA.missThrow1 = generated.missThrow1;
                    ASSETS_DATA.missThrow2 = generated.missThrow2;
                    ASSETS_DATA.missThrow3 = generated.missThrow3;
                    ASSETS_DATA.missThrow4 = generated.missThrow4;
                    ASSETS_DATA.missBall   = generated.missBall;
                }
                this.assets.missThrow1 = await loadImg(generated.missThrow1);
                this.assets.missThrow2 = await loadImg(generated.missThrow2);
                this.assets.missThrow3 = await loadImg(generated.missThrow3);
                this.assets.missThrow4 = await loadImg(generated.missThrow4);
                this.assets.missBall   = await loadImg(generated.missBall);
            }
        }

        if (this.parallaxManager) {
            this.parallaxManager.setAssets(this.assets.bgImg, this.assets.holeLimeImg, this.assets.holePinkImg);
            if (this.moleSpawner) {
                this.moleSpawner.updateHolePositions();
            }
        }
    }

    setupCanvasResolution() {
        const container = this.canvas.parentElement || document.body;
        const rect = container.getBoundingClientRect();
        const screenW = rect.width || window.innerWidth || 1080;
        const screenH = rect.height || window.innerHeight || 1920;

        // Portrait Kiosk Standard (1080 x 1920, 9:16)
        this.config.VIEWPORT_WIDTH = 1080;
        this.config.VIEWPORT_HEIGHT = 1920;
        this.config.IS_PORTRAIT = true;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(this.config.VIEWPORT_WIDTH * dpr);
        this.canvas.height = Math.round(this.config.VIEWPORT_HEIGHT * dpr);
        this.ctx.resetTransform?.();
        this.ctx.scale(dpr, dpr);

        if (this.inputManager) {
            this.inputManager.updateDimensions(this.config.VIEWPORT_WIDTH, this.config.VIEWPORT_HEIGHT);
        }
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

    startSlowMotion(duration = 1.2, scale = 0.22) {
        this.slowMoTimer = duration;
        this.slowMoDuration = duration;
        this.timeScale = scale;
    }

    handlePointerDown(x, y, isTouch) {
        if (!this.hammer || this.isGameOver || this.isPaused || !this.isStarted || this.isCoolingDown || this.pendingCoolDown || this.slowMoTimer > 0) return;

        // Play visual slap/punch hand sweep while resolving hit check on the exact tap frame
        // so attentive players can catch mid-throw characters before Frame 4 releases the ball
        this.hammer.triggerSwing(x, y, null, isTouch);
        this.processHit(x, y, isTouch, this.hammer.currentAttack);
    }

    processHit(x, y, isTouch, attackType) {
        if (!this.moleSpawner || this.isCoolingDown || this.pendingCoolDown || this.slowMoTimer > 0 || this.pendingEndType || this.isGameOver) return null;
        const result = this.moleSpawner.checkHit(x, y, this.config.HAND_HIT_RADIUS, attackType);

        if (result && result.success) {
            if (result.isBomb) {
                // Bomb hit sequence!
                this.handleBombHit(result);
            } else {
                // Normal laughing mouth hit
                this.handleNormalHit(result);
            }
        }
        return result;
    }

    handleNormalHit(result) {
        this.normalHits++;

        // Haptic feedback
        if (navigator.vibrate) {
            try { navigator.vibrate(20); } catch (e) {}
        }

        // Whack audio & VFX
        if (result.hitType === 'slap') {
            this.audioManager.playSlapHit();
        } else {
            this.audioManager.playPunchHit();
        }
        this.vfxManager.spawnHitVFX(result.x, result.y, result.hitType);

        // Update UI
        this.dispatchUIEvent('normalhit', {
            normalHits: this.normalHits,
            targetHits: this.targetHits,
            progress: Math.min(1.0, this.normalHits / this.targetHits)
        });

        // Check Win Condition (50 normal hits before 0:00 -> brief 0.28s beat before opening end modal)
        if (this.normalHits >= this.targetHits && !this.isGameOver && !this.pendingEndType) {
            this.pendingCoolDown = false;
            this.pendingCoolDownTimer = 0;
            this.pendingEndType = 'win';
            this.pendingEndTimer = 0.28;
        }
    }

    handleMissSplash(hole) {
        if (this.isGameOver || this.pendingEndType || !this.isStarted) return;
        // Release cleanly from character's front throwing hand position over hole rim
        const startX = hole ? (hole.screenX - hole.radiusX * 0.56) : (this.config.VIEWPORT_WIDTH * 0.5);
        const startY = hole ? (hole.screenY - hole.radiusY * 0.45) : (this.config.VIEWPORT_HEIGHT * 0.45);
        if (this.vfxManager && this.vfxManager.spawnMissBallProjectile) {
            this.vfxManager.spawnMissBallProjectile(startX, startY, (impactX, impactY) => {
                if (this.isGameOver || this.pendingEndType || !this.isStarted) return;
                this.dispatchUIEvent('misssplash', {
                    x: impactX,
                    y: impactY,
                    holeId: hole ? hole.id : -1
                });
            });
        } else {
            this.dispatchUIEvent('misssplash', {
                x: this.config.VIEWPORT_WIDTH * 0.5,
                y: this.config.VIEWPORT_HEIGHT * 0.48,
                holeId: hole ? hole.id : -1
            });
        }
    }

    /**
     * Persistent rotation index helper backed by localStorage (cycles 0 -> len-1 -> 0 across hits/sessions)
     */
    getNextRotationIndex(storageKey, length) {
        if (!length || length <= 0) return 0;
        let idx = 0;
        try {
            const raw = parseInt(localStorage.getItem(storageKey) || '0', 10);
            idx = Number.isFinite(raw) ? ((raw % length) + length) % length : 0;
            localStorage.setItem(storageKey, String((idx + 1) % length));
        } catch (e) {
            idx = (this.factIndex++) % length;
        }
        return idx;
    }

    handleBombHit(result) {
        this.bombHits++;

        // Local Hole Explosion Sprites/Sparks, Audio & Red Hurt Flash (no full-screen shake!)
        this.vfxManager.spawnBombExplosionSequence(result.x, result.y);
        this.audioManager.playRedExplosion();
        if (navigator.vibrate) {
            try { navigator.vibrate([80, 40, 80]); } catch (e) {}
        }

        const safeCutoff = (this.totalDuration || 90.0) - (this.config.SAFE_PHASE_DURATION ?? 12.0); // > 78s = first 12s safe phase
        const isSafePhase = this.gameTimeRemaining > safeCutoff;

        // Safe Phase (first 12s, timeRemaining > 78): warning explosion & red retreat only!
        // Heart stays full (bombHitsInCycle = 0), no cooldown modal, and no time penalty.
        if (isSafePhase) {
            this.dispatchUIEvent('bombhit', {
                bombHits: this.bombHits,
                bombHitsInCycle: this.bombHitsInCycle,
                heartCrackLevel: this.heartCrackLevel,
                safePhase: true,
                suppressFlash: false,
                timeRemaining: this.gameTimeRemaining
            });
            return;
        }

        // Active Phase (timeRemaining <= 78): 2-Hit Heart Cycle (Full -> Half -> Empty -> Cooldown)
        this.bombHitsInCycle = Math.min(2, this.bombHitsInCycle + 1);
        this.heartCrackLevel = this.bombHitsInCycle;

        this.dispatchUIEvent('bombhit', {
            bombHits: this.bombHits,
            bombHitsInCycle: this.bombHitsInCycle,
            heartCrackLevel: this.heartCrackLevel,
            safePhase: false,
            suppressFlash: false,
            timeRemaining: this.gameTimeRemaining
        });

        // On 2nd bomb hit in cycle (heart drops to 0), transform to furious red & paint on canvas FIRST,
        // then wait 0.32s (0.28s-0.35s) + >=2 painted frames before opening #cooldown-modal!
        if (this.bombHitsInCycle >= 2) {
            if (result && result.hole && result.hole.mole) {
                result.hole.mole.triggered = true;
                result.hole.mole.transformedRed = true;
                result.hole.mole.exploding = true;
                if (result.hole.mole.state !== 'TRANSFORMING_RED') {
                    result.hole.mole.state = 'TRANSFORMING_RED';
                    result.hole.mole.detonationTimer = Math.max(0.42, this.config.MOLE_RED_EXPLODE_TIME || 0.42);
                }
            }
            const openDelaySec = Math.max(0.28, this.config.COOLDOWN_OPEN_DELAY || 0.32);
            this.cooldownActive = false;
            this.pendingCoolDown = true;
            this.pendingCoolDownTimer = openDelaySec;
            this.pendingCoolDownDeadline = performance.now() + Math.round(openDelaySec * 1000);
            this.pendingCoolDownHole = (result && result.hole) ? result.hole : null;
            this.redFrameRenderedCount = 0;
            this.slowMoTimer = 0;
            this.timeScale = 1.0;
            this.render();
        }
    }

    get cooldownActive() {
        return this.isCoolingDown;
    }

    set cooldownActive(value) {
        this.isCoolingDown = !!value;
    }

    triggerCoolDown() {
        this.cooldownActive = true;
        this.cooldownTimer = this.config.COOLDOWN_AUTO_DURATION || 3.0;

        // 1 Rotating English Reflection & Fact per cooldown (persists across sessions via localStorage)
        const reflections = this.config.REFLECTIONS || [];
        const facts = this.config.FACTS || [];
        const idx = this.getNextRotationIndex('mazaaq_cooldown_idx', reflections.length);
        const reflectionLine = reflections[idx] || '';
        const factLine = facts.length ? facts[idx % facts.length] : '';

        this.audioManager.playCoolDownStart();

        this.dispatchUIEvent('cooldownshow', {
            reflection: reflectionLine,
            fact: factLine,
            duration: this.cooldownTimer,
            rotationIndex: idx
        });
    }

    // Complete 3.0s cooldown -> deduct -3s, restore heart to Full Health (bombHitsInCycle = 0),
    // trigger Lose if <= 0:00, else resume timer and gameplay
    finishFullCoolDown() {
        if (!this.isCoolingDown) return;
        this.cooldownActive = false;
        this.cooldownTimer = 0;

        const penalty = this.config.COOLDOWN_PENALTY_FULL || 3.0;
        this.gameTimeRemaining = Math.max(0, this.gameTimeRemaining - penalty);

        // Immediately sync #hud-timer-val and pulse -3s badge
        this.dispatchUIEvent('timertick', {
            timeRemaining: this.gameTimeRemaining,
            elapsed: Math.max(0, this.totalDuration - this.gameTimeRemaining),
            speedPercent: this.speedPercent,
            speedFactor: this.speedFactor
        });
        this.showTimerPenaltyFeedback(`-${Math.round(penalty)}s`);

        // Reset 2-hit cycle & restore #hud-heart-img back to Full Health (without red hurt flash)
        this.bombHitsInCycle = 0;
        this.heartCrackLevel = 0;
        this.dispatchUIEvent('bombhit', {
            bombHits: this.bombHits,
            bombHitsInCycle: 0,
            heartCrackLevel: 0,
            suppressFlash: true,
            timeRemaining: this.gameTimeRemaining
        });

        this.dispatchUIEvent('cooldownhide', {});

        // If -3s brought the clock to 0:00, immediately trigger the 3-stage Lose sequence
        if (this.gameTimeRemaining <= 0) {
            this.gameTimeRemaining = 0;
            this.pendingCoolDown = false;
            this.pendingCoolDownTimer = 0;
            this.triggerLoseSequence();
        }
    }

    showTimerPenaltyFeedback(text) {
        this.dispatchUIEvent('timerpenalty', { text: text });
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        this.dispatchUIEvent('pausechange', { isPaused: this.isPaused });
    }

    toggleAudio() {
        return this.audioManager.toggleMaster();
    }

    startGame() {
        this.isStarted = true;
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.isWin = false;
        this.isLose = false;
        this.gameTimeRemaining = this.totalDuration;
        this.lastTime = performance.now();
        this.normalHits = 0;
        this.bombHits = 0;
        this.bombHitsInCycle = 0;
        this.heartCrackLevel = 0;
        this.speedFactor = 1.9;
        this.speedPercent = 0;

        // Reset slow-motion state
        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.slowMoDuration = 0;
        this.pendingCoolDown = false;
        this.pendingCoolDownTimer = 0;
        this.pendingCoolDownDeadline = 0;
        this.pendingCoolDownHole = null;
        this.redFrameRenderedCount = 0;
        this.pendingEndType = null;
        this.pendingEndTimer = 0;

        if (this.moleSpawner) {
            this.moleSpawner.reset();
        }
        if (this.audioManager) {
            this.audioManager.resume();
            this.audioManager.playGameStart();
        }

        this.dispatchUIEvent('gamestart', {
            targetHits: this.targetHits,
            totalDuration: this.totalDuration
        });
    }

    gameLoop(now) {
        if (!this.isRunning) return;

        // Real-time unpaused delta for 3.0s cooldown auto-dismiss, rawDt capped for active gameplay,
        // and clamped animation dt <= 0.05s for smooth sprite interpolation.
        const wallDt = Math.max(0, (now - this.lastTime) / 1000);
        const rawDt = Math.min(wallDt, 0.5);
        const dt = Math.min(rawDt, 0.05);
        this.lastTime = now;

        if (this.isStarted && !this.isPaused && !this.isGameOver) {
            if (this.pendingEndType) {
                // Brief 0.28s intentional beat so final hit VFX & 0:00 clock register before end modal opens
                this.parallaxManager.update(dt);
                this.moleSpawner.update(dt, Math.max(0, this.totalDuration - this.gameTimeRemaining), this.normalHits);
                this.hammer.update(dt);
                this.vfxManager.update(dt);

                this.pendingEndTimer -= rawDt;
                if (this.pendingEndTimer <= 0) {
                    const endType = this.pendingEndType;
                    this.pendingEndType = null;
                    this.pendingEndTimer = 0;
                    if (endType === 'win') this.triggerWinSequence();
                    else if (endType === 'lose') this.triggerLoseSequence();
                }

                this.dispatchUIEvent('timertick', {
                    timeRemaining: Math.max(0, this.gameTimeRemaining),
                    elapsed: Math.max(0, this.totalDuration - this.gameTimeRemaining),
                    speedPercent: this.speedPercent,
                    speedFactor: this.speedFactor
                });
                this.render();
                requestAnimationFrame((t) => this.gameLoop(t));
                return;
            }

            // Pause ONLY the main 1:30 countdown clock while bomb cooldown is pending or open;
            // playfield scrolling, mole animations/spawns, and red sink continue running live behind cooldown!
            if (!this.isCoolingDown && !this.pendingCoolDown) {
                this.gameTimeRemaining -= rawDt;
            }

            const totalDur = this.totalDuration || 90.0;
            const elapsed = Math.min(90.0, Math.max(0.0, totalDur - Math.max(0, this.gameTimeRemaining)));
            const curve = computePacingCurve(elapsed, this.normalHits);

            // Continuous Piano Tiles intensity scroll & pacing curve (1.9x -> 3.8x -> 6.5x)
            this.speedFactor = curve.scrollMultiplier;
            this.speedPercent = Math.min(100, Math.max(0, Math.round(curve.intensity * 100)));

            if (this.moleSpawner) {
                this.moleSpawner.setSpeedFactor(this.speedFactor);
                this.moleSpawner.setNormalHits(this.normalHits);
                this.moleSpawner.setPacingCurve(curve);
            }
            if (this.parallaxManager) {
                this.parallaxManager.setSpeedMultiplier(curve.scrollMultiplier);
            }

            // Update Cinematic Slow-Motion
            let simDt = dt;
            if (this.slowMoTimer > 0) {
                this.slowMoTimer -= dt;
                if (this.slowMoTimer <= 0) {
                    this.slowMoTimer = 0;
                    this.timeScale = 1.0;
                } else {
                    const remainingRatio = this.slowMoTimer / (this.slowMoDuration || 1.0);
                    if (remainingRatio < 0.30) {
                        const t = (0.30 - remainingRatio) / 0.30;
                        this.timeScale = 0.25 + t * 0.75;
                    }
                }
                simDt = dt * this.timeScale;
            }

            // Pending cool-down transition: wait BOTH >= 0.32s wall-clock AND >= 2 rendered red frames so cooldown NEVER opens over green!
            if (this.pendingCoolDown) {
                this.pendingCoolDownTimer -= wallDt;
                const deadlineMet = !this.pendingCoolDownDeadline || (performance.now() >= this.pendingCoolDownDeadline);
                const holeMole = this.pendingCoolDownHole && this.pendingCoolDownHole.mole;
                const redReady = !holeMole || holeMole.transformedRed || holeMole.exploding || holeMole.state === 'HIDDEN';
                if (deadlineMet && this.pendingCoolDownTimer <= 0 && this.redFrameRenderedCount >= 2 && redReady) {
                    this.pendingCoolDown = false;
                    this.pendingCoolDownTimer = 0;
                    this.pendingCoolDownDeadline = 0;
                    this.pendingCoolDownHole = null;
                    this.triggerCoolDown();
                }
            }

            // Independent real-time 3.0s countdown for #cooldown-modal auto-close while main clock is paused
            if (this.isCoolingDown) {
                this.cooldownTimer -= wallDt;
                if (this.cooldownTimer <= 0) {
                    this.finishFullCoolDown();
                }
            }

            // Keep playfield background scrolling, mole popping, and red-character sinking alive during cooldown!
            if (!this.isGameOver) {
                this.parallaxManager.update(simDt);
                this.moleSpawner.update(simDt, elapsed, this.normalHits);
                this.hammer.update(simDt);
                this.vfxManager.update(simDt);
            }

            // Check Lose Condition (Time reached 0:00 -> launch 3-stage XP crash sequence immediately)
            if (!this.isGameOver && !this.pendingEndType && this.gameTimeRemaining <= 0) {
                this.gameTimeRemaining = 0;
                const wasCoolingDown = this.isCoolingDown;
                this.isCoolingDown = false;
                this.cooldownTimer = 0;
                this.pendingCoolDown = false;
                this.pendingCoolDownTimer = 0;
                if (wasCoolingDown) {
                    this.dispatchUIEvent('cooldownhide', {});
                }
                this.dispatchUIEvent('timertick', {
                    timeRemaining: 0,
                    elapsed: totalDur,
                    speedPercent: this.speedPercent,
                    speedFactor: this.speedFactor
                });
                this.triggerLoseSequence();
                this.render();
                requestAnimationFrame((t) => this.gameLoop(t));
                return;
            }

            this.dispatchUIEvent('timertick', {
                timeRemaining: Math.max(0, this.gameTimeRemaining),
                elapsed: Math.max(0, this.totalDuration - this.gameTimeRemaining),
                speedPercent: this.speedPercent,
                speedFactor: this.speedFactor
            });
        }

        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.config.VIEWPORT_WIDTH, this.config.VIEWPORT_HEIGHT);

        // Stationary canvas render (zero camera shake translation so edges never expose white border)
        // Layer 1: Playfield background + standalone transparent hole sprites
        this.parallaxManager.drawGroundPlane(ctx);

        // Layer 2 & Layer 3: Split-rim clipped character sprites + front colored rim overlays
        if (this.moleSpawner.drawActiveHoles) {
            this.moleSpawner.drawActiveHoles(ctx);
        } else {
            for (let i = 0; i < this.moleSpawner.holes.length; i++) {
                this.moleSpawner.holes[i].drawMole(ctx, this.parallaxManager);
            }
        }

        // Layer 4: Local hole VFX (explosion bursts/sparks & flash)
        this.vfxManager.draw(ctx);

        // Layer 5: Punch & Slap Attack Hands
        this.hammer.draw(ctx);

        // Count painted frames showing the transformed furious red character before opening #cooldown-modal
        if (this.pendingCoolDown) {
            const holeMole = this.pendingCoolDownHole && this.pendingCoolDownHole.mole;
            if (!holeMole || holeMole.transformedRed || holeMole.exploding || holeMole.state === 'HIDDEN') {
                this.redFrameRenderedCount++;
            }
        }
    }

    triggerWinSequence() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isWin = true;
        this.isCoolingDown = false;
        this.pendingCoolDown = false;
        this.pendingEndType = null;
        this.pendingEndTimer = 0;

        const timeTaken = this.totalDuration - this.gameTimeRemaining;
        const bestRun = this.recordPersonalBest(timeTaken, this.bombHits);
        const messages = this.config.WIN_MESSAGES || [];
        const idx = this.getNextRotationIndex('mazaaq_end_idx', messages.length);
        const message = messages[idx] || "Think about it. Choose your words well.";

        this.audioManager.playVictoryFanfare();

        this.dispatchUIEvent('gamewin', {
            timeTaken: timeTaken,
            bombHits: this.bombHits,
            normalHits: this.normalHits,
            bestRun: bestRun,
            message: message,
            rotationIndex: idx
        });
    }

    triggerLoseSequence() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isLose = true;
        this.isCoolingDown = false;
        this.pendingCoolDown = false;
        this.pendingEndType = null;
        this.pendingEndTimer = 0;

        const messages = this.config.LOSE_MESSAGES || [];
        const idx = this.getNextRotationIndex('mazaaq_end_idx', messages.length);
        const message = messages[idx] || "Pause first, then laugh. Careless words leave lasting marks.";

        this.audioManager.playDefeatFanfare();

        this.dispatchUIEvent('gamelose', {
            normalHits: this.normalHits,
            bombHits: this.bombHits,
            message: message,
            rotationIndex: idx
        });
    }

    recordPersonalBest(timeTaken, bombHits) {
        try {
            const raw = localStorage.getItem('mazaaq_tha_best_run');
            let currentBest = raw ? JSON.parse(raw) : null;

            // Ranked by fastest completion time. Fewest bomb hits as tiebreaker.
            let isNewBest = false;
            if (!currentBest) {
                isNewBest = true;
            } else if (timeTaken < currentBest.timeTaken) {
                isNewBest = true;
            } else if (Math.abs(timeTaken - currentBest.timeTaken) < 0.2 && bombHits < currentBest.bombHits) {
                isNewBest = true;
            }

            if (isNewBest) {
                currentBest = {
                    timeTaken: Math.round(timeTaken * 10) / 10,
                    bombHits: bombHits,
                    date: new Date().toLocaleDateString()
                };
                localStorage.setItem('mazaaq_tha_best_run', JSON.stringify(currentBest));
            }

            return {
                timeTaken: currentBest.timeTaken,
                bombHits: currentBest.bombHits,
                isNewRecord: isNewBest
            };
        } catch (e) {
            return { timeTaken: Math.round(timeTaken), bombHits: bombHits, isNewRecord: false };
        }
    }

    restartGame() {
        this.isStarted = true;
        this.isRunning = true;
        this.isGameOver = false;
        this.isWin = false;
        this.isLose = false;
        this.isPaused = false;
        this.isCoolingDown = false;

        this.gameTimeRemaining = this.totalDuration;
        this.lastTime = performance.now();
        this.normalHits = 0;
        this.bombHits = 0;
        this.bombHitsInCycle = 0;
        this.heartCrackLevel = 0;
        this.speedFactor = 1.9;
        this.speedPercent = 0;

        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.slowMoDuration = 0;
        this.pendingCoolDown = false;
        this.pendingCoolDownTimer = 0;
        this.pendingCoolDownDeadline = 0;
        this.pendingCoolDownHole = null;
        this.redFrameRenderedCount = 0;
        this.pendingEndType = null;
        this.pendingEndTimer = 0;

        // 1. Reset background conveyor completely back to top start
        if (this.parallaxManager) {
            this.parallaxManager.reset();
        }

        // 2. Reset MoleSpawner and re-align holes with reset parallax tiles
        if (this.moleSpawner) {
            this.moleSpawner.reset();
        }

        // 3. Clear all active VFX and floating speech bubbles
        if (this.vfxManager) {
            this.vfxManager.reset();
        }

        // 4. Reset camera shake
        if (this.cameraShake) {
            this.cameraShake.reset();
        }

        // 5. Reset hammer state
        if (this.hammer) {
            this.hammer.reset();
        }

        if (this.audioManager) {
            this.audioManager.playGameRestart();
        }

        this.dispatchUIEvent('gamerestart', {
            targetHits: this.targetHits,
            totalDuration: this.totalDuration
        });
    }

    dispatchUIEvent(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    }
}
