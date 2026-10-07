// src/MoleSpawner.js - 9-Hole Background Integration, Procedural Scrolling & Predictable Red Pattern
import { MoleController, MOLE_STATE } from './MoleController.js';
import { NATIVE_HOLES } from './ParallaxManager.js';

export class Hole {
    constructor(tileIndex, col, row, nativeHole, config, assets) {
        this.tileIndex = tileIndex;
        this.col = col;
        this.row = row;
        this.nativeHole = nativeHole;
        this.config = config;
        this.assets = assets;

        this.screenX = 0;
        this.screenY = 0;
        this.radiusX = (nativeHole.rx || 85);
        this.radiusY = (nativeHole.ry || 40);
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

    // Draw Mole emerging from the background hole cavity (with bottom rim clipping)
    drawMole(ctx) {
        if (!this.isVisible || this.mole.state === MOLE_STATE.HIDDEN || this.mole.riseProgress <= 0.01) return;

        ctx.save();
        // Continuous single closed polygon clip path:
        // Free emergence upwards for head, hair, badges and FX.
        // Strictly masked by the bottom ellipse rim so lower body and feet are completely hidden!
        const rx = this.radiusX;
        const ry = this.radiusY;

        ctx.beginPath();
        ctx.moveTo(this.screenX - rx * 2.5, this.screenY - 500);
        ctx.lineTo(this.screenX + rx * 2.5, this.screenY - 500);
        ctx.lineTo(this.screenX + rx * 1.04, this.screenY);
        ctx.ellipse(this.screenX, this.screenY, rx * 1.04, ry * 0.44, 0, 0, Math.PI, false);
        ctx.closePath();
        ctx.clip();

        this.mole.draw(ctx, this.screenX, this.screenY, this.depthScale, rx, ry);
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

        // Predictable Red Mole cycle (4th hit turns yellow to red)
        this.hitCount = 0;
        this.cycleLength = this.config.RED_TRIGGER_COUNT || 4;

        if (this.parallaxManager) {
            this.parallaxManager.onTileRecycled = (tileIdx) => this.onTileRecycled(tileIdx);
        }

        this.initHoles();
    }

    onTileRecycled(tileIdx) {
        for (let i = 0; i < this.holes.length; i++) {
            const h = this.holes[i];
            if (h.tileIndex === tileIdx && h.mole.state !== MOLE_STATE.HIDDEN) {
                h.mole.state = MOLE_STATE.HIDDEN;
                h.mole.riseProgress = 0;
                h.mole.isHit = false;
            }
        }
    }

    rebuildGrid(config) {
        this.config = config;
        this.cycleLength = this.config.RED_TRIGGER_COUNT || 4;
        this.updateHolePositions();
    }

    initHoles() {
        this.holes = [];
        // 3 repeating tile instances (conveyor belt)
        // 3 tiles x 21 native holes = 63 hole objects seamlessly moving with the background
        const tileCount = 3;
        for (let t = 0; t < tileCount; t++) {
            for (let i = 0; i < NATIVE_HOLES.length; i++) {
                const nh = NATIVE_HOLES[i];
                const hole = new Hole(t, nh.col, nh.row, nh, this.config, this.assets);
                hole.id = t * NATIVE_HOLES.length + i;
                this.holes.push(hole);
            }
        }
        this.updateHolePositions();
    }

    updateHolePositions() {
        if (!this.parallaxManager) return;
        const scale = this.parallaxManager.bounds.scale;
        const offsetX = this.parallaxManager.bounds.offsetX;
        const H = this.config.VIEWPORT_HEIGHT;

        for (let i = 0; i < this.holes.length; i++) {
            const hole = this.holes[i];
            const tileY = this.parallaxManager.getTileOffsetY(hole.tileIndex);
            hole.screenX = offsetX + hole.nativeHole.x * scale;
            hole.screenY = tileY + hole.nativeHole.y * scale;
            hole.radiusX = hole.nativeHole.rx * scale;
            hole.radiusY = hole.nativeHole.ry * scale;
            hole.depthScale = hole.nativeHole.depthScale * scale;

            // Hole visibility
            hole.isVisible = (hole.screenY >= -80 && hole.screenY <= H + 80);

            // Cleanly reset mole when hole scrolls past bottom of screen
            if (hole.screenY > H + 50 && hole.mole.state !== MOLE_STATE.HIDDEN) {
                hole.mole.state = MOLE_STATE.HIDDEN;
                hole.mole.riseProgress = 0;
                hole.mole.isHit = false;
            }
        }
    }

    getHitsUntilRed() {
        const remaining = this.cycleLength - (this.hitCount % this.cycleLength);
        return remaining;
    }

    update(dt) {
        this.gameTime += dt;
        this.spawnTimer -= dt;

        // Update positions locked to scrolling background
        this.updateHolePositions();

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

        const H = this.config.VIEWPORT_HEIGHT;
        // Eligible holes: visible, hidden, comfortably inside active play area (below HUD, above bottom)
        const eligibleHoles = this.holes.filter(h => 
            h.isVisible && 
            h.screenY >= 90 && 
            h.screenY <= H - 80 &&
            h.mole.state === MOLE_STATE.HIDDEN
        );

        if (eligibleHoles.length === 0) return;

        const maxSimultaneous = this.config.MAX_SIMULTANEOUS_MOLES || 3;
        const activeCount = this.holes.filter(h => h.mole.state !== MOLE_STATE.HIDDEN).length;
        if (activeCount >= maxSimultaneous) return;

        const selectedHole = eligibleHoles[Math.floor(Math.random() * eligibleHoles.length)];

        // Predictable Red Pattern: Is this the mole that will turn Red when hit?
        // When remaining === 1, the next hit turns Red!
        const isPatternTrigger = (this.getHitsUntilRed() === 1);

        selectedHole.mole.spawn('yellow', isPatternTrigger);
        this.audioManager.playMolePop();
        this.vfxManager.spawnMoleEmergeVFX(selectedHole.screenX, selectedHole.screenY, selectedHole.depthScale);
    }

    // Check hit on any active moving mole
    checkHit(hitX, hitY, isTouch = false, applyHit = true, hitType = 'punch') {
        // Sort visible active holes front-to-back (higher screenY = closer to player)
        const activeHoles = [...this.holes]
            .filter(h => h.isVisible && h.mole.state !== MOLE_STATE.HIDDEN && !h.mole.isHit)
            .sort((a, b) => b.screenY - a.screenY);

        const radiusMult = isTouch ? 1.4 : 1.1;

        for (let i = 0; i < activeHoles.length; i++) {
            const hole = activeHoles[i];
            const mole = hole.mole;

            const targetX = hole.screenX;
            // Target center of visible character head/face matching emergence
            const targetY = hole.screenY - (mole.riseProgress * 46 * hole.depthScale) - 10;

            const hitRadiusX = ((this.config.HAND_HIT_RADIUS || 105) * radiusMult) * hole.depthScale;
            const hitRadiusY = ((this.config.HAND_HIT_RADIUS || 105) * 1.25 * radiusMult) * hole.depthScale;

            const dx = (hitX - targetX) / hitRadiusX;
            const dy = (hitY - targetY) / hitRadiusY;

            // Also check hole rim area
            const holeRadX = hole.getRadiusX() * (isTouch ? 1.35 : 1.15);
            const holeRadY = hole.getRadiusY() * (isTouch ? 1.5 : 1.25);
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
                            depthScale: hole.depthScale,
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
                        depthScale: hole.depthScale,
                        penalty: mole.state === MOLE_STATE.ENRAGED_RED,
                        moleType: mole.type,
                        hitType: hitType
                    };
                }
            }
        }

        return { hit: false };
    }

    draw(ctx) {
        // Draw moving holes sorted top-to-bottom so foreground moles overlap background moles properly
        const sortedHoles = [...this.holes]
            .filter(h => h.isVisible)
            .sort((a, b) => a.screenY - b.screenY);

        for (let i = 0; i < sortedHoles.length; i++) {
            sortedHoles[i].drawMole(ctx);
        }
    }
}
