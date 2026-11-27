// src/MoleController.js - 3-Phase Hole Emergence, Rim-Aligned Hands, Disguised Bombs & Miss Ball-Throw
export const MOLE_STATE = {
    HIDDEN: 'HIDDEN',
    PEEKING: 'PEEKING',
    EMERGING: 'EMERGING',
    IDLE: 'IDLE',
    HIT: 'HIT',
    TRANSFORMING_RED: 'TRANSFORMING_RED',
    THROWING_MISS: 'throwingMiss',
    DUCKING: 'DUCKING'
};

export class MoleController {
    constructor(hole, config, assets) {
        this.hole = hole;
        this.config = config;
        this.assets = assets;

        this.state = MOLE_STATE.HIDDEN;
        this.isBomb = false;
        this.timer = 0;
        this.idleDuration = 1.4;

        // Visual animation properties
        this.riseProgress = 0; // 0 = completely submerged inside hole, 1 = fully popped out on rim
        this.scaleX = 1;
        this.scaleY = 1;
        this.idleBobTimer = 0;
        this.isHit = false;
        this.hit = false;
        this.triggered = false;
        this.transformedRed = false;
        this.exploding = false;
        this.missed = false;
        this.ballLaunched = false;

        // Front-facing 4-Frame 2D Miss Ball-Throw Animation State (0.13s + 0.14s + 0.13s wind-up + 0.10s release)
        this.missElapsed = 0;
        this.missTempoScale = 1.0;
        this.missTotalDuration = 0.50;
        this.missSplashFired = false;
        this.throwFrameIndex = 1;
        this.onMissThrow = null;

        // Bomb detonation timer
        this.detonationTimer = 0;
        this.onDetonate = null;
    }

    spawn(isBomb = false, idleDuration = 0.68, speedOrTimings = 1.0) {
        let popDur, holdDur, duckDur, redRetreatDur, missTempoScale = 1.0;
        if (speedOrTimings && typeof speedOrTimings === 'object') {
            popDur = speedOrTimings.popDuration ?? (this.config.MOLE_POP_DURATION || 0.22);
            holdDur = speedOrTimings.holdDuration ?? idleDuration;
            duckDur = speedOrTimings.duckDuration ?? (this.config.MOLE_DUCK_DURATION || 0.20);
            redRetreatDur = Math.max(0.20, speedOrTimings.redRetreatDuration ?? duckDur);
            missTempoScale = speedOrTimings.missTempoScale ?? 1.0;
        } else {
            const animSpeed = Math.max(1.0, speedOrTimings || 1.0);
            popDur = (this.config.MOLE_POP_DURATION || 0.22) / animSpeed;
            holdDur = idleDuration;
            duckDur = (this.config.MOLE_DUCK_DURATION || 0.20) / animSpeed;
            redRetreatDur = Math.max(0.20, this.config.MOLE_RED_RETREAT_TIME || 0.20);
        }

        this.isBomb = isBomb;
        this.state = MOLE_STATE.PEEKING;
        this.popDuration = popDur;
        this.duckDuration = duckDur;
        this.redRetreatDuration = redRetreatDur;
        this.phaseTotal = popDur;
        this.timer = popDur;
        this.riseProgress = 0;
        this.isHit = false;
        this.hit = false;
        this.triggered = false;
        this.transformedRed = false;
        this.exploding = false;
        this.missed = false;
        this.ballLaunched = false;
        this.missElapsed = 0;
        this.missTempoScale = Math.max(0.90, Math.min(1.0, missTempoScale));
        this.missTotalDuration = (this.config.MOLE_MISS_THROW_TIME || 0.50) * this.missTempoScale;
        this.missSplashFired = false;
        this.throwFrameIndex = 1;
        this.scaleX = 0.94;
        this.scaleY = 1.06;
        this.idleBobTimer = Math.random() * Math.PI * 2;
        this.idleDuration = holdDur;
        this.speedFactor = 1.0;
        this.detonationTimer = 0;
        this.onDetonate = null;
    }

