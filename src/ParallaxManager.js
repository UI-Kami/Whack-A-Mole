// src/ParallaxManager.js - Seamless Procedural Scrolling Background & 18-Hole Coordinate Mapping
export const TILE_NATIVE_WIDTH = 1024;
export const TILE_NATIVE_HEIGHT = 1200;

export const NATIVE_HOLES = [
    // Row 0 (Y = 100)
    { col: 0, row: 0, x: 205, y: 100, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 1, row: 0, x: 512, y: 100, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 2, row: 0, x: 819, y: 100, rx: 90, ry: 41, depthScale: 1.0 },
    // Row 1 (Y = 300)
    { col: 0, row: 1, x: 205, y: 300, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 1, row: 1, x: 512, y: 300, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 2, row: 1, x: 819, y: 300, rx: 90, ry: 41, depthScale: 1.0 },
    // Row 2 (Y = 500)
    { col: 0, row: 2, x: 205, y: 500, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 1, row: 2, x: 512, y: 500, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 2, row: 2, x: 819, y: 500, rx: 90, ry: 41, depthScale: 1.0 },
    // Row 3 (Y = 700)
    { col: 0, row: 3, x: 205, y: 700, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 1, row: 3, x: 512, y: 700, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 2, row: 3, x: 819, y: 700, rx: 90, ry: 41, depthScale: 1.0 },
    // Row 4 (Y = 900)
    { col: 0, row: 4, x: 205, y: 900, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 1, row: 4, x: 512, y: 900, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 2, row: 4, x: 819, y: 900, rx: 90, ry: 41, depthScale: 1.0 },
    // Row 5 (Y = 1100)
    { col: 0, row: 5, x: 205, y: 1100, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 1, row: 5, x: 512, y: 1100, rx: 90, ry: 41, depthScale: 1.0 },
    { col: 2, row: 5, x: 819, y: 1100, rx: 90, ry: 41, depthScale: 1.0 }
];

export class ParallaxManager {
    constructor(config) {
        this.config = config;
        this.bgImg = null;

        // Procedural scrolling parameters
        this.scrollSpeed = config.SCROLL_SPEED || 55; // pixels per second downward scroll
        this.onTileRecycled = null;

        // Render bounds for Background_Seamless.jpg (1024 x 1200 native)
        this.bounds = {
            renderTileW: 1024,
            renderTileH: 1200,
            offsetX: 0,
            scale: 1.0
        };

        // 3 continuous repeating tiles (conveyor belt)
        this.tiles = [
            { y: -1200 },
            { y: 0 },
            { y: 1200 }
        ];

        this.loadAssets();
    }

    loadAssets() {
        const img = new Image();
        img.src = 'assets/BG_NEW/Background_Seamless.jpg';
        img.onload = () => {
            this.bgImg = img;
            this.calculateBounds();
        };
    }

    resetTiles() {
        const rh = this.bounds.renderTileH || 1200;
        this.tiles = [
            { y: -rh },
            { y: 0 },
            { y: rh }
        ];
    }

    resize(config) {
        this.config = config;
        this.calculateBounds();
    }

    calculateBounds() {
        const w = this.config.VIEWPORT_WIDTH || 1200;
        const h = this.config.VIEWPORT_HEIGHT || 800;
        const nativeW = TILE_NATIVE_WIDTH;   // 1024
        const nativeH = TILE_NATIVE_HEIGHT;  // 1200
        const isPortrait = h > w;
        let scale;

        if (isPortrait) {
            // In portrait, board fills screen width
            scale = w / nativeW;
        } else {
            // In landscape, preserve natural aspect ratio with ZERO stretching
            // Frame board comfortably centered as a deluxe arcade table
            const targetW = Math.min(w * 0.85, Math.max(760, h * 0.95));
            scale = targetW / nativeW;
            scale = Math.max(0.70, Math.min(scale, 1.20));
        }

        const renderTileW = nativeW * scale;
        const renderTileH = nativeH * scale;

        // Center horizontally
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

    // Returns the current screen Y of tile repetition k
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

        // Move all 3 conveyor tiles downward continuously
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i].y += this.scrollSpeed * dt;
        }

        // When a tile completely scrolls past the bottom (its top edge >= H + 30):
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].y >= H + 30) {
                // Find top-most tile among all tiles
                let minY = Infinity;
                for (let j = 0; j < this.tiles.length; j++) {
                    if (this.tiles[j].y < minY) minY = this.tiles[j].y;
                }
                // Wrap cleanly to the top without gap
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
        const rw = b.renderTileW;
        const rh = b.renderTileH;
        const ox = b.offsetX;

        ctx.save();

        // 1. Sleek Arcade Cabinet Flanks on left & right if widescreen
        if (ox > 0) {
            // Left flank gradient
            const leftGrad = ctx.createLinearGradient(0, 0, ox, 0);
            leftGrad.addColorStop(0, '#060911');
            leftGrad.addColorStop(0.7, '#0b101c');
            leftGrad.addColorStop(1, '#111827');
            ctx.fillStyle = leftGrad;
            ctx.fillRect(0, 0, ox, h);

            // Right flank gradient
            const rightGrad = ctx.createLinearGradient(ox + rw, 0, w, 0);
            rightGrad.addColorStop(0, '#111827');
            rightGrad.addColorStop(0.3, '#0b101c');
            rightGrad.addColorStop(1, '#060911');
            ctx.fillStyle = rightGrad;
            ctx.fillRect(ox + rw, 0, w - (ox + rw), h);

            // Playfield 3D heavy drop shadow onto flanks
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
            ctx.shadowBlur = 35;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(ox, 0, rw, h);
            ctx.restore();
        }

        // 2. Draw seamlessly scrolling playfield tiles
        if (this.bgImg && this.bgImg.complete && this.bgImg.naturalWidth > 0 && rh > 0) {
            for (let i = 0; i < this.tiles.length; i++) {
                const ty = this.tiles[i].y;
                if (ty + rh > -40 && ty < h + 40) {
                    ctx.drawImage(this.bgImg, ox, Math.floor(ty), rw, Math.ceil(rh) + 1);
                }
            }
        } else {
            ctx.fillStyle = '#e6e1da';
            ctx.fillRect(ox, 0, rw, h);
        }

        // 3. Arcade Bezel Neon Edge Accent Lines
        if (ox > 0) {
            ctx.save();
            // Left neon strip
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(ox, 0);
            ctx.lineTo(ox, h);
            ctx.stroke();

            // Right neon strip
            ctx.beginPath();
            ctx.moveTo(ox + rw, 0);
            ctx.lineTo(ox + rw, h);
            ctx.stroke();

            // Inner crisp specular white line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(ox + 1, 0);
            ctx.lineTo(ox + 1, h);
            ctx.moveTo(ox + rw - 1, 0);
            ctx.lineTo(ox + rw - 1, h);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Subtle ambient lighting vignette
        const vignette = ctx.createRadialGradient(w * 0.5, h * 0.52, h * 0.38, w * 0.5, h * 0.52, Math.hypot(w, h) * 0.62);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
    }
}
