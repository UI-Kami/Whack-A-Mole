// src/VFXManager.js - Visual Effects, Particle Systems, Shockwaves, and Impact Juice
import { ObjectPool } from './ObjectPool.js';

// Particle definition
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
            // Air friction slows down horizontal speed
            this.vx *= 0.96;
        }

        return true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'spark') {
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
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
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            const s = this.size;
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
        } else if (this.type === 'droplet') {
            // Cartoon sweat/tear droplet
            ctx.fillStyle = this.color;
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            const s = this.size;
            ctx.moveTo(0, -s * 1.5);
            ctx.quadraticCurveTo(s, 0, 0, s);
            ctx.quadraticCurveTo(-s, 0, 0, -s * 1.5);
            ctx.fill();
            // Tiny white glint
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-s * 0.25, -s * 0.2, s * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'confetti') {
            // Tumbling 3D confetti ribbon
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 4;
            const w = this.size * 1.4;
            const h = Math.max(1.5, Math.abs(this.size * 0.6 * Math.cos(this.rotation * 2.5)));
            ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
        } else if (this.type === 'spore') {
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Shockwave definition
class Shockwave {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 0;
        this.maxRadius = 120;
        this.color = '#fff';
        this.lineWidth = 6;
        this.life = 0.35;
        this.maxLife = 0.35;
        this.active = false;
        this.aspectY = 0.55; // 2.5D perspective ellipse flattening
    }

    reset(x, y, maxRadius = 130, color = '#ffffff', maxLife = 0.38) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = maxRadius;
        this.color = color;
        this.maxLife = maxLife;
        this.life = maxLife;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) return false;
        const progress = 1 - (this.life / this.maxLife);
        const ease = 1 - Math.pow(1 - progress, 3);
        this.radius = 10 + (this.maxRadius - 10) * ease;
        this.lineWidth = Math.max(1, 8 * (1 - progress));
        return true;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = Math.max(0, (1 - progress) * 0.9);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius, this.radius * this.aspectY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Comic Floating Pop Text with 12-Point Jagged Starburst Explosion Backdrop
