// src/ParallaxManager.js - Fullscreen Arena Background & Lighting
export class ParallaxManager {
    constructor(config) {
        this.config = config;
        this.bgImg = null;

        this.bounds = {
            renderTileW: 1200,
            renderTileH: 800,
            offsetX: 0,
            scale: 1.0
        };

        this.loadAssets();
    }

    loadAssets() {
        const img = new Image();
        img.src = 'assets/clean_sprites/arena_bg.jpg';
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
        const nativeW = 1200;
        const nativeH = 800;
        const isPortrait = h > w;
        let scale;

        if (isPortrait) {
            scale = Math.max(w / nativeW, h / nativeH);
        } else {
            scale = Math.max(w / nativeW, h / nativeH);
        }

        const renderTileW = Math.round(nativeW * scale);
        const renderTileH = Math.round(nativeH * scale);
        const offsetX = Math.round((w - renderTileW) * 0.5);

        this.bounds = {
            renderTileW,
            renderTileH,
            offsetX,
            scale
        };
    }

    update(dt) {
        // Arena is stationary fullscreen table
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

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
            ctx.shadowBlur = 35;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(ox, 0, rw, h);
            ctx.restore();
        }

        // 2. Draw clean arena background floor
        if (this.bgImg && this.bgImg.complete && this.bgImg.naturalWidth > 0) {
            ctx.drawImage(this.bgImg, ox, 0, rw, rh);
        } else {
            // High quality procedural marble floor fallback
            ctx.fillStyle = '#eae6de';
            ctx.fillRect(0, 0, w, h);
            
            // Stone tile lines
            ctx.strokeStyle = 'rgba(215, 205, 190, 0.6)';
            ctx.lineWidth = 2;
            for (let y = 0; y < h; y += 120) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
        }

        // 3. Arcade Bezel Neon Edge Accent Lines if flanks exist
        if (ox > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.lineWidth = 2.5;
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

        // 4. Subtle ambient lighting vignette to focus center board
        const vignette = ctx.createRadialGradient(w * 0.5, h * 0.52, h * 0.35, w * 0.5, h * 0.52, Math.hypot(w, h) * 0.60);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
    }
}
