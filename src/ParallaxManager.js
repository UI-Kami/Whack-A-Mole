// src/ParallaxManager.js - Seamless Procedural Scrolling Background & Exact 13-Hole Ring Coordinate Mapping
export const TILE_NATIVE_WIDTH = 1080;
export const TILE_NATIVE_HEIGHT = 1920;

export const NATIVE_HOLES = [
    // Standalone hole coordinates & ring color variants (separated from background asset)
    // Row 0 (Y ~ 153)
    { col: 0, row: 0, x: 282, y: 151, rx: 126, ry: 60, variant: 'lime', depthScale: 1.0 },
    { col: 2, row: 0, x: 819, y: 156, rx: 126, ry: 60, variant: 'pink', depthScale: 1.0 },

    // Row 1 (Y ~ 336 - Center)
    { col: 1, row: 1, x: 551, y: 336, rx: 126, ry: 60, variant: 'pink', depthScale: 1.0 },

    // Row 2 (Y ~ 552)
    { col: 0, row: 2, x: 306, y: 548, rx: 126, ry: 60, variant: 'pink', depthScale: 1.0 },
    { col: 2, row: 2, x: 808, y: 557, rx: 126, ry: 60, variant: 'lime', depthScale: 1.0 },

    // Row 3 (Y ~ 759 - Center)
    { col: 1, row: 3, x: 551, y: 759, rx: 126, ry: 60, variant: 'lime', depthScale: 1.0 },

    // Row 4 (Y ~ 947)
    { col: 0, row: 4, x: 294, y: 947, rx: 126, ry: 60, variant: 'lime', depthScale: 1.0 },
    { col: 2, row: 4, x: 808, y: 947, rx: 126, ry: 60, variant: 'pink', depthScale: 1.0 },

    // Row 5 (Y ~ 1146 - Center)
    { col: 1, row: 5, x: 547, y: 1146, rx: 126, ry: 60, variant: 'lime', depthScale: 1.0 },

    // Row 6 (Y ~ 1346)
    { col: 0, row: 6, x: 301, y: 1344, rx: 126, ry: 60, variant: 'pink', depthScale: 1.0 },
    { col: 2, row: 6, x: 809, y: 1348, rx: 126, ry: 60, variant: 'lime', depthScale: 1.0 },

    // Row 7 (Y ~ 1564 - Center)
    { col: 1, row: 7, x: 554, y: 1564, rx: 126, ry: 60, variant: 'pink', depthScale: 1.0 },

    // Row 8 (Y ~ 1750)
    { col: 0, row: 8, x: 273, y: 1744, rx: 126, ry: 60, variant: 'lime', depthScale: 1.0 },
    { col: 2, row: 8, x: 804, y: 1754, rx: 126, ry: 60, variant: 'pink', depthScale: 1.0 }
];

export class ParallaxManager {
    constructor(config) {
        this.config = config;
        this.bgImg = null;
        this.holeLimeImg = null;
        this.holePinkImg = null;
        this.holeImg = null;

        // Procedural infinite scrolling parameters (scales 1.9x -> 3.8x -> 6.5x along continuous curve)
        this.scrollSpeed = config.SCROLL_SPEED || 110;
        this.speedMultiplier = 1.9;
        this.onTileRecycled = null;

        // Render bounds for 1080 x 1920 Kiosk standard
        this.bounds = {
            renderTileW: 1080,
            renderTileH: 1920,
            offsetX: 0,
            scale: 1.0
        };

        // 3 continuous repeating tiles (infinite conveyor belt)
        this.tiles = [
            { y: -1920 },
            { y: 0 },
            { y: 1920 }
        ];

        this.loadAssets();
    }

    setAssets(bgImg, holeLimeImg = null, holePinkImg = null) {
        if (bgImg) this.bgImg = bgImg;
        if (holeLimeImg) {
            this.holeLimeImg = holeLimeImg;
            this.holeImg = holeLimeImg;
        }
        if (holePinkImg) this.holePinkImg = holePinkImg;
        this.calculateBounds();
    }

    loadAssets() {
        const load = (src, assign) => {
            const img = new Image();
            img.src = src;
            img.onload = () => assign(img);
        };
        load('assets/normalized/bg_field_1080.png', (img) => {
            if (!this.bgImg) { this.bgImg = img; this.calculateBounds(); }
        });
        load('assets/normalized/hole_lime.png', (img) => {
            if (!this.holeLimeImg) { this.holeLimeImg = img; this.holeImg = img; }
        });
        load('assets/normalized/hole_pink.png', (img) => {
            if (!this.holePinkImg) { this.holePinkImg = img; }
        });
    }

    setSpeedMultiplier(factor) {
        this.speedMultiplier = Math.max(1.0, Math.min(8.0, factor));
    }

    resetTiles() {
        const rh = this.bounds.renderTileH || 1920;
        this.tiles = [
            { y: -rh },
            { y: 0 },
            { y: rh }
        ];
    }

    reset() {
        this.resetTiles();
        this.speedMultiplier = 1.9;
    }

