// src/MoleController.js - Laughing Mouths & Disguised Bomb Character State Machine
export const MOLE_STATE = {
    HIDDEN: 'HIDDEN',
    PEEKING: 'PEEKING',
    EMERGING: 'EMERGING',
    IDLE: 'IDLE',
    HIT: 'HIT',
    TRANSFORMING_RED: 'TRANSFORMING_RED',
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
        this.riseProgress = 0; // 0 = fully down, 1 = fully up
        this.scaleX = 1;
        this.scaleY = 1;
        this.idleBobTimer = 0;
        this.isHit = false;

        // Bomb detonation timer
        this.detonationTimer = 0;
        this.onDetonate = null;
    }

    spawn(isBomb = false, idleDuration = 1.4, speedFactor = 1.0) {
        const speedScale = Math.min(2.2, Math.max(1.0, speedFactor));
        this.isBomb = isBomb;
        this.state = MOLE_STATE.PEEKING;
        this.timer = (this.config.MOLE_PEEK_TIME || 0.20) / speedScale;
        this.riseProgress = 0.25;
        this.isHit = false;
        this.scaleX = 1;
        this.scaleY = 1;
        this.idleBobTimer = Math.random() * Math.PI * 2;
        this.idleDuration = idleDuration;
        this.speedFactor = speedScale;
        this.detonationTimer = 0;
        this.onDetonate = null;
    }

    explode() {
        this.state = MOLE_STATE.HIDDEN;
        this.riseProgress = 0;
        this.isHit = false;
        this.detonationTimer = 0;
    }

    reset() {
        this.state = MOLE_STATE.HIDDEN;
        this.riseProgress = 0;
        this.isHit = false;
        this.isBomb = false;
        this.detonationTimer = 0;
        this.timer = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.idleBobTimer = 0;
    }

    onHit(hitType = 'punch') {
        if (this.state === MOLE_STATE.HIDDEN || this.isHit || this.state === MOLE_STATE.TRANSFORMING_RED) {
            return null;
        }

        // Bomb hit sequence trigger
        if (this.isBomb) {
            this.isHit = true;
            this.state = MOLE_STATE.TRANSFORMING_RED;
            this.detonationTimer = 0.25;
            this.scaleX = 1.20;
            this.scaleY = 0.85;

            return {
                success: true,
                isBomb: true,
                hitType: hitType,
                x: this.hole.screenX,
                y: this.hole.screenY,
                hole: this.hole
            };
        }

        // Normal laughing mouth hit
        this.isHit = true;
        this.state = MOLE_STATE.HIT;
        this.timer = this.config.MOLE_HIT_RETREAT_TIME || 0.20;
        this.scaleX = 1.35;
        this.scaleY = 0.55;

        return {
            success: true,
            isBomb: false,
            hitType: hitType,
            x: this.hole.screenX,
            y: this.hole.screenY,
            hole: this.hole
        };
    }

    update(dt) {
        if (this.state === MOLE_STATE.HIDDEN) return;

        this.idleBobTimer += dt * 6.0;

        switch (this.state) {
            case MOLE_STATE.PEEKING:
                this.timer -= dt;
                this.riseProgress = 0.25;
                this.scaleX = 1.0 + Math.sin(this.idleBobTimer * 3) * 0.03;
                this.scaleY = 1.0 - Math.sin(this.idleBobTimer * 3) * 0.03;
                if (this.timer <= 0) {
                    this.state = MOLE_STATE.EMERGING;
                    this.timer = (this.config.MOLE_POP_DURATION || 0.24) / (this.speedFactor || 1);
                }
                break;

            case MOLE_STATE.EMERGING:
                this.timer -= dt;
                const emergeTotal = (this.config.MOLE_POP_DURATION || 0.24) / (this.speedFactor || 1);
                const p = Math.max(0, Math.min(1.0, 1 - (this.timer / emergeTotal)));

                if (p < 0.25) {
                    const sub = p / 0.25;
                    this.riseProgress = 0.25 + 0.35 * sub;
                    this.scaleX = 1.0 - 0.10 * Math.sin(sub * Math.PI);
                    this.scaleY = 1.0 + 0.15 * Math.sin(sub * Math.PI);
                } else {
                    const sub = (p - 0.25) / 0.75;
                    const ease = sub * (2 - sub);
                    this.riseProgress = 0.60 + 0.40 * ease;
                    this.scaleX = 1.0;
                    this.scaleY = 1.0;
                }

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.IDLE;
                    this.riseProgress = 1.0;
                    this.scaleX = 1.0;
                    this.scaleY = 1.0;
                    this.timer = this.idleDuration;
                }
                break;

            case MOLE_STATE.IDLE:
                this.timer -= dt;
                // Gentle rhythmic laughing bob
                this.scaleX = 1.0 + Math.sin(this.idleBobTimer * 2.5) * 0.04;
                this.scaleY = 1.0 - Math.sin(this.idleBobTimer * 2.5) * 0.04;
                this.riseProgress = 1.0 + Math.sin(this.idleBobTimer * 2.5) * 0.02;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.DUCKING;
                    this.timer = (this.config.MOLE_DUCK_DURATION || 0.18) / (this.speedFactor || 1);
                }
                break;

            case MOLE_STATE.TRANSFORMING_RED:
                this.detonationTimer -= dt;
                this.scaleX = 1.10 + (Math.random() - 0.5) * 0.20;
                this.scaleY = 1.10 + (Math.random() - 0.5) * 0.20;
                this.riseProgress = 1.0;

                if (this.detonationTimer <= 0) {
                    const cb = this.onDetonate;
                    this.onDetonate = null;
                    this.explode();
                    if (cb) cb();
                }
                break;

            case MOLE_STATE.HIT:
                this.timer -= dt;
                const hitTotal = this.config.MOLE_HIT_RETREAT_TIME || 0.20;
                const hitProg = 1 - Math.max(0, this.timer / hitTotal);
                this.riseProgress = 0.85 * (1 - hitProg * hitProg);
                this.scaleX = 1.35 - hitProg * 0.35;
                this.scaleY = 0.55 + hitProg * 0.45;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                    this.isHit = false;
                }
                break;

            case MOLE_STATE.DUCKING:
                this.timer -= dt;
                const duckTotal = this.config.MOLE_DUCK_DURATION || 0.18;
                const duckProg = Math.max(0, this.timer / duckTotal);
                this.riseProgress = duckProg;
                this.scaleX = 0.95;
                this.scaleY = 1.05;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                }
                break;
        }
    }

    getSpriteFrame() {
        // Disguised bomb: Look identical to normal laughing mouths until struck!
        if (this.state === MOLE_STATE.TRANSFORMING_RED) {
            return this.assets.red_idle || this.assets.red_push || this.assets.red;
        }

        // Normal mouth or disguised bomb while unhit
        if (this.state === MOLE_STATE.HIT) {
            return this.assets.yellow_hit || this.assets.yellow;
        }
        if (this.state === MOLE_STATE.PEEKING) {
            return this.assets.yellow_peek || this.assets.yellow;
        }
        if (this.state === MOLE_STATE.EMERGING) {
            return (this.riseProgress < 0.60) 
                ? (this.assets.yellow_push || this.assets.yellow_peek || this.assets.yellow) 
                : (this.assets.yellow_idle || this.assets.yellow);
        }
        if (this.state === MOLE_STATE.DUCKING) {
            return (this.riseProgress > 0.45) 
                ? (this.assets.yellow_push || this.assets.yellow) 
                : (this.assets.yellow_peek || this.assets.yellow);
        }
        // IDLE
        return this.assets.yellow_idle || this.assets.yellow;
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

        // Size character proportionally to fit snugly in hole
        const charW = holeRadiusX * 2.20;
        const charH = charW * aspect;

        let anchorY;
        const bob = (this.state === MOLE_STATE.IDLE) ? Math.sin(this.idleBobTimer * 2.5) * 3 : 0;

        if (this.state === MOLE_STATE.PEEKING) {
            anchorY = screenY + (holeRadiusY * 0.12);
        } else if (this.state === MOLE_STATE.EMERGING || this.state === MOLE_STATE.DUCKING) {
            const offset = (1.0 - this.riseProgress) * (holeRadiusY * 1.5);
            anchorY = screenY + (holeRadiusY * 0.06) - offset;
        } else if (this.state === MOLE_STATE.HIT) {
            anchorY = screenY - (holeRadiusY * 0.05);
        } else {
            // IDLE / TRANSFORMING_RED
            anchorY = screenY - (holeRadiusY * 0.10) + bob;
        }

        ctx.save();
        ctx.translate(screenX, anchorY);
        ctx.scale(this.scaleX, this.scaleY);

        // If detonating angry red, show red fiery shock pulse
        if (isDetonating) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.beginPath();
            ctx.arc(0, -charH * 0.5, charW * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw crisp normalized sprite centered horizontally, anchored from bottom
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
