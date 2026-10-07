// src/MoleSpawner.js - Fullscreen 3-Row Grid (Max 9 or 12 Holes), Layered Rim & Paws
import { MoleController, MOLE_STATE } from './MoleController.js';

export class Hole {
    constructor(col, row, screenX, screenY, radiusX, radiusY, config, assets) {
        this.col = col;
        this.row = row;
        this.screenX = screenX;
        this.screenY = screenY;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.depthScale = 1.0;
        this.config = config;
        this.assets = assets;
        this.isVisible = true;

        this.mole = new MoleController(this, config, assets);
    }

    getRadiusX() {
        return this.radiusX;
    }

    getRadiusY() {
        return this.radiusY;
    }

    // Complete 3D Layered Hole Rendering (Requirements 1 & 2):
    // Layer 1: Hole Pad & dark cavity
    // Layer 2: Mole emerging upwards (clipped so feet/lower body stay inside cavity)
    // Layer 3: Front silver rim of hole (drawn over lower torso)
    // Layer 4: Mole paws/hands resting around the front rim!
    draw(ctx) {
        if (!this.isVisible) return;

        const rx = this.radiusX;
        const ry = this.radiusY;
        const padW = rx * 2.32;
        const padH = ry * 2.36;

        // --- Layer 1: Hole Pad (Stone mound, 3D silver beveled rim, deep black cavity) ---
        if (this.assets.holePad && this.assets.holePad.complete && this.assets.holePad.naturalWidth > 0) {
            ctx.drawImage(this.assets.holePad, this.screenX - padW * 0.5, this.screenY - padH * 0.5, padW, padH);
        } else {
            // High-quality procedural fallback hole
            this.drawProceduralHole(ctx, rx, ry);
        }

        // --- Layer 2: Mole Emerging from cavity (with bottom mask) ---
        if (this.mole.state !== MOLE_STATE.HIDDEN && this.mole.riseProgress > 0.01) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.screenX - rx * 2.5, this.screenY - 500);
            ctx.lineTo(this.screenX + rx * 2.5, this.screenY - 500);
            ctx.lineTo(this.screenX + rx * 1.04, this.screenY);
            ctx.ellipse(this.screenX, this.screenY, rx * 1.04, ry * 0.44, 0, 0, Math.PI, false);
            ctx.closePath();
            ctx.clip();

