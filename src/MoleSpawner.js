// src/MoleSpawner.js - Manages infinite scrolling hole field & mole spawning cycles
import { MoleController, MOLE_STATE } from './MoleController.js';

export class Hole {
    constructor(col, row, config, assets) {
        this.col = col;
        this.row = row;
        this.config = config;
        this.assets = assets;

        // Relative coordinates within the scrolling grid
        this.gridX = 0;
        this.gridY = 0;

        // Screen coordinates updated every frame
        this.screenX = 0;
        this.screenY = 0;
        this.depthScale = 1.0;
        this.isVisible = false;

        // Each hole has its own MoleController
        this.mole = new MoleController(this, config, assets);
    }

    // Radius of hole opening
    getRadiusX() {
        return this.config.HOLE_BASE_RADIUS_X * this.depthScale;
    }

    getRadiusY() {
        return this.config.HOLE_BASE_RADIUS_Y * this.depthScale;
    }

    // 1. Hole Cavity & Subterranean Shadow (drawn behind mole)
    drawBack(ctx, theme) {
        if (!this.isVisible) return;

        ctx.save();
        ctx.translate(this.screenX, this.screenY);

        const rx = this.getRadiusX();
        const ry = this.getRadiusY();

        // 3D Mound dirt back shadow
        let moundShadow = 'rgba(27, 94, 32, 0.4)';
        if (theme === 'cheese') moundShadow = 'rgba(180, 83, 9, 0.38)';
        else if (theme === 'desert') moundShadow = 'rgba(127, 29, 29, 0.4)';
        else if (theme === 'candy') moundShadow = 'rgba(190, 24, 93, 0.35)';
        else if (theme === 'cyber') moundShadow = 'rgba(6, 182, 212, 0.35)';

        ctx.fillStyle = moundShadow;
        ctx.beginPath();
        ctx.ellipse(0, 4 * this.depthScale, rx * 1.22, ry * 1.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Deep hole cavity
        const holeGrad = ctx.createRadialGradient(0, -ry * 0.2, 0, 0, 0, rx);
        if (theme === 'cheese') {
            holeGrad.addColorStop(0, '#451a03');
            holeGrad.addColorStop(0.7, '#b45309');
            holeGrad.addColorStop(1, '#d97706');
        } else if (theme === 'desert') {
            holeGrad.addColorStop(0, '#260803');
            holeGrad.addColorStop(0.65, '#7c2d12');
            holeGrad.addColorStop(1, '#9a3412');
        } else if (theme === 'candy') {
            holeGrad.addColorStop(0, '#3b0764');
            holeGrad.addColorStop(0.65, '#831843');
            holeGrad.addColorStop(1, '#be185d');
        } else if (theme === 'cyber') {
            holeGrad.addColorStop(0, '#030712');
            holeGrad.addColorStop(0.65, '#1e1b4b');
            holeGrad.addColorStop(1, '#0891b2');
        } else {
            holeGrad.addColorStop(0, '#1a1006');
            holeGrad.addColorStop(0.65, '#3e2723');
            holeGrad.addColorStop(1, '#5d4037');
        }

        ctx.fillStyle = holeGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner shadow on top edge of hole
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.ellipse(0, -ry * 0.35, rx * 0.88, ry * 0.65, 0, 0, Math.PI);
        ctx.fill();

        ctx.restore();
    }

    // 2. Mole (drawn inside hole)
    drawMole(ctx) {
        if (!this.isVisible) return;
        this.mole.draw(ctx, this.screenX, this.screenY, this.depthScale, this.getRadiusX(), this.getRadiusY());
    }

    // 3. Hole Rim, 3D Dirt Mound Lip (drawn in front of mole paws)
    drawFront(ctx, theme) {
        if (!this.isVisible) return;

        ctx.save();
        ctx.translate(this.screenX, this.screenY);

        const rx = this.getRadiusX();
        const ry = this.getRadiusY();

        // Lower rim lip (mound in front)
        let rimFill = '#5d4037';
        let rimStroke = '#8d6e63';
        if (theme === 'cheese') {
            rimFill = '#d97706';
            rimStroke = '#fde047';
        } else if (theme === 'desert') {
            rimFill = '#9a3412';
            rimStroke = '#fb923c';
        } else if (theme === 'candy') {
            rimFill = '#be185d';
            rimStroke = '#f472b6';
        } else if (theme === 'cyber') {
            rimFill = '#0e7490';
            rimStroke = '#22d3ee';
        }

        ctx.fillStyle = rimFill;
        ctx.beginPath();
        ctx.ellipse(0, ry * 0.35, rx, ry * 0.75, 0, 0, Math.PI);
        ctx.fill();

        // Highlight rim edge
        ctx.strokeStyle = rimStroke;
        ctx.lineWidth = 3.5 * this.depthScale;
        ctx.beginPath();
        ctx.ellipse(0, ry * 0.2, rx * 0.98, ry * 0.65, 0, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        // Small pebbles / details on mound front
        if (theme === 'garden') {
            ctx.fillStyle = '#4e342e';
            ctx.beginPath();
            ctx.arc(-rx * 0.5, ry * 0.5, 3 * this.depthScale, 0, Math.PI * 2);
            ctx.arc(rx * 0.45, ry * 0.6, 2.5 * this.depthScale, 0, Math.PI * 2);
            ctx.fill();
        } else if (theme === 'cyber') {
            // Neon accent nodes
            ctx.fillStyle = '#67e8f9';
            ctx.beginPath();
            ctx.arc(-rx * 0.5, ry * 0.45, 2.5 * this.depthScale, 0, Math.PI * 2);
            ctx.arc(rx * 0.5, ry * 0.45, 2.5 * this.depthScale, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

export class MoleSpawner {
    constructor(config, assets, audioManager, vfxManager) {
        this.config = config;
        this.assets = assets;
        this.audioManager = audioManager;
        this.vfxManager = vfxManager;

        this.holes = [];
        this.spawnTimer = 0;
        this.gameTime = 0;

        // Grid calculation
        this.cols = config.HOLE_COLUMNS; // 4 columns (or 3 in portrait)
        this.rows = config.HOLE_ROWS;    // 5 rows (or 6 in portrait)
        this.initHoles();
    }

    rebuildGrid(config) {
        this.config = config;
        this.cols = config.HOLE_COLUMNS;
        this.rows = config.HOLE_ROWS;
        this.holes = [];
        this.initHoles();
    }

    initHoles() {
        const w = this.config.VIEWPORT_WIDTH;
        const horizon = this.config.PERSPECTIVE_HORIZON_Y;
        const h = this.config.VIEWPORT_HEIGHT;
        const groundH = h - horizon;

        const colWidth = w / (this.cols + 1);
        const rowHeight = this.config.HOLE_VERTICAL_SPACING;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const hole = new Hole(c, r, this.config, this.assets);
                
                // Stagger columns slightly for natural staggered arcade layout
                const stagger = (r % 2 === 1) ? colWidth * 0.25 : -colWidth * 0.2;
                hole.gridX = colWidth * (c + 1) + stagger;
                hole.gridY = r * rowHeight;

                this.holes.push(hole);
            }
        }
    }

    update(dt, scrollYGround) {
        this.gameTime += dt;
        this.spawnTimer -= dt;

        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const horizon = this.config.PERSPECTIVE_HORIZON_Y;
        const gridTotalHeight = this.rows * this.config.HOLE_VERTICAL_SPACING;

        // Update positions of all holes on the scrolling 2.5D plane
        for (let i = 0; i < this.holes.length; i++) {
            const hole = this.holes[i];

            // Upward scrolling world offset
            let rawY = (hole.gridY - scrollYGround) % gridTotalHeight;
            if (rawY < 0) rawY += gridTotalHeight;

            // Map into 2.5D ground plane (from horizon to bottom)
            const normY = rawY / gridTotalHeight;
            // Perspective easing (holes bunch slightly toward horizon)
            const perspectiveY = horizon + Math.pow(normY, 1.45) * (h - horizon);

            hole.screenY = perspectiveY;

            // Perspective X spread: wider near bottom, narrower near horizon
            const depthFactor = Math.max(0, Math.min(1.0, (perspectiveY - horizon) / (h - horizon)));
            const centerX = w * 0.5;
            const spreadFactor = this.config.IS_PORTRAIT ? (0.68 + depthFactor * 0.45) : (0.55 + depthFactor * 0.65);
            hole.screenX = centerX + (hole.gridX - centerX) * spreadFactor;

            // Depth Scale
            hole.depthScale = this.config.PERSPECTIVE_MIN_SCALE + 
                (this.config.PERSPECTIVE_MAX_SCALE - this.config.PERSPECTIVE_MIN_SCALE) * depthFactor;

            // Visibility check
            hole.isVisible = (hole.screenY >= horizon + 15 && hole.screenY <= h + 30);

            // Update mole state
            hole.mole.update(dt);
        }

        // Spawning cycle
        if (this.spawnTimer <= 0) {
            this.triggerNextSpawn();
        }
    }

    triggerNextSpawn() {
        // Calculate progression: ramp from initial interval to min interval smoothly
        const progress = Math.min(1.0, this.gameTime / this.config.INTENSITY_RAMP_DURATION);
        const currentInterval = this.config.INITIAL_SPAWN_INTERVAL - 
            progress * (this.config.INITIAL_SPAWN_INTERVAL - this.config.MIN_SPAWN_INTERVAL);

        // Add slight random variance (+- 20%)
        this.spawnTimer = currentInterval * (0.8 + Math.random() * 0.4);

        // Find eligible visible empty holes
        const eligibleHoles = this.holes.filter(h => 
            h.isVisible && 
            h.screenY > this.config.PERSPECTIVE_HORIZON_Y + 50 &&
            h.screenY < this.config.VIEWPORT_HEIGHT - 30 &&
            h.mole.state === MOLE_STATE.HIDDEN
        );

        if (eligibleHoles.length === 0) return;

        // Count currently active moles
        const activeCount = this.holes.filter(h => h.mole.state !== MOLE_STATE.HIDDEN).length;
        if (activeCount >= this.config.MAX_SIMULTANEOUS_MOLES) return;

        // Choose random hole
        const selectedHole = eligibleHoles[Math.floor(Math.random() * eligibleHoles.length)];

        // Count active humans to avoid multiple humans at once
        const activeHumans = this.holes.filter(h => h.mole.state !== MOLE_STATE.HIDDEN && h.mole.type === 'human').length;
        const humanChance = this.config.HUMAN_SPAWN_CHANCE || 0.22;

        // Choose mole/character type
        let moleType = 'normal';
        if (this.gameTime > 2.5 && activeHumans === 0 && Math.random() < humanChance) {
            moleType = 'human';
        } else {
            const roll = Math.random();
            if (roll < 0.12) {
                moleType = 'golden';
            } else if (roll < 0.32) {
                moleType = 'speedy';
            }
        }

        selectedHole.mole.spawn(moleType);
        this.audioManager.playMolePop();
        this.vfxManager.spawnMoleEmergeVFX(selectedHole.screenX, selectedHole.screenY, selectedHole.depthScale);

        // Occasional double spawn during higher intensity (second spawn is always a mole, never human)
        if (progress > 0.4 && Math.random() < 0.28 && activeCount + 1 < this.config.MAX_SIMULTANEOUS_MOLES) {
            const secondHoles = eligibleHoles.filter(h => h !== selectedHole);
            if (secondHoles.length > 0) {
                const secondHole = secondHoles[Math.floor(Math.random() * secondHoles.length)];
                setTimeout(() => {
                    if (secondHole.mole.state === MOLE_STATE.HIDDEN && secondHole.isVisible) {
                        secondHole.mole.spawn('normal');
                        this.audioManager.playMolePop();
                        this.vfxManager.spawnMoleEmergeVFX(secondHole.screenX, secondHole.screenY, secondHole.depthScale);
                    }
                }, 180);
            }
        }
    }

    // Check hit on any active mole
    checkHit(hitX, hitY, isTouch = false, applyHit = true) {
        // Sort holes from front (closest to camera, largest Y) to back
        const sortedHoles = [...this.holes]
            .filter(h => h.isVisible && h.mole.state !== MOLE_STATE.HIDDEN && !h.mole.isHit)
            .sort((a, b) => b.screenY - a.screenY);

        const radiusMultiplier = isTouch ? 1.45 : 1.0;

        for (let i = 0; i < sortedHoles.length; i++) {
            const hole = sortedHoles[i];
            const mole = hole.mole;

            // Target is centered on the visible mole body emerging above the rim
            const moleH = 100 * hole.depthScale;
            const targetX = hole.screenX;
            const targetY = hole.screenY - (mole.riseProgress * moleH * 0.55);

            // Forgiving elliptical hit check
            const radiusX = (hole.config.HAMMER_HIT_RADIUS * 0.85 * radiusMultiplier) * hole.depthScale;
            const radiusY = (hole.config.HAMMER_HIT_RADIUS * 1.05 * radiusMultiplier) * hole.depthScale;

            const dx = (hitX - targetX) / radiusX;
            const dy = (hitY - targetY) / radiusY;

            // Also check if tap is directly on the hole mound opening
            const holeRadX = hole.getRadiusX() * (isTouch ? 1.4 : 1.15);
            const holeRadY = hole.getRadiusY() * (isTouch ? 1.8 : 1.3);
            const hdx = (hitX - hole.screenX) / holeRadX;
            const hdy = (hitY - hole.screenY) / holeRadY;
            const inHole = (hdx * hdx + hdy * hdy) <= 1.0;

            if ((dx * dx + dy * dy <= 1.0) || inHole) {
                const isHuman = mole.type === 'human';
                if (applyHit) {
                    const hitSuccess = mole.onHit();
                    if (hitSuccess) {
                        return {
                            hit: true,
                            hole: hole,
                            mole: mole,
                            x: targetX,
                            y: targetY,
                            depthScale: hole.depthScale,
                            isSpecial: mole.type !== 'normal' && !isHuman,
                            isHuman: isHuman
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
                        isSpecial: mole.type !== 'normal' && !isHuman,
                        isHuman: isHuman
                    };
                }
            }
        }

        return { hit: false };
    }

    // Render all holes in 2.5D depth order (back-to-front so nearest objects occlude further objects)
    draw(ctx, theme) {
        // Sort visible holes by screenY ascending (top to bottom)
        const sortedHoles = [...this.holes]
            .filter(h => h.isVisible)
            .sort((a, b) => a.screenY - b.screenY);

        for (let i = 0; i < sortedHoles.length; i++) {
            const hole = sortedHoles[i];
            // 1. Hole back / shadow
            hole.drawBack(ctx, theme);
            // 2. Mole rising out of hole
            hole.drawMole(ctx);
            // 3. Hole front rim / dirt lip
            hole.drawFront(ctx, theme);
        }
    }
}
