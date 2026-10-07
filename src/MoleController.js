// src/MoleController.js - Yellow Mole & Red Mole State Machine, Animations & Transformation
export const MOLE_STATE = {
    HIDDEN: 'HIDDEN',
    PEEKING: 'PEEKING',
    EMERGING: 'EMERGING',
    IDLE: 'IDLE',
    HIT: 'HIT',
    ENRAGED_RED: 'ENRAGED_RED',
    DUCKING: 'DUCKING'
};

export class MoleController {
    constructor(hole, config, assets) {
        this.hole = hole; // Reference to parent Hole
        this.config = config;
        this.assets = assets;

        this.state = MOLE_STATE.HIDDEN;
        this.type = 'yellow'; // 'yellow' | 'red'
        this.timer = 0;
        this.idleDuration = 1.6;

        // Visual animation properties
        this.riseProgress = 0; // 0 = fully underground, 1 = fully up
        this.scaleX = 1;
        this.scaleY = 1;
        this.dizzyAngle = 0;
        this.idleBobTimer = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.isHit = false;

        // Eye glancing
        this.glanceTimer = 2.0;
        this.glanceX = 0;
        this.glanceY = 0;

        // Predictable Red Pattern properties
        this.isPatternTrigger = false; // When true, hitting this Yellow mole turns it RED!
        this.rageShakeTimer = 0;
        this.steamTimer = 0;
    }

    spawn(type = 'yellow', isPatternTrigger = false) {
        this.type = 'yellow'; // Always spawn as Yellow!
        this.isPatternTrigger = isPatternTrigger;
        this.state = MOLE_STATE.PEEKING;
        this.timer = this.config.MOLE_PEEK_TIME || 0.25;
        this.riseProgress = 0.22; // Low peek: hair and eyes visible
        this.isHit = false;
        this.scaleX = 1;
        this.scaleY = 1;
        this.idleBobTimer = Math.random() * Math.PI * 2;
        this.blinkTimer = 1.5 + Math.random() * 2;
        this.isBlinking = false;
        this.glanceTimer = 1.0 + Math.random() * 2.0;
        this.glanceX = 0;
        this.glanceY = 0;
        this.rageShakeTimer = 0;
        this.steamTimer = 0;

        const minIdle = this.config.MOLE_MIN_IDLE_TIME || 1.1;
        const maxIdle = this.config.MOLE_MAX_IDLE_TIME || 1.8;
        this.idleDuration = minIdle + Math.random() * (maxIdle - minIdle);
    }

    // Instantly vanish on explosion
    explode() {
        this.state = MOLE_STATE.HIDDEN;
        this.riseProgress = 0;
        this.isHit = false;
    }

    onHit(hitType = 'punch') {
        if (this.state === MOLE_STATE.HIDDEN || this.isHit) {
            return false;
        }

        // 1. If in ENRAGED_RED state -> hitting it causes massive EXPLOSION!
        if (this.state === MOLE_STATE.ENRAGED_RED) {
            this.isHit = true;
            this.explode(); // Instantly vanishes into explosion VFX
            return { success: true, penalty: true, type: 'red' };
        }

        // 2. If this Yellow mole is the PATTERN TRIGGER mole -> TRANSFORMS TO RED!
        if (this.isPatternTrigger && this.type === 'yellow') {
            this.type = 'red';
            this.state = MOLE_STATE.ENRAGED_RED;
            this.timer = this.config.RED_IDLE_TIME || 1.5;
            this.riseProgress = 1.0;
            this.scaleX = 1.25;
            this.scaleY = 0.85;
            this.rageShakeTimer = 0.6;
            return { success: true, transformedToRed: true, type: 'red' };
        }

        // 3. Normal Yellow mole hit
        this.isHit = true;
        this.state = MOLE_STATE.HIT;
        this.timer = this.config.MOLE_HIT_RETREAT_TIME || 0.22;
        this.scaleX = 1.45;
        this.scaleY = 0.48;
        this.dizzyAngle = 0;

        return { success: true, penalty: false, type: 'yellow' };
    }

    update(dt) {
        if (this.state === MOLE_STATE.HIDDEN) return;

        this.idleBobTimer += dt * 5.5;
        this.steamTimer += dt * 8.0;

        // Eye blinking cycle
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.isBlinking = !this.isBlinking;
            this.blinkTimer = this.isBlinking ? 0.12 : (2.0 + Math.random() * 2.5);
        }

