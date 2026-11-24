// src/VFXManager.js - Insult Speech Bubbles, Blasts, Particles & Optional Emoji Details
import { ObjectPool } from './ObjectPool.js';
import { CONFIG } from './Config.js';

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
        this.type = 'spark'; // 'spark' | 'dirt' | 'smoke' | 'star' | 'confetti'
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

// Bomb Insult Speech Bubble (Using clean single speech bubble sprite + bilingual text)
export class InsultBubble {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.x = 0;
        this.y = 0;
        this.text = '';
        this.maxLife = 2.8;
        this.life = 2.8;
        this.delay = 0;
        this.travelDuration = 0.38;
        this.travelTimer = 0;
        this.scale = 0;
        this.targetScale = 1.0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.active = false;
    }

    reset(startX, startY, targetX, targetY, text, maxLife = 2.8, delay = 0, travelDuration = 0.38) {
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = startX;
        this.y = startY;
        this.text = text;
        this.maxLife = maxLife;
        this.life = maxLife;
        this.delay = delay;
        this.travelDuration = travelDuration;
        this.travelTimer = 0;
        this.scale = 0;
        this.targetScale = 0.96 + Math.random() * 0.08;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.active = true;
    }

    update(dt) {
        // Wait for stagger delay before popping into view
        if (this.delay > 0) {
            this.delay -= dt;
            if (this.delay > 0) return true;
        }

        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return false;
        }

        // Travel smoothly from start to target with smooth cubic ease-out
        this.travelTimer += dt;
        const progress = Math.min(1.0, this.travelTimer / this.travelDuration);
        const ease = 1 - Math.pow(1 - progress, 3);
        this.x = this.startX + (this.targetX - this.startX) * ease;
        this.y = this.startY + (this.targetY - this.startY) * ease;

        // Pop-in spring scale animation
        const popTime = 0.22;
        if (this.travelTimer < popTime) {
            const p = this.travelTimer / popTime;
            this.scale = this.targetScale * (1.15 * Math.sin(p * Math.PI * 0.5));
        } else if (this.travelTimer < popTime + 0.10) {
            const p = (this.travelTimer - popTime) / 0.10;
            this.scale = this.targetScale * (1.15 - p * 0.15);
        } else {
            this.scale = this.targetScale;
        }

        return true;
    }

    draw(ctx, bubbleImg) {
        if (this.delay > 0) return; // Still waiting for pop delay

        // Smooth fade out in the last 0.35s
        const alpha = (this.life < 0.35) ? Math.max(0, this.life / 0.35) : 1.0;

        // Subtle gentle idle floating bob
        const bob = Math.sin((this.maxLife - this.life) * 4.0 + this.bobOffset) * 3;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y + bob);
        ctx.scale(this.scale, this.scale);

        // Aspect ratio of pristine bubble is 350x236 (1.48:1)
        const bubbleW = 280;
        const bubbleH = 190;

        // Soft comic drop-shadow to separate overlapping bubbles cleanly
        ctx.shadowColor = 'rgba(0, 0, 0, 0.40)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;

        if (bubbleImg && bubbleImg.complete && bubbleImg.naturalWidth > 0) {
            ctx.drawImage(bubbleImg, -bubbleW * 0.5, -bubbleH * 0.5, bubbleW, bubbleH);
        } else {
            // High-quality procedural comic speech bubble fallback
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(-bubbleW * 0.5, -bubbleH * 0.5, bubbleW, bubbleH - 15, 24);
            } else {
                ctx.rect(-bubbleW * 0.5, -bubbleH * 0.5, bubbleW, bubbleH - 15);
            }
            ctx.fill();
            ctx.stroke();

            // Pointer tail
            ctx.beginPath();
            ctx.moveTo(-15, (bubbleH - 15) * 0.5);
            ctx.lineTo(-30, bubbleH * 0.5);
            ctx.lineTo(5, (bubbleH - 15) * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Reset shadow before drawing text for maximum razor sharpness
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Interior text center offset: dX = -5px, dY = -14px (centered in white body)
        const textOffsetX = -5;
        const textOffsetY = -14;

        // Split text: e.g. "Bewakoof / بیوقوف" into English and Urdu
        const parts = this.text.split(' / ');
        const engText = parts[0] || '';
        const urduText = parts[1] || '';

        // Dynamic bold comic font size so text fills the speech balloon prominently
        let engFontSize = 26;
        let urduFontSize = 32;

        if (engText.length > 15 || (urduText && urduText.length > 15)) {
            engFontSize = 19;
            urduFontSize = 24;
        } else if (engText.length > 9 || (urduText && urduText.length > 9)) {
            engFontSize = 23;
            urduFontSize = 28;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Render English line (bold, clean dark)
        ctx.font = `900 ${engFontSize}px "Outfit", sans-serif`;
        ctx.fillStyle = '#121214';
        ctx.fillText(engText, textOffsetX, textOffsetY - Math.round(engFontSize * 0.65));

        // Render Urdu line with Arabic/Urdu connected script and fallback fonts
        if (urduText) {
            ctx.font = `700 ${urduFontSize}px "Noto Nastaliq Urdu", "Noto Sans Arabic", "Urdu Typesetting", "Jameel Noori Nastaleeq", "Arial", sans-serif`;
            ctx.fillStyle = '#dc2626';
            ctx.fillText(urduText, textOffsetX, textOffsetY + Math.round(urduFontSize * 0.60));
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

// Optional Noticeable Emoji Interaction (Left Margin Reaction)
class EmojiDetail {
    constructor(config) {
        this.config = config;
        this.active = false;
        this.timer = 5.0; // Trigger after initial 5s, then every ~14 seconds
        this.stage = 0;
        this.stageTimer = 0;
        this.x = 105;
        this.y = 420;
        this.scale = 0;
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
            }
            return;
        }

        // Animate entrance scale
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

        // Stage 0: Devil emoji laughing + speech bubble thrown
        // Stage 1: Crying emoji in the middle reacts
        // Stage 2: Laughing emoji on the right joins in
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Devil emoji
        ctx.font = '56px sans-serif';
        ctx.fillText('\uD83D\uDE08', 0, 0);

        // Middle Crying emoji
        if (this.stage >= 1) {
            ctx.font = '52px sans-serif';
            ctx.fillText('\uD83D\uDE22', 64, 0);
        }

        // Right Laughing emoji
        if (this.stage >= 2) {
            ctx.font = '56px sans-serif';
            ctx.fillText('\uD83D\uDE06', 128, 0);
        }

        // Prominent comic speech bubble placed comfortably above emojis
        const bX = -22;
        const bY = -115;
        const bW = 186;
        const bH = 74;

        // Clean drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 5;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bX, bY, bW, bH, 16);
        else ctx.rect(bX, bY, bW, bH);
        ctx.fill();
        ctx.stroke();

        // Pointer tail pointing down toward the laughing devil emoji (0, -28)
        ctx.beginPath();
        ctx.moveTo(bX + 28, bY + bH);
        ctx.lineTo(0, -28);
        ctx.lineTo(bX + 50, bY + bH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Reset shadow for crisp text
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Clean bold text inside speech bubble
        const textCenterX = bX + bW * 0.5;

        // English text line
        ctx.font = '900 18px "Outfit", sans-serif';
        ctx.fillStyle = '#141416';
        ctx.fillText('Bas mazaaq!', textCenterX, bY + 24);

        // Urdu text line
        ctx.font = '700 24px "Noto Nastaliq Urdu", "Noto Sans Arabic", serif';
        ctx.fillStyle = '#dc2626';
        ctx.fillText('\u0628\u0633 \u0645\u0630\u0627\u0642', textCenterX, bY + 52);

        ctx.restore();
    }
}

export class VFXManager {
    constructor(config) {
        this.config = config;
        this.assets = null;

        this.particles = new ObjectPool(() => new Particle(), (p, ...args) => p.reset(...args), 100);
        this.shockwaves = new ObjectPool(() => new Shockwave(), (s, ...args) => s.reset(...args), 15);
        this.insultBubbles = new ObjectPool(() => new InsultBubble(), (b, ...args) => b.reset(...args), 25);
        this.blastOverlays = new ObjectPool(() => new BlastOverlay(), (o, ...args) => o.reset(...args), 10);

        // Insult Deck Shuffler (Exhausts without repeating until all 22 shown)
        this.insultDeck = [];
        this.refillInsultDeck();

        // Screen Flash System
        this.screenFlash = {
            color: '239, 68, 68',
            alpha: 0,
            maxAlpha: 0.85,
            duration: 0.25,
            timer: 0
        };

        // Digital Glitch System (Bomb Impact Distortion)
        this.glitchTimer = 0;
        this.glitchDuration = 0.35;

        // Optional Emoji Detail
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
        // Fisher-Yates shuffle
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

    // Normal Laughing Mouth Whack VFX
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
    }

    // Bomb Hit Sequence: Blast + 4-6 Insult Speech Bubbles
    spawnBombExplosionSequence(x, y) {
        // 1. Red Screen Flash & Glitch
        this.triggerScreenFlash('239, 68, 68', 0.85, 0.30);
        this.triggerScreenGlitch(0.40);

        // 2. Dual Shockwaves
        this.shockwaves.get(x, y, 300, '#ef4444', 0.50);
        this.shockwaves.get(x, y, 200, '#f59e0b', 0.40);

        // 3. Dual Blast sprite overlays (Cinematic Slow-Mo Explosion!)
        if (this.assets && this.assets.blast1) {
            this.blastOverlays.get(x, y, this.assets.blast1, 0.45);
        }
        if (this.assets && this.assets.blast2) {
            this.blastOverlays.get(x, y, this.assets.blast2, 0.60);
        }

        // 4. Explosion smoke & fiery sparks
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

        // 5. Spawn 4 to 6 Insult Speech Bubbles pointing outward toward player / playfield
        const bubbleCount = 4 + Math.floor(Math.random() * 3); // 4, 5, or 6
        
        // Generous radial distribution: 330px to 450px travel distance
        // Bubble dimensions: 280 x 190. Wide angular step ensures center-to-center distance > 320px
        const totalAngle = Math.PI * 2;
        const baseAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
        const step = totalAngle / bubbleCount;

        for (let i = 0; i < bubbleCount; i++) {
            const insult = this.drawInsultFromDeck();
            const angle = baseAngle + (i * step) + (Math.random() - 0.5) * 0.18;

            // Stagger radiuses: alternate 330px and 440px so adjacent bubbles never overlap
            const radius = (i % 2 === 0) ? (330 + Math.random() * 30) : (440 + Math.random() * 40);

            let tx = x + Math.cos(angle) * radius;
            let ty = y + Math.sin(angle) * (radius * 1.15); // portrait aspect elongation

            // Safe playfield bounds (prevent colliding with HUD or screen edge)
            tx = Math.max(165, Math.min(915, tx));
            ty = Math.max(270, Math.min(1650, ty));

            const delay = i * 0.06; // 60ms stagger for sequential popping
            const life = 2.8 + Math.random() * 0.4;
            const travelDuration = 0.36 + Math.random() * 0.08;

            this.insultBubbles.get(
                x, y,
                tx, ty,
                insult,
                life,
                delay,
                travelDuration
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
        // 1. Digital scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (let y = 0; y < h; y += 8) {
            ctx.fillRect(0, y, w, 3);
        }

        // 2. Horizontal slice glitch bars (Chromatic offset)
        const slices = 6;
        for (let i = 0; i < slices; i++) {
            const sliceY = (Math.random() * h * 0.95);
            const sliceH = 15 + Math.random() * 40;
            const shiftX = (Math.random() - 0.5) * 50 * p;

            ctx.fillStyle = (i % 2 === 0) ? 'rgba(239, 68, 68, 0.32)' : 'rgba(34, 197, 94, 0.25)';
            ctx.fillRect(shiftX, sliceY, w, sliceH);
        }

        // 3. Glitch noise bars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
        for (let i = 0; i < 4; i++) {
            const ny = Math.random() * h;
            ctx.fillRect(Math.random() * w * 0.3, ny, 100 + Math.random() * 250, 3);
        }

        ctx.restore();
    }

    draw(ctx) {
        // Shockwaves & particles
        this.shockwaves.draw(ctx);
        this.particles.draw(ctx);
        this.blastOverlays.draw(ctx);

        // Optional Emoji detail
        this.emojiDetail.draw(ctx);

        // Insult Speech Bubbles (Render all active bubbles in the ObjectPool!)
        const bubbleImg = (this.assets && this.assets.speechBubble) ? this.assets.speechBubble : null;
        for (let i = 0; i < this.insultBubbles.active.length; i++) {
            const b = this.insultBubbles.active[i];
            b.draw(ctx, bubbleImg);
        }

        // Full Screen Glitch Effect
        if (this.glitchTimer > 0) {
            this.drawScreenGlitch(ctx);
        }

        // Full Screen Flash
        if (this.screenFlash.alpha > 0.005) {
            ctx.save();
            ctx.fillStyle = `rgba(${this.screenFlash.color}, ${this.screenFlash.alpha})`;
            ctx.fillRect(0, 0, this.config.VIEWPORT_WIDTH, this.config.VIEWPORT_HEIGHT);
            ctx.restore();
        }
    }
}