    resize(config) {
        this.config = config;
        this.calculateBounds();
    }

    calculateBounds() {
        const w = this.config.VIEWPORT_WIDTH || 1080;
        const h = this.config.VIEWPORT_HEIGHT || 1920;
        const nativeW = TILE_NATIVE_WIDTH;   // 1080
        const nativeH = TILE_NATIVE_HEIGHT;  // 1920
        const isPortrait = h > w;
        let scale;

        if (isPortrait) {
            scale = w / nativeW;
        } else {
            const targetW = Math.min(w * 0.85, Math.max(760, h * 0.95));
            scale = targetW / nativeW;
            scale = Math.max(0.60, Math.min(scale, 1.20));
        }

        const renderTileW = nativeW * scale;
        const renderTileH = nativeH * scale;
        const offsetX = Math.round((w - renderTileW) * 0.5);

        const oldRh = this.bounds.renderTileH;
        this.bounds = {
            renderTileW,
            renderTileH,
            offsetX,
            scale
        };

        if (oldRh !== renderTileH) {
            this.resetTiles();
        }
    }

    getTileOffsetY(tileIndex) {
        if (this.tiles && this.tiles[tileIndex]) {
            return this.tiles[tileIndex].y;
        }
        return 0;
    }

    update(dt) {
        const rh = this.bounds.renderTileH;
        const H = this.config.VIEWPORT_HEIGHT;
        if (rh <= 0) return;

        // Move all 3 conveyor tiles downward continuously (speed scales with game speed!)
        const speed = this.scrollSpeed * this.speedMultiplier;
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i].y += speed * dt;
        }

        // When a tile completely scrolls past the bottom (top edge >= H + 30):
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].y >= H + 30) {
                // Find top-most tile among all tiles
                let minY = Infinity;
                for (let j = 0; j < this.tiles.length; j++) {
                    if (this.tiles[j].y < minY) minY = this.tiles[j].y;
                }
                // Wrap cleanly to the top without any gap
                this.tiles[i].y = minY - rh;

                if (this.onTileRecycled) {
                    this.onTileRecycled(i);
                }
            }
        }
    }

    drawGroundPlane(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const b = this.bounds;
        const rw = b.renderTileW || w;
        const rh = b.renderTileH || h;
        const ox = b.offsetX || 0;

        ctx.save();

        // 1. Arcade Cabinet Flanks on left & right in landscape
        if (ox > 0) {
            const leftGrad = ctx.createLinearGradient(0, 0, ox, 0);
            leftGrad.addColorStop(0, '#060911');
            leftGrad.addColorStop(0.7, '#0b101c');
            leftGrad.addColorStop(1, '#111827');
            ctx.fillStyle = leftGrad;
            ctx.fillRect(0, 0, ox, h);

            const rightGrad = ctx.createLinearGradient(ox + rw, 0, w, 0);
            rightGrad.addColorStop(0, '#111827');
            rightGrad.addColorStop(0.3, '#0b101c');
            rightGrad.addColorStop(1, '#060911');
            ctx.fillStyle = rightGrad;
            ctx.fillRect(ox + rw, 0, w - (ox + rw), h);

            // Drop shadow onto flanks
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
            ctx.shadowBlur = 35;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(ox, 0, rw, h);
            ctx.restore();
        }

        // 2. Draw seamlessly scrolling hole-free playfield tiles (Infinite Scroll!)
        if (this.bgImg && this.bgImg.complete && this.bgImg.naturalWidth > 0 && rh > 0) {
            for (let i = 0; i < this.tiles.length; i++) {
                const ty = this.tiles[i].y;
                if (ty + rh > -40 && ty < h + 40) {
                    ctx.drawImage(this.bgImg, ox, Math.floor(ty), rw, Math.ceil(rh) + 1);
                }
            }
        } else {
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#ee7116');
            grad.addColorStop(0.5, '#e56408');
            grad.addColorStop(1, '#cb4700');
            ctx.fillStyle = grad;
            ctx.fillRect(ox, 0, rw, h);
        }

        // 2b. Composite standalone transparent hole PNGs on top of playfield tiles (Layer 1)
        const scale = b.scale || 1.0;
        for (let i = 0; i < this.tiles.length; i++) {
            const ty = this.tiles[i].y;
            if (ty + rh <= -160 || ty >= h + 160) continue;
            for (let j = 0; j < NATIVE_HOLES.length; j++) {
                const nh = NATIVE_HOLES[j];
                const cx = ox + (nh.x * scale);
                const cy = ty + (nh.y * scale);
                if (cy < -160 || cy > h + 160) continue;
                this.drawStandaloneHoleSprite(ctx, cx, cy, nh.rx * scale, nh.ry * scale, nh.variant, scale);
            }
        }

        // 3. Arcade bezel neon accent lines for widescreen
        if (ox > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(ox, 0);
            ctx.lineTo(ox, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(ox + rw, 0);
            ctx.lineTo(ox + rw, h);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Subtle ambient lighting vignette
        this.drawAmbientVignette(ctx);

        ctx.restore();
    }

    drawAmbientVignette(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const vignette = ctx.createRadialGradient(w * 0.5, h * 0.52, h * 0.38, w * 0.5, h * 0.52, Math.hypot(w, h) * 0.62);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
    }

    /**
     * Smooth paw-pocket exposure factor from pop progress:
     * < 0.45: paws stay behind inner black opening; >= 0.45: paws emerge onto front colored rim.
     */
    getPawPocketBlend(riseProgress) {
        const raw = Math.max(0, Math.min(1, (riseProgress - 0.45) / 0.45));
        return raw * raw * (3 - 2 * raw);
    }

    /**
     * Trace the split bottom rim curve from right (+outerRx) to left (-outerRx):
     * - Center ~56% width stays along the inner black pit arc (keeping lower torso behind front rim).
     * - Left & right ~22% paw pockets smoothly extend down toward the outer lower colored rim edge
     *   according to pawBlend so hands/paws sit visibly outside on top of the front rim at peak.
     */
    traceSplitFrontCurve(ctx, cx, cy, rx, ry, pawBlend, innerRxScale = 1.02, innerRyScale = 1.05, outerRxScale = 1.48, outerRyScale = 2.04) {
        const outRx = rx * outerRxScale;
        const outRy = ry * outerRyScale;
        const inRx = rx * innerRxScale;
        const inRy = ry * innerRyScale;
        const steps = 40;

        for (let i = 0; i <= steps; i++) {
            const xOff = outRx - (2 * outRx * (i / steps));
            const uOut = Math.min(1, Math.abs(xOff) / outRx);
            const yOut = cy + outRy * Math.sqrt(Math.max(0, 1 - uOut * uOut));

            const vIn = Math.abs(xOff) / inRx;
            const yIn = (vIn < 1) ? (cy + inRy * Math.sqrt(Math.max(0, 1 - vIn * vIn))) : cy;

            // Smooth pocket mask: 0 across center torso (|x| <= 0.56*rx), 1 across outer paw pockets
            const absRatio = Math.abs(xOff) / rx;
            const pocketT = Math.max(0, Math.min(1, (absRatio - 0.54) / 0.10));
            const pocketWeight = pocketT * pocketT * (3 - 2 * pocketT);

            const yVal = yIn + (yOut - yIn) * (pocketWeight * pawBlend);
            ctx.lineTo(cx + xOff, yVal);
        }
    }

    getHoleSprite(variant) {
        if (variant === 'pink') return this.holePinkImg || this.holeImg;
        return this.holeLimeImg || this.holeImg;
    }

    drawStandaloneHoleSprite(ctx, cx, cy, rx, ry, variant) {
        const holeSprite = this.getHoleSprite(variant);
        if (holeSprite && holeSprite.complete && holeSprite.naturalWidth > 0) {
            const aspect = holeSprite.naturalHeight / holeSprite.naturalWidth;
            const w = rx * 3.162;
            const h = w * aspect;
            ctx.drawImage(holeSprite, cx - w * 0.5, cy - h * 0.5, w, h);
        } else {
            // Vector fallback if standalone PNG is not loaded
            ctx.fillStyle = variant === 'pink' ? '#ff99ee' : '#bbcc00';
            ctx.beginPath();
            ctx.ellipse(cx, cy + ry * 0.06, rx * 1.46, ry * 2.02, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Layer 3 (Front Colored Rim Overlay):
     * Redraws only the front half of the standalone hole asset (excluding the black pit
     * across the center, and opening left/right paw pockets as pawBlend -> 1).
     */
    drawHoleFrontRim(ctx, hole, pawBlend = 0) {
        const b = this.bounds;
        const scale = b.scale || 1.0;
        const h = this.config.VIEWPORT_HEIGHT || 1920;
        const ty = this.getTileOffsetY(hole.tileIndex);
        const rh = b.renderTileH || h;

        if (ty + rh <= -160 || ty >= h + 160) return;

        const cx = hole.screenX;
        const cy = hole.screenY;
        const rx = hole.radiusX;
        const ry = hole.radiusY;

        ctx.save();
        ctx.beginPath();

        // Outer lower semi-ellipse covering bottom front half of colored rim & outer shadow
        ctx.moveTo(cx + rx * 1.50, cy);
        ctx.ellipse(cx, cy, rx * 1.50, ry * 2.12, 0, 0, Math.PI, false);
        ctx.closePath();

        // Inner cutout matching Layer 2's split curve (excludes black pit + revealed paw pockets)
        ctx.moveTo(cx + rx * 1.50, cy);
        this.traceSplitFrontCurve(ctx, cx, cy, rx, ry, pawBlend, 0.99, 0.99, 1.50, 2.12);
        ctx.closePath();

        ctx.clip('evenodd');
        this.drawStandaloneHoleSprite(ctx, cx, cy, rx, ry, hole.variant, scale);
        this.drawAmbientVignette(ctx);
        ctx.restore();
    }
}
