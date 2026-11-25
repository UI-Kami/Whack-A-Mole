// src/GameManager.js - Central Game Orchestrator, 90-Second Timeline, Bomb Sequence & UI
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

        // 90-Second Timeline Clock
        this.totalDuration = this.config.TOTAL_DURATION || 90.0;
        this.gameTimeRemaining = this.totalDuration;
        this.lastTime = performance.now();
        this.isStarted = false;
        this.isRunning = true;
        this.isPaused = false;

        // Gameplay Metrics
        this.normalHits = 0;          // Progress toward 30 normal hits
        this.targetHits = this.config.TARGET_NORMAL_HITS || 30;
        this.bombHits = 0;            // Neutral bomb contact count
        this.heartCrackLevel = 0;     // 0 = clean, 1 = cracked 1, 2 = cracked 2, 3 = heavily cracked
        this.speedFactor = 1.0;
        this.speedPercent = 0;        // 0 to 100% for Speed bar

        // End Game & Cool-Down States
        this.isGameOver = false;
        this.isWin = false;
        this.isLose = false;
        this.isCoolingDown = false;
        this.cooldownTimer = 0;
        this.cooldownAutoTime = this.config.COOLDOWN_AUTO_DURATION || 2.2;
        this.lastReflectionIndex = -1;
        this.factIndex = 0;

        // Assets Container
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

        // Cinematic Slow-Motion System for Bomb Explosions
        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.slowMoDuration = 0;
        this.pendingCoolDown = false;
        this.pendingCoolDownTimer = 0;

        this.init();
    }

    async init() {
        this.setupCanvasResolution();
        window.addEventListener('resize', () => this.setupCanvasResolution());
        window.addEventListener('orientationchange', () => setTimeout(() => this.setupCanvasResolution(), 120));

        await this.loadSprites();

        if (this.assets.bgImg) {
            this.parallaxManager.bgImg = this.assets.bgImg;
        }
        this.vfxManager.setAssets(this.assets);

        this.moleSpawner = new MoleSpawner(this.config, this.assets, this.audioManager, this.vfxManager, this.parallaxManager);
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

            this.assets.bgImg       = await loadImg(ASSETS_DATA.bg);
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

            this.assets.bgImg       = await loadImg('assets/normalized/poster_bg_1080.png');
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
        if (!this.hammer || this.isGameOver || this.isPaused || !this.isStarted || this.isCoolingDown || this.slowMoTimer > 0) return;

        this.hammer.triggerSwing(x, y, (hitX, hitY, attackType) => {
            this.processHit(hitX, hitY, isTouch, attackType);
        }, isTouch);
    }

    processHit(x, y, isTouch, attackType) {
        if (!this.moleSpawner || this.isCoolingDown || this.slowMoTimer > 0) return;
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
        this.cameraShake.addTrauma(0.28, 0, 1);
        this.vfxManager.spawnHitVFX(result.x, result.y, result.hitType);

        // Update UI
        this.dispatchUIEvent('normalhit', {
            normalHits: this.normalHits,
            targetHits: this.targetHits,
            progress: Math.min(1.0, this.normalHits / this.targetHits)
        });

        // Check Win Condition (30 normal hits before 0:00)
        if (this.normalHits >= this.targetHits && !this.isGameOver) {
            this.triggerWinSequence();
        }
    }

    handleBombHit(result) {
        this.bombHits++;

        // 1. Cinematic Slow-Motion Bomb Explosion (Dramatic 1.2s at 22% timeScale)
        this.startSlowMotion(1.2, 0.22);

        // 2. Red Screen Flash, Dual Blasts, Shockwaves & 4-6 Insult Speech Bubbles
        this.vfxManager.spawnBombExplosionSequence(result.x, result.y);

        // 3. Crack Heart Health Icon
        this.heartCrackLevel = Math.min(3, this.heartCrackLevel + 1);

        // 4. Immediately Deduct -1 Second from Main Timer
        this.gameTimeRemaining = Math.max(0, this.gameTimeRemaining - this.config.BOMB_TIME_PENALTY);
        this.showTimerPenaltyFeedback('-1s');

        // 5. Increase Game Speed & Advance Speed Bar
        this.speedFactor += 0.14;
        this.moleSpawner.setSpeedFactor(this.speedFactor);
        this.speedPercent = Math.min(100, Math.round(((this.speedFactor - 1.0) / 1.5) * 100));

        // Camera Shake & Explosive Audio
        this.cameraShake.addTrauma(1.4, 0, 1);
        this.audioManager.playRedExplosion();
        if (navigator.vibrate) {
            try { navigator.vibrate([80, 40, 80]); } catch (e) {}
        }

        // Dispatch HUD update
        this.dispatchUIEvent('bombhit', {
            bombHits: this.bombHits,
            heartCrackLevel: this.heartCrackLevel,
            speedPercent: this.speedPercent,
            timeRemaining: this.gameTimeRemaining
        });

        // 6. On every 2nd bomb hit: Schedule Cool-Down to trigger AFTER slow-mo explosion finishes!
        if (this.bombHits % this.config.COOLDOWN_CADENCE === 0) {
            this.pendingCoolDown = true;
            this.pendingCoolDownTimer = 1.15; // Displays cool-down right as slow-mo concludes
        }
    }

    triggerCoolDown() {
        this.isCoolingDown = true;
        this.cooldownTimer = this.cooldownAutoTime;

        // Pick Reflection line without repeating back-to-back
        const reflections = this.config.REFLECTIONS;
        let nextRefIndex = Math.floor(Math.random() * reflections.length);
        if (nextRefIndex === this.lastReflectionIndex) {
            nextRefIndex = (nextRefIndex + 1) % reflections.length;
        }
        this.lastReflectionIndex = nextRefIndex;
        const reflectionLine = reflections[nextRefIndex];

        // Pick Fact line (cycle sequentially)
        const facts = this.config.FACTS;
        const factLine = facts[this.factIndex % facts.length];
        this.factIndex++;

        // Calm chime audio
        this.audioManager.playCoolDownStart();

        this.dispatchUIEvent('cooldownshow', {
            reflection: reflectionLine,
            fact: factLine
        });
    }

    // Skip cool-down early by tapping "Continue" (costs only -1s instead of -3s)
    skipCoolDownEarly() {
        if (!this.isCoolingDown) return;
        this.isCoolingDown = false;

        // Deduct only -1s
        this.gameTimeRemaining = Math.max(0, this.gameTimeRemaining - this.config.COOLDOWN_PENALTY_SKIP);
        this.showTimerPenaltyFeedback('-1s');

        // Restore health after cooling down
        this.heartCrackLevel = 0;
        this.dispatchUIEvent('bombhit', {
            heartCrackLevel: 0,
            speedPercent: this.speedPercent
        });

        this.dispatchUIEvent('cooldownhide', {});
    }

    // Complete full cool-down auto-continue (costs -3s)
    finishFullCoolDown() {
        if (!this.isCoolingDown) return;
        this.isCoolingDown = false;

        // Deduct -3s
        this.gameTimeRemaining = Math.max(0, this.gameTimeRemaining - this.config.COOLDOWN_PENALTY_FULL);
        this.showTimerPenaltyFeedback('-3s');

        // Restore health after cooling down
        this.heartCrackLevel = 0;
        this.dispatchUIEvent('bombhit', {
            heartCrackLevel: 0,
            speedPercent: this.speedPercent
        });

        this.dispatchUIEvent('cooldownhide', {});
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
        this.heartCrackLevel = 0;
        this.speedFactor = 1.0;
        this.speedPercent = 0;

        // Reset slow-motion state
        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.slowMoDuration = 0;
        this.pendingCoolDown = false;
        this.pendingCoolDownTimer = 0;

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

        const dt = Math.min(Math.max(0, (now - this.lastTime) / 1000), 0.05);
        this.lastTime = now;

        if (this.isStarted && !this.isPaused && !this.isGameOver) {
            // Main Countdown Timer (KEEPS RUNNING CONTINUOUSLY during every cool-down!)
            this.gameTimeRemaining -= dt;

            // Continuous timeline progress across 90 seconds (0.0 to 1.0)
            const elapsed = Math.max(0, this.totalDuration - this.gameTimeRemaining);
            const timeProgress = Math.min(1.0, elapsed / this.totalDuration);

            // Gradual Continuous Speed Ramp:
            // Base speed smoothly increases from 1.0 up to 1.95 over 90 seconds
            const timelineSpeed = 1.0 + (timeProgress * 0.95);
            // Each bomb hit increases speed by +0.12
            const bombSpeed = 1.0 + (this.bombHits * 0.12);
            // Total combined speed factor
            this.speedFactor = timelineSpeed * bombSpeed;
            // Smoothly update speed bar (1.0 = 0%, 2.5 = 100%)
            this.speedPercent = Math.min(100, Math.max(0, Math.round(((this.speedFactor - 1.0) / 1.5) * 100)));

            if (this.moleSpawner) {
                this.moleSpawner.setSpeedFactor(this.speedFactor);
            }
            if (this.parallaxManager) {
                this.parallaxManager.setSpeedMultiplier(this.speedFactor);
            }

            // Update Cinematic Slow-Motion
            let simDt = dt;
            if (this.slowMoTimer > 0) {
                this.slowMoTimer -= dt;
                if (this.slowMoTimer <= 0) {
                    this.slowMoTimer = 0;
                    this.timeScale = 1.0;
                } else {
                    // Smoothly ease back up from 0.22 to 1.0 during the last 0.35s
                    const remainingRatio = this.slowMoTimer / (this.slowMoDuration || 1.2);
                    if (remainingRatio < 0.30) {
                        const t = (0.30 - remainingRatio) / 0.30;
                        this.timeScale = 0.22 + t * 0.78;
                    }
                }
                simDt = dt * this.timeScale;
            }

            // Pending cool-down transition (lets slow-mo explosion & insults finish first!)
            if (this.pendingCoolDown) {
                this.pendingCoolDownTimer -= dt;
                if (this.pendingCoolDownTimer <= 0) {
                    this.pendingCoolDown = false;
                    this.triggerCoolDown();
                }
            }

            // Cool-down countdown timer
            if (this.isCoolingDown) {
                this.cooldownTimer -= dt;
                if (this.cooldownTimer <= 0) {
                    this.finishFullCoolDown();
                }
            }

            // Check Lose Condition (Time reached 0:00)
            if (this.gameTimeRemaining <= 0) {
                this.gameTimeRemaining = 0;
                this.triggerLoseSequence();
            }

            // Update Canvas Subsystems only when Cooldown Modal is NOT active so exploding red
            // characters resume their post-explosion poppingIn retreat smoothly upon Continue!
            if (!this.isCoolingDown) {
                this.parallaxManager.update(simDt);
                this.moleSpawner.update(simDt, elapsed);
                this.hammer.update(simDt);
                this.vfxManager.update(simDt);
                this.cameraShake.update(simDt);
            }

            // Update Live Timer and Speed UI continuously
            this.dispatchUIEvent('timertick', {
                timeRemaining: Math.max(0, this.gameTimeRemaining),
                elapsed: elapsed,
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

        ctx.save();
        this.cameraShake.apply(ctx);

        // Layer 1: Hole Shadow, Back Rim & Black Interior (complete ground holes base)
        this.parallaxManager.drawGroundPlane(ctx);

        // Layer 2 & Layer 3: Character clipped to inner opening + Front colored rim overlay
        if (this.moleSpawner.drawActiveHoles) {
            this.moleSpawner.drawActiveHoles(ctx);
        } else {
            for (let i = 0; i < this.moleSpawner.holes.length; i++) {
                this.moleSpawner.holes[i].drawMole(ctx, this.parallaxManager);
            }
        }

        // 3. VFX (Particles, Insult Bubbles, Screen Flash)
        this.vfxManager.draw(ctx);

        // 4. Punch & Slap Attack Hands (Rendered above playfield)
        this.hammer.draw(ctx);

        ctx.restore();
    }

    triggerWinSequence() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isWin = true;

        const timeTaken = this.totalDuration - this.gameTimeRemaining;
        const bestRun = this.recordPersonalBest(timeTaken, this.bombHits);

        this.audioManager.playVictoryFanfare();

        this.dispatchUIEvent('gamewin', {
            timeTaken: timeTaken,
            bombHits: this.bombHits,
            normalHits: this.normalHits,
            bestRun: bestRun
        });
    }

    triggerLoseSequence() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isLose = true;

        this.audioManager.playDefeatFanfare();

        this.dispatchUIEvent('gamelose', {
            normalHits: this.normalHits,
            bombHits: this.bombHits
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
        this.heartCrackLevel = 0;
        this.speedFactor = 1.0;
        this.speedPercent = 0;

        this.timeScale = 1.0;
        this.slowMoTimer = 0;
        this.slowMoDuration = 0;
        this.pendingCoolDown = false;
        this.pendingCoolDownTimer = 0;

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