    explode() {
        this.state = MOLE_STATE.HIDDEN;
        this.riseProgress = 0;
        this.isHit = false;
        this.hit = false;
        this.triggered = false;
        this.transformedRed = false;
        this.exploding = false;
        this.missed = false;
        this.ballLaunched = false;
        this.missElapsed = 0;
        this.missSplashFired = false;
        this.throwFrameIndex = 1;
        this.detonationTimer = 0;
    }

    reset() {
        this.state = MOLE_STATE.HIDDEN;
        this.riseProgress = 0;
        this.isHit = false;
        this.hit = false;
        this.triggered = false;
        this.transformedRed = false;
        this.exploding = false;
        this.missed = false;
        this.ballLaunched = false;
        this.missElapsed = 0;
        this.missSplashFired = false;
        this.throwFrameIndex = 1;
        this.isBomb = false;
        this.detonationTimer = 0;
        this.timer = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.idleBobTimer = 0;
    }

    canBeHit() {
        if (
            this.state === MOLE_STATE.HIDDEN ||
            this.isHit ||
            this.hit ||
            this.triggered ||
            this.missed ||
            this.ballLaunched ||
            this.state === MOLE_STATE.TRANSFORMING_RED ||
            this.state === MOLE_STATE.HIT
        ) {
            return false;
        }
        if (this.state === MOLE_STATE.THROWING_MISS) {
            // Keep hitbox clickable during wind-up Frames 1-3 until Frame 4 releases the ball
            return !this.ballLaunched && this.throwFrameIndex < 4;
        }
        if (this.state === MOLE_STATE.DUCKING && this.transformedRed) {
            return false;
        }
        return true;
    }

    onHit(hitType = 'punch') {
        if (!this.canBeHit()) {
            return null;
        }

        const wasMidThrow = (this.state === MOLE_STATE.THROWING_MISS);

        // Hidden Bomb hit (including mid-throw): cancel any throw, lock trigger, transform green -> red,
        // hold furious red exploding state >= 0.42s so canvas draws red BEFORE cooldown, then sink as red_sink.
        if (this.isBomb) {
            this.isHit = true;
            this.hit = true;
            this.triggered = true;
            this.ballLaunched = false;
            this.missed = false;
            this.missSplashFired = false;
            this.transformedRed = true;
            this.exploding = true;
            this.state = MOLE_STATE.TRANSFORMING_RED;
            this.detonationTimer = Math.max(0.42, this.config.MOLE_RED_EXPLODE_TIME || 0.42);
            this.riseProgress = 1.0;
            this.scaleX = 1.20;
            this.scaleY = 0.86;

            return {
                success: true,
                isBomb: true,
                interruptedThrow: wasMidThrow,
                hitType: hitType,
                x: this.hole.screenX,
                y: this.hole.screenY,
                hole: this.hole
            };
        }

        // Normal green hit (including mid-throw Frames 1-3): abort throw & retreat immediately behind front rim
        this.isHit = true;
        this.hit = true;
        this.triggered = true;
        this.ballLaunched = false;
        this.missed = false;
        this.missSplashFired = false;
        this.state = MOLE_STATE.HIT;
        this.phaseTotal = Math.max(0.07, Math.min(this.config.MOLE_HIT_RETREAT_TIME || 0.20, this.duckDuration || 0.20));
        this.timer = this.phaseTotal;
        this.scaleX = 1.18;
        this.scaleY = 0.78;

        return {
            success: true,
            isBomb: false,
            interruptedThrow: wasMidThrow,
            hitType: hitType,
            x: this.hole.screenX,
            y: this.hole.screenY,
            hole: this.hole
        };
    }