        // Eye glance pupil movement
        this.glanceTimer -= dt;
        if (this.glanceTimer <= 0) {
            this.glanceTimer = 1.5 + Math.random() * 2.5;
            const r = Math.random();
            if (r < 0.35) {
                this.glanceX = -3.5; // Look left
                this.glanceY = 0;
            } else if (r < 0.70) {
                this.glanceX = 3.5; // Look right
                this.glanceY = 0;
            } else {
                this.glanceX = 0; // Look center
                this.glanceY = -2;
            }
        }

        switch (this.state) {
            case MOLE_STATE.PEEKING:
                this.timer -= dt;
                this.riseProgress = 0.22;
                // Subtle anticipation breathing while peeking
                this.scaleX = 1.0 + Math.sin(this.idleBobTimer * 3) * 0.03;
                this.scaleY = 1.0 - Math.sin(this.idleBobTimer * 3) * 0.03;
                if (this.timer <= 0) {
                    this.state = MOLE_STATE.EMERGING;
                    this.timer = this.config.MOLE_POP_DURATION || 0.28;
                }
                break;

            case MOLE_STATE.EMERGING:
                this.timer -= dt;
                const emergeTotal = this.config.MOLE_POP_DURATION || 0.28;
                const p = Math.max(0, Math.min(1.0, 1 - (this.timer / emergeTotal)));

                // 3-Phase Juicy Disney/Pixar Squash & Stretch Curve:
                // Phase 1 (0.0 to 0.18): Anticipation / Coiling down into hole
                // Phase 2 (0.18 to 0.65): Rocket upward stretch
                // Phase 3 (0.65 to 1.0): Elastic impact squash, overshoot, and harmonic dampening settle
                if (p < 0.18) {
                    const sub = p / 0.18;
                    this.riseProgress = 0.22 - 0.07 * Math.sin(sub * Math.PI); // subtle dip
                    this.scaleX = 1.0 + 0.14 * Math.sin(sub * Math.PI);       // coil squash
                    this.scaleY = 1.0 - 0.14 * Math.sin(sub * Math.PI);
                } else if (p < 0.65) {
                    const sub = (p - 0.18) / 0.47;
                    const ease = sub * (2 - sub); // smooth rocket propulsion
                    this.riseProgress = 0.15 + 0.90 * ease;
                    const stretch = Math.sin(sub * Math.PI);
                    this.scaleX = 1.0 - 0.18 * stretch; // rocket vertical stretch
                    this.scaleY = 1.0 + 0.24 * stretch;
                } else {
                    const sub = (p - 0.65) / 0.35;
                    const decay = Math.exp(-sub * 3.5);
                    const wobble = Math.sin(sub * Math.PI * 2.5) * decay;
                    this.riseProgress = 1.0 + 0.04 * wobble;
                    this.scaleX = 1.0 + 0.14 * wobble; // bouncy settle
                    this.scaleY = 1.0 - 0.14 * wobble;
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
                // Soft organic breathing and gentle vertical bobbing
                this.scaleX = 1.0 + Math.sin(this.idleBobTimer * 2.4) * 0.035;
                this.scaleY = 1.0 - Math.sin(this.idleBobTimer * 2.4) * 0.035;
                this.riseProgress = 1.0 + Math.sin(this.idleBobTimer * 2.4) * 0.02;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.DUCKING;
                    this.timer = this.config.MOLE_DUCK_DURATION || 0.22;
                }
                break;

            case MOLE_STATE.ENRAGED_RED:
                this.timer -= dt;
                // Angry jitter & steam vibration
                if (this.rageShakeTimer > 0) {
                    this.rageShakeTimer -= dt;
                }
                const shakeAmp = (this.rageShakeTimer > 0) ? 0.09 : 0.05;
                this.scaleX = 1.06 + (Math.random() - 0.5) * shakeAmp;
                this.scaleY = 1.06 + (Math.random() - 0.5) * shakeAmp;
                this.riseProgress = 1.0;

                // If player doesn't hit the Red mole, it ducks safely (Red dodge)
                if (this.timer <= 0) {
                    this.state = MOLE_STATE.DUCKING;
                    this.timer = this.config.MOLE_DUCK_DURATION || 0.22;
                }
                break;

            case MOLE_STATE.HIT:
                this.timer -= dt;
                this.dizzyAngle += dt * 18;

                const hitTotal = this.config.MOLE_HIT_RETREAT_TIME || 0.22;
                const hitProg = 1 - Math.max(0, this.timer / hitTotal);
                this.riseProgress = 0.85 * (1 - hitProg * hitProg);
                this.scaleX = 1.48 - hitProg * 0.48;
                this.scaleY = 0.46 + hitProg * 0.44;

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                    this.isHit = false;
                }
                break;

