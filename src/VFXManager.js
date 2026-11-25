// src/VFXManager.js - Hit Reaction Curse Bubbles, Blasts, Particles & Side Emoji Details
import { ObjectPool } from './ObjectPool.js';
import { CONFIG } from './Config.js';

// Helper to resolve custom font CSS variables with reliable fallbacks
function getConfiguredFonts() {
    try {
        const cs = getComputedStyle(document.documentElement);
        const en = (cs.getPropertyValue('--font-en') || '').trim();
        const ur = (cs.getPropertyValue('--font-ur') || '').trim();
        return {
            en: en || '"Outfit", sans-serif',
            ur: ur || '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Noto Sans Arabic", Arial, sans-serif'
        };
    } catch (e) {
        return {
            en: '"Outfit", sans-serif',
            ur: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Noto Sans Arabic", Arial, sans-serif'
        };
    }
}

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
        this.type = 'spark';
        this.rotation = 0;
        this.rotSpeed = 0;
        this.scale = 1;
        this.active = false;
    }

    reset(x, y, vx, vy, size, color, maxLife, gravity = 400, type = 'spark') {
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
        this.type = type;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 10;
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

        if (this.type === 'smoke') {
            this.scale = 1 + progress * 2.0;
            this.alpha = Math.max(0, (1 - progress) * 0.7);
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
        } else if (this.type === 'confetti') {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size, -this.size * 0.5, this.size * 2, this.size);
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
        this.maxRadius = 180;
        this.color = '#fff';
        this.life = 0;
        this.maxLife = 0.35;
        this.active = false;
    }

    reset(x, y, maxRadius = 180, color = '#fff', maxLife = 0.35) {
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
        this.radius = 10 + (this.maxRadius - 10) * Math.sin(progress * Math.PI * 0.5);
        return true;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        const alpha = Math.max(0, 1 - progress);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(1.5, 5 * (1 - progress));
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Single-Language Speech Bubble (Used on BOTH every normal green hit & bomb explosions)
export class InsultBubble {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.x = 0;
        this.y = 0;
        this.text = '';
        this.lang = 'en';
        this.maxLife = 0.90;
        this.life = 0.90;
        this.delay = 0;
        this.travelDuration = 0.24;
        this.travelTimer = 0;
        this.scale = 0;
        this.targetScale = 1.0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.active = false;
    }

    reset(startX, startY, targetX, targetY, entry, maxLife = 0.90, delay = 0, travelDuration = 0.24, baseScale = 1.0) {
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = startX;
        this.y = startY;

        if (typeof entry === 'string') {
            this.text = entry;
            this.lang = /[\u0600-\u06FF]/.test(entry) ? 'ur' : 'en';
        } else if (entry) {
            this.text = entry.text || '';
            this.lang = entry.lang || (/[\u0600-\u06FF]/.test(this.text) ? 'ur' : 'en');
        } else {
            this.text = '';
            this.lang = 'en';
        }

        this.maxLife = maxLife;
        this.life = maxLife;
        this.delay = delay;
        this.travelDuration = travelDuration;
        this.travelTimer = 0;
        this.scale = 0;
        this.targetScale = baseScale * (0.96 + Math.random() * 0.08);
        this.bobOffset = Math.random() * Math.PI * 2;
        this.active = true;
    }

    update(dt) {
        if (this.delay > 0) {
            this.delay -= dt;
            if (this.delay > 0) return true;
        }

        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return false;
        }

        this.travelTimer += dt;
        const progress = Math.min(1.0, this.travelTimer / this.travelDuration);
        const ease = 1 - Math.pow(1 - progress, 3);
        this.x = this.startX + (this.targetX - this.startX) * ease;
        this.y = this.startY + (this.targetY - this.startY) * ease;

        const popTime = 0.18;
        if (this.travelTimer < popTime) {
            const p = this.travelTimer / popTime;
            this.scale = this.targetScale * (1.16 * Math.sin(p * Math.PI * 0.5));
        } else if (this.travelTimer < popTime + 0.09) {
            const p = (this.travelTimer - popTime) / 0.09;
            this.scale = this.targetScale * (1.16 - p * 0.16);
        } else {
            this.scale = this.targetScale;
        }

        return true;
    }

    draw(ctx, bubbleImg) {
        if (this.delay > 0 || !this.active || this.life <= 0) return;

        // Start rapid smooth fade-out at 38% of total lifetime so bubbles never linger
        const elapsedProgress = (this.maxLife > 0) ? (1.0 - (this.life / this.maxLife)) : 1.0;
        const fadeStart = 0.38;
        let alpha = 1.0;
        if (elapsedProgress >= fadeStart) {
            const fadeT = Math.min(1.0, (elapsedProgress - fadeStart) / (1.0 - fadeStart));
            alpha = Math.max(0, 1.0 - Math.pow(fadeT, 0.85));
        }
        if (alpha <= 0.005) return;

        const bob = Math.sin((this.maxLife - this.life) * 4.0 + this.bobOffset) * 2.5;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y + bob);
        ctx.scale(this.scale, this.scale);

        const bubbleW = 264;
        const bubbleH = 178;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;

        if (bubbleImg && bubbleImg.complete && bubbleImg.naturalWidth > 0) {
            ctx.drawImage(bubbleImg, -bubbleW * 0.5, -bubbleH * 0.5, bubbleW, bubbleH);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(-bubbleW * 0.5, -bubbleH * 0.5, bubbleW, bubbleH - 15, 22);
            else ctx.rect(-bubbleW * 0.5, -bubbleH * 0.5, bubbleW, bubbleH - 15);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-15, (bubbleH - 15) * 0.5);
            ctx.lineTo(-28, bubbleH * 0.5);
            ctx.lineTo(5, (bubbleH - 15) * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Centered tightly in the white speech balloon (offset dX=-5, dY=-14 for tail headroom)
        const textOffsetX = -5;
        const textOffsetY = -14;
        const fonts = getConfiguredFonts();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.lang === 'ur') {
            ctx.direction = 'rtl';
            const urSize = this.text.length > 14 ? 30 : this.text.length > 9 ? 34 : 40;
            ctx.font = `700 ${urSize}px ${fonts.ur}`;
            ctx.fillStyle = '#dc2626';
            ctx.fillText(this.text, textOffsetX, textOffsetY + 2);
        } else {
            ctx.direction = 'ltr';
            const enSize = this.text.length > 14 ? 22 : this.text.length > 9 ? 26 : 32;
            ctx.font = `900 ${enSize}px ${fonts.en}`;
            ctx.fillStyle = '#141416';
            ctx.fillText(this.text, textOffsetX, textOffsetY);
        }

        ctx.restore();
    }
}