    update(dt) {
        if (this.state === MOLE_STATE.HIDDEN) return;

        const clampedDt = Math.min(Math.max(0, dt), 0.05);
        this.idleBobTimer += clampedDt * 5.2;

        switch (this.state) {
            case MOLE_STATE.PEEKING:
            case MOLE_STATE.EMERGING: {
                // Pop-Out (Rise) Phase (0.42s -> 0.32s Phase 1, 0.32s -> 0.14s Phase 2): Continuous cubic ease-out
                this.timer -= clampedDt;
                const popTotal = this.popDuration || this.phaseTotal || (this.config.MOLE_POP_DURATION || 0.42);
                const t = Math.max(0, Math.min(1.0, 1.0 - (this.timer / popTotal)));
                const easeOut = 1.0 - Math.pow(1.0 - t, 3);
                this.riseProgress = easeOut;

                // Subtle vertical stretch rising out, settling cleanly to 1.0 as paws reach rim
                const swell = Math.sin(t * Math.PI);
                this.scaleX = 1.0 - 0.06 * swell;
                this.scaleY = 1.0 + 0.09 * swell;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.IDLE;
                    this.riseProgress = 1.0;
                    this.scaleX = 1.0;
                    this.scaleY = 1.0;
                    this.timer = this.idleDuration;
                }
                break;
            }

            case MOLE_STATE.IDLE: {
                // Hold (Idle) Phase (1.15s -> 0.85s Phase 1, 0.85s -> 0.32s Phase 2): Smooth breathing at peak
                this.timer -= clampedDt;
                const wave = Math.sin(this.idleBobTimer * 0.9);
                this.scaleX = 1.0 + wave * 0.025;
                this.scaleY = 1.0 - wave * 0.025;
                this.riseProgress = 1.0;

                if (this.timer <= 0) {
                    // Normal green character missed -> enter clickable 4-frame front-facing 2D throw sequence!
                    // Keep hitbox active through wind-up Frames 1-3; lock ONLY once Frame 4 releases the ball.
                    if (!this.isBomb && !this.isHit && !this.triggered && !this.missed && this.assets && (this.assets.missThrow1 || this.assets.splashFrame2)) {
                        this.missed = false;
                        this.triggered = false;
                        this.ballLaunched = false;
                        this.hit = false;
                        this.isHit = false;
                        this.state = MOLE_STATE.THROWING_MISS;
                        this.missElapsed = 0;
                        this.missTotalDuration = (this.config.MOLE_MISS_THROW_TIME || 0.50) * Math.max(0.90, Math.min(1.0, this.missTempoScale || 1.0));
                        this.missSplashFired = false;
                        this.throwFrameIndex = 1;
                        this.riseProgress = 1.0;
                        this.scaleX = 1.0;
                        this.scaleY = 1.0;
                    } else {
                        this.state = MOLE_STATE.DUCKING;
                        this.phaseTotal = this.duckDuration || (this.config.MOLE_DUCK_DURATION || 0.20);
                        this.timer = this.phaseTotal;
                    }
                }
                break;
            }

            case MOLE_STATE.THROWING_MISS: {
                // Cohesive 4-Frame Front-Facing 2D Throw Sequence (zero 3D zoom/scale distortion):
                // Clickable wind-up (~0.36s-0.40s scaled across Frames 1-3):
                //   Frame 1 (~0.13s): Front Surprised (!)
                //   Frame 2 (~0.14s): Front Angry & Holding Pink/Red Ball
                //   Frame 3 (~0.13s): Front Wind-Up behind shoulder
                // Locked release:
                //   Frame 4 (~0.10s): Front Forward Throw Follow-Through & launch 2D ball arc
                this.missElapsed += clampedDt;
                const sc = Math.max(0.90, Math.min(1.0, this.missTempoScale || 1.0));
                const t1 = 0.13 * sc;
                const t2 = t1 + 0.14 * sc;
                const t3 = t2 + 0.13 * sc;
                const tTotal = t3 + 0.10 * sc;

                this.riseProgress = 1.0;
                this.scaleX = 1.0;
                this.scaleY = 1.0;

                if (this.missElapsed < t1) {
                    this.throwFrameIndex = 1;
                } else if (this.missElapsed < t2) {
                    this.throwFrameIndex = 2;
                } else if (this.missElapsed < t3) {
                    this.throwFrameIndex = 3;
                } else {
                    // Frame 4 releases the ball and locks target against late taps
                    this.throwFrameIndex = 4;
                    this.ballLaunched = true;
                    this.missed = true;
                    this.triggered = true;
                    if (!this.missSplashFired) {
                        this.missSplashFired = true;
                        if (this.onMissThrow) this.onMissThrow(this.hole);
                    }
                }

                if (this.missElapsed >= tTotal) {
                    // Retreat smoothly downward into the hole behind front colored rim (poppingIn)
                    this.state = MOLE_STATE.DUCKING;
                    this.phaseTotal = Math.max(0.12, this.duckDuration || (this.config.MOLE_DUCK_DURATION || 0.20));
                    this.timer = this.phaseTotal;
                    this.scaleX = 1.0;
                    this.scaleY = 1.0;
                    this.riseProgress = 1.0;
                }
                break;
            }

            case MOLE_STATE.TRANSFORMING_RED:
                this.detonationTimer -= clampedDt;
                this.scaleX = 1.08 + (Math.random() - 0.5) * 0.14;
                this.scaleY = 1.08 + (Math.random() - 0.5) * 0.14;
                this.riseProgress = 1.0;

                if (this.detonationTimer <= 0) {
                    // Chain cleanly into poppingIn (DUCKING) using downward red_sink frame behind front rim (min 0.20s)
                    const cb = this.onDetonate;
                    this.onDetonate = null;
                    this.exploding = false;
                    this.state = MOLE_STATE.DUCKING;
                    this.phaseTotal = Math.max(0.20, this.redRetreatDuration || (this.config.MOLE_RED_RETREAT_TIME || 0.20));
                    this.timer = this.phaseTotal;
                    this.scaleX = 1.0;
                    this.scaleY = 1.0;
                    this.riseProgress = 1.0;
                    if (cb) cb();
                }
                break;

            case MOLE_STATE.HIT: {
                // Pop-In Hit Retreat (~0.34s): Squash recover + cubic ease-in (t^3) downward
                this.timer -= clampedDt;
                const hitTotal = this.phaseTotal || (this.config.MOLE_HIT_RETREAT_TIME || 0.34);
                const t = Math.max(0, Math.min(1.0, 1.0 - (this.timer / hitTotal)));
                const easeIn = t * t * t;
                this.riseProgress = Math.max(0, 1.0 - easeIn);
                this.scaleX = 1.18 - t * 0.22;
                this.scaleY = 0.78 + t * 0.24;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                    this.isHit = false;
                    this.hit = false;
                    this.triggered = false;
                    this.transformedRed = false;
                    this.missed = false;
                    this.ballLaunched = false;
                    this.throwFrameIndex = 1;
                }
                break;
            }

