// src/ParallaxManager.js - Centered 9-Hole Background Integration & Deluxe Arcade Framing
export const NATIVE_BG_WIDTH = 1024;
export const NATIVE_BG_HEIGHT = 1536;
export const HOLE_CLUSTER_CENTER_X = 512;
export const HOLE_CLUSTER_CENTER_Y = 740;

// Exact, calibrated coordinates of the 9 holes in Background_New.jpg (Native 1024x1536)
export const NATIVE_HOLES = [
    // Row 0 (Top row: Y ≈ 544, rx ≈ 81, ry ≈ 38)
    { col: 0, row: 0, x: 218, y: 543, rx: 84, ry: 38, depthScale: 0.94 },
    { col: 1, row: 0, x: 511, y: 544, rx: 78, ry: 38, depthScale: 0.94 },
    { col: 2, row: 0, x: 805, y: 545, rx: 82, ry: 36, depthScale: 0.94 },
    // Row 1 (Middle row: Y ≈ 728, rx ≈ 85, ry ≈ 43)
    { col: 0, row: 1, x: 203, y: 728, rx: 87, ry: 44, depthScale: 1.00 },
    { col: 1, row: 1, x: 511, y: 728, rx: 84, ry: 42, depthScale: 1.00 },
    { col: 2, row: 1, x: 821, y: 728, rx: 85, ry: 42, depthScale: 1.00 },
    // Row 2 (Bottom row: Y ≈ 936, rx ≈ 89, ry ≈ 48)
    { col: 0, row: 2, x: 194, y: 936, rx: 92, ry: 47, depthScale: 1.06 },
    { col: 1, row: 2, x: 511, y: 936, rx: 88, ry: 48, depthScale: 1.06 },
    { col: 2, row: 2, x: 830, y: 935, rx: 88, ry: 50, depthScale: 1.06 }
];

export class ParallaxManager {
    constructor(config) {
        this.config = config;
        this.bgImg = null;

        this.bounds = {
            renderW: 1024,
            renderH: 1536,
            offsetX: 0,
            offsetY: 0,
            scale: 1.0,
            targetCenterX: 512,
            targetCenterY: 740
        };

        this.loadAssets();
    }

    loadAssets() {
        const img = new Image();
        img.src = 'assets/BG_NEW/Background_New.jpg';
        img.onload = () => {
            this.bgImg = img;
            this.calculateBounds();
        };
    }

    resize(config) {
        this.config = config;
        this.calculateBounds();
    }

    calculateBounds() {
        const w = this.config.VIEWPORT_WIDTH || 1200;
        const h = this.config.VIEWPORT_HEIGHT || 800;
        const isPortrait = h > w;

        // Vertical play area between top HUD bar and bottom screen padding
        const padTop = isPortrait ? 100 : 110;
        const padBottom = isPortrait ? 50 : 55;
        const availH = Math.max(200, h - padTop - padBottom);
        const targetCenterY = padTop + availH * 0.5;
        const targetCenterX = w * 0.5;

        // The 9 holes span ~815 px horizontally and ~480 px vertically in native coordinates
        const clusterW = 815;
        const clusterH = 480;

        let scale;
        if (isPortrait) {
            // In portrait: cluster fills ~82% of screen width (leaving ~9% padding on each side and clear corners)
            const maxW = w * 0.82;
            const maxH = availH * 0.68;
            scale = Math.min(maxW / clusterW, maxH / clusterH);
            scale = Math.max(0.45, Math.min(scale, 1.15));
        } else {
            // In landscape: cluster fits comfortably within play area height (leaving ample top/bottom and wide corner margins)
            const maxH = availH * 0.72;
            const maxW = w * 0.65;
            scale = Math.min(maxH / clusterH, maxW / clusterW);
            scale = Math.max(0.55, Math.min(scale, 1.10));
        }

        const renderW = Math.round(NATIVE_BG_WIDTH * scale);
        const renderH = Math.round(NATIVE_BG_HEIGHT * scale);
        const offsetX = Math.round(targetCenterX - HOLE_CLUSTER_CENTER_X * scale);
        const offsetY = Math.round(targetCenterY - HOLE_CLUSTER_CENTER_Y * scale);

        this.bounds = {
            renderW,
            renderH,
            offsetX,
            offsetY,
            scale,
            targetCenterX,
            targetCenterY
        };
    }

    update(dt) {
        // Stationary centered board
    }

    drawGroundPlane(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const b = this.bounds;
        const rw = b.renderW;
        const rh = b.renderH;
        const ox = b.offsetX;
        const oy = b.offsetY;

        ctx.save();

        // 1. Base clean arena floor tone matching Background_New.jpg stone
        ctx.fillStyle = '#e6e1da';
        ctx.fillRect(0, 0, w, h);

        // 2. Draw Background_New.jpg centered around the hole cluster
        if (this.bgImg && this.bgImg.complete && this.bgImg.naturalWidth > 0) {
            ctx.drawImage(this.bgImg, ox, oy, rw, rh);
        }

        // 3. Sleek Arcade Cabinet Flanks on left & right if widescreen margins exist
        if (ox > 0) {
            const leftGrad = ctx.createLinearGradient(0, 0, ox, 0);
            leftGrad.addColorStop(0, '#060911');
            leftGrad.addColorStop(0.75, '#0b101c');
            leftGrad.addColorStop(1, 'rgba(17, 24, 39, 0.96)');
            ctx.fillStyle = leftGrad;
            ctx.fillRect(0, 0, ox, h);

            const rightGrad = ctx.createLinearGradient(ox + rw, 0, w, 0);
            rightGrad.addColorStop(0, 'rgba(17, 24, 39, 0.96)');
            rightGrad.addColorStop(0.25, '#0b101c');
            rightGrad.addColorStop(1, '#060911');
            ctx.fillStyle = rightGrad;
            ctx.fillRect(ox + rw, 0, w - (ox + rw), h);

            // Arcade Bezel Neon Edge Accent Lines
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(ox, 0);
            ctx.lineTo(ox, h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(ox + rw, 0);
            ctx.lineTo(ox + rw, h);
            ctx.stroke();
        }

        // 4. Subtle ambient lighting vignette to focus center board
        const vignette = ctx.createRadialGradient(b.targetCenterX, b.targetCenterY, h * 0.30, b.targetCenterX, b.targetCenterY, Math.hypot(w, h) * 0.55);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
    }
}
