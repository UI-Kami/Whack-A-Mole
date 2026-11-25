// src/HammerController.js - Side-Entering Slap & Punch Hand Animation (Back Sleeve Always Off-Screen)
export const HAND_STATE = {
    IDLE: 'IDLE',
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

        this.targetX = config.VIEWPORT_WIDTH / 2;
        this.targetY = config.VIEWPORT_HEIGHT / 2;
        this.x = -500;
        this.y = this.targetY;

        this.state = HAND_STATE.IDLE;
        this.phaseTimer = 0;
        this.strikeDuration = 0.095;
        this.impactDuration = 0.065;
        this.recoveryDuration = 0.115;

        this.handMode = config.HAND_MODE || 'combo';
        this.currentAttack = 'punch';
        this.enterSide = 'left'; // 'left' | 'right'
        this.comboCounter = 0;

        this.angle = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.scaleZ = 1;

        this.startX = -50;
        this.startY = this.targetY;
        this.hitTargetX = this.targetX;
        this.hitTargetY = this.targetY;
        this.hitCallback = null;

        this.trailPoints = [];
        this.impactFlashAlpha = 0;
    }

    setPointer(px, py) {
        this.targetX = px;
        this.targetY = py;
    }

    reset() {
        this.state = HAND_STATE.IDLE;
        this.phaseTimer = 0;
        this.comboCounter = 0;
        this.hitCallback = null;
        this.targetX = this.config.VIEWPORT_WIDTH / 2;
        this.targetY = this.config.VIEWPORT_HEIGHT / 2;
        this.x = -500;
        this.y = this.targetY;
        this.angle = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.scaleZ = 1;
        this.trailPoints = [];
        this.impactFlashAlpha = 0;
    }

    setHandMode(mode) {
        if (mode === 'combo' || mode === 'punch' || mode === 'slap') {
            this.handMode = mode;
        }
    }

    triggerSwing(hitX, hitY, hitCallback, isTouch = false) {
        // Resolve any in-flight swing cleanly so rapid taps never drop hits
        if (this.state === HAND_STATE.STRIKE && this.hitCallback) {
            const cb = this.hitCallback;
            const px = this.hitTargetX;
            const py = this.hitTargetY;
            this.hitCallback = null;
            cb(px, py, this.currentAttack);
        }

        const vw = this.config.VIEWPORT_WIDTH || 1080;

        // Enter smoothly from the nearest side edge so arm cut-out never enters screen!
        this.enterSide = (hitX < vw * 0.5) ? 'left' : 'right';
        this.currentAttack = (this.enterSide === 'left') ? 'punch' : 'slap';
        this.comboCounter++;

        this.targetX = hitX;
        this.targetY = hitY;
        this.hitTargetX = hitX;
        this.hitTargetY = hitY;
        this.hitCallback = hitCallback;

        // Start palm right off the side edge of the screen with smaller scale, sweeping & scaling UP onto target!
        this.startX = (this.enterSide === 'left') ? 24 : (vw - 24);
        this.startY = hitY + 55;
        this.x = this.startX;
        this.y = this.startY;
        this.scaleZ = 0.66;
        this.scaleX = 0.96;
        this.scaleY = 1.04;
        this.angle = (this.enterSide === 'left') ? -14 : 14;
        this.trailPoints = [];

        this.strikeDuration = isTouch ? 0.075 : 0.095;
        this.state = HAND_STATE.STRIKE;
        this.phaseTimer = this.strikeDuration;

        if (this.currentAttack === 'punch') {
            this.audioManager.playPunchSwing();
        } else {
            this.audioManager.playSlapSwing();
        }
    }

    update(dt) {
        if (this.impactFlashAlpha > 0) {
            this.impactFlashAlpha = Math.max(0, this.impactFlashAlpha - dt * 7.0);
        }

        const isLeft = (this.enterSide === 'left');
        const vw = this.config.VIEWPORT_WIDTH || 1080;

        switch (this.state) {
            case HAND_STATE.IDLE:
                // Never hover or spawn mid-screen when idle
                this.trailPoints = [];
                break;

            case HAND_STATE.STRIKE: {
                this.phaseTimer -= dt;
                const total = this.strikeDuration || 0.095;
                const prog = 1 - Math.max(0, this.phaseTimer / total);
                // Smooth cubic ease-out entering from side edge and scaling up toward target
                const ease = 1 - Math.pow(1 - prog, 2.2);

                this.x = this.startX + (this.hitTargetX - this.startX) * ease;
                this.y = this.startY + (this.hitTargetY - this.startY) * ease;

                // Scales up smoothly from 0.66 -> 1.12 as hand reaches the hole!
                this.scaleZ = 0.66 + 0.46 * ease;
                this.scaleX = 0.96 + 0.14 * ease;
                this.scaleY = 1.04 - 0.08 * ease;

                // Sweeps from cocked side angle down toward crisp flat slap
                this.angle = isLeft ? (-14 + 18 * ease) : (14 - 18 * ease);

                this.recordTrailPoint();

                if (this.phaseTimer <= 0) {
                    this.state = HAND_STATE.IMPACT;
                    this.phaseTimer = this.impactDuration;
                    this.x = this.hitTargetX;
                    this.y = this.hitTargetY;
                    this.scaleZ = 1.14;
                    this.scaleX = 1.12;
                    this.scaleY = 0.90;
                    this.angle = isLeft ? 4 : -4;
                    this.onImpact();
                }
                break;
            }

            case HAND_STATE.IMPACT:
                this.phaseTimer -= dt;
                this.impactFlashAlpha = 1.0;
                this.x = this.hitTargetX;
                this.y = this.hitTargetY;
                this.scaleX = 1.12;
                this.scaleY = 0.90;
                this.scaleZ = 1.14;
                this.angle = isLeft ? 4 : -4;

                if (this.phaseTimer <= 0) {
                    this.state = HAND_STATE.RECOVERY;
                    this.phaseTimer = this.recoveryDuration;
                }
                break;

            case HAND_STATE.RECOVERY: {
                this.phaseTimer -= dt;
                const total = this.recoveryDuration || 0.115;
                const prog = 1 - Math.max(0, this.phaseTimer / total);
                const ease = prog * prog;

                // Smoothly retract straight back off the same screen side edge
                const exitX = isLeft ? -40 : (vw + 40);
                const exitY = this.hitTargetY + 45;
                this.x = this.hitTargetX + (exitX - this.hitTargetX) * ease;
                this.y = this.hitTargetY + (exitY - this.hitTargetY) * ease;
                this.scaleZ = 1.14 - 0.46 * ease;
                this.scaleX = 1.12 - 0.12 * ease;
                this.scaleY = 0.90 + 0.10 * ease;
                this.angle = isLeft ? (4 - 14 * ease) : (-4 + 14 * ease);

                if (this.phaseTimer <= 0) {
                    this.state = HAND_STATE.IDLE;
                    this.scaleX = 1;
                    this.scaleY = 1;
                    this.scaleZ = 1;
                    this.angle = 0;
                    this.trailPoints = [];
                }
                break;
            }
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
        if (this.trailPoints.length > 7) {
            this.trailPoints.shift();
        }
    }

    decayTrail(dt) {
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            this.trailPoints[i].alpha -= dt * 7.5;
            if (this.trailPoints[i].alpha <= 0) {
                this.trailPoints.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Never draw stationary chopped hand mid-screen during IDLE
        if (this.state === HAND_STATE.IDLE && this.trailPoints.length === 0) {
            return;
        }

        this.drawMotionTrail(ctx);

        if (this.state === HAND_STATE.IDLE) return;

        const isLeft = (this.enterSide === 'left');
        const vw = this.config.VIEWPORT_WIDTH || 1080;
        const sprite = isLeft
            ? (this.assets.punchSprite || this.assets.slapSprite)
            : (this.assets.slapSprite || this.assets.punchSprite);

        // Ground shadow beneath the striking palm
        ctx.save();
        ctx.fillStyle = (this.state === HAND_STATE.IMPACT) ? 'rgba(0, 0, 0, 0.30)' : 'rgba(0, 0, 0, 0.16)';
        ctx.beginPath();
        const shadowScale = (this.state === HAND_STATE.IMPACT) ? 1.35 : (0.9 * this.scaleZ);
        ctx.ellipse(this.x, this.y + 24, 52 * shadowScale, 20 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw arm entering from screen edge with guaranteed off-screen back edge
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.scale(this.scaleX * this.scaleZ, this.scaleY * this.scaleZ);

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            const natW = sprite.naturalWidth;
            const natH = sprite.naturalHeight;
            const aspect = natW / natH; // ~2.912 for 1529x525 arm sprite

            // Strike anchor point on the palm/fingers inside sprite:
            // Left arm: palm is at (0.85 * w, 0.28 * h); back cut-out sleeve is at X = 0
            // Right arm: palm is at (0.15 * w, 0.28 * h); back cut-out sleeve is at X = w
            const reach = isLeft ? Math.max(0, this.x) : Math.max(0, vw - this.x);
            const effScale = Math.max(0.55, this.scaleX * this.scaleZ);
            // Guarantee rotated back sleeve edge stays >= 80px OFF screen at ALL frames!
            const minRequiredW = (reach + 140) / (0.82 * effScale);
            const drawW = Math.max(820, minRequiredW);
            const drawH = drawW / aspect;

            if (isLeft) {
                ctx.drawImage(sprite, -drawW * 0.85, -drawH * 0.28, drawW, drawH);
            } else {
                ctx.drawImage(sprite, -drawW * 0.15, -drawH * 0.28, drawW, drawH);
            }
        } else {
            this.drawProceduralHand(ctx, isLeft);
        }

        if (this.state === HAND_STATE.IMPACT || this.impactFlashAlpha > 0.05) {
            this.drawImpactBurst(ctx, isLeft);
        }

        ctx.restore();
    }

    drawImpactBurst(ctx, isLeft) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.impactFlashAlpha);

        const spikeCount = 9;
        const outerR = 54;
        const innerR = 20;
        const color = isLeft ? '#ffd700' : '#f472b6';

        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;

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

        const colorRgb = (this.enterSide === 'right') ? '244, 114, 182' : '255, 215, 0';

        for (let i = 1; i < this.trailPoints.length; i++) {
            const p1 = this.trailPoints[i - 1];
            const p2 = this.trailPoints[i];
            const alpha = Math.max(0, p2.alpha);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${colorRgb}, ${alpha * 0.55})`;
            ctx.lineWidth = 18 * (i / this.trailPoints.length);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawProceduralHand(ctx, isLeft) {
        ctx.save();
        ctx.fillStyle = '#fbcfe8';
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(isLeft ? -350 : 350, 20, 420, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}