            case MOLE_STATE.DUCKING: {
                // Pop-In (Retreat) Phase (~0.32-0.40s): Switch to downward frame & cubic ease-in (t^3)
                this.timer -= clampedDt;
                const duckTotal = this.phaseTotal || ((this.config.MOLE_DUCK_DURATION || 0.36) / (this.speedFactor || 1));
                const t = Math.max(0, Math.min(1.0, 1.0 - (this.timer / duckTotal)));
                const easeIn = t * t * t;
                this.riseProgress = Math.max(0, 1.0 - easeIn);

                // Smoothly transition from IDLE scale toward gentle downward elongation (no jump!)
                this.scaleX = 1.0 - 0.04 * easeIn;
                this.scaleY = 1.0 + 0.05 * easeIn;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                    this.isHit = false;
                    this.hit = false;
                    this.triggered = false;
                    this.transformedRed = false;
                    this.exploding = false;
                    this.missed = false;
                    this.ballLaunched = false;
                    this.missElapsed = 0;
                    this.missSplashFired = false;
                    this.throwFrameIndex = 1;
                }
                break;
            }
        }
    }

    getSpriteFrame() {
        // Post-Hit Exploding / Retreat Red State (ONLY when a hidden bomb has been struck!)
        if (this.transformedRed || this.exploding) {
            if (this.state === MOLE_STATE.TRANSFORMING_RED) {
                return this.assets.red_push || this.assets.red_idle || this.assets.red;
            }
            if (this.state === MOLE_STATE.DUCKING || this.state === MOLE_STATE.HIT) {
                return this.assets.red_sink || this.assets.red_peek;
            }
            return this.assets.red_push || this.assets.red_idle;
        }

        // Missed Normal Character Front-Facing 2D Ball-Throw State (Frames 1 -> 2 -> 3 -> 4)
        if (this.state === MOLE_STATE.THROWING_MISS) {
            const key = `missThrow${this.throwFrameIndex || 1}`;
            return this.assets[key] || this.assets.missThrow1 || this.assets.yellow_idle;
        }

        // ALL Initial Emergence (poppingOut), Hold (IDLE), and Unhit Retreat (DUCKING)
        // render strictly as GREEN characters — hidden bombs look identical until tapped!
        if (this.state === MOLE_STATE.PEEKING || this.state === MOLE_STATE.EMERGING) {
            return (this.riseProgress < 0.72)
                ? (this.assets.yellow_peek || this.assets.yellow_idle)
                : (this.assets.yellow_idle || this.assets.yellow);
        }
        if (this.state === MOLE_STATE.DUCKING || this.state === MOLE_STATE.HIT) {
            return this.assets.yellow_retract || this.assets.yellow_hit || this.assets.yellow_idle;
        }
        // IDLE (Fully popped out)
        return this.assets.yellow_idle || this.assets.yellow_push || this.assets.yellow;
    }

    draw(ctx, screenX, screenY, holeRadiusX, holeRadiusY) {
        if (this.state === MOLE_STATE.HIDDEN || this.riseProgress <= 0.01) return;

        const isDetonating = (this.state === MOLE_STATE.TRANSFORMING_RED);
        const sprite = this.getSpriteFrame();

        if (!sprite || !sprite.complete || sprite.naturalWidth === 0) {
            this.drawProcedural(ctx, screenX, screenY, holeRadiusX, isDetonating);
            return;
        }

        const natW = sprite.naturalWidth;
        const natH = sprite.naturalHeight;
        const aspect = natH / natW;

        let charW, charH, anchorY;

        if (isDetonating) {
            // Furious red full-body burst with legs strictly for explosion reaction pop-up above hole
            charW = holeRadiusX * 2.35;
            charH = charW * aspect;
            anchorY = screenY + holeRadiusY * 1.05;
        } else if (sprite === this.assets.red_peek) {
            // 981x744 clinging red sprite: round torso sits cleanly behind center lip while
            // wide red paws align cleanly with left/right outer paw pockets on front rim.
            charW = holeRadiusX * 2.52;
            charH = charW * aspect;
            const frontLipY = screenY + (holeRadiusY * 1.38);
            const submergeDistance = charH * 0.88;
            const downwardHideOffset = (1.0 - Math.min(1.0, Math.max(0.0, this.riseProgress))) * submergeDistance;
            anchorY = frontLipY + downwardHideOffset;
        } else if (sprite === this.assets.red_sink) {
            // 524x679 downward-moving red sprite with vertical motion lines
            charW = holeRadiusX * 2.24;
            charH = charW * aspect;
            const frontLipY = screenY + (holeRadiusY * 1.38);
            const submergeDistance = charH * 0.90;
            const downwardHideOffset = (1.0 - Math.min(1.0, Math.max(0.0, this.riseProgress))) * submergeDistance;
            anchorY = frontLipY + downwardHideOffset;
        } else {
            // Canonical 900x980 green sprites (torso + paws on rim, no legs):
            // FrontLipY seats lower belly past dark pit bottom behind Layer 3 center rim
            // while both hands reach outside into the open left/right paw pockets at peak height.
            charW = holeRadiusX * 3.55;
            charH = charW * aspect;

            const frontLipY = screenY + (holeRadiusY * 1.38);
            const submergeRatio = (sprite === this.assets.yellow_retract || sprite === this.assets.yellow_hit) ? 0.88 : 0.58;
            const submergeDistance = charH * submergeRatio;
            const downwardHideOffset = (1.0 - Math.min(1.0, Math.max(0.0, this.riseProgress))) * submergeDistance;
            anchorY = frontLipY + downwardHideOffset;
        }

        ctx.save();
        ctx.translate(screenX, anchorY);
        ctx.scale(this.scaleX, this.scaleY);

        if (isDetonating) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.beginPath();
            ctx.arc(0, -charH * 0.48, charW * 0.46, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw crisp sprite anchored at bottom center (hands/paws aligned on front rim)
        ctx.drawImage(sprite, -charW * 0.5, -charH, charW, charH);

        ctx.restore();
    }

    drawProcedural(ctx, x, y, r, isRed) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = isRed ? '#ef4444' : '#bef264';
        ctx.beginPath();
        ctx.arc(0, -r * 0.8, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
