// src/HammerController.js - Punch & Slap Hand Attacks with Juicy Comic Animations (Point 3)
export const HAND_STATE = {
    IDLE: 'IDLE',
    ANTICIPATION: 'ANTICIPATION',
    STRIKE: 'STRIKE',
    IMPACT: 'IMPACT',
    RECOVERY: 'RECOVERY'
};

export class HammerController {
    constructor(config, assets, audioManager, cameraShake, vfxManager) {
        this.config = config;
        this.assets = assets;
        this.audioManager = audioManager;
        this.cameraShake = cameraShake;
        this.vfxManager = vfxManager;

        // Position coordinates
        this.targetX = config.VIEWPORT_WIDTH / 2;
        this.targetY = config.VIEWPORT_HEIGHT / 2;
        this.x = this.targetX;
        this.y = this.targetY;

        // Attack state
        this.state = HAND_STATE.IDLE;
        this.phaseTimer = 0;
        this.handMode = config.HAND_MODE || 'combo'; // 'combo' | 'punch' | 'slap'
        this.currentAttack = 'punch'; // 'punch' | 'slap'
        this.comboCounter = 0;

        // Transform properties
        this.angle = -14; // in degrees
        this.scaleX = 1;
        this.scaleY = 1;
        this.scaleZ = 1; // 3D perspective punch scale

        // Target coordinates of current strike
        this.hitTargetX = this.targetX;
        this.hitTargetY = this.targetY;
        this.hitCallback = null;

        // Visual effects: motion trail & impact burst
        this.trailPoints = [];
        this.idleBob = 0;
        this.impactFlashAlpha = 0;
    }

    setPointer(px, py) {
        this.targetX = px;
        this.targetY = py;
    }

    setHandMode(mode) {
        if (mode === 'combo' || mode === 'punch' || mode === 'slap') {
            this.handMode = mode;
        }
    }

    triggerSwing(hitX, hitY, hitCallback, isTouch = false) {
        // Fulfill any pending strike
        if ((this.state === HAND_STATE.STRIKE || this.state === HAND_STATE.ANTICIPATION) && this.hitCallback) {
            const cb = this.hitCallback;
            const px = this.hitTargetX;
            const py = this.hitTargetY;
            this.hitCallback = null;
            cb(px, py, this.currentAttack);
        }

        // Determine attack type based on mode
        if (this.handMode === 'combo') {
            this.currentAttack = (this.comboCounter % 2 === 0) ? 'punch' : 'slap';
            this.comboCounter++;
        } else {
            this.currentAttack = this.handMode;
        }

        this.targetX = hitX;
        this.targetY = hitY;
        this.hitTargetX = hitX;
        this.hitTargetY = hitY;
        this.hitCallback = hitCallback;

        this.state = HAND_STATE.ANTICIPATION;
        this.phaseTimer = isTouch ? 0.025 : 0.035; // Snappy, responsive wind-up

        if (this.currentAttack === 'punch') {
            this.audioManager.playPunchSwing();
        } else {
            this.audioManager.playSlapSwing();
        }
    }