            case MOLE_STATE.DUCKING:
                this.timer -= dt;
                const duckTotal = this.config.MOLE_DUCK_DURATION || 0.22;
                const duckProg = Math.max(0, this.timer / duckTotal);
                this.riseProgress = duckProg;
                // Stretches slightly down as pulled into the hole
                this.scaleX = 0.94 - 0.08 * (1 - duckProg);
                this.scaleY = 1.06 + 0.12 * (1 - duckProg);

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                }
                break;
        }
    }

    draw(ctx, screenX, screenY, depthScale, holeRadiusX, holeRadiusY) {
        if (this.state === MOLE_STATE.HIDDEN || this.riseProgress <= 0.01) return;

        const isRed = (this.type === 'red' || this.state === MOLE_STATE.ENRAGED_RED);
        const sprite = isRed ? this.assets.redCharacter : this.assets.yellowCharacter;

        // Size matches hole opening: character fills hole width comfortably
        // holeRadiusX is already in screen pixels
        const charW = holeRadiusX * 2.10;
        const charH = charW * (259 / 264);

        // Emergence vertical anchoring:
        // Whack-a-Mole characters pop out head/chest/arms, NEVER lower body or feet!
        // At peak riseProgress = 1.0, face/eyes are raised proudly above the hole rim,
        // while the bottom feet stay deep inside the hole cavity (submerged below hole center).
        const travelY = holeRadiusY * 3.0;
        const faceCenterY = (-holeRadiusY * 1.28) + (1.0 - this.riseProgress) * travelY;

        // Relative scale factor for facial features and accessories
        const s = charW / 140;

        ctx.save();
        ctx.translate(screenX, screenY + faceCenterY);

        // Pattern Trigger tell: subtle warning aura before hit so player can predict!
        if (this.isPatternTrigger && !isRed && this.state === MOLE_STATE.IDLE) {
            this.drawPredictorAura(ctx, charW * 1.10, charH * 0.95);
        }

        // Enraged Red Warning Banner & Steam Puffs
        if (isRed && this.state === MOLE_STATE.ENRAGED_RED) {
            this.drawEnragedSteam(ctx, charW * 0.32, -charH * 0.20);
            this.drawEnragedBadge(ctx, 0, -charH * 0.44 * this.scaleY);
        }

        ctx.scale(this.scaleX, this.scaleY);

        // Red Enraged Fiery Glow
        if (isRed && this.state === MOLE_STATE.ENRAGED_RED) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 22 + Math.sin(this.idleBobTimer * 5) * 8;
        }

        // Draw clean character sprite
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            // Draw centered on face: top is -charH * 0.38, bottom is +charH * 0.62
            ctx.drawImage(sprite, -charW * 0.5, -charH * 0.38, charW, charH);

            // Eye enhancements
            if (!isRed) {
                if (this.state === MOLE_STATE.HIT) {
                    // Cartoon "X X" KO eyes on hit
                    this.drawKOEyes(ctx, s);
                } else if (this.isBlinking) {
                    // Cute blinking eyelids
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.ellipse(-15 * s, 6 * s, 14 * s, 6.5 * s, 0, 0, Math.PI * 2);
                    ctx.ellipse(15 * s, 6 * s, 14 * s, 6.5 * s, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.glanceX !== 0 || this.glanceY !== 0) {
                    // Pupil glance dots for personality
                    ctx.fillStyle = '#1e293b';
                    ctx.beginPath();
                    ctx.arc((-15 + this.glanceX) * s, (6 + this.glanceY) * s, 4.5 * s, 0, Math.PI * 2);
                    ctx.arc((15 + this.glanceX) * s, (6 + this.glanceY) * s, 4.5 * s, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Red mole fierce angry eyebrows
                this.drawAngryEyebrows(ctx, s);
            }
        } else {
            // Procedural fallback
            this.drawProceduralCharacter(ctx, charW, charH, isRed);
        }

        // Dizzy stars on hit
        if (this.state === MOLE_STATE.HIT) {
            this.drawDizzyFX(ctx, charH * 0.38);
        }

        ctx.restore();
    }

    // Cartoon KO "X X" eyes when yellow character is hit
    drawKOEyes(ctx, s = 1.0) {
        ctx.save();
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 4.2 * s;
        ctx.lineCap = 'round';

        const ey = 6 * s;
        // Left eye X
        ctx.beginPath();
        ctx.moveTo(-24 * s, ey - 9 * s);
        ctx.lineTo(-6 * s, ey + 9 * s);
        ctx.moveTo(-6 * s, ey - 9 * s);
        ctx.lineTo(-24 * s, ey + 9 * s);
        ctx.stroke();

        // Right eye X
        ctx.beginPath();
        ctx.moveTo(6 * s, ey - 9 * s);
        ctx.lineTo(24 * s, ey + 9 * s);
        ctx.moveTo(24 * s, ey - 9 * s);
        ctx.lineTo(6 * s, ey + 9 * s);
        ctx.stroke();
        ctx.restore();
    }

    // Angry angled eyebrows for Red character
    drawAngryEyebrows(ctx, s = 1.0) {
        ctx.save();
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 4.5 * s;
        ctx.lineCap = 'round';

        const ey = 2 * s;
        // Left angry eyebrow slant downwards toward nose
        ctx.beginPath();
        ctx.moveTo(-25 * s, ey - 10 * s);
        ctx.lineTo(-6 * s, ey - 2 * s);
        ctx.stroke();

        // Right angry eyebrow slant downwards toward nose
        ctx.beginPath();
        ctx.moveTo(25 * s, ey - 10 * s);
        ctx.lineTo(6 * s, ey - 2 * s);
        ctx.stroke();
        ctx.restore();
    }

    // Steam puffs rising from Red character's temples
    drawEnragedSteam(ctx, xOffset, yOffset) {
        ctx.save();
        const steamPhase = this.steamTimer;
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                const prog = ((steamPhase * 0.8 + i * 0.33) % 1.0);
                const alpha = (1 - prog) * 0.65;
                const r = 4 + prog * 8;
                const px = side * (xOffset + prog * 10);
                const py = yOffset - prog * 28;

                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(px, py, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // Predictor Glow: subtle rhythmic pulse so player easily predicts the next Red mole!
    drawPredictorAura(ctx, w, h) {
        ctx.save();
        const pulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.4;
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse * 0.85})`;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.58, h * 0.58, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Warning badge overhead: "WILL ENRAGE!"
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-46, -h * 0.62, 92, 18, 9);
        } else {
            ctx.rect(-46, -h * 0.62, 92, 18);
        }
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 10px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("WILL ENRAGE!", 0, -h * 0.62 + 9);
        ctx.restore();
    }

    // Enraged Red Mole warning badge: "DON'T HIT!"
    drawEnragedBadge(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        const bob = Math.sin(this.idleBobTimer * 3.5) * 2.5;
        ctx.translate(0, bob);

        ctx.fillStyle = 'rgba(220, 38, 38, 0.96)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-54, -20, 108, 22, 11);
        } else {
            ctx.rect(-54, -20, 108, 22);
        }
        ctx.fill();
        ctx.stroke();

        ctx.font = '900 11px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("! DON'T HIT !", 0, -9);
        ctx.restore();
    }

    drawDizzyFX(ctx, moleH) {
        ctx.save();
        ctx.translate(0, -moleH - 12);
        for (let i = 0; i < 3; i++) {
            const angle = this.dizzyAngle + (i * (Math.PI * 2 / 3));
            const orbitX = Math.cos(angle) * 36;
            const orbitY = Math.sin(angle) * 12;

            ctx.save();
            ctx.translate(orbitX, orbitY);
            ctx.rotate(angle * 2);
            ctx.fillStyle = '#ffeb3b';
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

    drawProceduralCharacter(ctx, w, h, isRed) {
        ctx.save();
        ctx.fillStyle = isRed ? '#dc2626' : '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, w * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-14, -8, 5, 0, Math.PI * 2);
        ctx.arc(14, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
