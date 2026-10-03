// src/HammerController.js - Responsive Hammer Physics, Swing Phases, Motion Trails & Impact Juice
export const HAMMER_STATE = {
    IDLE: 'IDLE',
    ANTICIPATION: 'ANTICIPATION',
    SWING: 'SWING',
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

        // Pointer target and current hammer positions
        this.targetX = config.VIEWPORT_WIDTH / 2;
        this.targetY = config.VIEWPORT_HEIGHT / 2;
        this.x = this.targetX + 65;
        this.y = this.targetY + 45;

        // Swing state
        this.state = HAMMER_STATE.IDLE;
        this.phaseTimer = 0;
        this.swingProgress = 0; // 0 to 1

        // Transform properties
        this.angle = this.config.HAMMER_IDLE_ANGLE || 0; // in degrees
        this.scaleX = 1;
        this.scaleY = 1;
        this.squashFactor = 1;

        // Swing target coordinate (where the click occurred)
        this.hitTargetX = this.targetX;
        this.hitTargetY = this.targetY;
        this.hitCallback = null;

        // Motion Trail buffer
        this.trailPoints = [];
        this.idleBob = 0;
    }

    setPointer(px, py) {
        this.targetX = px;
        this.targetY = py;
    }

    triggerSwing(hitX, hitY, hitCallback, isTouch = false) {
        // If an ongoing swing had an unfulfilled hit, complete it right away so rapid multi-taps don't drop
        if ((this.state === HAMMER_STATE.SWING || this.state === HAMMER_STATE.ANTICIPATION) && this.hitCallback) {
            const pendingCb = this.hitCallback;
            const px = this.hitTargetX;
            const py = this.hitTargetY;
            this.hitCallback = null;
            pendingCb(px, py);
        }

        this.targetX = hitX;
        this.targetY = hitY;
        this.hitTargetX = hitX;
        this.hitTargetY = hitY;
        this.hitCallback = hitCallback;

        // Exact impact grip position so head (-75, -75) lands precisely on hitTarget
        const impactGripX = hitX + 98;
        const impactGripY = hitY - 41;

        if (isTouch) {
            // Immediate snap to strike position on mobile touch
            this.x = impactGripX + 15;
            this.y = impactGripY - 25;
            this.angle = 20;
            this.state = HAMMER_STATE.ANTICIPATION;
            this.phaseTimer = 0.02; // Ultra snappy 20ms anticipation on touch
        } else {
            const dist = Math.hypot(this.x - impactGripX, this.y - impactGripY);
            if (dist > 180) {
                this.x = hitX + 70;
                this.y = hitY - 20;
            }
            this.state = HAMMER_STATE.ANTICIPATION;
            this.phaseTimer = (this.config.HAMMER_ANTICIPATION_MS || 40) / 1000;
        }

        this.audioManager.playHammerSwing();
    }

    update(dt) {
        this.idleBob += dt * 3.5;

        // Target grip offsets
        const impactGripX = this.hitTargetX + 98;
        const impactGripY = this.hitTargetY - 41;

        let desiredGripX = this.targetX + 65;
        let desiredGripY = this.targetY + 45;

        // Swing State Machine
        switch (this.state) {
            case HAMMER_STATE.IDLE:
                // Gentle floating breath
                this.angle = (this.config.HAMMER_IDLE_ANGLE || 0) + Math.sin(this.idleBob) * 2.5;
                this.scaleX = 1;
                this.scaleY = 1;
                this.trailPoints = [];
                break;

            case HAMMER_STATE.ANTICIPATION:
                this.phaseTimer -= dt;
                const anticTotal = 0.04;
                const anticProg = 1 - Math.max(0, this.phaseTimer / anticTotal);
                
                // Lift / cock back & up for momentum
                this.angle = (this.config.HAMMER_IDLE_ANGLE || 0) + 
                    ((this.config.HAMMER_ANTICIPATION_ANGLE || 26) - (this.config.HAMMER_IDLE_ANGLE || 0)) * anticProg;

                desiredGripX = impactGripX + 15 + anticProg * 10;
                desiredGripY = impactGripY - 25 - anticProg * 15;

                if (this.phaseTimer <= 0) {
                    this.state = HAMMER_STATE.SWING;
                    this.phaseTimer = (this.config.HAMMER_SWING_MS || 50) / 1000;
                }
                break;

            case HAMMER_STATE.SWING:
                this.phaseTimer -= dt;
                const swingTotal = (this.config.HAMMER_SWING_MS || 50) / 1000;
                const rawProg = 1 - Math.max(0, this.phaseTimer / swingTotal);
                
                // Explosive accelerating ease-in downward smash
                const easeInQuad = rawProg * rawProg;
                const impactAngle = this.config.HAMMER_IMPACT_ANGLE || -68;
                const anticAngle = this.config.HAMMER_ANTICIPATION_ANGLE || 26;

                this.angle = anticAngle + (impactAngle - anticAngle) * easeInQuad;

                desiredGripX = (impactGripX + 20) + (impactGripX - (impactGripX + 20)) * easeInQuad;
                desiredGripY = (impactGripY - 35) + (impactGripY - (impactGripY - 35)) * easeInQuad;

                this.recordTrailPoint();

                if (this.phaseTimer <= 0) {
                    this.state = HAMMER_STATE.IMPACT;
                    this.phaseTimer = 0.05; // 50ms impact squash
                    this.x = impactGripX;
                    this.y = impactGripY;
                    this.onImpact();
                }
                break;

            case HAMMER_STATE.IMPACT:
                this.phaseTimer -= dt;
                this.angle = this.config.HAMMER_IMPACT_ANGLE || -68;
                
                // Squash mallet head against the ground
                this.scaleX = 1.25;
                this.scaleY = 0.76;

                desiredGripX = impactGripX;
                desiredGripY = impactGripY;

                if (this.phaseTimer <= 0) {
                    this.state = HAMMER_STATE.RECOVERY;
                    this.phaseTimer = (this.config.HAMMER_RECOVERY_MS || 120) / 1000;
                }
                break;

            case HAMMER_STATE.RECOVERY:
                this.phaseTimer -= dt;
                const recovTotal = (this.config.HAMMER_RECOVERY_MS || 120) / 1000;
                const recovProg = 1 - Math.max(0, this.phaseTimer / recovTotal);
                
                // Spring recovery back up to idle
                const easeOutElastic = Math.sin(recovProg * Math.PI * 0.5);
                const startAngle = this.config.HAMMER_IMPACT_ANGLE || -68;
                const endAngle = this.config.HAMMER_IDLE_ANGLE || 0;

                this.angle = startAngle + (endAngle - startAngle) * easeOutElastic;
                
                this.scaleX = 0.76 + 0.24 * easeOutElastic;
                this.scaleY = 1.25 - 0.25 * easeOutElastic;

                desiredGripX = impactGripX + (this.targetX + 65 - impactGripX) * easeOutElastic;
                desiredGripY = impactGripY + (this.targetY + 45 - impactGripY) * easeOutElastic;

                this.decayTrail(dt);

                if (this.phaseTimer <= 0) {
                    this.state = HAMMER_STATE.IDLE;
                }
                break;
        }

        // Apply fast spring/lerp to desired grip position
        const lerpFactor = Math.min(1.0, dt * 35);
        this.x += (desiredGripX - this.x) * lerpFactor;
        this.y += (desiredGripY - this.y) * lerpFactor;
    }

    onImpact() {
        if (this.hitCallback) {
            this.hitCallback(this.hitTargetX, this.hitTargetY);
            this.hitCallback = null;
        }
        this.cameraShake.addTrauma(0.24, 0, 1);
    }

    recordTrailPoint() {
        const rad = (this.angle * Math.PI) / 180;
        // Head coordinate relative to grip: approx (-75, -75)
        const hx = this.x + Math.cos(rad) * (-75) - Math.sin(rad) * (-75);
        const hy = this.y + Math.sin(rad) * (-75) + Math.cos(rad) * (-75);

        this.trailPoints.push({ x: hx, y: hy, alpha: 0.75 });
        if (this.trailPoints.length > 8) {
            this.trailPoints.shift();
        }
    }

    decayTrail(dt) {
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            this.trailPoints[i].alpha -= dt * 5.0;
            if (this.trailPoints[i].alpha <= 0) {
                this.trailPoints.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // 1. Draw motion blur arc swoosh
        this.drawMotionTrail(ctx);

        // 2. Realistic ground drop shadow beneath mallet head
        const rad = (this.angle * Math.PI) / 180;
        const headX = this.x + Math.cos(rad) * (-75) - Math.sin(rad) * (-75);
        const headY = this.y + Math.sin(rad) * (-75) + Math.cos(rad) * (-75);

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        const shadowScale = (this.state === HAMMER_STATE.IMPACT) ? 1.25 : 0.95;
        ctx.ellipse(headX, headY + 16, 36 * shadowScale, 14 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Draw hammer
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.scale(this.scaleX, this.scaleY);

        const sprite = this.assets.hammerSprite;

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            // Draw clean toy mallet with handle grip at (0, 0)
            const w = 115;
            const h = 115;
            ctx.drawImage(sprite, -w * 0.91, -h * 0.92, w, h);
        } else {
            this.drawProceduralHammer(ctx);
        }

        ctx.restore();
    }

    drawMotionTrail(ctx) {
        if (this.trailPoints.length < 2) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < this.trailPoints.length; i++) {
            const p1 = this.trailPoints[i - 1];
            const p2 = this.trailPoints[i];
            const alpha = Math.max(0, p2.alpha);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 235, 59, ${alpha * 0.6})`;
            ctx.lineWidth = 14 * (i / this.trailPoints.length);
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 8;
            ctx.stroke();
        }

        ctx.restore();
    }

    drawProceduralHammer(ctx) {
        // Wooden handle angled towards top-left (-85, -75)
        ctx.save();
        ctx.rotate(-Math.PI * 0.77);

        // Wooden handle from grip (0,0) extending along X
        ctx.fillStyle = '#8d6e63';
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(0, -6, 95, 12, 5);
        ctx.fill();
        ctx.stroke();

        // Blue rubber mallet head
        const headGrad = ctx.createLinearGradient(75, -28, 115, 28);
        headGrad.addColorStop(0, '#42a5f5');
        headGrad.addColorStop(0.5, '#1e88e5');
        headGrad.addColorStop(1, '#1565c0');
        ctx.fillStyle = headGrad;
        ctx.strokeStyle = '#0d47a1';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(75, -28, 40, 56, 10);
        ctx.fill();
        ctx.stroke();

        // Striking face cushions (yellow rubber bumpers)
        ctx.fillStyle = '#ffca28';
        ctx.fillRect(75, -28, 6, 56);
        ctx.fillRect(109, -28, 6, 56);

        ctx.restore();
    }
}
