// src/ParallaxManager.js - 2.5D Infinite Upward Scrolling & Parallax Environment
export class ParallaxManager {
    constructor(config) {
        this.config = config;
        this.theme = config.DEFAULT_THEME || 'garden';
        
        // Scroll offsets (in pixels)
        this.scrollY_Sky = 0;
        this.scrollY_Mountains = 0;
        this.scrollY_Midground = 0;
        this.scrollY_Ground = 0;
        this.scrollY_Foreground = 0;

        // Animated environmental items
        this.clouds = [];
        this.windmills = [];
        this.floatingLeaves = [];
        this.initClouds();
        this.initFloatingLeaves();

        // Cheese image asset
        this.cheeseImg = null;
        this.loadAssets();
    }

    loadAssets() {
        const img = new Image();
        img.src = 'assets/Cheese_Clean.png';
        img.onload = () => {
            this.cheeseImg = img;
        };
    }

    setTheme(theme) {
        this.theme = theme;
    }

    initClouds() {
        const w = this.config.VIEWPORT_WIDTH;
        for (let i = 0; i < 7; i++) {
            this.clouds.push({
                x: Math.random() * w,
                y: Math.random() * 150,
                scale: 0.6 + Math.random() * 0.8,
                speedX: 8 + Math.random() * 12,
                speedY: -(this.config.SCROLL_SPEED_BG_SKY * (0.5 + Math.random() * 0.5)),
                alpha: 0.35 + Math.random() * 0.4
            });
        }
    }

    initFloatingLeaves() {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        for (let i = 0; i < 15; i++) {
            this.floatingLeaves.push({
                x: Math.random() * w,
                y: Math.random() * h,
                speedY: -(this.config.SCROLL_SPEED_FOREGROUND * (0.8 + Math.random() * 0.4)),
                speedX: (Math.random() - 0.5) * 35,
                angle: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 3,
                size: 8 + Math.random() * 10,
                color: Math.random() > 0.4 ? '#81c784' : '#aed581'
            });
        }
    }

    update(dt) {
        // Continuous upward scrolling
        this.scrollY_Sky = (this.scrollY_Sky + this.config.SCROLL_SPEED_BG_SKY * dt) % 1000;
        this.scrollY_Mountains = (this.scrollY_Mountains + this.config.SCROLL_SPEED_BG_MOUNTAINS * dt) % 1000;
        this.scrollY_Midground = (this.scrollY_Midground + this.config.SCROLL_SPEED_MIDGROUND_HILLS * dt) % 1000;
        this.scrollY_Ground += this.config.SCROLL_SPEED_GROUND * dt;
        this.scrollY_Foreground = (this.scrollY_Foreground + this.config.SCROLL_SPEED_FOREGROUND * dt) % 1000;

        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;

        // Clouds movement
        for (let i = 0; i < this.clouds.length; i++) {
            const c = this.clouds[i];
            c.x += c.speedX * dt;
            c.y += c.speedY * dt;
            if (c.x > w + 150) c.x = -150;
            if (c.y < -80) c.y = 150;
        }

        // Floating leaves movement
        for (let i = 0; i < this.floatingLeaves.length; i++) {
            const leaf = this.floatingLeaves[i];
            leaf.y += leaf.speedY * dt;
            leaf.x += leaf.speedX * dt;
            leaf.angle += leaf.rotSpeed * dt;
            if (leaf.y < -30) {
                leaf.y = h + 30;
                leaf.x = Math.random() * w;
            }
            if (leaf.x < -30) leaf.x = w + 30;
            if (leaf.x > w + 30) leaf.x = -30;
        }
    }

