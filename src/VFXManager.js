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
        this.type = 'spark'; // 'spark' | 'dirt' | 'smoke' | 'star' | 'spore'
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
            // Gentle floating oscillation
            this.vx += Math.sin(this.life * 4) * 5 * dt;
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
            // Irregular pebble shape
            ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'smoke') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * this.scale, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            // Cartoon 4-point star
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
        // Easing out cubic
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
        // 2.5D ellipse flat on the ground
        ctx.ellipse(this.x, this.y, this.radius, this.radius * this.aspectY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Comic Floating Pop Text
class FloatingText {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.text = 'BONK!';
        this.life = 0.65;
        this.maxLife = 0.65;
        this.color = '#ffeb3b';
        this.strokeColor = '#b71c1c';
        this.scale = 1;
        this.vy = -70;
        this.rotation = 0;
        this.active = false;
    }

    reset(x, y, text, color = '#ffeb3b', strokeColor = '#212121') {
        this.x = x;
        this.y = y - 20;
        this.text = text;
        this.color = color;
        this.strokeColor = strokeColor;
        this.maxLife = 0.7;
        this.life = this.maxLife;
        this.vy = -90;
        this.scale = 0.3;
        this.rotation = (Math.random() - 0.5) * 0.35;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) return false;
        const progress = 1 - (this.life / this.maxLife);
        
        // Elastic pop scale: quick expand then settle
        if (progress < 0.25) {
            this.scale = (progress / 0.25) * 1.35;
        } else if (progress < 0.45) {
            this.scale = 1.35 - (progress - 0.25) / 0.2 * 0.35;
        } else {
            this.scale = 1.0;
        }

        this.y += this.vy * dt;
        this.vy *= 0.94; // Deceleration
        return true;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        const alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        ctx.font = '900 28px "Outfit", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer cartoon stroke
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = 6;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;
        ctx.strokeText(this.text, 0, 0);

        // Bright fill with drop shadow
        ctx.fillStyle = this.color;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowOffsetY = 3;
        ctx.shadowBlur = 4;
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

export class VFXManager {
    constructor(config) {
        this.config = config;

        // Pools
        this.particles = new ObjectPool(() => new Particle(), (p, ...args) => p.reset(...args), 120);
        this.shockwaves = new ObjectPool(() => new Shockwave(), (s, ...args) => s.reset(...args), 20);
        this.floatingTexts = new ObjectPool(() => new FloatingText(), (t, ...args) => t.reset(...args), 15);
        this.impactFlashes = new ObjectPool(() => new ImpactFlash(), (f, ...args) => f.reset(...args), 10);

        // Ambient drifting spores / pollen
        this.ambientParticles = [];
        this.initAmbientParticles();
    }

    initAmbientParticles() {
        for (let i = 0; i < 40; i++) {
            this.ambientParticles.push({
                x: Math.random() * this.config.VIEWPORT_WIDTH,
                y: Math.random() * this.config.VIEWPORT_HEIGHT,
                speedY: -(20 + Math.random() * 40), // Upward drift
                speedX: (Math.random() - 0.5) * 15,
                size: 1.5 + Math.random() * 3,
                baseAlpha: 0.2 + Math.random() * 0.45,
                phase: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? '#fff9c4' : '#b2dfdb'
            });
        }
    }

    // Trigger full satisfying hit VFX bundle
    spawnHitVFX(x, y, depthScale = 1.0, isSpecial = false) {
        // 1. Impact flash
        this.impactFlashes.get(x, y, 95 * depthScale, isSpecial ? '#ffeb3b' : '#ffffff');

        // 2. Shockwave expanding on 2.5D plane
        this.shockwaves.get(x, y + 10 * depthScale, 135 * depthScale, isSpecial ? '#ffd54f' : '#ffffff');

        // 3. Golden hit sparks radiating outwards
        const sparkCount = Math.floor(this.config.PARTICLE_COUNT_HIT * depthScale);
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 140 + Math.random() * 260;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 0.65 - 80; // Upward bias
            const color = ['#ffeb3b', '#ff9800', '#ff5722', '#ffffff', '#ffd54f'][Math.floor(Math.random() * 5)];
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

        // 4. Bonk stars
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
                '#ffd700',
                0.5 + Math.random() * 0.3,
                420,
                'star'
            );
        }

        // 5. Dirt clumps & dust puffs around hole rim
        const dustCount = Math.floor(this.config.PARTICLE_COUNT_DUST * depthScale);
        for (let i = 0; i < dustCount; i++) {
            const angle = -Math.PI + Math.random() * Math.PI; // Upward half-circle
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
                y + 35 * depthScale // Ground boundary for bounce
            );
        }

        // 6. Comic pop text
        if (this.config.FLOATING_TEXT_ENABLED) {
            const words = isSpecial 
                ? ['CRITICAL!', 'MEGA BONK!', 'GOLDEN!', 'WHAM!']
                : ['BONK!', 'POW!', 'WHACK!', 'SMACK!', 'BAM!', 'GOTCHA!'];
            const word = words[Math.floor(Math.random() * words.length)];
            const color = isSpecial ? '#ffea00' : '#ffe082';
            this.floatingTexts.get(x, y - 30 * depthScale, word, color, '#261405');
        }
    }

    // Dirt puff when mole emerges from hole
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

    // Draw ground-level effects (shockwaves, dirt on ground)
    drawGroundLayer(ctx) {
        this.shockwaves.draw(ctx);
    }

    // Draw above-mole effects (impact flashes, sparks, floating text)
    drawTopLayer(ctx) {
        this.impactFlashes.draw(ctx);
        this.particles.draw(ctx);
        this.floatingTexts.draw(ctx);
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
