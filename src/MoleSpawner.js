// src/MoleSpawner.js - Centered 9-Hole Background Integration & Crawling Paws
import { MoleController, MOLE_STATE } from './MoleController.js';
import { NATIVE_HOLES } from './ParallaxManager.js';

export class Hole {
    constructor(col, row, nativeHole, config, assets, parallaxManager = null) {
        this.col = col;
        this.row = row;
        this.nativeHole = nativeHole;
        this.config = config;
        this.assets = assets;
        this.parallaxManager = parallaxManager;

        this.screenX = 0;
        this.screenY = 0;
        this.radiusX = nativeHole.rx || 84;
        this.radiusY = nativeHole.ry || 42;
        this.depthScale = nativeHole.depthScale || 1.0;
        this.isVisible = true;

        this.mole = new MoleController(this, config, assets);
    }

    getRadiusX() {
        return this.radiusX;
    }

    getRadiusY() {
        return this.radiusY;
    }

    // 3D Layered Hole Rendering:
    // Background already draws the stone mound, bevels, and dark cavity (zero stretching!).
    // 1. Mole emerges upwards (clipped so lower body stays inside hole cavity)
    // 2. Character paws/hands gripping over the front rim!
    draw(ctx) {
        if (!this.isVisible) return;

        const rx = this.radiusX;
        const ry = this.radiusY;

        // If background image is missing, render procedural fallback hole
        if (!this.assets.bgImg || !this.assets.bgImg.complete || this.assets.bgImg.naturalWidth === 0) {
            this.drawProceduralHole(ctx, rx, ry);
        }

        // --- Layer 1: Mole Emerging from cavity (with bottom ellipse mask) ---
        if (this.mole.state !== MOLE_STATE.HIDDEN && this.mole.riseProgress > 0.01) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.screenX - rx * 2.5, this.screenY - 500);
            ctx.lineTo(this.screenX + rx * 2.5, this.screenY - 500);
            ctx.lineTo(this.screenX + rx * 1.02, this.screenY);
            ctx.ellipse(this.screenX, this.screenY, rx * 1.02, ry * 0.44, 0, 0, Math.PI, false);
            ctx.closePath();
            ctx.clip();

            this.mole.draw(ctx, this.screenX, this.screenY, rx, ry);
            ctx.restore();
        }

        // --- Layer 2: Character Paws / Hands gripping over the front rim! (Requirement 2) ---
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
        this.updateHolePositions();
    }

    initHoles() {
        this.holes = [];
        for (let i = 0; i < NATIVE_HOLES.length; i++) {
            const nh = NATIVE_HOLES[i];
            const hole = new Hole(nh.col, nh.row, nh, this.config, this.assets, this.parallaxManager);
            hole.id = i;
            this.holes.push(hole);
        }
        this.updateHolePositions();
    }

    updateHolePositions() {
        if (!this.parallaxManager) return;
        const b = this.parallaxManager.bounds;
        const scale = b.scale;
        const ox = b.offsetX;
        const oy = b.offsetY;

        for (let i = 0; i < this.holes.length; i++) {
            const hole = this.holes[i];
            const nh = hole.nativeHole;
            hole.screenX = Math.round(ox + nh.x * scale);
            hole.screenY = Math.round(oy + nh.y * scale);
            hole.radiusX = Math.round(nh.rx * scale);
            hole.radiusY = Math.round(nh.ry * scale);
            hole.depthScale = nh.depthScale * scale;
            hole.isVisible = true;
        }
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
