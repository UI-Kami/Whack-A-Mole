// src/MoleController.js - Yellow Mole & Red Mole State Machine, Animations & Paws Around Hole
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
        this.isPatternTrigger = false; // When true, hitting this Yellow mole turns it RED and immediately explodes!
        this.rageShakeTimer = 0;
        this.steamTimer = 0;
    }

    spawn(type = 'yellow', isPatternTrigger = false) {
        this.type = 'yellow'; // Always spawn as Yellow!
        this.isPatternTrigger = isPatternTrigger;
        this.state = MOLE_STATE.PEEKING;
        this.timer = this.config.MOLE_PEEK_TIME || 0.22;
        this.riseProgress = 0.24; // Low peek: hair, eyes, and fingers visible
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

        // Requirement 3: If this Yellow mole is the PATTERN TRIGGER mole:
        // Turns RED and IMMEDIATELY DETONATES without needing a second touch!
        if (this.isPatternTrigger && this.type === 'yellow') {
            this.type = 'red';
            this.isHit = true;
            this.explode(); // Instantly vanishes into explosion VFX
            return {
                success: true,
                transformedToRed: true,
                penalty: true,
                type: 'red',
                hitType: hitType
            };
        }

        // If directly in ENRAGED_RED state (e.g. from debug or dodge):
        if (this.state === MOLE_STATE.ENRAGED_RED) {
            this.isHit = true;
            this.explode();
            return {
                success: true,
                penalty: true,
                type: 'red',
                hitType: hitType
            };
        }

        // Normal Yellow mole hit: successful whack
        this.isHit = true;
        this.state = MOLE_STATE.HIT;
        this.timer = this.config.MOLE_HIT_RETREAT_TIME || 0.20;
        this.scaleX = 1.45;
        this.scaleY = 0.48;
        this.dizzyAngle = 0;

        return {
            success: true,
            penalty: false,
            transformedToRed: false,
            type: 'yellow',
            hitType: hitType
        };
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
                this.glanceX = -3.5;
                this.glanceY = 0;
            } else if (r < 0.70) {
                this.glanceX = 3.5;
                this.glanceY = 0;
            } else {
                this.glanceX = 0;
                this.glanceY = -2;
            }
        }

        switch (this.state) {
            case MOLE_STATE.PEEKING:
                this.timer -= dt;
                this.riseProgress = 0.25;
                this.scaleX = 1.0 + Math.sin(this.idleBobTimer * 3) * 0.03;
                this.scaleY = 1.0 - Math.sin(this.idleBobTimer * 3) * 0.03;
                if (this.timer <= 0) {
                    this.state = MOLE_STATE.EMERGING;
                    this.timer = this.config.MOLE_POP_DURATION || 0.26;
                }
                break;

            case MOLE_STATE.EMERGING:
                this.timer -= dt;
                const emergeTotal = this.config.MOLE_POP_DURATION || 0.26;
                const p = Math.max(0, Math.min(1.0, 1 - (this.timer / emergeTotal)));

                // 3-Phase Juicy Disney/Pixar Pop Curve (Requirement 2):
                // Phase 1 (0.0 to 0.18): Coiling down into hole
                // Phase 2 (0.18 to 0.65): Rocket upward emergence
                // Phase 3 (0.65 to 1.0): Elastic settle and clamp onto rim
                if (p < 0.18) {
                    const sub = p / 0.18;
                    this.riseProgress = 0.25 - 0.08 * Math.sin(sub * Math.PI);
                    this.scaleX = 1.0 + 0.14 * Math.sin(sub * Math.PI);
                    this.scaleY = 1.0 - 0.14 * Math.sin(sub * Math.PI);
                } else if (p < 0.65) {
                    const sub = (p - 0.18) / 0.47;
                    const ease = sub * (2 - sub);
                    this.riseProgress = 0.17 + 0.88 * ease;
                    const stretch = Math.sin(sub * Math.PI);
                    this.scaleX = 1.0 - 0.18 * stretch;
                    this.scaleY = 1.0 + 0.22 * stretch;
                } else {
                    const sub = (p - 0.65) / 0.35;
                    const decay = Math.exp(-sub * 3.5);
                    const wobble = Math.sin(sub * Math.PI * 2.5) * decay;
                    this.riseProgress = 1.0 + 0.04 * wobble;
                    this.scaleX = 1.0 + 0.12 * wobble;
                    this.scaleY = 1.0 - 0.12 * wobble;
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
                    this.timer = this.config.MOLE_DUCK_DURATION || 0.20;
                }
                break;

            case MOLE_STATE.ENRAGED_RED:
                this.timer -= dt;
                if (this.rageShakeTimer > 0) {
                    this.rageShakeTimer -= dt;
                }
                const shakeAmp = (this.rageShakeTimer > 0) ? 0.09 : 0.05;
                this.scaleX = 1.06 + (Math.random() - 0.5) * shakeAmp;
                this.scaleY = 1.06 + (Math.random() - 0.5) * shakeAmp;
                this.riseProgress = 1.0;

                // If player dodged the Red mole, it ducks safely underground (Red dodge reward)
                if (this.timer <= 0) {
                    this.state = MOLE_STATE.DUCKING;
                    this.timer = this.config.MOLE_DUCK_DURATION || 0.20;
                }
                break;

            case MOLE_STATE.HIT:
                this.timer -= dt;
                this.dizzyAngle += dt * 18;

                const hitTotal = this.config.MOLE_HIT_RETREAT_TIME || 0.20;
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
                const duckTotal = this.config.MOLE_DUCK_DURATION || 0.20;
                const duckProg = Math.max(0, this.timer / duckTotal);
                this.riseProgress = duckProg;
                this.scaleX = 0.94 - 0.08 * (1 - duckProg);
                this.scaleY = 1.06 + 0.12 * (1 - duckProg);

                if (this.timer <= 0) {
                    this.state = MOLE_STATE.HIDDEN;
                    this.riseProgress = 0;
                }
                break;
        }
    }

    // Draw Character Body (clipped inside the hole cavity)
    draw(ctx, screenX, screenY, holeRadiusX, holeRadiusY) {
        if (this.state === MOLE_STATE.HIDDEN || this.riseProgress <= 0.01) return;

        const isRed = (this.type === 'red' || this.state === MOLE_STATE.ENRAGED_RED);
        const sprite = isRed ? this.assets.redCharacter : this.assets.yellowCharacter;

        // Size matches hole opening: character fills hole width comfortably
        const charW = holeRadiusX * 2.05;
        const charH = charW * (259 / 264);

        // Emergence vertical anchoring:
        // Head, hair curl, and eyes pop above hole rim; bottom torso sits inside hole
        const travelY = holeRadiusY * 2.8;
        const faceCenterY = (-holeRadiusY * 1.15) + (1.0 - this.riseProgress) * travelY;

        const s = charW / 140;

        ctx.save();
        ctx.translate(screenX, screenY + faceCenterY);

        // Warning tell: subtle pulse before hit so player can predict explosion!
        if (this.isPatternTrigger && !isRed && this.state === MOLE_STATE.IDLE) {
            this.drawPredictorAura(ctx, charW * 1.10, charH * 0.95);
        }

        ctx.scale(this.scaleX, this.scaleY);

        // Red Enraged Fiery Glow (lightweight without heavy shadowBlur)
        if (isRed) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
            ctx.beginPath();
            ctx.arc(0, 0, charW * 0.58, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw clean character sprite
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, -charW * 0.5, -charH * 0.38, charW, charH);

            // Eye enhancements
            if (!isRed) {
                if (this.state === MOLE_STATE.HIT) {
                    this.drawKOEyes(ctx, s);
                } else if (this.isBlinking) {
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.ellipse(-15 * s, 6 * s, 14 * s, 6.5 * s, 0, 0, Math.PI * 2);
                    ctx.ellipse(15 * s, 6 * s, 14 * s, 6.5 * s, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.glanceX !== 0 || this.glanceY !== 0) {
                    ctx.fillStyle = '#1e293b';
                    ctx.beginPath();
                    ctx.arc((-15 + this.glanceX) * s, (6 + this.glanceY) * s, 4.5 * s, 0, Math.PI * 2);
                    ctx.arc((15 + this.glanceX) * s, (6 + this.glanceY) * s, 4.5 * s, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                this.drawAngryEyebrows(ctx, s);
            }
        } else {
            this.drawProceduralCharacter(ctx, charW, charH, isRed);
        }

        // Dizzy stars on hit
        if (this.state === MOLE_STATE.HIT) {
            this.drawDizzyFX(ctx, charH * 0.38);
        }

        ctx.restore();
    }

    // Requirement 2: Draw Character Hands / Paws around the Hole Rim!
    // Shows like the character crawled out of the hole like a mole!
    drawCharacterPaws(ctx, screenX, screenY, holeRadiusX, holeRadiusY) {
        if (this.state === MOLE_STATE.HIDDEN || this.riseProgress <= 0.05) return;

        const isRed = (this.type === 'red' || this.state === MOLE_STATE.ENRAGED_RED);
        const pawW = holeRadiusX * 0.44;
        const pawH = holeRadiusY * 0.58;

        // Paw vertical travel:
        // When peeking (riseProgress ~0.25): paws are resting right at the rim edge
        // When fully up (riseProgress = 1.0): paws are firmly clamped onto the front rim
        // Gentle organic breathing bobbing
        const bob = (this.state === MOLE_STATE.IDLE) ? Math.sin(this.idleBobTimer * 2.4) * 1.5 : 0;
        const pawY = screenY + (holeRadiusY * 0.12) + bob;

        // Left Paw position: on the left side of the hole rim
        const leftPawX = screenX - holeRadiusX * 0.54;
        // Right Paw position: on the right side of the hole rim
        const rightPawX = screenX + holeRadiusX * 0.54;

        ctx.save();

        const pawColor = isRed ? '#ef4444' : '#facc15';
        const pawShade = isRed ? '#b91c1c' : '#eab308';
        const outlineColor = isRed ? '#450a0a' : '#261c0e';
        const clawColor = isRed ? '#ffffff' : '#fef08a';

        // Draw Left Paw
        this.renderSinglePaw(ctx, leftPawX, pawY, pawW, pawH, -0.15, pawColor, pawShade, outlineColor, clawColor, isRed);

        // Draw Right Paw
        this.renderSinglePaw(ctx, rightPawX, pawY, pawW, pawH, 0.15, pawColor, pawShade, outlineColor, clawColor, isRed);

        ctx.restore();
    }

    // Render a single cute cartoon paw gripping over the front rim
    renderSinglePaw(ctx, x, y, w, h, tiltAngle, baseColor, shadeColor, outlineColor, clawColor, isRed) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tiltAngle);

        const r = w * 0.5;

        // 1. Subtle drop shadow onto hole rim
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(0, h * 0.22, r * 1.05, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Paw Base Cushion (rounded oval)
        ctx.fillStyle = shadeColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.08, r * 0.92, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Paw Outline
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = Math.max(2.0, w * 0.09);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.ellipse(0, 0, r, h * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 4. 3 Gripping Fingers / Claws curled downwards over the rim
        const fingerSpacing = r * 0.52;
        for (let i = -1; i <= 1; i++) {
            const fx = i * fingerSpacing;
            const fy = h * 0.22;

            // Finger knuckle line
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = Math.max(1.8, w * 0.08);
            ctx.beginPath();
            ctx.moveTo(fx, -h * 0.12);
            ctx.lineTo(fx, fy);
            ctx.stroke();

            // Little claw / finger pad
            ctx.fillStyle = clawColor;
            ctx.beginPath();
            ctx.arc(fx, fy, Math.max(2.2, r * 0.20), 0, Math.PI * 2);
            ctx.fill();
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
        ctx.beginPath();
        ctx.moveTo(-24 * s, ey - 9 * s);
        ctx.lineTo(-6 * s, ey + 9 * s);
        ctx.moveTo(-6 * s, ey - 9 * s);
        ctx.lineTo(-24 * s, ey + 9 * s);
        ctx.stroke();

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
        ctx.beginPath();
        ctx.moveTo(-25 * s, ey - 10 * s);
        ctx.lineTo(-6 * s, ey - 2 * s);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(25 * s, ey - 10 * s);
        ctx.lineTo(6 * s, ey - 2 * s);
        ctx.stroke();
        ctx.restore();
    }

    // Predictor Glow: pulsing warning ring and banner so player predicts the dangerous mole!
    drawPredictorAura(ctx, w, h) {
        ctx.save();
        const pulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.4;
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse * 0.85})`;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.58, h * 0.58, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Warning badge overhead: "WILL EXPLODE!"
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-50, -h * 0.62, 100, 18, 9);
        } else {
            ctx.rect(-50, -h * 0.62, 100, 18);
        }
        ctx.fill();
        ctx.stroke();

        ctx.font = '800 10px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("WILL EXPLODE!", 0, -h * 0.62 + 9);
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

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-14, -8, 5, 0, Math.PI * 2);
        ctx.arc(14, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
