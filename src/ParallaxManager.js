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

    resize(config) {
        this.config = config;
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        for (let i = 0; i < this.clouds.length; i++) {
            if (this.clouds[i].x > w) this.clouds[i].x = Math.random() * w;
        }
        for (let i = 0; i < this.floatingLeaves.length; i++) {
            if (this.floatingLeaves[i].x > w) this.floatingLeaves[i].x = Math.random() * w;
            if (this.floatingLeaves[i].y > h) this.floatingLeaves[i].y = Math.random() * h;
        }
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
        const theme = this.theme;

        // 1. Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
        if (theme === 'cheese') {
            // Dreamy Twilight Sky to balance and complement golden cheese
            skyGrad.addColorStop(0, '#1c1038');
            skyGrad.addColorStop(0.35, '#3b2260');
            skyGrad.addColorStop(0.7, '#792d64');
            skyGrad.addColorStop(1, '#d97706');
        } else if (theme === 'desert') {
            // Arizona canyon dusk sunset
            skyGrad.addColorStop(0, '#2e1065');
            skyGrad.addColorStop(0.4, '#7f1d1d');
            skyGrad.addColorStop(0.75, '#c2410c');
            skyGrad.addColorStop(1, '#f59e0b');
        } else if (theme === 'candy') {
            // Pastel cotton candy fantasy
            skyGrad.addColorStop(0, '#db2777');
            skyGrad.addColorStop(0.4, '#c084fc');
            skyGrad.addColorStop(0.8, '#7dd3fc');
            skyGrad.addColorStop(1, '#fef08a');
        } else if (theme === 'cyber') {
            // Retro synthwave space
            skyGrad.addColorStop(0, '#030712');
            skyGrad.addColorStop(0.4, '#1e1b4b');
            skyGrad.addColorStop(0.75, '#4a044e');
            skyGrad.addColorStop(1, '#0891b2');
        } else {
            // Lush Sunny Garden
            skyGrad.addColorStop(0, '#4fc3f7');
            skyGrad.addColorStop(0.5, '#81d4fa');
            skyGrad.addColorStop(1, '#e1f5fe');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, horizon + 20);

        // 2. Celestial Body (Sun / Moon / Retro Sun)
        ctx.save();
        const sunX = w * 0.78;
        const sunY = 55;

        if (theme === 'cheese') {
            // Giant glowing Swiss Cheese Moon
            const moonGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 70);
            moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
            moonGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
            moonGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
            ctx.fill();

            // Moon body
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
            ctx.fill();

            // Cheese craters on moon
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(sunX - 7, sunY - 6, 5, 0, Math.PI * 2);
            ctx.arc(sunX + 8, sunY - 4, 3.5, 0, Math.PI * 2);
            ctx.arc(sunX + 2, sunY + 8, 4.5, 0, Math.PI * 2);
            ctx.arc(sunX - 10, sunY + 9, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Twinkling stars in twilight sky
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            const stars = [
                { x: w * 0.15, y: 35, s: 2 },
                { x: w * 0.32, y: 55, s: 1.5 },
                { x: w * 0.45, y: 25, s: 2.2 },
                { x: w * 0.62, y: 40, s: 1.8 },
                { x: w * 0.90, y: 30, s: 2.5 }
            ];
            for (let i = 0; i < stars.length; i++) {
                const st = stars[i];
                ctx.beginPath();
                ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (theme === 'cyber') {
            // Retro 80s Synthwave sliced glowing sun
            const cyberGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
            cyberGlow.addColorStop(0, 'rgba(244, 63, 94, 0.9)');
            cyberGlow.addColorStop(0.5, 'rgba(236, 72, 153, 0.35)');
            cyberGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
            ctx.fillStyle = cyberGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
            ctx.fill();

            // Sun with horizontal scanline bars
            const sunGrad = ctx.createLinearGradient(sunX, sunY - 30, sunX, sunY + 30);
            sunGrad.addColorStop(0, '#fef08a');
            sunGrad.addColorStop(0.5, '#f43f5e');
            sunGrad.addColorStop(1, '#a855f7');
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
            ctx.fill();

            // Horizontal slice cutouts
            ctx.fillStyle = '#030712';
            for (let bar = 0; bar < 4; bar++) {
                const by = sunY + 2 + bar * 7;
                const bh = 1.5 + bar * 0.8;
                ctx.fillRect(sunX - 32, by, 64, bh);
            }
        } else {
            // Golden Sun
            const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
            sunGlow.addColorStop(0, theme === 'desert' ? 'rgba(254, 215, 170, 0.95)' : 'rgba(255, 253, 231, 0.95)');
            sunGlow.addColorStop(0.4, theme === 'desert' ? 'rgba(249, 115, 22, 0.45)' : 'rgba(255, 238, 88, 0.45)');
            sunGlow.addColorStop(1, 'rgba(255, 238, 88, 0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = theme === 'desert' ? '#fed7aa' : (theme === 'candy' ? '#fce7f3' : '#fff9c4');
            ctx.beginPath();
            ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 3. Clouds (or cyber data grids)
        ctx.save();
        for (let i = 0; i < this.clouds.length; i++) {
            const c = this.clouds[i];
            ctx.globalAlpha = c.alpha * (theme === 'cyber' ? 0.35 : 0.85);
            ctx.fillStyle = theme === 'candy' ? '#fbcfe8' : (theme === 'cheese' ? 'rgba(255, 248, 225, 0.85)' : '#ffffff');
            this.drawStylizedCloud(ctx, c.x, c.y, c.scale);
        }
        ctx.restore();

        // 4. Distant Mountains
        ctx.save();
        const mountainGrad = ctx.createLinearGradient(0, horizon - 90, 0, horizon);
        if (theme === 'cheese') {
            // Toasted biscuit & cracker ridges
            mountainGrad.addColorStop(0, '#5d4037');
            mountainGrad.addColorStop(0.6, '#8d6e63');
            mountainGrad.addColorStop(1, '#b45309');
        } else if (theme === 'desert') {
            // Sandstone canyon buttes & plateaus
            mountainGrad.addColorStop(0, '#7f1d1d');
            mountainGrad.addColorStop(0.5, '#9a3412');
            mountainGrad.addColorStop(1, '#c2410c');
        } else if (theme === 'candy') {
            // Sugar-frosted fudge peaks
            mountainGrad.addColorStop(0, '#701a75');
            mountainGrad.addColorStop(0.7, '#a21caf');
            mountainGrad.addColorStop(1, '#f472b6');
        } else if (theme === 'cyber') {
            // Neon vector wireframe mountains
            mountainGrad.addColorStop(0, '#3b0764');
            mountainGrad.addColorStop(0.6, '#581c87');
            mountainGrad.addColorStop(1, '#0e7490');
        } else {
            // Alpine Garden
            mountainGrad.addColorStop(0, '#7986cb');
            mountainGrad.addColorStop(1, '#aed581');
        }
        ctx.fillStyle = mountainGrad;
        ctx.beginPath();
        ctx.moveTo(0, horizon);

        const mOffset = (this.scrollY_Mountains * 0.3) % 400;
        for (let x = 0; x <= w; x += 30) {
            const h1 = Math.sin((x + mOffset) * 0.007) * 45;
            const h2 = Math.cos((x + mOffset) * 0.015) * 22;
            ctx.lineTo(x, horizon - 45 + h1 + h2);
        }
        ctx.lineTo(w, horizon);
        ctx.closePath();
        ctx.fill();

        // Cyber / Candy ridge highlights
        if (theme === 'cyber') {
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, horizon);
            for (let x = 0; x <= w; x += 30) {
                const h1 = Math.sin((x + mOffset) * 0.007) * 45;
                const h2 = Math.cos((x + mOffset) * 0.015) * 22;
                ctx.lineTo(x, horizon - 45 + h1 + h2);
            }
            ctx.stroke();
        } else if (theme === 'candy') {
            // White vanilla frosting dripping on mountain tops
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            for (let x = 0; x <= w; x += 60) {
                const h1 = Math.sin((x + mOffset) * 0.007) * 45;
                const h2 = Math.cos((x + mOffset) * 0.015) * 22;
                const my = horizon - 45 + h1 + h2;
                ctx.beginPath();
                ctx.arc(x, my + 6, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
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
        const theme = this.theme;

        ctx.save();
        const hillGrad = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 30);
        if (theme === 'cheese') {
            // Warm Cheddar Slopes with toasted edges
            hillGrad.addColorStop(0, '#b45309');
            hillGrad.addColorStop(1, '#d97706');
        } else if (theme === 'desert') {
            // Terracotta dunes
            hillGrad.addColorStop(0, '#9a3412');
            hillGrad.addColorStop(1, '#c2410c');
        } else if (theme === 'candy') {
            // Strawberry frosting hills
            hillGrad.addColorStop(0, '#db2777');
            hillGrad.addColorStop(1, '#ec4899');
        } else if (theme === 'cyber') {
            // Glowing neon grid ridge
            hillGrad.addColorStop(0, '#1e1b4b');
            hillGrad.addColorStop(1, '#0e7490');
        } else {
            // Emerald lawn hills
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

        // Stylized environmental objects on ridge
        const treeSpacing = 160;
        const treeBaseOffset = (this.scrollY_Midground * 0.6) % treeSpacing;
        for (let x = -treeSpacing + treeBaseOffset; x < w + treeSpacing; x += treeSpacing) {
            const wave = Math.sin((x + hillOffset) * 0.009) * 28 + Math.cos((x - hillOffset) * 0.016) * 12;
            const treeY = horizon - 8 + wave;
            this.drawSceneryFeature(ctx, x, treeY, 0.45, theme);
        }

        ctx.restore();
    }

    drawSceneryFeature(ctx, x, y, scale, theme) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        if (theme === 'cheese') {
            // Fresh Cartoon Broccoli Florets (healthy green contrast to golden cheese!)
            ctx.fillStyle = '#451a03'; // Pretzel / stalk stem
            ctx.fillRect(-3.5, 0, 7, 20);

            ctx.fillStyle = '#15803d'; // Rich green broccoli floret
            ctx.beginPath();
            ctx.arc(0, -12, 17, 0, Math.PI * 2);
            ctx.arc(-10, -5, 13, 0, Math.PI * 2);
            ctx.arc(10, -5, 13, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#22c55e'; // Highlight floret texture
            ctx.beginPath();
            ctx.arc(-4, -14, 8, 0, Math.PI * 2);
            ctx.arc(5, -11, 7, 0, Math.PI * 2);
            ctx.fill();
        } else if (theme === 'desert') {
            // Saguaro Cactus
            ctx.fillStyle = '#15803d';
            // Main stem
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(-5, -28, 10, 36, 4) : ctx.rect(-5, -28, 10, 36);
            ctx.fill();

            // Left arm
            ctx.beginPath();
            ctx.rect(-14, -18, 9, 5);
            ctx.rect(-14, -26, 5, 13);
            ctx.fill();

            // Right arm
            ctx.beginPath();
            ctx.rect(5, -14, 9, 5);
            ctx.rect(9, -22, 5, 13);
            ctx.fill();
        } else if (theme === 'candy') {
            // Giant Swirled Lollipop
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, 0, 4, 25);

            // Candy disc
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -14, 16, 0, Math.PI * 2);
            ctx.fill();

            // White swirl
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, -14, 10, 0, 1.5 * Math.PI);
            ctx.stroke();
        } else if (theme === 'cyber') {
            // Cyber Grid Beacon / Obelisk
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.lineTo(6, 10);
            ctx.lineTo(-6, 10);
            ctx.closePath();
            ctx.fill();
        } else {
            // Classic Cartoon Tree
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(-4, 0, 8, 22);

            ctx.fillStyle = '#2e7d32';
            ctx.beginPath();
            ctx.arc(0, -12, 18, 0, Math.PI * 2);
            ctx.arc(-10, -5, 14, 0, Math.PI * 2);
            ctx.arc(10, -5, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(-3, -15, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Layer 3: 2.5D Infinite Ground Plane
    drawGroundPlane(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const horizon = this.config.PERSPECTIVE_HORIZON_Y;
        const theme = this.theme;

        ctx.save();

        if (theme === 'cheese') {
            // Rich appetizing Swiss & Gouda cheese ground (warm golden, NOT blinding lemon yellow)
            const cheeseGrad = ctx.createLinearGradient(0, horizon, 0, h);
            cheeseGrad.addColorStop(0, '#b45309');
            cheeseGrad.addColorStop(0.2, '#d97706');
            cheeseGrad.addColorStop(0.6, '#f59e0b');
            cheeseGrad.addColorStop(1, '#fbbf24');
            ctx.fillStyle = cheeseGrad;
            ctx.fillRect(0, horizon, w, h - horizon);

            // Draw porous Swiss cheese crater bubbles on the plane
            this.drawCheeseGroundTexture(ctx, w, h, horizon);
        } else if (theme === 'desert') {
            // Warm terracotta desert sand plane
            const desertGrad = ctx.createLinearGradient(0, horizon, 0, h);
            desertGrad.addColorStop(0, '#9a3412');
            desertGrad.addColorStop(0.3, '#c2410c');
            desertGrad.addColorStop(0.7, '#ea580c');
            desertGrad.addColorStop(1, '#f97316');
            ctx.fillStyle = desertGrad;
            ctx.fillRect(0, horizon, w, h - horizon);

            this.drawPerspectiveGrid(ctx, w, h, horizon, 'rgba(127, 29, 29, 0.16)');
        } else if (theme === 'candy') {
            // Strawberry frosting & waffle cone ground
            const candyGrad = ctx.createLinearGradient(0, horizon, 0, h);
            candyGrad.addColorStop(0, '#be185d');
            candyGrad.addColorStop(0.3, '#db2777');
            candyGrad.addColorStop(0.7, '#f472b6');
            candyGrad.addColorStop(1, '#fbcfe8');
            ctx.fillStyle = candyGrad;
            ctx.fillRect(0, horizon, w, h - horizon);

            // Colorful candy confetti on ground
            this.drawCandyGroundSprinkles(ctx, w, h, horizon);
        } else if (theme === 'cyber') {
            // High-tech dark glossy synthwave grid
            const cyberGrad = ctx.createLinearGradient(0, horizon, 0, h);
            cyberGrad.addColorStop(0, '#030712');
            cyberGrad.addColorStop(0.4, '#090d16');
            cyberGrad.addColorStop(1, '#111827');
            ctx.fillStyle = cyberGrad;
            ctx.fillRect(0, horizon, w, h - horizon);

            this.drawCyberGrid(ctx, w, h, horizon);
        } else {
            // Lush 2.5D Lawn / Meadow
            const groundGrad = ctx.createLinearGradient(0, horizon, 0, h);
            groundGrad.addColorStop(0, '#388e3c');
            groundGrad.addColorStop(0.25, '#4caf50');
            groundGrad.addColorStop(0.7, '#66bb6a');
            groundGrad.addColorStop(1, '#81c784');
            ctx.fillStyle = groundGrad;
            ctx.fillRect(0, horizon, w, h - horizon);

            this.drawPerspectiveGrid(ctx, w, h, horizon, 'rgba(27, 94, 32, 0.12)');
        }

        // Vignette & Horizon atmospheric haze
        const hazeGrad = ctx.createLinearGradient(0, horizon, 0, horizon + 65);
        if (theme === 'cheese') {
            hazeGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
            hazeGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        } else if (theme === 'cyber') {
            hazeGrad.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
            hazeGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        } else {
            hazeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
            hazeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, horizon, w, 65);

        ctx.restore();
    }

    // Realistic porous Swiss cheese details on ground plane
    drawCheeseGroundTexture(ctx, w, h, horizon) {
        const groundHeight = h - horizon;
        const scroll = this.scrollY_Ground;

        // Subtle baked cheese crust stripes
        const stripeCount = 18;
        for (let i = 0; i < stripeCount; i++) {
            const norm1 = Math.pow(i / stripeCount, 2.1);
            const norm2 = Math.pow((i + 1) / stripeCount, 2.1);
            const y1 = horizon + norm1 * groundHeight;
            const y2 = horizon + norm2 * groundHeight;

            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
                ctx.fillRect(0, y1, w, y2 - y1);
            }
        }

        // 3D Porous cheese pores
        const poreCols = 6;
        const poreRows = 8;
        const spacingY = 120;
        const totalTileY = poreRows * spacingY;

        for (let r = 0; r < poreRows; r++) {
            for (let c = 0; c < poreCols; c++) {
                let rawY = (r * spacingY - scroll * 0.7) % totalTileY;
                if (rawY < 0) rawY += totalTileY;
                const normY = rawY / totalTileY;
                const py = horizon + Math.pow(normY, 1.5) * groundHeight;
                if (py < horizon + 10 || py > h - 10) continue;

                const scale = 0.5 + normY * 0.8;
                const px = (w / (poreCols + 1)) * (c + 1) + ((r % 2 === 0) ? 25 : -25);

                // Deep cheese cavity
                ctx.fillStyle = 'rgba(120, 53, 15, 0.22)';
                ctx.beginPath();
                ctx.ellipse(px, py, 18 * scale, 9 * scale, 0, 0, Math.PI * 2);
                ctx.fill();

                // Creamy highlight rim
                ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
                ctx.lineWidth = 1.5 * scale;
                ctx.beginPath();
                ctx.ellipse(px, py + 1.5 * scale, 17 * scale, 7.5 * scale, 0, 0, Math.PI);
                ctx.stroke();
            }
        }
    }

    drawCandyGroundSprinkles(ctx, w, h, horizon) {
        const groundHeight = h - horizon;
        const scroll = this.scrollY_Ground;
        const colors = ['#f43f5e', '#38bdf8', '#facc15', '#4ade80', '#ffffff'];

        // Perspective waffle lines
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
        ctx.lineWidth = 1.5;
        const centerX = w * 0.5;
        for (let col = -6; col <= 6; col++) {
            const spread = col * (w * 0.12);
            ctx.beginPath();
            ctx.moveTo(centerX + spread * 0.15, horizon);
            ctx.lineTo(centerX + spread * 1.6, h);
            ctx.stroke();
        }

        // Rainbow sprinkles
        for (let i = 0; i < 35; i++) {
            const rawY = (i * 45 - scroll * 0.8) % groundHeight;
            const normY = (rawY < 0 ? rawY + groundHeight : rawY) / groundHeight;
            const py = horizon + Math.pow(normY, 1.4) * groundHeight;
            const px = ((i * 137.5) % w);
            const scale = 0.6 + normY * 0.7;

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate((i * 45) * Math.PI / 180);
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(-4 * scale, -1.5 * scale, 8 * scale, 3 * scale, 1.5) : ctx.rect(-4 * scale, -1.5 * scale, 8 * scale, 3 * scale);
            ctx.fill();
            ctx.restore();
        }
    }

    drawCyberGrid(ctx, w, h, horizon) {
        const groundHeight = h - horizon;
        const scroll = this.scrollY_Ground;

        // Glowing horizontal perspective grid rings
        const ringCount = 14;
        for (let i = 0; i < ringCount; i++) {
            const rawI = (i - (scroll * 0.05)) % ringCount;
            const norm = (rawI < 0 ? rawI + ringCount : rawI) / ringCount;
            const y = horizon + Math.pow(norm, 2.2) * groundHeight;

            ctx.strokeStyle = 'rgba(236, 72, 153, ' + (0.15 + norm * 0.45) + ')';
            ctx.lineWidth = 1 + norm * 2.5;
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 6 * norm;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Converging neon cyan perspective lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        const centerX = w * 0.5;
        for (let col = -6; col <= 6; col++) {
            const spread = col * (w * 0.12);
            ctx.beginPath();
            ctx.moveTo(centerX + spread * 0.12, horizon);
            ctx.lineTo(centerX + spread * 1.6, h);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    drawPerspectiveGrid(ctx, w, h, horizon, lineColor = 'rgba(27, 94, 32, 0.12)') {
        const groundHeight = h - horizon;

        // Subtle alternating rolling turf stripes flowing upward
        const stripeCount = 20;
        for (let i = 0; i < stripeCount; i++) {
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
        ctx.strokeStyle = lineColor;
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

    // Layer 4: Foreground Elements (Floating Leaves / Particles, Corner Grass)
    drawForegroundLayer(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const theme = this.theme;

        ctx.save();

        // 1. Drifting particles / leaves
        for (let i = 0; i < this.floatingLeaves.length; i++) {
            const leaf = this.floatingLeaves[i];
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.angle);

            if (theme === 'cheese') {
                ctx.fillStyle = '#fde047';
                ctx.globalAlpha = 0.65;
                // Golden cheese sparkle star
                ctx.beginPath();
                const s = leaf.size * 0.6;
                ctx.moveTo(0, -s);
                ctx.lineTo(s * 0.3, -s * 0.3);
                ctx.lineTo(s, 0);
                ctx.lineTo(s * 0.3, s * 0.3);
                ctx.lineTo(0, s);
                ctx.lineTo(-s * 0.3, s * 0.3);
                ctx.lineTo(-s, 0);
                ctx.lineTo(-s * 0.3, -s * 0.3);
                ctx.closePath();
                ctx.fill();
            } else if (theme === 'cyber') {
                ctx.fillStyle = '#06b6d4';
                ctx.globalAlpha = 0.7;
                ctx.fillRect(-leaf.size * 0.4, -leaf.size * 0.4, leaf.size * 0.8, leaf.size * 0.8);
            } else if (theme === 'desert') {
                ctx.fillStyle = '#fb923c';
                ctx.globalAlpha = 0.55;
                ctx.beginPath();
                ctx.arc(0, 0, leaf.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (theme === 'candy') {
                ctx.fillStyle = i % 2 === 0 ? '#f43f5e' : '#38bdf8';
                ctx.globalAlpha = 0.75;
                ctx.beginPath();
                ctx.arc(0, 0, leaf.size * 0.45, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = leaf.color;
                ctx.globalAlpha = 0.75;
                ctx.beginPath();
                ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 2. Corner Foreground Blades
        this.drawCornerGrass(ctx, 0, h, false, theme);
        this.drawCornerGrass(ctx, w, h, true, theme);

        ctx.restore();
    }

    drawCornerGrass(ctx, x, y, flip = false, theme = 'garden') {
        ctx.save();
        ctx.translate(x, y);
        if (flip) ctx.scale(-1, 1);

        let colors = ['#1b5e20', '#2e7d32', '#388e3c'];
        if (theme === 'cheese') {
            colors = ['#78350f', '#b45309', '#d97706']; // Toasted pretzel & biscuit crust blades
        } else if (theme === 'desert') {
            colors = ['#7c2d12', '#9a3412', '#c2410c']; // Dry canyon grasses
        } else if (theme === 'candy') {
            colors = ['#be185d', '#db2777', '#f472b6']; // Pink frosting swirls
        } else if (theme === 'cyber') {
            colors = ['#0891b2', '#06b6d4', '#22d3ee']; // Glowing neon data blades
        }

        const sway = Math.sin(Date.now() * 0.003) * 6;

        for (let i = 0; i < 7; i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(i * 14, 0);
            ctx.quadraticCurveTo(i * 14 + 10 + sway, -60 - i * 12, i * 14 + 25 + sway * 1.5, -95 - i * 15);
            ctx.quadraticCurveTo(i * 14 + 5 + sway, -50 - i * 10, i * 14 + 12, 0);
            ctx.fill();
        }

        ctx.restore();
    }
}
