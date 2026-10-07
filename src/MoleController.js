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

    getSpriteFrame(isRed) {
        if (isRed) {
            if (this.state === MOLE_STATE.HIT) {
                return this.assets.red_hit || this.assets.redCharacter;
            }
            if (this.state === MOLE_STATE.PEEKING) {
                return this.assets.red_peek || this.assets.redCharacter;
            }
            if (this.state === MOLE_STATE.EMERGING) {
                return (this.riseProgress < 0.60) ? (this.assets.red_push || this.assets.red_peek || this.assets.redCharacter) : (this.assets.red_idle || this.assets.redCharacter);
            }
            if (this.state === MOLE_STATE.DUCKING) {
                return (this.riseProgress > 0.45) ? (this.assets.red_push || this.assets.redCharacter) : (this.assets.red_peek || this.assets.redCharacter);
            }
            // IDLE / ENRAGED_RED
            return this.assets.red_idle || this.assets.redCharacter;
        } else {
            if (this.state === MOLE_STATE.HIT) {
                return this.assets.yellow_hit || this.assets.yellowCharacter;
            }
            if (this.state === MOLE_STATE.PEEKING) {
                return this.assets.yellow_peek || this.assets.yellowCharacter;
            }
            if (this.state === MOLE_STATE.EMERGING) {
                return (this.riseProgress < 0.60) ? (this.assets.yellow_push || this.assets.yellow_peek || this.assets.yellowCharacter) : (this.assets.yellow_idle || this.assets.yellowCharacter);
            }
            if (this.state === MOLE_STATE.DUCKING) {
                return (this.riseProgress > 0.45) ? (this.assets.yellow_push || this.assets.yellowCharacter) : (this.assets.yellow_peek || this.assets.yellowCharacter);
            }
            // IDLE
            return this.assets.yellow_idle || this.assets.yellowCharacter;
        }
    }

    // Draw Character with integrated Animated Sprite Frames
    draw(ctx, screenX, screenY, holeRadiusX, holeRadiusY) {
        if (this.state === MOLE_STATE.HIDDEN || this.riseProgress <= 0.01) return;

        const isRed = (this.type === 'red' || this.state === MOLE_STATE.ENRAGED_RED);
        const sprite = this.getSpriteFrame(isRed);

        if (!sprite || !sprite.complete || sprite.naturalWidth === 0) {
            this.drawProceduralCharacter(ctx, holeRadiusX * 2, holeRadiusX * 2, isRed);
            return;
        }

        const natW = sprite.naturalWidth;
        const natH = sprite.naturalHeight;
        const aspect = natH / natW;

        // Size character proportionally to hole width
        const charW = holeRadiusX * 2.15;
        const charH = charW * aspect;

        // Vertical positioning based on animation state:
        let anchorY;
        const bob = (this.state === MOLE_STATE.IDLE) ? Math.sin(this.idleBobTimer * 2.4) * 2.5 : 0;

        if (this.state === MOLE_STATE.PEEKING) {
            // Hands sit right on the hole rim
            anchorY = screenY + (holeRadiusY * 0.14);
        } else if (this.state === MOLE_STATE.EMERGING) {
            const emergeOffset = (1.0 - this.riseProgress) * (holeRadiusY * 1.5);
            anchorY = screenY + (holeRadiusY * 0.08) - emergeOffset;
        } else if (this.state === MOLE_STATE.DUCKING) {
            const duckOffset = (1.0 - this.riseProgress) * (holeRadiusY * 1.6);
            anchorY = screenY + (holeRadiusY * 0.08) - duckOffset;
        } else if (this.state === MOLE_STATE.HIT) {
            anchorY = screenY - (holeRadiusY * 0.05);
        } else {
            // IDLE / ENRAGED_RED
            anchorY = screenY - (holeRadiusY * 0.10) + bob;
        }

        ctx.save();
        ctx.translate(screenX, anchorY);

        // Warning tell: subtle pulse before hit so player can predict explosion!
        if (this.isPatternTrigger && !isRed && this.state === MOLE_STATE.IDLE) {
            this.drawPredictorAura(ctx, charW * 1.10, charH * 0.95);
        }

        ctx.scale(this.scaleX, this.scaleY);

        // Red Enraged subtle glow
        if (isRed) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
            ctx.beginPath();
            ctx.arc(0, -charH * 0.5, charW * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw animated sprite frame anchored horizontally centered and vertically from bottom
        ctx.drawImage(sprite, -charW * 0.5, -charH, charW, charH);

        // Dizzy stars on hit
        if (this.state === MOLE_STATE.HIT) {
            this.drawDizzyFX(ctx, charH);
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