    update(dt) {
        this.idleBob += dt * 4.5;
        const isPunch = (this.currentAttack === 'punch');

        if (this.impactFlashAlpha > 0) {
            this.impactFlashAlpha = Math.max(0, this.impactFlashAlpha - dt * 6.5);
        }

        switch (this.state) {
            case HAND_STATE.IDLE:
                // Natural ready stance: gentle floating breath
                this.angle = isPunch ? (-14 + Math.sin(this.idleBob) * 2.5) : (12 + Math.sin(this.idleBob) * 3);
                this.scaleX = 1 + Math.sin(this.idleBob * 1.5) * 0.02;
                this.scaleY = 1 - Math.sin(this.idleBob * 1.5) * 0.02;
                this.scaleZ = 1.0;
                this.trailPoints = [];

                // Smoothly follow pointer in idle
                this.x += (this.targetX - this.x) * 0.55;
                this.y += (this.targetY - this.y) * 0.55;
                break;

            case HAND_STATE.ANTICIPATION:
                this.phaseTimer -= dt;
                const anticTotal = 0.035;
                const anticProg = 1 - Math.max(0, this.phaseTimer / anticTotal);

                if (isPunch) {
                    // Fist pulls back and cocks: rotates back, scales down slightly for 3D depth
                    this.angle = -14 - 22 * anticProg; // Cocks to -36 deg
                    this.scaleX = 0.94;
                    this.scaleY = 1.08;
                    this.scaleZ = 0.85; // Pulled back away from screen
                    this.x = this.hitTargetX - 35 * anticProg;
                    this.y = this.hitTargetY - 25 * anticProg;
                } else {
                    // Open slap hand raises high in air tilted backwards
                    this.angle = 12 + 38 * anticProg; // Raises to +50 deg
                    this.scaleX = 0.90;
                    this.scaleY = 1.14;
                    this.scaleZ = 0.88;
                    this.x = this.hitTargetX + 35 * anticProg;
                    this.y = this.hitTargetY - 45 * anticProg;
                }

                if (this.phaseTimer <= 0) {
                    this.state = HAND_STATE.STRIKE;
                    this.phaseTimer = 0.032; // Fast lightning strike
                }
                break;

            case HAND_STATE.STRIKE:
                this.phaseTimer -= dt;
                const strikeTotal = 0.032;
                const strikeProg = 1 - Math.max(0, this.phaseTimer / strikeTotal);
                const easeIn = strikeProg * strikeProg;

                if (isPunch) {
                    // High-speed rocket punch thrust: zooms forward into screen!
                    this.angle = -36 + 46 * easeIn; // Drives forward to +10 deg
                    this.scaleX = 0.92 + 0.3 * easeIn;
                    this.scaleY = 1.15 - 0.2 * easeIn;
                    this.scaleZ = 0.85 + 0.50 * easeIn; // Zooms up to 1.35x for impact!
                    // Drive directly to target coordinates
                    this.x = this.hitTargetX - 35 * (1 - easeIn);
                    this.y = this.hitTargetY - 25 * (1 - easeIn);
                } else {
                    // Wide sweeping slap arc downwards
                    this.angle = 50 - 95 * easeIn; // Sweeps from +50 down to -45
                    this.scaleX = 1.18;
                    this.scaleY = 0.85;
                    this.scaleZ = 0.88 + 0.38 * easeIn;
                    this.x = this.hitTargetX + 35 * (1 - easeIn);
                    this.y = this.hitTargetY - 45 * (1 - easeIn);
                }

                this.recordTrailPoint();

                if (this.phaseTimer <= 0) {
                    this.state = HAND_STATE.IMPACT;
                    this.phaseTimer = 0.052;
                    this.x = this.hitTargetX;
                    this.y = this.hitTargetY;
                    this.onImpact();
                }
                break;

            case HAND_STATE.IMPACT:
                this.phaseTimer -= dt;
                this.impactFlashAlpha = 1.0;
                this.x = this.hitTargetX;
                this.y = this.hitTargetY;

                // Impact squash & stretch upon landing
                if (isPunch) {
                    this.scaleX = 1.45; // Heavy comic horizontal squash on knuckles!
                    this.scaleY = 0.68;
                    this.scaleZ = 1.30;
                    this.angle = 10;
                } else {
                    this.scaleX = 1.48;
                    this.scaleY = 0.65;
                    this.scaleZ = 1.25;
                    this.angle = -45;
                }

                if (this.phaseTimer <= 0) {
                    this.state = HAND_STATE.RECOVERY;
                    this.phaseTimer = 0.095;
                }
                break;

            case HAND_STATE.RECOVERY:
                this.phaseTimer -= dt;
                const recTotal = 0.095;
                const recProg = 1 - Math.max(0, this.phaseTimer / recTotal);
                // Elastic spring overshoot return to idle
                const easeOut = Math.sin(recProg * Math.PI * 0.5);

                this.scaleX = 1.45 - 0.45 * easeOut;
                this.scaleY = 0.68 + 0.32 * easeOut;
                this.scaleZ = 1.30 - 0.30 * easeOut;
                this.angle = isPunch ? (10 - 24 * easeOut) : (-45 + 57 * easeOut);

                // Smoothly return towards current pointer
                this.x += (this.targetX - this.x) * (0.35 + 0.35 * easeOut);
                this.y += (this.targetY - this.y) * (0.35 + 0.35 * easeOut);

                if (this.phaseTimer <= 0) {
                    this.state = HAND_STATE.IDLE;
                    this.scaleX = 1;
                    this.scaleY = 1;
                    this.scaleZ = 1;
                    this.angle = isPunch ? -14 : 12;
                }
                break;
        }

        this.decayTrail(dt);
    }

