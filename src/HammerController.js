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
        this.x = this.targetX;
        this.y = this.targetY;

        // Swing state
        this.state = HAMMER_STATE.IDLE;
        this.phaseTimer = 0;
        this.swingProgress = 0; // 0 to 1

        // Transform properties
        this.angle = this.config.HAMMER_IDLE_ANGLE; // in degrees
        this.scaleX = 1;
        this.scaleY = 1;
        this.squashFactor = 1;

        // Swing target coordinate (where the click occurred)
        this.hitTargetX = 0;
        this.hitTargetY = 0;
        this.hitCallback = null;

        // Motion Trail buffer
        this.trailPoints = [];
        this.idleBob = 0;
    }

    setPointer(px, py) {
        this.targetX = px;
        this.targetY = py;
    }

    triggerSwing(hitX, hitY, hitCallback) {
        // Can interrupt recovery, but not an ongoing forward strike
        if (this.state === HAMMER_STATE.SWING || this.state === HAMMER_STATE.IMPACT) {
            return;
        }

        this.hitTargetX = hitX;
        this.hitTargetY = hitY;
        this.hitCallback = hitCallback;

        // Start anticipation phase
        this.state = HAMMER_STATE.ANTICIPATION;
        this.phaseTimer = this.config.HAMMER_ANTICIPATION_MS / 1000;
        this.audioManager.playHammerSwing();
    }

    update(dt) {
        this.idleBob += dt * 3;

        // Determine handle grip target based on state
        let desiredGripX = this.targetX + 60;
        let desiredGripY = this.targetY + 25;

        // 2. Swing State Machine
        switch (this.state) {
            case HAMMER_STATE.IDLE:
                // Gentle floating breath
                this.angle = this.config.HAMMER_IDLE_ANGLE + Math.sin(this.idleBob) * 2.5;
                this.scaleX = 1;
                this.scaleY = 1;
                this.trailPoints = [];
                break;

            case HAMMER_STATE.ANTICIPATION:
                this.phaseTimer -= dt;
                const anticTotal = this.config.HAMMER_ANTICIPATION_MS / 1000;
                const anticProg = 1 - Math.max(0, this.phaseTimer / anticTotal);
                
                // Lift / cock back & up for momentum
                this.angle = this.config.HAMMER_IDLE_ANGLE + 
                    (this.config.HAMMER_ANTICIPATION_ANGLE - this.config.HAMMER_IDLE_ANGLE) * anticProg;

                desiredGripX = this.targetX + 60 + anticProg * 10;
                desiredGripY = this.targetY + 25 - anticProg * 15;

                if (this.phaseTimer <= 0) {
                    this.state = HAMMER_STATE.SWING;
                    this.phaseTimer = this.config.HAMMER_SWING_MS / 1000;
                }
                break;

            case HAMMER_STATE.SWING:
                this.phaseTimer -= dt;
                const swingTotal = this.config.HAMMER_SWING_MS / 1000;
                const rawProg = 1 - Math.max(0, this.phaseTimer / swingTotal);
                
                // Explosive accelerating ease-in: downward swing arc
                const easeInQuad = rawProg * rawProg;
                this.angle = this.config.HAMMER_ANTICIPATION_ANGLE + 
                    (this.config.HAMMER_IMPACT_ANGLE - this.config.HAMMER_ANTICIPATION_ANGLE) * easeInQuad;

                // Move grip so head lands directly on hitTarget
                const impactGripX = this.hitTargetX + 88;
                const impactGripY = this.hitTargetY - 42;
                desiredGripX = (this.targetX + 70) + (impactGripX - (this.targetX + 70)) * easeInQuad;
                desiredGripY = (this.targetY + 10) + (impactGripY - (this.targetY + 10)) * easeInQuad;

                // Record motion trail arc
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
                this.angle = this.config.HAMMER_IMPACT_ANGLE;
                
                // Squash mallet head against the ground
                this.scaleX = 1.3;
                this.scaleY = 0.72;

                desiredGripX = this.hitTargetX + 88;
                desiredGripY = this.hitTargetY - 42;

                if (this.phaseTimer <= 0) {
                    this.state = HAMMER_STATE.RECOVERY;
                    this.phaseTimer = this.config.HAMMER_RECOVERY_MS / 1000;
                }
                break;

            case HAMMER_STATE.RECOVERY:
                this.phaseTimer -= dt;
                const recovTotal = this.config.HAMMER_RECOVERY_MS / 1000;
                const recovProg = 1 - Math.max(0, this.phaseTimer / recovTotal);
                
                // Spring recovery back up to idle
                const easeOutElastic = Math.sin(recovProg * Math.PI * 0.5);
                this.angle = this.config.HAMMER_IMPACT_ANGLE + 
                    (this.config.HAMMER_IDLE_ANGLE - this.config.HAMMER_IMPACT_ANGLE) * easeOutElastic;
                
                this.scaleX = 0.72 + 0.28 * easeOutElastic;
                this.scaleY = 1.3 - 0.3 * easeOutElastic;

                // Interpolate grip back to resting cursor follow position
                const startGripX = this.hitTargetX + 88;
                const startGripY = this.hitTargetY - 42;
                desiredGripX = startGripX + (this.targetX + 60 - startGripX) * easeOutElastic;
                desiredGripY = startGripY + (this.targetY + 25 - startGripY) * easeOutElastic;

                this.decayTrail(dt);

                if (this.phaseTimer <= 0) {
                    this.state = HAMMER_STATE.IDLE;
                }
                break;
        }

        // Apply fast spring/lerp to desired grip position
        const lerpFactor = Math.min(1.0, dt * 30);
        this.x += (desiredGripX - this.x) * lerpFactor;
        this.y += (desiredGripY - this.y) * lerpFactor;
    }

    onImpact() {
        if (this.hitCallback) {
            this.hitCallback(this.hitTargetX, this.hitTargetY);
        }
        this.cameraShake.addTrauma(0.24, 0, 1);
    }

    recordTrailPoint() {
        const rad = (this.angle * Math.PI) / 180;
        // Head coordinate relative to grip: approx (-85, -75)
        const hx = this.x + Math.cos(rad) * (-85) - Math.sin(rad) * (-75);
        const hy = this.y + Math.sin(rad) * (-85) + Math.cos(rad) * (-75);

        this.trailPoints.push({ x: hx, y: hy, alpha: 0.75 });
        if (this.trailPoints.length > 9) {
            this.trailPoints.shift();
        }
    }

    decayTrail(dt) {
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            this.trailPoints[i].alpha -= dt * 4.5;
            if (this.trailPoints[i].alpha <= 0) {
                this.trailPoints.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // 1. Draw motion blur arc swoosh
        this.drawMotionTrail(ctx);

        // 2. Draw hammer
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.scale(this.scaleX, this.scaleY);

        // Drop shadow beneath hammer
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-40, 20, 42, 16, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

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
        ctx.roundRect(75, -26, 36, 52, 8);
        ctx.fill();
        ctx.stroke();

        // Red central accent ring
        ctx.fillStyle = '#e53935';
        ctx.fillRect(86, -26, 14, 52);

        // Sheen highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.roundRect(80, -22, 6, 44, 3);
        ctx.fill();

        ctx.restore();
    }
}
