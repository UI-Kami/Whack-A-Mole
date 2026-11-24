// src/MoleSpawner.js - 90-Second Timeline Spawner & Disguised Bomb Scheduler
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

    drawMole(ctx) {
        if (!this.isVisible || this.mole.state === MOLE_STATE.HIDDEN || this.mole.riseProgress <= 0.01) return;

        ctx.save();
        // Mask with hole rim so lower body stays neatly inside the hole
        const rx = this.radiusX;
        const ry = this.radiusY;

        ctx.beginPath();
        ctx.moveTo(this.screenX - rx * 2.5, this.screenY - 700);
        ctx.lineTo(this.screenX + rx * 2.5, this.screenY - 700);
        ctx.lineTo(this.screenX + rx * 1.05, this.screenY);
        ctx.ellipse(this.screenX, this.screenY, rx * 1.05, ry * 0.44, 0, 0, Math.PI, false);
        ctx.closePath();
        ctx.clip();

        this.mole.draw(ctx, this.screenX, this.screenY, rx, ry);
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
        this.elapsedTimeline = 0; // seconds elapsed on 90s clock

        this.warmupBombSpawned = false;
        this.warmupBomb2Spawned = false;
        this.totalBombsSpawned = 0;
        this.speedFactor = 1.0;

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
        this.spawnTimer = 0.5;
        this.elapsedTimeline = 0;
        this.warmupBombSpawned = false;
        this.warmupBomb2Spawned = false;
        this.totalBombsSpawned = 0;
        this.speedFactor = 1.0;

        for (let i = 0; i < this.holes.length; i++) {
            this.holes[i].mole.reset();
        }
        this.updateHolePositions();
    }

    setSpeedFactor(factor) {
        this.speedFactor = Math.max(1.0, factor);
    }

    update(dt, elapsedTimeline) {
        this.elapsedTimeline = elapsedTimeline;
        this.updateHolePositions();

        // Update all active moles
        for (let i = 0; i < this.holes.length; i++) {
            this.holes[i].mole.update(dt);
        }

        // Spawning logic according to timeline
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.attemptSpawn();
        }
    }

    attemptSpawn() {
        const time = this.elapsedTimeline;
        let baseInterval = this.config.SPAWN_INTERVAL_WARMUP;
        let maxSimultaneous = 2;
        let idleDuration = this.config.MOLE_IDLE_WARMUP;
        let shouldSpawnBomb = false;

        // Phase 1: 0:00–0:20 Warm-up (Slow pop-ups, introduce disguised bombs early so players learn the mechanic)
        if (time < this.config.PHASE_WARMUP_END) {
            baseInterval = this.config.SPAWN_INTERVAL_WARMUP;
            maxSimultaneous = 2;
            idleDuration = this.config.MOLE_IDLE_WARMUP;

            if (!this.warmupBombSpawned && time >= 6.5) {
                shouldSpawnBomb = true;
                this.warmupBombSpawned = true;
            } else if (this.warmupBombSpawned && !this.warmupBomb2Spawned && time >= 13.5) {
                shouldSpawnBomb = true;
                this.warmupBomb2Spawned = true;
            }
        }
        // Phase 2: 0:20–0:50 Middle (Faster, bombs appear with steady cadence)
        else if (time < this.config.PHASE_MIDDLE_END) {
            baseInterval = this.config.SPAWN_INTERVAL_MIDDLE;
            maxSimultaneous = 2;
            idleDuration = this.config.MOLE_IDLE_MIDDLE;

            if (Math.random() < 0.24) {
                shouldSpawnBomb = true;
            }
        }
        // Phase 3: 0:50–1:20 Pressure (Highest density, bombs more frequent)
        else if (time < this.config.PHASE_PRESSURE_END) {
            baseInterval = this.config.SPAWN_INTERVAL_PRESSURE;
            maxSimultaneous = 3;
            idleDuration = this.config.MOLE_IDLE_PRESSURE;

            if (Math.random() < 0.34) {
                shouldSpawnBomb = true;
            }
        }
        // Phase 4: 1:20–1:30 Final push (Fastest speed, maximum clock pressure)
        else {
            baseInterval = this.config.SPAWN_INTERVAL_FINAL;
            maxSimultaneous = 3;
            idleDuration = this.config.MOLE_IDLE_FINAL;

            if (Math.random() < 0.45) {
                shouldSpawnBomb = true;
            }
        }

        // Apply speedFactor acceleration from bomb hits and progression
        const interval = Math.max(0.35, baseInterval / this.speedFactor);
        this.spawnTimer = interval * (0.85 + Math.random() * 0.30);

        // Count currently active moles on screen
        const visibleHoles = this.holes.filter(h => h.isVisible);
        const activeMoles = visibleHoles.filter(h => h.mole.state !== MOLE_STATE.HIDDEN);

        if (activeMoles.length >= maxSimultaneous) return;

        // Pick an available visible hole
        const availableHoles = visibleHoles.filter(h => h.mole.state === MOLE_STATE.HIDDEN);
        if (availableHoles.length === 0) return;

        const chosenHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
        const idle = Math.max(0.40, (idleDuration / this.speedFactor) * (0.85 + Math.random() * 0.30));

        chosenHole.mole.spawn(shouldSpawnBomb, idle, this.speedFactor);

        if (shouldSpawnBomb) {
            this.totalBombsSpawned++;
        }

        // Pop audio & dust puff
        if (this.audioManager) this.audioManager.playMoleEmerge();
        if (this.vfxManager) this.vfxManager.spawnMoleEmergeVFX(chosenHole.screenX, chosenHole.screenY);
    }

    checkHit(hitX, hitY, hitRadius, hitType = 'punch') {
        const visibleHoles = this.holes.filter(h => h.isVisible && h.mole.state !== MOLE_STATE.HIDDEN);
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