// Blast Explosion Sprite Overlay
class BlastOverlay {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.img = null;
        this.life = 0;
        this.maxLife = 0.40;
        this.scale = 1.0;
        this.active = false;
    }

    reset(x, y, img, maxLife = 0.40) {
        this.x = x;
        this.y = y;
        this.img = img;
        this.maxLife = maxLife;
        this.life = maxLife;
        this.scale = 0.4;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) return false;
        const progress = 1 - (this.life / this.maxLife);
        this.scale = 0.4 + progress * 0.8;
        return true;
    }

    draw(ctx) {
        if (!this.img || !this.img.complete) return;
        const progress = 1 - (this.life / this.maxLife);
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        const w = 380;
        const h = 300;
        ctx.drawImage(this.img, -w * 0.5, -h * 0.5, w, h);
        ctx.restore();
    }
}

// Optional Side Emoji Interaction (Left Margin Reaction — Single-Language Bubble!)
class EmojiDetail {
    constructor(config) {
        this.config = config;
        this.active = false;
        this.timer = 5.0;
        this.stage = 0;
        this.stageTimer = 0;
        this.x = 105;
        this.y = 420;
        this.scale = 0;
        this.bubbleIndex = 0;
    }

    update(dt) {
        if (!this.active) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.active = true;
                this.stage = 0;
                this.stageTimer = 2.6;
                this.y = 380 + Math.random() * 280;
                this.timer = 14.0 + Math.random() * 6.0;
                this.scale = 0;
                this.bubbleIndex++;
            }
            return;
        }

        if (this.scale < 1.0) {
            this.scale = Math.min(1.0, this.scale + dt * 4.5);
        }

        this.stageTimer -= dt;
        if (this.stageTimer <= 0) {
            this.stage++;
            if (this.stage > 2) {
                this.active = false;
            } else {
                this.stageTimer = 2.2;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = '56px sans-serif';
        ctx.fillText('\uD83D\uDE08', 0, 0);

        if (this.stage >= 1) {
            ctx.font = '52px sans-serif';
            ctx.fillText('\uD83D\uDE22', 64, 0);
        }

        if (this.stage >= 2) {
            ctx.font = '56px sans-serif';
            ctx.fillText('\uD83D\uDE06', 128, 0);
        }

        const pool = (this.config && this.config.EMOJI_REACTION_BUBBLES)
            ? this.config.EMOJI_REACTION_BUBBLES
            : [{ text: '\u0628\u0633 \u0645\u0630\u0627\u0642!', lang: 'ur' }];
        const item = pool[this.bubbleIndex % pool.length];

        const bX = -22;
        const bY = -102;
        const bW = 172;
        const bH = 60;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bX, bY, bW, bH, 16);
        else ctx.rect(bX, bY, bW, bH);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bX + 26, bY + bH);
        ctx.lineTo(0, -28);
        ctx.lineTo(bX + 46, bY + bH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        const fonts = getConfiguredFonts();
        const textCenterX = bX + bW * 0.5;
        const textCenterY = bY + bH * 0.5;

        if (item.lang === 'ur') {
            ctx.direction = 'rtl';
            ctx.font = `700 28px ${fonts.ur}`;
            ctx.fillStyle = '#dc2626';
            ctx.fillText(item.text, textCenterX, textCenterY + 2);
        } else {
            ctx.direction = 'ltr';
            ctx.font = `900 21px ${fonts.en}`;
            ctx.fillStyle = '#141416';
            ctx.fillText(item.text, textCenterX, textCenterY);
        }

        ctx.restore();
    }
}