class FloatingText {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.text = 'BONK!';
        this.life = 0.65;
        this.maxLife = 0.65;
        this.color = '#ffeb3b';
        this.strokeColor = '#b71c1c';
        this.bannerColor = '#fde047';
        this.scale = 1;
        this.vy = -70;
        this.rotation = 0;
        this.isScore = false;
        this.active = false;
    }

    reset(x, y, text, color = '#ffeb3b', strokeColor = '#212121', bannerColor = '#fde047', isScore = false) {
        this.x = x;
        this.y = y - 20;
        this.text = text;
        this.color = color;
        this.strokeColor = strokeColor;
        this.bannerColor = bannerColor;
        this.isScore = isScore;
        this.maxLife = isScore ? 0.85 : 0.72;
        this.life = this.maxLife;
        this.vy = isScore ? -105 : -80;
        this.scale = 0.3;
        this.rotation = isScore ? 0 : (Math.random() - 0.5) * 0.28;
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
        const alpha = progress > 0.65 ? Math.max(0, 1 - (progress - 0.65) / 0.35) : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        if (!this.isScore && this.bannerColor) {
            // Draw 12-point jagged comic explosion starburst backdrop!
            ctx.save();
            ctx.fillStyle = this.bannerColor;
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;

            const points = 12;
            const textWidth = Math.max(84, this.text.length * 15.5);
            const outerR = textWidth * 0.60;
            const innerR = outerR * 0.65;
            ctx.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const angle = (i * Math.PI) / points;
                const r = (i % 2 === 0) ? outerR : innerR;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * (r * 0.62); // 2.5D oval perspective
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.font = this.isScore 
            ? '900 24px "Outfit", "Arial Black", sans-serif'
            : '900 26px "Outfit", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer cartoon stroke
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.isScore ? 5 : 6;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;
        ctx.strokeText(this.text, 0, 0);

        // Bright fill with subtle specular glow
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.isScore ? 'rgba(245, 158, 11, 0.8)' : 'rgba(0,0,0,0.4)';
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 6;
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

// Hole Crack VFX - Jagged stone fracture lines radiating from hole rim on hit (Point 4)
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
        this.life = 2.4;
        this.maxLife = 2.4;
        this.branches = [];

        // Generate 5-7 jagged fracture branches radiating out from the rim
        const count = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const baseAngle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
            const startX = Math.cos(baseAngle) * (rx * 0.95);
            const startY = Math.sin(baseAngle) * (ry * 0.95);

            const segs = [];
            let cx = startX;
            let cy = startY;
            const segCount = 3 + Math.floor(Math.random() * 3);
            const totalLen = 22 + Math.random() * 28;

            for (let j = 0; j < segCount; j++) {
                const ang = baseAngle + (Math.random() - 0.5) * 0.8;
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
        ctx.lineJoin = 'miter';

        // Outer dark fissure
        ctx.strokeStyle = 'rgba(25, 30, 40, 0.9)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (const b of this.branches) {
            ctx.moveTo(b.startX, b.startY);
            for (const pt of b.segs) {
                ctx.lineTo(pt.x, pt.y);
            }
        }
        ctx.stroke();

        // Inner stone highlight line
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

export const INSULT_TEXTS = [
    'Bewakoof',
    'Gadhay',
    'Nalaiq',
    'Nikammo',
    'Doob Maro',
    'Ullu',
    'Jahil',
    'Pagal',
    'Namoona',
    'Bakwas',
    'Noob',
    'Idiot',
    'Stupid',
    'Moron',
    'Chomu'
];

export class VFXManager {
    constructor(config) {
        this.config = config;

        // Pools
        this.particles = new ObjectPool(() => new Particle(), (p, ...args) => p.reset(...args), 150);
        this.shockwaves = new ObjectPool(() => new Shockwave(), (s, ...args) => s.reset(...args), 25);
        this.floatingTexts = new ObjectPool(() => new FloatingText(), (t, ...args) => t.reset(...args), 20);
        this.impactFlashes = new ObjectPool(() => new ImpactFlash(), (f, ...args) => f.reset(...args), 15);
        this.holeCracks = new ObjectPool(() => new HoleCrack(), (c, ...args) => c.reset(...args), 25);

        // Screen Impact Flash System
        this.screenFlash = {
            color: '255, 255, 255',
            alpha: 0,
            maxAlpha: 0.35,
            duration: 0.05,
            timer: 0
        };

        // Ambient drifting spores / pollen
        this.ambientParticles = [];
        this.initAmbientParticles();
    }

    initAmbientParticles() {
        for (let i = 0; i < 40; i++) {
            this.ambientParticles.push({
                x: Math.random() * this.config.VIEWPORT_WIDTH,
                y: Math.random() * this.config.VIEWPORT_HEIGHT,
                speedY: -(20 + Math.random() * 40),
                speedX: (Math.random() - 0.5) * 15,
                size: 1.5 + Math.random() * 3,
                baseAlpha: 0.2 + Math.random() * 0.45,
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

    spawnComboConfetti(x, y, count = 28) {
        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#fbbf24', '#a855f7', '#ec4899', '#ffffff'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 260;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 0.7 - 90;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.get(
                x + (Math.random() - 0.5) * 30,
                y + (Math.random() - 0.5) * 20,
                vx, vy,
                5 + Math.random() * 4,
                color,
                0.65 + Math.random() * 0.4,
                380,
                'confetti'
            );
        }
    }

    // Trigger full satisfying hit VFX bundle with HumanHit(TEXT) insults & juice
    spawnHitVFX(x, y, depthScale = 1.0, isSpecial = false, hitType = 'punch', comboStreak = 1) {
        const isSlap = hitType === 'slap';

        // 1. Screen impact flash (crisp micro-flash)
        const flashCol = isSlap ? '244, 114, 182' : '255, 235, 150';
        this.triggerScreenFlash(flashCol, isSlap ? 0.28 : 0.24, 0.04);

        // 2. Impact radial flash
        const flashColor = isSlap ? '#f472b6' : (isSpecial ? '#ffeb3b' : '#ffffff');
        this.impactFlashes.get(x, y, (isSlap ? 115 : 100) * depthScale, flashColor);

        // 3. Shockwave expanding on 2.5D plane
        const waveColor = isSlap ? '#ec4899' : (isSpecial ? '#ffd54f' : '#ffffff');
        this.shockwaves.get(x, y + 10 * depthScale, (isSlap ? 155 : 140) * depthScale, waveColor);

        // 4. Hit sparks radiating outwards
        const sparkCount = Math.floor((isSlap ? 22 : this.config.PARTICLE_COUNT_HIT) * depthScale);
        const palette = isSlap 
            ? ['#f472b6', '#ec4899', '#db2777', '#fbcfe8', '#ffffff']
            : ['#ffeb3b', '#ff9800', '#ff5722', '#ffffff', '#ffd54f'];

        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 140 + Math.random() * 260;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 0.65 - 80;
            const color = palette[Math.floor(Math.random() * palette.length)];
            this.particles.get(
                x, y,
                vx, vy,
                (2.5 + Math.random() * 3.5) * depthScale,
                color,
                0.35 + Math.random() * 0.35,
                350,
                'spark'
            );
        }

        // 5. Flying cartoon sweat / tear droplets
        const dropCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < dropCount; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
            const speed = 110 + Math.random() * 190;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 60;
            this.particles.get(
                x, y - 10 * depthScale,
                vx, vy,
                (4.5 + Math.random() * 3) * depthScale,
                'rgba(147, 197, 253, 0.95)',
                0.45 + Math.random() * 0.25,
                460,
                'droplet'
            );
        }

        // 6. Bonk / slap stars
        const starCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < starCount; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
            const speed = 120 + Math.random() * 180;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 50;
            this.particles.get(
                x, y - 15 * depthScale,
                vx, vy,
                (6 + Math.random() * 5) * depthScale,
                isSlap ? '#f472b6' : '#ffd700',
                0.5 + Math.random() * 0.3,
                420,
                'star'
            );
        }

        // 7. Dirt clumps & dust puffs around hole rim
        const dustCount = Math.floor(this.config.PARTICLE_COUNT_DUST * depthScale);
        for (let i = 0; i < dustCount; i++) {
            const angle = -Math.PI + Math.random() * Math.PI;
            const speed = 70 + Math.random() * 160;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const isSmoke = Math.random() > 0.45;
            this.particles.get(
                x + (Math.random() - 0.5) * 40 * depthScale,
                y + (Math.random() - 0.5) * 15 * depthScale,
                vx, vy,
                (isSmoke ? 8 : 4) * depthScale,
                isSmoke ? 'rgba(215, 195, 160, 0.6)' : '#6d4c41',
                0.4 + Math.random() * 0.35,
                isSmoke ? 30 : 500,
                isSmoke ? 'smoke' : 'dirt',
                y + 35 * depthScale
            );
        }

        // 8. Confetti burst on high streaks!
        if (comboStreak >= 3) {
            this.spawnComboConfetti(x, y - 20 * depthScale, Math.min(32, 14 + comboStreak * 4));
        }

        // 9. Comic Insult Text with Starburst Explosion Banner
        if (this.config.FLOATING_TEXT_ENABLED) {
            const word = INSULT_TEXTS[Math.floor(Math.random() * INSULT_TEXTS.length)] + '!';
            const textColor = isSlap ? '#ffffff' : '#261405';
            const strokeColor = isSlap ? '#831843' : '#1c1917';
            const bannerColor = isSlap ? '#f472b6' : '#fde047';
            this.floatingTexts.get(x, y - 36 * depthScale, word, textColor, strokeColor, bannerColor, false);

            // 10. Arcade Score Popup right above insult text
            const basePts = 100;
            const multiplier = Math.max(1, Math.min(5, comboStreak));
            const pts = basePts * multiplier;
            this.spawnScorePopup(x, y - 68 * depthScale, pts, comboStreak);
        }
    }

    // Trigger rage transformation VFX when Yellow turns Red
    spawnRedEnrageVFX(x, y, depthScale = 1.0) {
        this.triggerScreenFlash('239, 68, 68', 0.42, 0.08);

        this.impactFlashes.get(x, y, 125 * depthScale, '#ef4444');
        this.shockwaves.get(x, y + 10 * depthScale, 165 * depthScale, '#dc2626');

        // Steam puffs rising up from angry head
        for (let i = 0; i < 14; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
            const speed = 60 + Math.random() * 140;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 50;
            this.particles.get(
                x + (Math.random() - 0.5) * 30 * depthScale,
                y - 20 * depthScale,
                vx, vy,
                (7 + Math.random() * 6) * depthScale,
                'rgba(239, 68, 68, 0.75)',
                0.5 + Math.random() * 0.3,
                20,
                'smoke'
            );
        }

        // Fiery red sparks
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 220;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 60;
            this.particles.get(
                x, y - 10 * depthScale,
                vx, vy,
                (3 + Math.random() * 3) * depthScale,
                '#f87171',
                0.4 + Math.random() * 0.3,
                380,
                'spark'
            );
        }

        if (this.config.FLOATING_TEXT_ENABLED) {
            this.floatingTexts.get(x, y - 48 * depthScale, 'ENRAGED!', '#ffffff', '#450a0a', '#ef4444', false);
        }
    }

    // Trigger stone crack VFX around hole rim when yellow mole is hit (Point 4)
    spawnHoleCrackVFX(x, y, rx, ry, hole = null) {
        this.holeCracks.get(x, y, rx, ry, hole);

        // Small stone chips / flying debris
        for (let i = 0; i < 7; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 90;
            this.particles.get(
                x + Math.cos(angle) * (rx * 0.9),
                y + Math.sin(angle) * (ry * 0.9),
                Math.cos(angle) * speed,
                Math.sin(angle) * speed * 0.6 - 35,
                2 + Math.random() * 2.5,
                Math.random() > 0.5 ? '#e5e7eb' : '#9ca3af',
                0.35 + Math.random() * 0.25,
                420,
                'dirt'
            );
        }
    }

    // Trigger massive Red Mole explosion VFX with fireball, shockwave, shrapnel & KABOOM (Point 5)
    spawnRedExplosionVFX(x, y, depthScale = 1.0) {
        // Dramatic crimson fireball screen flash
        this.triggerScreenFlash('220, 38, 38', 0.65, 0.16);

        // 1. Massive radial white-hot fireball flash
        this.impactFlashes.get(x, y, 170 * depthScale, '#ffffff');

        // 2. Double fiery shockwaves (outer orange wave + inner crimson ring)
        this.shockwaves.get(x, y, 230 * depthScale, '#ff5722');
        this.shockwaves.get(x, y, 175 * depthScale, '#dc2626');

        // 3. Dense fireball smoke puffs (exploding out in 360 degrees)
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 0.7 - 65;
            const colors = ['#f59e0b', '#ef4444', '#dc2626', '#b91c1c', 'rgba(55, 65, 81, 0.85)'];
            const c = colors[Math.floor(Math.random() * colors.length)];
            this.particles.get(
                x + (Math.random() - 0.5) * 40 * depthScale,
                y + (Math.random() - 0.5) * 30 * depthScale,
                vx, vy,
                (10 + Math.random() * 14) * depthScale,
                c,
                0.55 + Math.random() * 0.4,
                25,
                'smoke'
            );
        }

        // 4. Burning fiery sparks and flying shrapnel
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 140 + Math.random() * 320;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 80;
            const sparkColors = ['#ffeb3b', '#ff9800', '#ff5722', '#ffffff', '#ef4444'];
            this.particles.get(
                x, y,
                vx, vy,
                (3 + Math.random() * 4) * depthScale,
                sparkColors[Math.floor(Math.random() * sparkColors.length)],
                0.45 + Math.random() * 0.35,
                450,
                'spark'
            );
        }

        // 5. Giant comic KABOOM! floating pop text with starburst
        if (this.config.FLOATING_TEXT_ENABLED) {
            this.floatingTexts.get(x, y - 60 * depthScale, 'KABOOM! -1 LIFE', '#ffffff', '#450a0a', '#dc2626', false);
        }
    }

    spawnWrongHitVFX(x, y, depthScale = 1.0) {
        this.spawnRedExplosionVFX(x, y, depthScale);
    }

    spawnMoleEmergeVFX(x, y, depthScale = 1.0) {
        for (let i = 0; i < 8; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
            const speed = 40 + Math.random() * 80;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.particles.get(
                x + (Math.random() - 0.5) * 35 * depthScale,
                y + 10 * depthScale,
                vx, vy,
                (4 + Math.random() * 4) * depthScale,
                'rgba(180, 150, 110, 0.5)',
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

        // Update Screen Flash
        if (this.screenFlash.timer > 0) {
            this.screenFlash.timer -= dt;
            this.screenFlash.alpha = Math.max(0, (this.screenFlash.timer / this.screenFlash.duration) * this.screenFlash.maxAlpha);
        }

        // Update ambient floating spores
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        for (let i = 0; i < this.ambientParticles.length; i++) {
            const p = this.ambientParticles[i];
            p.y += p.speedY * dt;
            p.x += (p.speedX + Math.sin(p.phase) * 12) * dt;
            p.phase += dt * 2.2;

            if (p.y < -20) {
                p.y = h + 20;
                p.x = Math.random() * w;
            }
            if (p.x < -20) p.x = w + 20;
            if (p.x > w + 20) p.x = -20;
        }
    }

    // Draw ground-level effects (cracks, shockwaves)
    drawGroundLayer(ctx) {
        this.holeCracks.draw(ctx);
        this.shockwaves.draw(ctx);
    }

    // Draw above-mole effects (impact flashes, sparks, floating text)
    drawTopLayer(ctx) {
        this.impactFlashes.draw(ctx);
        this.particles.draw(ctx);
        this.floatingTexts.draw(ctx);
    }

    // Draw full-canvas screen flash overlay on heavy impacts
    drawScreenFlash(ctx) {
        if (this.screenFlash && this.screenFlash.alpha > 0.005) {
            ctx.save();
            ctx.fillStyle = `rgba(${this.screenFlash.color}, ${this.screenFlash.alpha})`;
            ctx.fillRect(0, 0, this.config.VIEWPORT_WIDTH, this.config.VIEWPORT_HEIGHT);
            ctx.restore();
        }
    }

    // Draw ambient foreground drifting spores / floating dust
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