    onImpact() {
        if (this.hitCallback) {
            const cb = this.hitCallback;
            const px = this.hitTargetX;
            const py = this.hitTargetY;
            const attack = this.currentAttack;
            this.hitCallback = null;
            cb(px, py, attack);
        }
    }

    recordTrailPoint() {
        this.trailPoints.push({ x: this.x, y: this.y, alpha: 0.85, type: this.currentAttack, scaleZ: this.scaleZ });
        if (this.trailPoints.length > 8) {
            this.trailPoints.shift();
        }
    }

    decayTrail(dt) {
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            this.trailPoints[i].alpha -= dt * 6.5;
            if (this.trailPoints[i].alpha <= 0) {
                this.trailPoints.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // 1. Motion Trail / speed streaks
        this.drawMotionTrail(ctx);

        // 2. Realistic ground shadow beneath hand
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        const shadowScale = (this.state === HAND_STATE.IMPACT) ? 1.45 : (1.0 * this.scaleZ);
        ctx.ellipse(this.x, this.y + 28, 48 * shadowScale, 20 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Draw active hand sprite with comic 3D punch scaling
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.scale(this.scaleX * this.scaleZ, this.scaleY * this.scaleZ);

        const isPunch = (this.currentAttack === 'punch');
        const sprite = isPunch ? this.assets.punchSprite : this.assets.slapSprite;

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            if (isPunch) {
                // Punch fist: natural size ~433x407
                // Knuckles impact point is at top-right of fist: offset so knuckles are at pivot (0, 0)
                const w = 142;
                const h = 133;
                ctx.drawImage(sprite, -w * 0.82, -h * 0.50, w, h);
            } else {
                // Slap hand: natural size ~502x752
                // Palm center lands at pivot (0, 0)
                const w = 125;
                const h = 172;
                ctx.drawImage(sprite, -w * 0.52, -h * 0.72, w, h);
            }
        } else {
            // Procedural fallback
            this.drawProceduralHand(ctx, isPunch);
        }

        // 4. Comic impact burst on knuckles
        if (this.state === HAND_STATE.IMPACT || this.impactFlashAlpha > 0.05) {
            this.drawImpactBurst(ctx, isPunch);
        }

        ctx.restore();
    }

    drawImpactBurst(ctx, isPunch) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.impactFlashAlpha);

        // Comic impact starburst spikes
        const spikeCount = isPunch ? 8 : 10;
        const outerR = isPunch ? 50 : 58;
        const innerR = isPunch ? 16 : 22;
        const color = isPunch ? '#ffd700' : '#f472b6';

        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.8;

        ctx.beginPath();
        for (let i = 0; i < spikeCount * 2; i++) {
            const angle = (i * Math.PI) / spikeCount;
            const r = (i % 2 === 0) ? outerR : innerR;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    drawMotionTrail(ctx) {
        if (this.trailPoints.length < 2) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const isSlap = (this.currentAttack === 'slap');
        const colorRgb = isSlap ? '244, 114, 182' : '255, 215, 0';

        for (let i = 1; i < this.trailPoints.length; i++) {
            const p1 = this.trailPoints[i - 1];
            const p2 = this.trailPoints[i];
            const alpha = Math.max(0, p2.alpha);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${colorRgb}, ${alpha * 0.65})`;
            ctx.lineWidth = 20 * (i / this.trailPoints.length);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawProceduralHand(ctx, isPunch) {
        ctx.save();
        ctx.fillStyle = '#fbcfe8';
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (isPunch) {
            ctx.arc(-20, 0, 38, 0, Math.PI * 2);
        } else {
            ctx.ellipse(0, -30, 26, 48, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}
