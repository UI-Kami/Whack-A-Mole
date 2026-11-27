// src/MoleSpawner.js - Continuous Piano Tiles Spawner & Disguised Bomb Scheduler
import { WIN_HITS, computePacingCurve } from './Config.js';
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
        this.radiusX = (nativeHole.rx || 126);
        this.radiusY = (nativeHole.ry || 60);
        this.variant = nativeHole.variant || 'lime';
        this.depthScale = nativeHole.depthScale || 1.0;
        this.isVisible = true;
        this.lastSpawnWasBomb = false;

        this.mole = new MoleController(this, config, assets);
    }

    getRadiusX() {
        return this.radiusX;
    }

    getRadiusY() {
        return this.radiusY;
    }

    drawMole(ctx, parallaxManager = null) {
        if (!this.isVisible || this.mole.state === MOLE_STATE.HIDDEN || this.mole.riseProgress <= 0.01) return;

        const cx = this.screenX;
        const cy = this.screenY;
        const rx = this.radiusX;
        const ry = this.radiusY;
        // Keep paw pockets open ONLY when the character is emerging/clinging on the rim;
        // retract pockets immediately during green DUCKING/HIT (yellow_retract cheeks stay behind rim)
        // and rapidly pull red_sink paws back inside as red character sinks post-explosion.
        let pawBlend = 0;
        if (parallaxManager) {
            if (!this.mole.transformedRed && (this.mole.state === MOLE_STATE.DUCKING || this.mole.state === MOLE_STATE.HIT)) {
                pawBlend = 0;
            } else if (this.mole.transformedRed && this.mole.state === MOLE_STATE.DUCKING) {
                const redT = Math.max(0, Math.min(1, (this.mole.riseProgress - 0.72) / 0.25));
                pawBlend = redT * redT * (3 - 2 * redT);
            } else if (this.mole.state !== MOLE_STATE.TRANSFORMING_RED) {
                pawBlend = parallaxManager.getPawPocketBlend(this.mole.riseProgress);
            }
        }

        // Layer 2: Character Sprite with Split Rim Clipping
        // Generous top & side bounds (cy - 700, cx +/- 2.2*rx) so head, hair, and radiating lines never clip;
        // along the bottom curve, center ~56% stays tucked behind the inner opening while left/right ~22% paw pockets
        // smoothly reveal hands outside on top of the colored front rim when popProgress >= 0.45.
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - rx * 2.2, cy - 700);
        ctx.lineTo(cx + rx * 2.2, cy - 700);
        ctx.lineTo(cx + rx * 2.2, cy);
        if (parallaxManager) {
            parallaxManager.traceSplitFrontCurve(ctx, cx, cy, rx, ry, pawBlend, 1.03, 1.06, 1.48, 2.04);
        } else {
            ctx.lineTo(cx + rx * 1.04, cy);
            ctx.ellipse(cx, cy, rx * 1.04, ry * 1.06, 0, 0, Math.PI, false);
        }
        ctx.lineTo(cx - rx * 2.2, cy);
        ctx.closePath();
        ctx.clip();

        this.mole.draw(ctx, cx, cy, rx, ry);
        ctx.restore();

        // Layer 3: Front Colored Rim Overlay matching center + unrevealed paw pocket complement
        if (parallaxManager) {
            parallaxManager.drawHoleFrontRim(ctx, this, pawBlend);
        }
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
        this.spawnTimer = 0.14;
        this.elapsedTimeline = 0; // seconds elapsed on 90s clock
        this.normalHits = 0;

        this.warmupBombSpawned = false;
        this.warmupBomb2Spawned = false;
        this.lastBombHoleId = -1;
        this.totalBombsSpawned = 0;
        this.speedFactor = 1.9;
        this.pacingCurve = computePacingCurve(0, 0);
        this.onMissThrow = null;

        if (this.parallaxManager) {
            this.parallaxManager.onTileRecycled = (tileIdx) => this.onTileRecycled(tileIdx);
        }

        this.initHoles();
    }

    onTileRecycled(tileIdx) {
        for (let i = 0; i < this.holes.length; i++) {
            const h = this.holes[i];
            if (h.tileIndex === tileIdx) {
                h.lastSpawnWasBomb = false;
                if (h.mole.state !== MOLE_STATE.HIDDEN) {
                    h.mole.reset();
                }
            }
        }
    }

    rebuildGrid(config) {
        this.config = config;
        this.updateHolePositions();
    }

    initHoles() {
        this.holes = [];
        const tileCount = 3;
        for (let t = 0; t < tileCount; t++) {
            for (let i = 0; i < NATIVE_HOLES.length; i++) {
                const nh = NATIVE_HOLES[i];
                const hole = new Hole(t, nh.col, nh.row, nh, this.config, this.assets);
                hole.id = t * NATIVE_HOLES.length + i;
                hole.mole.onMissThrow = (missedHole) => {
                    if (this.onMissThrow) this.onMissThrow(missedHole);
                };
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
            hole.screenX = offsetX + (hole.nativeHole.x * scale);
            hole.screenY = tileY + (hole.nativeHole.y * scale);
            hole.radiusX = (hole.nativeHole.rx || 126) * scale;
            hole.radiusY = (hole.nativeHole.ry || 60) * scale;

            // Only mark visible if hole is inside visible vertical range
            hole.isVisible = (hole.screenY >= 60 && hole.screenY <= H - 40);
        }
    }

    reset() {
        this.spawnTimer = 0.14;
        this.elapsedTimeline = 0;
        this.normalHits = 0;
        this.warmupBombSpawned = false;
        this.warmupBomb2Spawned = false;
        this.lastBombHoleId = -1;
        this.totalBombsSpawned = 0;
        this.speedFactor = 1.9;
        this.pacingCurve = computePacingCurve(0, 0);

        for (let i = 0; i < this.holes.length; i++) {
            this.holes[i].lastSpawnWasBomb = false;
            this.holes[i].mole.reset();
        }
        this.updateHolePositions();
    }

    setSpeedFactor(factor) {
        this.speedFactor = Math.max(1.0, factor);
    }

    setNormalHits(hits) {
        this.normalHits = Math.max(0, hits || 0);
    }

    setPacingCurve(curve) {
        this.pacingCurve = curve;
    }

    update(dt, elapsedTimeline, normalHits = this.normalHits) {
        this.elapsedTimeline = elapsedTimeline;
        this.normalHits = Math.max(0, normalHits || 0);
        this.pacingCurve = computePacingCurve(elapsedTimeline, this.normalHits);
        this.updateHolePositions();

        // Update all active moles
        for (let i = 0; i < this.holes.length; i++) {
            this.holes[i].mole.update(dt);
        }

        // Spawning logic driven cleanly by continuous Piano Tiles curve
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.attemptSpawn();
        }
    }

    attemptSpawn() {
        const time = this.elapsedTimeline;
        const cachedCurve = this.pacingCurve;
        const curve = (cachedCurve && Math.abs(((cachedCurve.timeP || 0) * 90.0) - time) < 0.05 && Math.round((cachedCurve.hitP || 0) * WIN_HITS) === Math.min(WIN_HITS, this.normalHits))
            ? cachedCurve
            : computePacingCurve(time, this.normalHits);

        // Continuous active target ceiling (3 -> 4 -> 5) & exact curve spawn interval
        const maxSimultaneous = curve.maxSimultaneous ?? ((curve.intensity < 0.28) ? 3 : ((curve.intensity < 0.62) ? 4 : 5));
        this.spawnTimer = curve.spawnInterval * (0.92 + Math.random() * 0.16);

        // Count active board state before picking target type/hole
        const visibleHoles = this.holes.filter(h => h.isVisible);
        const activeMoles = visibleHoles.filter(h => h.mole.state !== MOLE_STATE.HIDDEN);
        if (activeMoles.length >= maxSimultaneous) return;

        const availableHoles = visibleHoles.filter(h => h.mole.state === MOLE_STATE.HIDDEN);
        if (availableHoles.length === 0) return;

        const activeBombs = activeMoles.filter(h => h.mole.isBomb).length;
        const activeNormals = activeMoles.length - activeBombs;
        const maxSimultaneousBombs = curve.maxActiveBombs ?? ((time < 45.0) ? 2 : 3);

        // Bombs spawn from t=0: 18% -> 35% in Phase 1 (max 2), jumping to 50% -> 62% in Phase 2 (max 3)
        const currentBombProb = curve.bombProb ?? ((time <= 45.0) ? 0.18 : 0.50);
        let shouldSpawnBomb = Math.random() < currentBombProb;

        // Anti-flood & normal target prioritization guards:
        // 1. Cap simultaneous active bombs (max 2 in first 45s, max 3 in final 45s)
        if (activeBombs >= maxSimultaneousBombs) {
            shouldSpawnBomb = false;
        }
        // 2. Ensure at least 1-2 normal green hittable targets remain on screen alongside bombs
        if (activeMoles.length >= 1 && activeNormals < 1) {
            shouldSpawnBomb = false;
        } else if (maxSimultaneous >= 4 && activeMoles.length >= 2 && activeNormals < 2) {
            shouldSpawnBomb = false;
        }

        // 3. Prevent back-to-back bomb spawns in the same hole
        let candidateHoles = availableHoles;
        if (shouldSpawnBomb) {
            const nonRepeatHoles = availableHoles.filter(h => !h.lastSpawnWasBomb && h.id !== this.lastBombHoleId);
            if (nonRepeatHoles.length > 0) {
                candidateHoles = nonRepeatHoles;
            } else {
                shouldSpawnBomb = false;
            }
        }

        const chosenHole = candidateHoles[Math.floor(Math.random() * candidateHoles.length)];
        const jitterHold = curve.holdDuration * (0.95 + Math.random() * 0.10);
        // Keep wind-up Frames 1-3 within ~0.34s-0.38s (0.34s-0.42s) throughout the entire round
        const missTempoScale = Math.max(0.90, Math.min(1.0, 1.0 - 0.10 * (curve.intensity || 0)));
        const timings = {
            popDuration: curve.popDuration,
            holdDuration: jitterHold,
            duckDuration: curve.duckDuration,
            redRetreatDuration: curve.redRetreatDuration,
            missTempoScale
        };

        chosenHole.mole.spawn(shouldSpawnBomb, jitterHold, timings);
        chosenHole.lastSpawnWasBomb = shouldSpawnBomb;

        if (shouldSpawnBomb) {
            this.lastBombHoleId = chosenHole.id;
            this.totalBombsSpawned++;

            // Pair any bomb spawn with a hittable normal target nearby so skilled players stay supplied with hits
            if (activeNormals === 0 && (activeMoles.length + 1) < maxSimultaneous && availableHoles.length >= 2) {
                const partnerPool = availableHoles.filter(h => h.id !== chosenHole.id);
                if (partnerPool.length > 0) {
                    const partnerHole = partnerPool[Math.floor(Math.random() * partnerPool.length)];
                    const partnerHold = curve.holdDuration * (0.96 + Math.random() * 0.10);
                    partnerHole.mole.spawn(false, partnerHold, {
                        popDuration: curve.popDuration,
                        holdDuration: partnerHold,
                        duckDuration: curve.duckDuration,
                        redRetreatDuration: curve.redRetreatDuration,
                        missTempoScale
                    });
                    partnerHole.lastSpawnWasBomb = false;
                }
            }
        }

        // Pop audio & dust puff
        if (this.audioManager) this.audioManager.playMoleEmerge();
        if (this.vfxManager) this.vfxManager.spawnMoleEmergeVFX(chosenHole.screenX, chosenHole.screenY);
    }

    drawActiveHoles(ctx) {
        // Render Layer 2 (inner-clipped character) + Layer 3 (front rim overlay) top-to-bottom
        const activeVisible = this.holes.filter(
            h => h.isVisible && h.mole.state !== MOLE_STATE.HIDDEN && h.mole.riseProgress > 0.01
        );
        activeVisible.sort((a, b) => a.screenY - b.screenY);

        for (let i = 0; i < activeVisible.length; i++) {
            activeVisible[i].drawMole(ctx, this.parallaxManager);
        }
    }

    checkHit(hitX, hitY, hitRadius, hitType = 'punch') {
        const visibleHoles = this.holes.filter(h => h.isVisible && (h.mole.canBeHit ? h.mole.canBeHit() : (h.mole.state !== MOLE_STATE.HIDDEN && !h.mole.missed)));
        if (visibleHoles.length === 0) return null;

        let bestHole = null;
        let bestDist = Infinity;

        for (let i = 0; i < visibleHoles.length; i++) {
            const h = visibleHoles[i];
            const targetY = h.screenY - h.radiusY * 0.6;
            const dx = hitX - h.screenX;
            const dy = hitY - targetY;
            const dist = Math.hypot(dx, dy);

            const effectiveRadius = Math.max(hitRadius, h.radiusX * 1.25);
            if (dist <= effectiveRadius && dist < bestDist) {
                bestDist = dist;
                bestHole = h;
            }
        }

        if (bestHole) {
            return bestHole.mole.onHit(hitType);
        }

        return null;
    }
}
