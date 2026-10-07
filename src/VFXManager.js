// src/VFXManager.js - Visual Effects, Particle Systems, Full-Screen Explosion & Floating Text in Front of Hand
import { ObjectPool } from './ObjectPool.js';

// Particle definition (Optimized: No expensive Canvas shadowBlur for mobile 60 FPS)
class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 5;
        this.color = '#fff';
        this.alpha = 1;
        this.life = 1;
        this.maxLife = 1;
        this.gravity = 400;
        this.bounce = 0.3;
        this.groundY = 9999;
        this.type = 'spark'; // 'spark' | 'dirt' | 'smoke' | 'star' | 'spore' | 'droplet' | 'confetti'
        this.rotation = 0;
        this.rotSpeed = 0;
        this.scale = 1;
        this.active = false;
    }

    reset(x, y, vx, vy, size, color, maxLife, gravity = 400, type = 'spark', groundY = 9999) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.maxLife = maxLife;
        this.life = maxLife;
        this.alpha = 1;
        this.gravity = gravity;
        this.groundY = groundY;
        this.type = type;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 12;
        this.scale = 1;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) return false;

        const progress = 1 - (this.life / this.maxLife);
        this.alpha = Math.max(0, 1 - progress);

        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotSpeed * dt;

        // Ground bounce for dirt clumps
        if (this.type === 'dirt' && this.y >= this.groundY) {
            this.y = this.groundY;
            this.vy = -this.vy * this.bounce;
            this.vx *= 0.65;
        }

        // Smoke / spore expansion
        if (this.type === 'smoke') {
            this.scale = 1 + progress * 2.2;
            this.alpha = Math.max(0, (1 - progress) * 0.7);
        } else if (this.type === 'spore') {
            this.vx += Math.sin(this.life * 4) * 5 * dt;
        } else if (this.type === 'confetti') {
            this.vx *= 0.96;
        }

        return true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Mobile Optimization: Zero shadowBlur for silky smooth 60 FPS
        if (this.type === 'spark') {
            // Crisp dual-layer glow circle (100x faster than canvas blur)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'dirt') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'smoke') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * this.scale, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            const s = this.size;
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
        } else if (this.type === 'droplet') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            const s = this.size;
            ctx.moveTo(0, -s * 1.5);
            ctx.quadraticCurveTo(s, 0, 0, s);
            ctx.quadraticCurveTo(-s, 0, 0, -s * 1.5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-s * 0.25, -s * 0.2, s * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'confetti') {
            ctx.fillStyle = this.color;
            const w = this.size * 1.4;
            const h = Math.max(1.5, Math.abs(this.size * 0.6 * Math.cos(this.rotation * 2.5)));
            ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
        } else if (this.type === 'spore') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Shockwave Ring
class Shockwave {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 0;
        this.maxRadius = 160;
        this.color = '#fff';
        this.life = 0;
        this.maxLife = 0.35;
        this.active = false;
    }

    reset(x, y, maxRadius = 160, color = '#fff', maxLife = 0.35) {
        this.x = x;
        this.y = y;
        this.maxRadius = maxRadius;
        this.color = color;
        this.maxLife = maxLife;
        this.life = maxLife;
        this.radius = 10;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) return false;
        const progress = 1 - (this.life / this.maxLife);
        // Exponential ease-out expansion
        this.radius = 10 + (this.maxRadius - 10) * Math.sin(progress * Math.PI * 0.5);
        return true;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        const alpha = Math.max(0, 1 - progress);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(1.5, 6 * (1 - progress));
        ctx.beginPath();
        // 2.5D perspective ellipse
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Floating Comic Insult & Score Text (Requirement 4: Drawn IN FRONT of Hand!)
class FloatingText {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.text = 'IDIOt!';
        this.life = 0.75;
        this.maxLife = 0.75;
        this.color = '#ffffff';
        this.strokeColor = '#1e1b4b';
        this.bannerColor = '#facc15';
        this.scale = 1;
        this.vy = -85;
        this.rotation = 0;
        this.isScore = false;
        this.active = false;
    }

    reset(x, y, text, color = '#ffffff', strokeColor = '#1e1b4b', bannerColor = '#facc15', isScore = false) {
        this.x = x;
        // Spawns higher above the hit point so it is never obstructed
        this.y = y - 48;
        this.text = text;
        this.color = color;
        this.strokeColor = strokeColor;
        this.bannerColor = bannerColor;
        this.isScore = isScore;
        this.maxLife = isScore ? 0.85 : 0.80;
        this.life = this.maxLife;
        this.vy = isScore ? -110 : -95;
        this.scale = 0.3;
        this.rotation = isScore ? 0 : (Math.random() - 0.5) * 0.22;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) return false;
        const progress = 1 - (this.life / this.maxLife);

        // Elastic pop scale: fast overshoot and spring settle
        if (progress < 0.22) {
            this.scale = 0.3 + (progress / 0.22) * 1.05;
        } else if (progress < 0.40) {
            this.scale = 1.35 - ((progress - 0.22) / 0.18) * 0.35;
        } else {
            this.scale = 1.0;
        }

        this.y += this.vy * dt;
        this.vy *= 0.94;
        return true;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        const alpha = progress > 0.68 ? Math.max(0, 1 - (progress - 0.68) / 0.32) : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        if (!this.isScore && this.bannerColor) {
            // 12-point jagged comic explosion starburst banner
            ctx.save();
            ctx.fillStyle = this.bannerColor;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3.5;

            const points = 12;
            const textWidth = Math.max(96, this.text.length * 18);
            const outerR = textWidth * 0.62;
            const innerR = outerR * 0.68;
            ctx.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const angle = (i * Math.PI) / points;
                const r = (i % 2 === 0) ? outerR : innerR;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * (r * 0.62);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.font = '900 30px "Outfit", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // High performance cartoon drop shadow (offset fill without blur)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillText(this.text, 2, 4);

        // Thick comic cartoon stroke
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = 7.0;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeText(this.text, 0, 0);

        // Crisp white / bright fill
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, 0);

        ctx.restore();
    }
}