export class VFXManager {
    constructor(config) {
        this.config = config;
        this.assets = null;

        this.particles = new ObjectPool(() => new Particle(), (p, ...args) => p.reset(...args), 100);
        this.shockwaves = new ObjectPool(() => new Shockwave(), (s, ...args) => s.reset(...args), 15);
        this.insultBubbles = new ObjectPool(() => new InsultBubble(), (b, ...args) => b.reset(...args), 40);
        this.blastOverlays = new ObjectPool(() => new BlastOverlay(), (o, ...args) => o.reset(...args), 10);

        this.insultDeck = [];
        this.refillInsultDeck();

        this.screenFlash = {
            color: '239, 68, 68',
            alpha: 0,
            maxAlpha: 0.85,
            duration: 0.25,
            timer: 0
        };

        this.glitchTimer = 0;
        this.glitchDuration = 0.35;

        this.emojiDetail = new EmojiDetail(config);
    }

    triggerScreenGlitch(duration = 0.35) {
        this.glitchTimer = duration;
        this.glitchDuration = duration;
    }

    setAssets(assets) {
        this.assets = assets;
    }

    refillInsultDeck() {
        const list = [...CONFIG.INSULTS];
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = list[i];
            list[i] = list[j];
            list[j] = temp;
        }
        this.insultDeck = list;
    }

    drawInsultFromDeck() {
        if (this.insultDeck.length === 0) {
            this.refillInsultDeck();
        }
        return this.insultDeck.pop();
    }

    reset() {
        this.particles.active.length = 0;
        this.shockwaves.active.length = 0;
        this.insultBubbles.active.length = 0;
        this.blastOverlays.active.length = 0;
        this.screenFlash.alpha = 0;
        this.screenFlash.timer = 0;
        this.glitchTimer = 0;
        if (this.emojiDetail) {
            this.emojiDetail.active = false;
            this.emojiDetail.timer = 5.0;
            this.emojiDetail.scale = 0;
        }
        this.refillInsultDeck();
    }

    triggerScreenFlash(color = '239, 68, 68', maxAlpha = 0.85, duration = 0.25) {
        this.screenFlash.color = color;
        this.screenFlash.maxAlpha = maxAlpha;
        this.screenFlash.alpha = maxAlpha;
        this.screenFlash.duration = duration;
        this.screenFlash.timer = duration;
    }

    // Normal Green Emoji Whack VFX + Consistent Hit Reaction Curse Speech Bubble!
    spawnHitVFX(x, y, hitType = 'punch') {
        const count = 14;
        const colors = (hitType === 'slap')
            ? ['#f472b6', '#ec4899', '#fbcfe8', '#bef264', '#ffffff']
            : ['#bef264', '#84cc16', '#facc15', '#ffffff', '#fb923c'];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed * 0.7 - 60;
            this.particles.get(
                x, y,
                vx, vy,
                3 + Math.random() * 3,
                colors[Math.floor(Math.random() * colors.length)],
                0.35 + Math.random() * 0.25,
                350,
                'spark'
            );
        }

        this.shockwaves.get(x, y, 130, '#bef264', 0.28);

        // Consistently pop up a curse/scold reaction speech bubble on every hit!
        const insult = this.drawInsultFromDeck();
        const jitterX = (Math.random() - 0.5) * 140;
        const tx = Math.max(165, Math.min(915, x + jitterX));
        const ty = Math.max(240, Math.min(1650, y - 155));

        this.insultBubbles.get(
            x, y - 35,
            tx, ty,
            insult,
            0.85, // brisk 0.85s lifetime (~0.32s hold -> rapid fade)
            0,    // instant pop!
            0.18,
            0.84
        );
    }

    // Bomb Hit Sequence: Blast + 4-6 Insult Speech Bubbles
    spawnBombExplosionSequence(x, y) {
        this.triggerScreenFlash('239, 68, 68', 0.85, 0.30);
        this.triggerScreenGlitch(0.40);

        this.shockwaves.get(x, y, 300, '#ef4444', 0.50);
        this.shockwaves.get(x, y, 200, '#f59e0b', 0.40);

        if (this.assets && this.assets.blast1) {
            this.blastOverlays.get(x, y, this.assets.blast1, 0.45);
        }
        if (this.assets && this.assets.blast2) {
            this.blastOverlays.get(x, y, this.assets.blast2, 0.60);
        }

        for (let i = 0; i < 32; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 260;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 50;
            this.particles.get(
                x, y,
                vx, vy,
                10 + Math.random() * 14,
                (i % 3 === 0) ? '#ef4444' : (i % 3 === 1) ? '#f59e0b' : '#facc15',
                0.60 + Math.random() * 0.40,
                40,
                'smoke'
            );
        }

        const bubbleCount = 4 + Math.floor(Math.random() * 3);
        const totalAngle = Math.PI * 2;
        const baseAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
        const step = totalAngle / bubbleCount;

        for (let i = 0; i < bubbleCount; i++) {
            const insult = this.drawInsultFromDeck();
            const angle = baseAngle + (i * step) + (Math.random() - 0.5) * 0.18;
            const radius = (i % 2 === 0) ? (330 + Math.random() * 30) : (440 + Math.random() * 40);

            let tx = x + Math.cos(angle) * radius;
            let ty = y + Math.sin(angle) * (radius * 1.15);

            tx = Math.max(165, Math.min(915, tx));
            ty = Math.max(250, Math.min(1650, ty));

            const delay = i * 0.04;
            const life = 0.82 + Math.random() * 0.16;
            const travelDuration = 0.24 + Math.random() * 0.06;

            this.insultBubbles.get(
                x, y,
                tx, ty,
                insult,
                life,
                delay,
                travelDuration,
                1.0
            );
        }
    }

    spawnMoleEmergeVFX(x, y) {
        for (let i = 0; i < 4; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
            const speed = 40 + Math.random() * 60;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.particles.get(
                x + (Math.random() - 0.5) * 30,
                y + 10,
                vx, vy,
                4 + Math.random() * 3,
                'rgba(180, 160, 130, 0.5)',
                0.30,
                30,
                'smoke'
            );
        }
    }

    update(dt) {
        this.particles.update(dt);
        this.shockwaves.update(dt);
        this.insultBubbles.update(dt);
        this.blastOverlays.update(dt);
        this.emojiDetail.update(dt);

        if (this.screenFlash.timer > 0) {
            this.screenFlash.timer -= dt;
            this.screenFlash.alpha = Math.max(0, (this.screenFlash.timer / this.screenFlash.duration) * this.screenFlash.maxAlpha);
        }

        if (this.glitchTimer > 0) {
            this.glitchTimer -= dt;
        }
    }

    drawScreenGlitch(ctx) {
        const w = this.config.VIEWPORT_WIDTH;
        const h = this.config.VIEWPORT_HEIGHT;
        const p = Math.max(0, this.glitchTimer / (this.glitchDuration || 0.35));

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (let y = 0; y < h; y += 8) {
            ctx.fillRect(0, y, w, 3);
        }

        const slices = 6;
        for (let i = 0; i < slices; i++) {
            const sliceY = (Math.random() * h * 0.95);
            const sliceH = 15 + Math.random() * 40;
            const shiftX = (Math.random() - 0.5) * 50 * p;

            ctx.fillStyle = (i % 2 === 0) ? 'rgba(239, 68, 68, 0.32)' : 'rgba(34, 197, 94, 0.25)';
            ctx.fillRect(shiftX, sliceY, w, sliceH);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
        for (let i = 0; i < 4; i++) {
            const ny = Math.random() * h;
            ctx.fillRect(Math.random() * w * 0.3, ny, 100 + Math.random() * 250, 3);
        }

        ctx.restore();
    }

    draw(ctx) {
        this.shockwaves.draw(ctx);
        this.particles.draw(ctx);
        this.blastOverlays.draw(ctx);

        this.emojiDetail.draw(ctx);

        const bubbleImg = (this.assets && this.assets.speechBubble) ? this.assets.speechBubble : null;
        for (let i = 0; i < this.insultBubbles.active.length; i++) {
            const b = this.insultBubbles.active[i];
            b.draw(ctx, bubbleImg);
        }

        if (this.glitchTimer > 0) {
            this.drawScreenGlitch(ctx);
        }

        if (this.screenFlash.alpha > 0.005) {
            ctx.save();
            ctx.fillStyle = `rgba(${this.screenFlash.color}, ${this.screenFlash.alpha})`;
            ctx.fillRect(0, 0, this.config.VIEWPORT_WIDTH, this.config.VIEWPORT_HEIGHT);
            ctx.restore();
        }
    }
}
