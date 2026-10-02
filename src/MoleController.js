// src/MoleController.js - Individual Mole State Machine, 2.5D Depth, Animations & Hit Reactions
export const MOLE_STATE = {
    HIDDEN: 'HIDDEN',
    PEEKING: 'PEEKING',
    EMERGING: 'EMERGING',
    IDLE: 'IDLE',
    HIT: 'HIT',
    RETREATING: 'RETREATING',
    DUCKING: 'DUCKING'
};

export class MoleController {
    constructor(hole, config, assets) {
        this.hole = hole; // Reference to parent Hole
        this.config = config;
        this.assets = assets;

        this.state = MOLE_STATE.HIDDEN;
        this.type = 'normal'; // 'normal' | 'speedy' | 'golden'
        this.timer = 0;
        this.idleDuration = 1.5;

        // Visual animation properties
        this.riseProgress = 0; // 0 = fully underground, 1 = fully up
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetY = 0;
        this.dizzyAngle = 0;
        this.idleBobTimer = 0;
        this.isHit = false;

        // Hit hitbox bounds (calculated dynamically based on depth scale)
        this.hitboxRadius = 45;
    }

    spawn(type = 'normal') {
        this.type = type;
        this.state = MOLE_STATE.PEEKING;
        this.timer = this.config.MOLE_PEEK_TIME * (type === 'speedy' ? 0.6 : 1.0);
        this.riseProgress = 0.15; // Low peek
        this.isHit = false;
        this.scaleX = 1;
        this.scaleY = 1;
        this.idleBobTimer = Math.random() * Math.PI * 2;

        const minIdle = this.config.MOLE_MIN_IDLE_TIME * (type === 'speedy' ? 0.65 : 1.0);
        const maxIdle = this.config.MOLE_MAX_IDLE_TIME * (type === 'speedy' ? 0.75 : 1.0);
        this.idleDuration = minIdle + Math.random() * (maxIdle - minIdle);
    }

    onHit() {
        if (this.state === MOLE_STATE.HIDDEN || this.state === MOLE_STATE.RETREATING || this.isHit) {
            return false;
        }

        this.isHit = true;
        this.state = MOLE_STATE.HIT;
        this.timer = this.config.MOLE_HIT_RETREAT_TIME; // Fast 0.14s hit stun
        
        // Immediate punchy squash
        this.scaleX = 1.45;
        this.scaleY = 0.45;
        this.dizzyAngle = 0;

        return true;
    }

    update(dt) {
        if (this.state === MOLE_STATE.HIDDEN) return;

        this.idleBobTimer += dt * 5;

        switch (this.state) {
            case MOLE_STATE.PEEKING:
                this.timer -= dt;
                this.riseProgress = 0.25; // Just ears and eyes peeking over rim
                if (this.timer <= 0) {
                    this.state = MOLE_STATE.EMERGING;
                    this.timer = this.config.MOLE_POP_DURATION * (this.type === 'speedy' ? 0.6 : 1.0);
                }
                break;

            case MOLE_STATE.EMERGING:
                this.timer -= dt;
                const emergeTotal = this.config.MOLE_POP_DURATION * (this.type === 'speedy' ? 0.6 : 1.0);
                const popProgress = 1 - Math.max(0, this.timer / emergeTotal);
                
                // Overshoot spring pop
                const easeOutBack = 1 + 2.2 * Math.pow(popProgress - 1, 3) + 1.2 * Math.pow(popProgress - 1, 2);
                this.riseProgress = Math.min(1.05, 0.25 + 0.8 * easeOutBack);

                // Stretch vertically while emerging
                this.scaleX = 0.9;
                this.scaleY = 1.12;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.IDLE;
                    this.riseProgress = 1.0;
                    this.timer = this.idleDuration;
                }
                break;

            case MOLE_STATE.IDLE:
                this.timer -= dt;
                // Subtle breathing and idle bobbing
                this.scaleX = 1.0 + Math.sin(this.idleBobTimer * 2) * 0.03;
                this.scaleY = 1.0 - Math.sin(this.idleBobTimer * 2) * 0.03;
                this.riseProgress = 1.0 + Math.sin(this.idleBobTimer * 2.5) * 0.02;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.DUCKING;
                    this.timer = this.config.MOLE_DUCK_DURATION;
                }
                break;

            case MOLE_STATE.HIT:
                this.timer -= dt;
                this.dizzyAngle += dt * 18;

                // Squash down and immediately sink
                const hitProgress = 1 - (this.timer / this.config.MOLE_HIT_RETREAT_TIME);
                this.riseProgress = 0.8 * (1 - hitProgress); // Rapidly duck down while hit
                this.scaleX = 1.45 - hitProgress * 0.3;
                this.scaleY = 0.45 + hitProgress * 0.35;