    // Layer 1: Distant Sky and Far Mountains
    drawSkyLayer(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const horizon = this.config.PERSPECTIVE_HORIZON_Y;

        // 1. Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
        if (this.theme === 'cheese') {
            skyGrad.addColorStop(0, '#ffcc80');
            skyGrad.addColorStop(0.6, '#ffe082');
            skyGrad.addColorStop(1, '#fff9c4');
        } else {
            skyGrad.addColorStop(0, '#4fc3f7');
            skyGrad.addColorStop(0.5, '#81d4fa');
            skyGrad.addColorStop(1, '#e1f5fe');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, horizon + 20);

        // 2. Stylized Sun / Light Source
        ctx.save();
        const sunX = w * 0.78;
        const sunY = 55;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
        sunGlow.addColorStop(0, 'rgba(255, 253, 231, 0.95)');
        sunGlow.addColorStop(0.4, 'rgba(255, 238, 88, 0.45)');
        sunGlow.addColorStop(1, 'rgba(255, 238, 88, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff9c4';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Clouds
        ctx.save();
        for (let i = 0; i < this.clouds.length; i++) {
            const c = this.clouds[i];
            ctx.globalAlpha = c.alpha;
            ctx.fillStyle = '#ffffff';
            this.drawStylizedCloud(ctx, c.x, c.y, c.scale);
        }
        ctx.restore();

        // 4. Distant Mountains
        ctx.save();
        const mountainGrad = ctx.createLinearGradient(0, horizon - 90, 0, horizon);
        if (this.theme === 'cheese') {
            mountainGrad.addColorStop(0, '#ffb74d');
            mountainGrad.addColorStop(1, '#ffe082');
        } else {
            mountainGrad.addColorStop(0, '#7986cb');
            mountainGrad.addColorStop(1, '#aed581');
        }
        ctx.fillStyle = mountainGrad;
        ctx.beginPath();
        ctx.moveTo(0, horizon);

        // Infinite sine mountain ridge
        const mOffset = (this.scrollY_Mountains * 0.3) % 400;
        for (let x = 0; x <= w; x += 30) {
            const h1 = Math.sin((x + mOffset) * 0.007) * 45;
            const h2 = Math.cos((x + mOffset) * 0.015) * 22;
            ctx.lineTo(x, horizon - 45 + h1 + h2);
        }
        ctx.lineTo(w, horizon);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawStylizedCloud(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.arc(22, -8, 20, 0, Math.PI * 2);
        ctx.arc(44, 0, 22, 0, Math.PI * 2);
        ctx.arc(22, 10, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Layer 2: Midground Rolling Hills & Trees
    drawMidgroundLayer(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const horizon = this.config.PERSPECTIVE_HORIZON_Y;

        ctx.save();
        const hillGrad = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 30);
        if (this.theme === 'cheese') {
            hillGrad.addColorStop(0, '#ffa726');
            hillGrad.addColorStop(1, '#ffb300');
        } else {
            hillGrad.addColorStop(0, '#66bb6a');
            hillGrad.addColorStop(1, '#43a047');
        }
        ctx.fillStyle = hillGrad;

        ctx.beginPath();
        ctx.moveTo(0, horizon + 35);
        const hillOffset = (this.scrollY_Midground * 0.6) % 600;
        for (let x = 0; x <= w; x += 25) {
            const wave = Math.sin((x + hillOffset) * 0.009) * 28 + Math.cos((x - hillOffset) * 0.016) * 12;
            ctx.lineTo(x, horizon - 8 + wave);
        }
        ctx.lineTo(w, horizon + 35);
        ctx.closePath();
        ctx.fill();

        // Stylized cute cartoon trees on the hill ridge
        const treeSpacing = 160;
        const treeBaseOffset = (this.scrollY_Midground * 0.6) % treeSpacing;
        for (let x = -treeSpacing + treeBaseOffset; x < w + treeSpacing; x += treeSpacing) {
            const wave = Math.sin((x + hillOffset) * 0.009) * 28 + Math.cos((x - hillOffset) * 0.016) * 12;
            const treeY = horizon - 8 + wave;
            this.drawCartoonTree(ctx, x, treeY, 0.45);
        }

        ctx.restore();
    }

    drawCartoonTree(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Trunk
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-4, 0, 8, 22);

        // Foliage (stacked rounded triangles or puffs)
        ctx.fillStyle = this.theme === 'cheese' ? '#ff9800' : '#2e7d32';
        ctx.beginPath();
        ctx.arc(0, -12, 18, 0, Math.PI * 2);
        ctx.arc(-10, -5, 14, 0, Math.PI * 2);
        ctx.arc(10, -5, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.theme === 'cheese' ? '#ffb74d' : '#4caf50';
        ctx.beginPath();
        ctx.arc(-3, -15, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Layer 3: 2.5D Infinite Ground Plane
    drawGroundPlane(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const horizon = this.config.PERSPECTIVE_HORIZON_Y;

        ctx.save();

        if (this.theme === 'cheese' && this.cheeseImg) {
            // Cheese kingdom scrolling textured pattern
            const grad = ctx.createLinearGradient(0, horizon, 0, h);
            grad.addColorStop(0, '#fbc02d');
            grad.addColorStop(0.5, '#fdd835');
            grad.addColorStop(1, '#ffeb3b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, horizon, w, h - horizon);

            // Draw subtle scrolling cheese texture
            ctx.globalAlpha = 0.28;
            const tileH = 600;
            const offsetY = (this.scrollY_Ground) % tileH;
            for (let y = horizon - tileH + offsetY; y < h + tileH; y += tileH) {
                ctx.drawImage(this.cheeseImg, 0, y, w, tileH);
            }
            ctx.globalAlpha = 1.0;
        } else {
            // Lush 2.5D Lawn / Meadow
            const groundGrad = ctx.createLinearGradient(0, horizon, 0, h);
            groundGrad.addColorStop(0, '#388e3c');
            groundGrad.addColorStop(0.25, '#4caf50');
            groundGrad.addColorStop(0.7, '#66bb6a');
            groundGrad.addColorStop(1, '#81c784');
            ctx.fillStyle = groundGrad;
            ctx.fillRect(0, horizon, w, h - horizon);

            // 2.5D Perspective Grid & Field Stripes scrolling upward
            this.drawPerspectiveGrid(ctx, w, h, horizon);
        }

        // Vignette & Horizon atmospheric haze
        const hazeGrad = ctx.createLinearGradient(0, horizon, 0, horizon + 65);
        hazeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        hazeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, horizon, w, 65);

        ctx.restore();
    }

    drawPerspectiveGrid(ctx, w, h, horizon) {
        const groundHeight = h - horizon;
        const scroll = this.scrollY_Ground;

        // Subtle alternating rolling turf stripes flowing upward
        const stripeCount = 20;
        for (let i = 0; i < stripeCount; i++) {
            // Non-linear perspective spacing
            const norm1 = Math.pow(i / stripeCount, 2.1);
            const norm2 = Math.pow((i + 1) / stripeCount, 2.1);
            const y1 = horizon + norm1 * groundHeight;
            const y2 = horizon + norm2 * groundHeight;

            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.fillRect(0, y1, w, y2 - y1);
            }
        }

        // Perspective longitudinal depth lines converging towards horizon vanishing point
        ctx.strokeStyle = 'rgba(27, 94, 32, 0.12)';
        ctx.lineWidth = 1.5;
        const centerX = w * 0.5;
        for (let col = -5; col <= 5; col++) {
            const spread = col * (w * 0.13);
            ctx.beginPath();
            ctx.moveTo(centerX + spread * 0.15, horizon);
            ctx.lineTo(centerX + spread * 1.6, h);
            ctx.stroke();
        }
    }

    // Layer 4: Foreground Elements (Floating Leaves, Corner Grass)
    drawForegroundLayer(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;

        ctx.save();

        // 1. Drifting leaves
        for (let i = 0; i < this.floatingLeaves.length; i++) {
            const leaf = this.floatingLeaves[i];
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.angle);
            ctx.fillStyle = leaf.color;
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            // Leaf shape
            ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 2. Corner Foreground Grass Blades with soft depth-of-field blur
        this.drawCornerGrass(ctx, 0, h, false);
        this.drawCornerGrass(ctx, w, h, true);

        ctx.restore();
    }

    drawCornerGrass(ctx, x, y, flip = false) {
        ctx.save();
        ctx.translate(x, y);
        if (flip) ctx.scale(-1, 1);

        const grassColors = ['#1b5e20', '#2e7d32', '#388e3c'];
        const sway = Math.sin(Date.now() * 0.003) * 6;

        for (let i = 0; i < 7; i++) {
            ctx.fillStyle = grassColors[i % grassColors.length];
            ctx.beginPath();
            ctx.moveTo(i * 14, 0);
            ctx.quadraticCurveTo(i * 14 + 10 + sway, -60 - i * 12, i * 14 + 25 + sway * 1.5, -95 - i * 15);
            ctx.quadraticCurveTo(i * 14 + 5 + sway, -50 - i * 10, i * 14 + 12, 0);
            ctx.fill();
        }

        ctx.restore();
    }
}
