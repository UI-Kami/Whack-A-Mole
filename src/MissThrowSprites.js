// src/MissThrowSprites.js - Programmatic High-Res 2D Front-Facing Miss Throw Sprite Generator
// Matches canonical 900x980 lime character chalk-brush art style (#c8df32, #9eb61e, #1c1c1e, #faf7f2, #e86b72)

function createRng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function strokeChalkOutline(ctx, drawPathFn, width = 16, color = '#faf7f2', rng = null) {
    const rand = rng || createRng(1337);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Subtle dark charcoal outer sketch hairline for poster contrast
    ctx.strokeStyle = 'rgba(28, 28, 30, 0.32)';
    ctx.lineWidth = width + 4;
    ctx.beginPath();
    drawPathFn(ctx);
    ctx.stroke();

    // Primary thick warm chalk white stroke
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    drawPathFn(ctx);
    ctx.stroke();

    // Textured brushed highlight pass with slight organic jitter
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = Math.max(4, width * 0.48);
    ctx.translate((rand() - 0.5) * 2.2, (rand() - 0.5) * 2.2);
    ctx.beginPath();
    drawPathFn(ctx);
    ctx.stroke();
    ctx.restore();
}

function drawCoralChalkBall(ctx, cx, cy, r, seed = 404) {
    const rng = createRng(seed);
    ctx.save();

    // Rough white chalk halo outline
    strokeChalkOutline(ctx, (c) => {
        c.arc(cx, cy, r, 0, Math.PI * 2);
    }, Math.max(8, r * 0.24), '#faf7f2', rng);

    // Charcoal chalk inner ring border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#e86b72';
    ctx.fill();

    // Deeper coral crescent shadow on bottom-right & diagonal chalk hatching
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#d15058';
    ctx.beginPath();
    ctx.arc(cx + r * 0.22, cy + r * 0.24, r * 0.98, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e86b72';
    ctx.beginPath();
    ctx.arc(cx - r * 0.14, cy - r * 0.16, r * 0.88, 0, Math.PI * 2);
    ctx.fill();

    // Soft pastel pink top-left sheen
    ctx.fillStyle = 'rgba(252, 184, 188, 0.50)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.30, cy - r * 0.30, r * 0.32, r * 0.20, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Diagonal chalk hatching strokes matching sprite sheet style
    ctx.strokeStyle = 'rgba(130, 38, 46, 0.52)';
    ctx.lineCap = 'round';
    for (let i = -2; i <= 3; i++) {
        ctx.lineWidth = Math.max(2.5, r * 0.055 + (i % 2) * 1.2);
        const off = i * (r * 0.30);
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.85 + off * 0.45, cy + r * 0.85);
        ctx.lineTo(cx + r * 0.85, cy - r * 0.85 + off * 0.45);
        ctx.stroke();
    }
    ctx.restore();

    // Textured dark charcoal rim contour inside white chalk halo
    ctx.strokeStyle = 'rgba(68, 52, 54, 0.68)';
    ctx.lineWidth = Math.max(3, r * 0.075);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawSpikyHairCrown(ctx, rng) {
    const tufts = [
        // Sweeping left upper tuft
        [[432, 545], [372, 468], [282, 434], [385, 428], [462, 525]],
        // Central tall curving crest
        [[456, 535], [442, 442], [462, 396], [492, 446], [506, 535]],
        // Right upper crest
        [[492, 538], [534, 448], [588, 418], [568, 476], [536, 546]],
        // Small outer left spike
        [[395, 558], [320, 502], [250, 488], [344, 476], [422, 542]],
        // Small outer right spike
        [[528, 556], [596, 496], [648, 488], [608, 528], [552, 566]]
    ];

    // Layer white chalk halos around tufts first
    for (let i = 0; i < tufts.length; i++) {
        const t = tufts[i];
        strokeChalkOutline(ctx, (c) => {
            c.moveTo(t[0][0], t[0][1]);
            c.quadraticCurveTo(t[1][0], t[1][1], t[2][0], t[2][1]);
            c.quadraticCurveTo(t[3][0], t[3][1], t[4][0], t[4][1]);
        }, 16, '#faf7f2', rng);
    }

    // Fill tufts with matching #c8df32 lime and #9eb61e root shade
    for (let i = 0; i < tufts.length; i++) {
        const t = tufts[i];
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(t[0][0], t[0][1]);
        ctx.quadraticCurveTo(t[1][0], t[1][1], t[2][0], t[2][1]);
        ctx.quadraticCurveTo(t[3][0], t[3][1], t[4][0], t[4][1]);
        ctx.closePath();
        ctx.fillStyle = '#c8df32';
        ctx.fill();

        ctx.strokeStyle = 'rgba(130, 152, 16, 0.55)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }
}

function drawChalkLimeBody(ctx, seed = 101) {
    const rng = createRng(seed);
    const cx = 468;
    const cy = 740;
    const rx = 214;
    const ry = 204;

    drawSpikyHairCrown(ctx, rng);

    // Chalk outline around sphere
    strokeChalkOutline(ctx, (c) => {
        c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }, 18, '#faf7f2', rng);

    // Fill #c8df32 body with #9eb61e left/bottom crescent shading matching lime_hit.png
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#c8df32';
    ctx.fill();
    ctx.clip();

    // Left/bottom crescent shadow
    ctx.fillStyle = '#9eb61e';
    ctx.beginPath();
    ctx.ellipse(cx - 28, cy + 32, rx * 1.02, ry * 1.02, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c8df32';
    ctx.beginPath();
    ctx.ellipse(cx + 22, cy - 22, rx * 0.94, ry * 0.94, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bottom rim contact shadow crease
    ctx.fillStyle = 'rgba(122, 145, 16, 0.42)';
    ctx.fillRect(cx - rx, cy + ry - 38, rx * 2, 48);

    // Hand-drawn subtle lime brush contour strokes near crown & bottom
    ctx.strokeStyle = 'rgba(134, 158, 18, 0.55)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, rx - 14, Math.PI * 0.68, Math.PI * 1.15);
    ctx.stroke();

    ctx.restore();
}

function drawRimPaw(ctx, cx, cy, flipX = false, scale = 1.0, isFist = false) {
    const s = scale;
    const dir = flipX ? -1 : 1;
    const rng = createRng(Math.round(cx + cy));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(dir * s, s);

    const tracePaw = (c) => {
        if (isFist) {
            c.moveTo(-84, 34);
            c.bezierCurveTo(-98, -32, -48, -68, 2, -62);
            c.bezierCurveTo(64, -64, 96, -18, 86, 40);
            c.quadraticCurveTo(42, 62, 0, 56);
            c.quadraticCurveTo(-52, 62, -84, 34);
        } else {
            // Exact 3-toe gripping paw matching lime_hit.png bottom paws
            c.moveTo(-94, 34);
            c.bezierCurveTo(-102, -30, -56, -72, -4, -66);
            c.bezierCurveTo(56, -70, 102, -26, 94, 36);
            c.bezierCurveTo(78, 62, 48, 56, 36, 38);
            c.bezierCurveTo(22, 62, -16, 64, -28, 38);
            c.bezierCurveTo(-44, 62, -78, 58, -94, 34);
        }
        c.closePath();
    };

    strokeChalkOutline(ctx, tracePaw, 15, '#faf7f2', rng);

    ctx.beginPath();
    tracePaw(ctx);
    ctx.fillStyle = '#c8df32';
    ctx.fill();

    // Knuckle/toe crescent shade (#9eb61e)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#9eb61e';
    ctx.beginPath();
    ctx.ellipse(0, 44, 96, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(130, 152, 16, 0.72)';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    if (isFist) {
        ctx.beginPath();
        ctx.arc(-22, -6, 20, 0.2, 2.5);
        ctx.moveTo(16, -24);
        ctx.lineTo(24, 16);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(-30, 40);
        ctx.quadraticCurveTo(-24, 4, -18, -14);
        ctx.moveTo(34, 40);
        ctx.quadraticCurveTo(28, 4, 20, -14);
        ctx.stroke();
    }

    ctx.restore();
}

function drawAngryVFace(ctx, isThrowFollowThrough = false) {
    // Angry squinting wide white eyes glaring straight forward + V-shaped #1c1c1e brows + grim frown
    const leftEye = { x: 392, y: 695 };
    const rightEye = { x: 544, y: 695 };

    [leftEye, rightEye].forEach((eye, idx) => {
        ctx.save();
        ctx.translate(eye.x, eye.y);
        // Eye white with thick #1c1c1e charcoal border
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1c1c1e';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, 38, isThrowFollowThrough ? 40 : 34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Angled eyelid clip from angry brow
        ctx.fillStyle = '#1c1c1e';
        ctx.beginPath();
        ctx.arc(idx === 0 ? 6 : -6, 4, 15, 0, Math.PI * 2);
        ctx.fill();

        // Crisp white eye catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(idx === 0 ? 11 : -1, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Furrowed V-shaped dark charcoal eyebrows pressing tightly toward nose bridge
    ctx.save();
    ctx.strokeStyle = '#faf7f2';
    ctx.lineCap = 'round';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(338, 636);
    ctx.lineTo(446, 678);
    ctx.moveTo(598, 636);
    ctx.lineTo(490, 678);
    ctx.stroke();

    ctx.strokeStyle = '#1c1c1e';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(340, 636);
    ctx.lineTo(444, 678);
    ctx.moveTo(596, 636);
    ctx.lineTo(492, 678);
    ctx.stroke();
    ctx.restore();

    // Angry open grimace / frown mouth
    ctx.save();
    const traceMouth = (c) => {
        if (isThrowFollowThrough) {
            c.moveTo(396, 828);
            c.quadraticCurveTo(468, 756, 540, 828);
            c.quadraticCurveTo(468, 846, 396, 828);
        } else {
            c.moveTo(404, 820);
            c.quadraticCurveTo(468, 764, 532, 820);
            c.quadraticCurveTo(468, 804, 404, 820);
        }
        c.closePath();
    };
    strokeChalkOutline(ctx, traceMouth, 12, '#faf7f2');
    ctx.beginPath();
    traceMouth(ctx);
    ctx.fillStyle = '#1c1c1e';
    ctx.fill();
    if (isThrowFollowThrough) {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = '#e86b72';
        ctx.beginPath();
        ctx.ellipse(468, 834, 42, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();

    // Red anger vein mark (💢) on forehead
    ctx.save();
    const vx = 556, vy = 578;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const traceAnger = (c) => {
        c.moveTo(vx - 16, vy - 26); c.quadraticCurveTo(vx - 4, vy - 8, vx - 24, vy - 4);
        c.moveTo(vx + 22, vy - 22); c.quadraticCurveTo(vx + 6, vy - 4, vx + 26, vy + 4);
        c.moveTo(vx - 20, vy + 18); c.quadraticCurveTo(vx - 2, vy + 6, vx - 10, vy + 28);
        c.moveTo(vx + 16, vy + 24); c.quadraticCurveTo(vx + 4, vy + 10, vx + 24, vy + 14);
    };
    ctx.strokeStyle = '#faf7f2';
    ctx.lineWidth = 14;
    ctx.beginPath(); traceAnger(ctx); ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 8;
    ctx.beginPath(); traceAnger(ctx); ctx.stroke();
    ctx.restore();
}

function makeCanvas(w = 900, h = 980) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

export function buildFrontThrowSpriteAssets() {
    if (typeof document === 'undefined') return null;

    // 1. Standalone 2D Coral-Pink Ball Projectile Sprite (160x160 transparent, matches Frame 2/3 ball)
    const ballCvs = makeCanvas(160, 160);
    const bCtx = ballCvs.getContext('2d');
    drawCoralChalkBall(bCtx, 80, 80, 62, 404);
    const missBall = ballCvs.toDataURL('image/png');

    // FRAME 1 — Front Surprised (!, wide white oval eyes, small O mouth, both paws on rim)
    const f1 = makeCanvas();
    const c1 = f1.getContext('2d');
    drawChalkLimeBody(c1, 101);
    drawRimPaw(c1, 252, 895, false, 1.0, false);
    drawRimPaw(c1, 662, 902, true, 1.0, false);
    // Wide surprised oval eyes
    [{ x: 396, y: 690 }, { x: 540, y: 690 }].forEach((eye) => {
        c1.save();
        c1.fillStyle = '#ffffff';
        c1.strokeStyle = '#1c1c1e';
        c1.lineWidth = 11;
        c1.beginPath();
        c1.ellipse(eye.x, eye.y, 40, 50, 0, 0, Math.PI * 2);
        c1.fill();
        c1.stroke();
        c1.fillStyle = '#1c1c1e';
        c1.beginPath();
        c1.arc(eye.x, eye.y + 4, 15, 0, Math.PI * 2);
        c1.fill();
        c1.fillStyle = '#ffffff';
        c1.beginPath();
        c1.arc(eye.x + 5, eye.y - 3, 5, 0, Math.PI * 2);
        c1.fill();
        c1.restore();
    });
    // Raised surprised brows
    c1.save();
    c1.strokeStyle = '#1c1c1e';
    c1.lineWidth = 14;
    c1.lineCap = 'round';
    c1.beginPath();
    c1.arc(396, 646, 38, Math.PI * 1.15, Math.PI * 1.85);
    c1.stroke();
    c1.beginPath();
    c1.arc(540, 646, 38, Math.PI * 1.15, Math.PI * 1.85);
    c1.stroke();
    c1.restore();
    // Small surprised "O" mouth
    strokeChalkOutline(c1, (c) => {
        c.ellipse(468, 812, 34, 42, 0, 0, Math.PI * 2);
    }, 12, '#faf7f2');
    c1.save();
    c1.beginPath();
    c1.ellipse(468, 812, 32, 40, 0, 0, Math.PI * 2);
    c1.fillStyle = '#1c1c1e';
    c1.fill();
    c1.clip();
    c1.fillStyle = '#e86b72';
    c1.beginPath();
    c1.ellipse(468, 840, 22, 14, 0, 0, Math.PI * 2);
    c1.fill();
    c1.restore();
    // Chalk-white "!" exclamation mark next to head
    c1.save();
    c1.translate(744, 476);
    c1.rotate(0.18);
    const traceBang = (c) => {
        c.moveTo(-18, -76);
        c.lineTo(18, -76);
        c.lineTo(9, 26);
        c.lineTo(-9, 26);
        c.closePath();
        c.moveTo(15, 58);
        c.arc(0, 58, 15, 0, Math.PI * 2);
    };
    c1.strokeStyle = 'rgba(28, 28, 30, 0.42)';
    c1.lineWidth = 14;
    c1.lineJoin = 'round';
    c1.beginPath(); traceBang(c1); c1.stroke();
    c1.fillStyle = '#faf7f2';
    c1.beginPath(); traceBang(c1); c1.fill();
    c1.restore();

    // FRAME 2 — Front Angry & Holding Coral-Pink/Red Ball beside right shoulder + left fist on rim
    const f2 = makeCanvas();
    const c2 = f2.getContext('2d');
    drawChalkLimeBody(c2, 202);
    drawAngryVFace(c2, false);
    // Left fist resting on front rim
    drawRimPaw(c2, 662, 902, true, 1.0, true);
    // Right arm raising up beside shoulder to hold coral ball (character's right side = left viewport side)
    strokeChalkOutline(c2, (c) => {
        c.moveTo(278, 770);
        c.quadraticCurveTo(212, 742, 206, 658);
    }, 34, '#faf7f2');
    c2.strokeStyle = '#c8df32';
    c2.lineWidth = 30;
    c2.lineCap = 'round';
    c2.beginPath();
    c2.moveTo(278, 770);
    c2.quadraticCurveTo(212, 742, 206, 658);
    c2.stroke();
    // Coral ball held cleanly beside right shoulder
    drawCoralChalkBall(c2, 204, 598, 72, 212);
    // Hand cupping ball
    drawRimPaw(c2, 208, 662, false, 0.72, true);

    // FRAME 3 — Front Wind-Up (remaining square toward player, cocking arm & ball back behind shoulder + chalk motion arcs)
    const f3 = makeCanvas();
    const c3 = f3.getContext('2d');
    drawChalkLimeBody(c3, 303);
    drawAngryVFace(c3, false);
    drawRimPaw(c3, 662, 902, true, 1.0, true);
    // Ball & arm cocked further back/outward behind shoulder
    drawCoralChalkBall(c3, 150, 548, 72, 313);
    strokeChalkOutline(c3, (c) => {
        c.moveTo(276, 756);
        c.quadraticCurveTo(192, 692, 166, 608);
    }, 34, '#faf7f2');
    c3.strokeStyle = '#c8df32';
    c3.lineWidth = 30;
    c3.lineCap = 'round';
    c3.beginPath();
    c3.moveTo(276, 756);
    c3.quadraticCurveTo(192, 692, 166, 608);
    c3.stroke();
    drawRimPaw(c3, 166, 608, false, 0.72, true);
    // Curved white chalk motion arcs behind cocked arm & ball
    c3.save();
    c3.lineCap = 'round';
    [0, 1].forEach((idx) => {
        const rr = 104 + idx * 28;
        c3.strokeStyle = 'rgba(28, 28, 30, 0.30)';
        c3.lineWidth = 15 - idx * 3;
        c3.beginPath();
        c3.arc(210, 608, rr, Math.PI * 0.78, Math.PI * 1.48);
        c3.stroke();
        c3.strokeStyle = '#faf7f2';
        c3.lineWidth = 9 - idx * 2;
        c3.beginPath();
        c3.arc(210, 608, rr, Math.PI * 0.78, Math.PI * 1.48);
        c3.stroke();
    });
    c3.restore();

    // FRAME 4 — Front Forward Throw Follow-Through (straight toward viewer, foreshortened open throwing hand + speed lines)
    const f4 = makeCanvas();
    const c4 = f4.getContext('2d');
    drawChalkLimeBody(c4, 404);
    drawAngryVFace(c4, true);
    drawRimPaw(c4, 662, 902, true, 1.0, false);
    // Foreshortened arm tapering toward forward-reaching open hand at (296, 804)
    strokeChalkOutline(c4, (c) => {
        c.moveTo(274, 728);
        c.quadraticCurveTo(286, 766, 298, 810);
    }, 46, '#faf7f2');
    c4.strokeStyle = '#c8df32';
    c4.lineWidth = 42;
    c4.lineCap = 'round';
    c4.beginPath();
    c4.moveTo(274, 728);
    c4.quadraticCurveTo(286, 766, 298, 810);
    c4.stroke();
    // Large foreshortened open release hand reaching out over the front rim toward viewer
    drawRimPaw(c4, 298, 822, false, 1.08, false);
    // Radial white chalk speed lines bursting cleanly around forward release point (298, 796)
    c4.save();
    c4.lineCap = 'round';
    const rxC = 298, ryC = 786;
    const angles = [-2.55, -2.05, -1.55, -0.75, 0.25, 2.55];
    for (let i = 0; i < angles.length; i++) {
        const ang = angles[i];
        const r1 = 84;
        const r2 = 148 + (i % 2) * 28;
        c4.strokeStyle = 'rgba(28, 28, 30, 0.32)';
        c4.lineWidth = 14;
        c4.beginPath();
        c4.moveTo(rxC + Math.cos(ang) * r1, ryC + Math.sin(ang) * r1);
        c4.lineTo(rxC + Math.cos(ang) * r2, ryC + Math.sin(ang) * r2);
        c4.stroke();

        c4.strokeStyle = '#faf7f2';
        c4.lineWidth = 8;
        c4.beginPath();
        c4.moveTo(rxC + Math.cos(ang) * r1, ryC + Math.sin(ang) * r1);
        c4.lineTo(rxC + Math.cos(ang) * r2, ryC + Math.sin(ang) * r2);
        c4.stroke();
    }
    c4.restore();

    return {
        missThrow1: f1.toDataURL('image/png'),
        missThrow2: f2.toDataURL('image/png'),
        missThrow3: f3.toDataURL('image/png'),
        missThrow4: f4.toDataURL('image/png'),
        missBall: missBall
    };
}