                if (this.timer <= 0) {
                    // Instantly disappear into hole
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                    this.isHit = false;
                }
                break;

            case MOLE_STATE.RETREATING:
            case MOLE_STATE.DUCKING:
                this.timer -= dt;
                const totalDuck = this.config.MOLE_DUCK_DURATION;
                const duckProg = Math.max(0, this.timer / totalDuck);
                // Ease smoothly into hole
                this.riseProgress = duckProg * duckProg;
                this.scaleX = 0.95;
                this.scaleY = 1.05;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                    this.isHit = false;
                }
                break;
        }
    }

    draw(ctx, holeX, holeY, depthScale, rx, ry) {
        if (this.state === MOLE_STATE.HIDDEN) return;

        ctx.save();

        // Position at hole center
        ctx.translate(holeX, holeY);
        ctx.scale(depthScale, depthScale);

        // Clip mole so it is ONLY visible emerging above the hole's bottom rim
        // This ensures the mole emerges cleanly out of the hole without rendering below the rim
        const rimY = ry * 0.35;
        ctx.beginPath();
        ctx.rect(-rx * 1.6, -300, rx * 3.2, 300 + rimY);
        ctx.clip();

        const moleW = 88;
        const moleH = 108;

        // Anchor mole: when riseProgress = 1.0, paws are at rimY
        // When riseProgress = 0.0, mole is completely below rimY
        const submergedY = (1 - this.riseProgress) * moleH;
        ctx.translate(0, rimY + submergedY);
        ctx.scale(this.scaleX, this.scaleY);

        // Draw shadow cast inside hole
        this.drawMoleShadow(ctx);

        // Draw the mole character
        this.drawMoleBody(ctx, moleW, moleH);

        // If hit, draw dizzy comic stars
        if (this.state === MOLE_STATE.HIT) {
            this.drawDizzyFX(ctx, moleH);
        }

        ctx.restore();
    }

    drawMoleShadow(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#100a04';
        ctx.beginPath();
        ctx.ellipse(0, -6, 36, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawMoleBody(ctx, w, h) {
        const sprite = this.assets.moleSprite;

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            if (this.type === 'golden') {
                ctx.save();
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 18;
            }

            // Draw mole with bottom edge (paws) aligned at y = 0
            ctx.drawImage(sprite, -w / 2, -h, w, h);

            if (this.type === 'golden') {
                ctx.restore();
                this.drawCrown(ctx, 0, -h - 4);
            } else if (this.type === 'speedy') {
                this.drawHeadband(ctx, 0, -h + 34);
            }
        } else {
            this.drawProceduralMole(ctx, w, h);
        }
    }

    drawCrown(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#b78103';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-20, -16);
        ctx.lineTo(-8, -8);
        ctx.lineTo(0, -22);
        ctx.lineTo(8, -8);
        ctx.lineTo(20, -16);
        ctx.lineTo(16, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ruby jewels
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(0, -6, 3, 0, Math.PI * 2);
        ctx.arc(-12, -4, 2, 0, Math.PI * 2);
        ctx.arc(12, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawHeadband(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#e53935';
        ctx.fillRect(-32, -5, 64, 10);
        
        // Headband knot tails blowing in wind
        const flutter = Math.sin(Date.now() * 0.015) * 4;
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(46, -6 + flutter);
        ctx.lineTo(44, 4 + flutter);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawDizzyFX(ctx, moleH) {
        ctx.save();
        ctx.translate(0, -moleH - 10);

        // Orbiting stars
        for (let i = 0; i < 3; i++) {
            const angle = this.dizzyAngle + (i * (Math.PI * 2 / 3));
            const orbitX = Math.cos(angle) * 36;
            const orbitY = Math.sin(angle) * 14;

            ctx.save();
            ctx.translate(orbitX, orbitY);
            ctx.rotate(angle * 2);
            ctx.fillStyle = '#ffeb3b';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            const s = 6;
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    drawProceduralMole(ctx, w, h) {
        // High quality stylized mole backup
        // Mole Body
        const grad = ctx.createLinearGradient(0, -h, 0, 0);
        grad.addColorStop(0, '#6d4c41');
        grad.addColorStop(1, '#4e342e');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, -h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#ffab91';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.45, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#d84315';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.52, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(-15, -h * 0.65, 4.5, 0, Math.PI * 2);
        ctx.arc(15, -h * 0.65, 4.5, 0, Math.PI * 2);
        ctx.fill();
    }
}