// Impact Flash (radial light burst)
class ImpactFlash {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 100;
        this.life = 0;
        this.maxLife = 0.14;
        this.color = '#ffffff';
        this.active = false;
    }

    reset(x, y, radius = 90, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.maxLife = 0.14;
        this.life = this.maxLife;
    }

    update(dt) {
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        const alpha = Math.max(0, (1 - progress) * 0.85);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;

        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, this.color);
        grad.addColorStop(0.4, 'rgba(255, 235, 100, 0.7)');
        grad.addColorStop(1, 'rgba(255, 200, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Hole Crack VFX - Stone fracture lines on hit
export class HoleCrack {
    constructor() {
        this.reset(0, 0, 50, 25);
    }

    reset(x, y, rx, ry, hole = null) {
        this.x = x;
        this.y = y;
        this.rx = rx;
        this.ry = ry;
        this.hole = hole;
        this.life = 2.0;
        this.maxLife = 2.0;
        this.branches = [];

        const count = 5;
        for (let i = 0; i < count; i++) {
            const baseAngle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const startX = Math.cos(baseAngle) * (rx * 0.95);
            const startY = Math.sin(baseAngle) * (ry * 0.95);

            const segs = [];
            let cx = startX;
            let cy = startY;
            const segCount = 3;
            const totalLen = 22 + Math.random() * 20;

            for (let j = 0; j < segCount; j++) {
                const ang = baseAngle + (Math.random() - 0.5) * 0.7;
                const len = totalLen / segCount;
                cx += Math.cos(ang) * len;
                cy += Math.sin(ang) * len * 0.65;
                segs.push({ x: cx, y: cy });
            }
            this.branches.push({ startX, startY, segs });
        }
    }

    update(dt) {
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const progress = 1 - (this.life / this.maxLife);
        const alpha = progress < 0.6 ? 0.95 : Math.max(0, (1 - progress) / 0.4 * 0.95);

        const drawX = this.hole ? this.hole.screenX : this.x;
        const drawY = this.hole ? this.hole.screenY : this.y;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';

        ctx.strokeStyle = 'rgba(25, 30, 40, 0.85)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (const b of this.branches) {
            ctx.moveTo(b.startX, b.startY);
            for (const pt of b.segs) {
                ctx.lineTo(pt.x, pt.y);
            }
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        for (const b of this.branches) {
            ctx.moveTo(b.startX + 0.6, b.startY + 0.6);
            for (const pt of b.segs) {
                ctx.lineTo(pt.x + 0.6, pt.y + 0.6);
            }
        }
        ctx.stroke();
        ctx.restore();
    }
}

// User Requested Insult Texts (Requirement 4)
export const INSULT_TEXTS = [
    'Idiot',
    'Namoona',
    'Chomu',
    'Bewakoof',
    'Gadhay',
    'Nalaiq',
    'Nikammo',
    'Doob Maro',
    'Ullu',
    'Jahil',
    'Pagal',
    'Bakwas',
    'Noob',
    'Stupid',
    'Moron'
];

export class VFXManager {
    constructor(config) {
        this.config = config;

        // Optimized Object Pools
        this.particles = new ObjectPool(() => new Particle(), (p, ...args) => p.reset(...args), 120);
        this.shockwaves = new ObjectPool(() => new Shockwave(), (s, ...args) => s.reset(...args), 20);
        this.floatingTexts = new ObjectPool(() => new FloatingText(), (t, ...args) => t.reset(...args), 20);
        this.impactFlashes = new ObjectPool(() => new ImpactFlash(), (f, ...args) => f.reset(...args), 15);
        this.holeCracks = new ObjectPool(() => new HoleCrack(), (c, ...args) => c.reset(...args), 20);

        // Screen Impact Flash System
        this.screenFlash = {
            color: '255, 255, 255',
            alpha: 0,
            maxAlpha: 0.35,
            duration: 0.05,
            timer: 0
        };

        // Full Screen Explosion Vignette (Requirement 3)
        this.fullScreenExplosion = {
            active: false,
            timer: 0,
            duration: 0.65,
            color: '220, 38, 38'
        };

        // Ambient drifting spores
        this.ambientParticles = [];
        this.initAmbientParticles();
    }

    initAmbientParticles() {
        const count = 25; // Mobile-friendly count
        for (let i = 0; i < count; i++) {
            this.ambientParticles.push({
                x: Math.random() * this.config.VIEWPORT_WIDTH,
                y: Math.random() * this.config.VIEWPORT_HEIGHT,
                speedY: -(20 + Math.random() * 35),
                speedX: (Math.random() - 0.5) * 12,
                size: 1.5 + Math.random() * 2.5,
                baseAlpha: 0.2 + Math.random() * 0.4,
                phase: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? '#fff9c4' : '#b2dfdb'
            });
        }
    }

    triggerScreenFlash(color = '255, 255, 255', maxAlpha = 0.30, duration = 0.05) {
        this.screenFlash.color = color;
        this.screenFlash.maxAlpha = maxAlpha;
        this.screenFlash.alpha = maxAlpha;
        this.screenFlash.duration = duration;
        this.screenFlash.timer = duration;
    }

    spawnScorePopup(x, y, points, streak = 1) {
        let label = `+${points}`;
        let col = '#fde047';
        if (streak >= 5) {
            label = `+${points} FEVER!`;
            col = '#f43f5e';
        } else if (streak >= 3) {
            label = `+${points} COMBO!`;
            col = '#38bdf8';
        }
        this.floatingTexts.get(x, y, label, col, '#090d16', null, true);
    }

    spawnComboConfetti(x, y, count = 20) {
        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#fbbf24', '#a855f7', '#ec4899', '#ffffff'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 220;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 0.7 - 50;
            this.particles.get(
                x, y,
                vx, vy,
                3 + Math.random() * 4,
                colors[Math.floor(Math.random() * colors.length)],
                0.6 + Math.random() * 0.4,
                350,
                'confetti'
            );
        }
    }

    // Regular Hit VFX
    spawnHitVFX(x, y, depthScale = 1.0, isSpecial = false, hitType = 'punch', comboStreak = 1) {
        const isSlap = (hitType === 'slap');

        const flashCol = isSlap ? '244, 114, 182' : '255, 235, 150';
        this.triggerScreenFlash(flashCol, isSlap ? 0.25 : 0.20, 0.04);

        const flashColor = isSlap ? '#f472b6' : (isSpecial ? '#ffeb3b' : '#ffffff');
        this.impactFlashes.get(x, y, (isSlap ? 110 : 95) * depthScale, flashColor);

        const waveColor = isSlap ? '#ec4899' : (isSpecial ? '#ffd54f' : '#ffffff');
        this.shockwaves.get(x, y + 10 * depthScale, (isSlap ? 150 : 135) * depthScale, waveColor);

        // High performance sparks
        const sparkCount = isSlap ? 16 : 14;
        const palette = isSlap 
            ? ['#f472b6', '#ec4899', '#db2777', '#fbcfe8', '#ffffff']
            : ['#ffeb3b', '#ff9800', '#ff5722', '#ffffff', '#ffd54f'];

        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 130 + Math.random() * 220;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 0.65 - 70;
            const color = palette[Math.floor(Math.random() * palette.length)];
            this.particles.get(
                x, y,
                vx, vy,
                (2.5 + Math.random() * 3) * depthScale,
                color,
                0.32 + Math.random() * 0.28,
                340,
                'spark'
            );
        }

        // Flying cartoon droplets
        for (let i = 0; i < 4; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
            const speed = 100 + Math.random() * 160;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 50;
            this.particles.get(
                x, y - 10 * depthScale,
                vx, vy,
                (4 + Math.random() * 2.5) * depthScale,
                'rgba(147, 197, 253, 0.95)',
                0.40 + Math.random() * 0.20,
                440,
                'droplet'
            );
        }

        // Cartoon stars
        for (let i = 0; i < 4; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
            const speed = 110 + Math.random() * 160;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 45;
            this.particles.get(
                x, y - 15 * depthScale,
                vx, vy,
                (5.5 + Math.random() * 4) * depthScale,
                isSlap ? '#f472b6' : '#ffd700',
                0.45 + Math.random() * 0.25,
                400,
                'star'
            );
        }

        // Dust puffs
        for (let i = 0; i < 6; i++) {
            const angle = -Math.PI + Math.random() * Math.PI;
            const speed = 60 + Math.random() * 130;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const isSmoke = Math.random() > 0.45;
            this.particles.get(
                x + (Math.random() - 0.5) * 35 * depthScale,
                y + (Math.random() - 0.5) * 12 * depthScale,
                vx, vy,
                (isSmoke ? 7 : 3.5) * depthScale,
                isSmoke ? 'rgba(215, 195, 160, 0.55)' : '#6d4c41',
                0.35 + Math.random() * 0.25,
                isSmoke ? 30 : 480,
                isSmoke ? 'smoke' : 'dirt',
                y + 30 * depthScale
            );
        }

        if (comboStreak >= 3) {
            this.spawnComboConfetti(x, y - 20 * depthScale, Math.min(22, 10 + comboStreak * 3));
        }

        // Requirement 4: Comic Pop Insult Text (Idiot, Namoona, Chomu, etc.)
        if (this.config.FLOATING_TEXT_ENABLED) {
            const word = INSULT_TEXTS[Math.floor(Math.random() * INSULT_TEXTS.length)] + '!';
            const bannerCol = isSlap ? '#f472b6' : '#facc15';
            const strokeCol = isSlap ? '#831843' : '#1e1b4b';
            this.floatingTexts.get(x, y, word, '#ffffff', strokeCol, bannerCol, false);
        }
    }

    // Trigger stone crack VFX on hole rim
    spawnHoleCrackVFX(x, y, rx, ry, hole = null) {
        this.holeCracks.get(x, y, rx, ry, hole);
    }

    // Requirement 3: Massive FULL-SCREEN Explosion VFX!
    // Covers the ENTIRE viewport with shockwaves, blazing fire, embers, and full-screen vignette!
    spawnFullScreenExplosionVFX(x, y) {
        const W = this.config.VIEWPORT_WIDTH || 1200;
        const H = this.config.VIEWPORT_HEIGHT || 800;
        const screenDiagonal = Math.hypot(W, H);

        // 1. Intense Full-Screen Chromatic Screen Flash
        this.triggerScreenFlash('239, 68, 68', 0.85, 0.24);

        // Activate Full-Screen Fiery Explosion Vignette
        this.fullScreenExplosion.active = true;
        this.fullScreenExplosion.duration = 0.70;
        this.fullScreenExplosion.timer = 0.70;

        // 2. Giant Full-Screen expanding blast waves covering entire screen
        this.impactFlashes.get(x, y, 260, '#ffffff');
        this.shockwaves.get(x, y, screenDiagonal * 0.95, '#ff5722', 0.55);
        this.shockwaves.get(x, y, screenDiagonal * 0.70, '#dc2626', 0.45);
        this.shockwaves.get(x, y, screenDiagonal * 0.45, '#ffd700', 0.35);

        // 3. Dense radial fireball smoke puffs expanding across the screen
        for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 340;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 0.75 - 80;
            const colors = ['#f59e0b', '#ef4444', '#dc2626', '#b91c1c', 'rgba(40, 45, 55, 0.85)'];
            const c = colors[Math.floor(Math.random() * colors.length)];
            this.particles.get(
                x + (Math.random() - 0.5) * 50,
                y + (Math.random() - 0.5) * 40,
                vx, vy,
                14 + Math.random() * 16,
                c,
                0.60 + Math.random() * 0.40,
                30,
                'smoke'
            );
        }

        // 4. Burning fiery sparks flying in all directions
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 160 + Math.random() * 400;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 100;
            const sparkColors = ['#ffeb3b', '#ff9800', '#ff5722', '#ffffff', '#ef4444'];
            this.particles.get(
                x, y,
                vx, vy,
                3.5 + Math.random() * 4,
                sparkColors[Math.floor(Math.random() * sparkColors.length)],
                0.50 + Math.random() * 0.35,
                460,
                'spark'
            );
        }

        // 5. Giant comic BOOM! text in front of hand!
        if (this.config.FLOATING_TEXT_ENABLED) {
            this.floatingTexts.get(x, y - 60, 'BOOM! -1 LIFE', '#ffffff', '#450a0a', '#dc2626', false);
        }
    }

    spawnMoleEmergeVFX(x, y, depthScale = 1.0) {
        for (let i = 0; i < 6; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
            const speed = 40 + Math.random() * 70;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.particles.get(
                x + (Math.random() - 0.5) * 35 * depthScale,
                y + 10 * depthScale,
                vx, vy,
                (4 + Math.random() * 3) * depthScale,
                'rgba(180, 150, 110, 0.45)',
                0.3 + Math.random() * 0.2,
                30,
                'smoke'
            );
        }
    }

    update(dt) {
        this.particles.update(dt);
        this.shockwaves.update(dt);
        this.floatingTexts.update(dt);
        this.impactFlashes.update(dt);
        this.holeCracks.update(dt);

        if (this.screenFlash.timer > 0) {
            this.screenFlash.timer -= dt;
            this.screenFlash.alpha = Math.max(0, (this.screenFlash.timer / this.screenFlash.duration) * this.screenFlash.maxAlpha);
        }

        if (this.fullScreenExplosion.active) {
            this.fullScreenExplosion.timer -= dt;
            if (this.fullScreenExplosion.timer <= 0) {
                this.fullScreenExplosion.active = false;
            }
        }

        // Ambient floating spores
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        for (let i = 0; i < this.ambientParticles.length; i++) {
            const p = this.ambientParticles[i];
            p.y += p.speedY * dt;
            p.x += (p.speedX + Math.sin(p.phase) * 10) * dt;
            p.phase += dt * 2.0;

            if (p.y < -20) {
                p.y = h + 20;
                p.x = Math.random() * w;
            }
            if (p.x < -20) p.x = w + 20;
            if (p.x > w + 20) p.x = -20;
        }
    }

    drawGroundLayer(ctx) {
        this.holeCracks.draw(ctx);
        this.shockwaves.draw(ctx);
    }

    drawTopLayer(ctx) {
        this.impactFlashes.draw(ctx);
        this.particles.draw(ctx);
    }

    // Requirement 4: Draw Floating Texts (Idiot, Namoona, Chomu, etc.) IN FRONT OF HAND!
    drawFloatingTexts(ctx) {
        this.floatingTexts.draw(ctx);
    }

    // Requirement 3: Draw Full-screen Screen Flash & Fiery Explosion Covering Whole Screen
    drawScreenFlash(ctx) {
        const W = this.config.VIEWPORT_WIDTH;
        const H = this.config.VIEWPORT_HEIGHT;

        // 1. Fiery Explosion Vignette covering whole screen
        if (this.fullScreenExplosion.active) {
            const p = 1 - (this.fullScreenExplosion.timer / this.fullScreenExplosion.duration);
            const vigAlpha = Math.max(0, (1 - p) * 0.75);

            ctx.save();
            const vig = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.25, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.65);
            vig.addColorStop(0, 'rgba(239, 68, 68, 0)');
            vig.addColorStop(0.5, `rgba(220, 38, 38, ${vigAlpha * 0.45})`);
            vig.addColorStop(1, `rgba(185, 28, 28, ${vigAlpha})`);
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }

        // 2. High-impact Screen Flash
        if (this.screenFlash && this.screenFlash.alpha > 0.005) {
            ctx.save();
            ctx.fillStyle = `rgba(${this.screenFlash.color}, ${this.screenFlash.alpha})`;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }
    }

    drawAmbientForeground(ctx) {
        ctx.save();
        for (let i = 0; i < this.ambientParticles.length; i++) {
            const p = this.ambientParticles[i];
            const pulse = 0.7 + Math.sin(p.phase) * 0.3;
            ctx.globalAlpha = p.baseAlpha * pulse;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