            this.mole.draw(ctx, this.screenX, this.screenY, rx, ry);
            ctx.restore();
        }

        // --- Layer 3: Front Silver Rim of Hole (masks character waist/torso) ---
        if (this.mole.state !== MOLE_STATE.HIDDEN && this.mole.riseProgress > 0.05) {
            if (this.assets.holeRim && this.assets.holeRim.complete && this.assets.holeRim.naturalWidth > 0) {
                ctx.drawImage(this.assets.holeRim, this.screenX - padW * 0.5, this.screenY - padH * 0.5, padW, padH);
            }
        }

        // --- Layer 4: Character Paws / Hands gripping over the front rim! (Requirement 2) ---
        // Showing like it crawled out of the hole like a mole!
        if (this.mole.state !== MOLE_STATE.HIDDEN && this.mole.riseProgress > 0.05) {
            this.mole.drawCharacterPaws(ctx, this.screenX, this.screenY, rx, ry);
        }
    }

    drawProceduralHole(ctx, rx, ry) {
        ctx.save();
        // Stone pad mound
        ctx.fillStyle = '#f1ece4';
        ctx.beginPath();
        ctx.ellipse(this.screenX, this.screenY, rx * 1.35, ry * 1.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer silver rim
        ctx.fillStyle = '#b0b3b8';
        ctx.beginPath();
        ctx.ellipse(this.screenX, this.screenY, rx * 1.12, ry * 1.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner dark hole cavity
        ctx.fillStyle = '#111317';
        ctx.beginPath();
        ctx.ellipse(this.screenX, this.screenY, rx * 0.94, ry * 0.94, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class MoleSpawner {
    constructor(config, assets, audioManager, vfxManager, parallaxManager = null) {
        this.config = config;
        this.assets = assets;
        this.audioManager = audioManager;
        this.vfxManager = vfxManager;
        this.parallaxManager = parallaxManager;

        this.holes = [];
        this.spawnTimer = 0.5;
        this.gameTime = 0;

        // Predictable Red Mole cycle (4th hit turns yellow to red and explodes!)
        this.hitCount = 0;
        this.cycleLength = this.config.RED_TRIGGER_COUNT || 4;

        this.initHoles();
    }

    rebuildGrid(config) {
        this.config = config;
        this.cycleLength = this.config.RED_TRIGGER_COUNT || 4;
        this.initHoles();
    }

    // Requirement 1: Only max 9 or 12 Hole to show in full screen in Row (3) and Column (3 or 4)
    // with padding from Up, Down, Left, and Right!
    initHoles() {
        this.holes = [];
        const W = this.config.VIEWPORT_WIDTH || 1200;
        const H = this.config.VIEWPORT_HEIGHT || 800;
        const isPortrait = H > W;

        const rows = 3; // Strictly 3 rows!
        let cols = 4;   // 3 or 4 columns (max 9 or 12 holes)

        if (this.config.GRID_MODE === 9) {
            cols = 3;
        } else if (this.config.GRID_MODE === 12) {
            cols = 4;
        } else {
            // 'auto' mode: 3 cols in portrait (9 holes), 4 cols in landscape (12 holes)
            cols = isPortrait ? 3 : 4;
        }

        // Padding from (Up, down, left and right)
        const padTop = this.config.PADDING_TOP || (isPortrait ? 120 : 130);
        const padBottom = this.config.PADDING_BOTTOM || (isPortrait ? 65 : 75);
        const padX = this.config.PADDING_HORIZONTAL || (isPortrait ? 45 : 75);

        const availW = W - (padX * 2);
        const availH = H - padTop - padBottom;

        const stepX = availW / (cols - 1);
        const stepY = availH / (rows - 1);

        // Optimal hole proportions fitting padded layout comfortably
        const radiusX = Math.min(108, Math.round(stepX * 0.38));
        const radiusY = Math.round(radiusX * 0.52);

        let id = 0;
        for (let r = 0; r < rows; r++) {
            const y = Math.round(padTop + r * stepY);
            for (let c = 0; c < cols; c++) {
                const x = Math.round(padX + c * stepX);
                const hole = new Hole(c, r, x, y, radiusX, radiusY, this.config, this.assets);
                hole.id = id++;
                this.holes.push(hole);
            }
        }
    }

    updateHolePositions() {
        // Holes are cleanly anchored in the 3-row fullscreen grid
    }

    getHitsUntilRed() {
        const remaining = this.cycleLength - (this.hitCount % this.cycleLength);
        return remaining;
    }

    update(dt) {
        this.gameTime += dt;
        this.spawnTimer -= dt;

        for (let i = 0; i < this.holes.length; i++) {
            this.holes[i].mole.update(dt);
        }

        // Spawning cycle
        if (this.spawnTimer <= 0) {
            this.triggerNextSpawn();
        }
    }

    triggerNextSpawn() {
        const progress = Math.min(1.0, this.gameTime / (this.config.INTENSITY_RAMP_DURATION || 180));
        const initInt = this.config.INITIAL_SPAWN_INTERVAL || 1.15;
        const minInt = this.config.MIN_SPAWN_INTERVAL || 0.50;
        const currentInterval = initInt - progress * (initInt - minInt);

        this.spawnTimer = currentInterval * (0.85 + Math.random() * 0.3);

        const eligibleHoles = this.holes.filter(h => h.mole.state === MOLE_STATE.HIDDEN);
        if (eligibleHoles.length === 0) return;

        const maxSimultaneous = this.config.MAX_SIMULTANEOUS_MOLES || 3;
        const activeCount = this.holes.filter(h => h.mole.state !== MOLE_STATE.HIDDEN).length;
        if (activeCount >= maxSimultaneous) return;

        const selectedHole = eligibleHoles[Math.floor(Math.random() * eligibleHoles.length)];

        // Predictable Red Pattern: Is this the mole that will turn Red and explode when hit?
        const isPatternTrigger = (this.getHitsUntilRed() === 1);

        selectedHole.mole.spawn('yellow', isPatternTrigger);
        this.audioManager.playMolePop();
        this.vfxManager.spawnMoleEmergeVFX(selectedHole.screenX, selectedHole.screenY, selectedHole.depthScale);
    }

    // Check hit on active moles
    checkHit(hitX, hitY, isTouch = false, applyHit = true, hitType = 'punch') {
        const activeHoles = [...this.holes]
            .filter(h => h.mole.state !== MOLE_STATE.HIDDEN && !h.mole.isHit)
            .sort((a, b) => b.screenY - a.screenY);

        const radiusMult = isTouch ? 1.45 : 1.15;

        for (let i = 0; i < activeHoles.length; i++) {
            const hole = activeHoles[i];
            const mole = hole.mole;

            const targetX = hole.screenX;
            const targetY = hole.screenY - (mole.riseProgress * 42) - 10;

            const hitRadiusX = (this.config.HAND_HIT_RADIUS || 100) * radiusMult;
            const hitRadiusY = (this.config.HAND_HIT_RADIUS || 100) * 1.25 * radiusMult;

            const dx = (hitX - targetX) / hitRadiusX;
            const dy = (hitY - targetY) / hitRadiusY;

            // Also check hole rim area
            const holeRadX = hole.getRadiusX() * (isTouch ? 1.4 : 1.2);
            const holeRadY = hole.getRadiusY() * (isTouch ? 1.5 : 1.3);
            const hdx = (hitX - hole.screenX) / holeRadX;
            const hdy = (hitY - hole.screenY) / holeRadY;
            const inHoleMound = (hdx * hdx + hdy * hdy) <= 1.0;

            if ((dx * dx + dy * dy <= 1.0) || inHoleMound) {
                if (applyHit) {
                    const hitResult = mole.onHit(hitType);
                    if (hitResult && hitResult.success) {
                        if (!hitResult.penalty) {
                            this.hitCount++;
                        }
                        return {
                            hit: true,
                            hole: hole,
                            mole: mole,
                            x: targetX,
                            y: targetY,
                            depthScale: 1.0,
                            penalty: !!hitResult.penalty,
                            transformedToRed: !!hitResult.transformedToRed,
                            moleType: hitResult.type,
                            hitType: hitType
                        };
                    }
                } else {
                    return {
                        hit: true,
                        hole: hole,
                        mole: mole,
                        x: targetX,
                        y: targetY,
                        depthScale: 1.0,
                        penalty: mole.state === MOLE_STATE.ENRAGED_RED || (mole.isPatternTrigger && mole.type === 'yellow'),
                        moleType: mole.type,
                        hitType: hitType
                    };
                }
            }
        }

        return { hit: false };
    }

    draw(ctx) {
        // Draw 3 rows sorted top-to-bottom so foreground holes naturally overlap background holes
        const sortedHoles = [...this.holes].sort((a, b) => a.screenY - b.screenY);
        for (let i = 0; i < sortedHoles.length; i++) {
            sortedHoles[i].draw(ctx);
        }
    }
}
