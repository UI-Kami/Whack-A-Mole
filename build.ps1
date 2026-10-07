$ErrorActionPreference = "Stop"

$styleCss = Get-Content -Path "style.css" -Raw
$assetsJson = Get-Content -Path "assets\clean_sprites\assets_base64.json" -Raw

$modules = @(
    "Config.js",
    "AudioManager.js",
    "CameraShake.js",
    "ObjectPool.js",
    "VFXManager.js",
    "ParallaxManager.js",
    "MoleController.js",
    "MoleSpawner.js",
    "HammerController.js",
    "InputManager.js",
    "GameManager.js"
)

$combinedModules = ""
foreach ($m in $modules) {
    $content = Get-Content -Path "src\$m" -Raw
    # Strip import statements
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, "(?m)^\s*import\s+[^;]+;\s*\r?\n?", "")
    # Strip export keywords
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, "(?m)^\s*export\s+(class|const|let|var|function|default)\s+", '$1 ')
    $combinedModules += "`n    // ========================================== `n    // Module: $m `n    // ========================================== `n" + $content + "`n"
}

$uiWiring = @'
    // --- Instantiate Game Engine ---
    const game = new GameManager('game-canvas');
    window.game = game;

    // --- UI Element References ---
    const btnSfx = document.getElementById('btn-sfx');
    const svgSfx = document.getElementById('svg-sfx');
    const btnMusic = document.getElementById('btn-music');
    const svgMusic = document.getElementById('svg-music');
    const btnHandMode = document.getElementById('btn-hand-mode');
    const textHandMode = document.getElementById('text-hand-mode');
    const iconHandMode = document.getElementById('icon-hand-mode');
    const btnStats = document.getElementById('btn-stats');
    const btnCloseStats = document.getElementById('btn-close-stats');
    const statsModal = document.getElementById('stats-modal');
    const gameoverModal = document.getElementById('gameover-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnRestart = document.getElementById('btn-restart');
    const hurtOverlay = document.getElementById('hurt-overlay');
    const hudScorePill = document.querySelector('.hud-score-pill');
    const hudScoreVal = document.getElementById('hud-score-val');
    const hudStreakPill = document.getElementById('hud-streak-pill');
    const hudStreakVal = document.getElementById('hud-streak-val');
    const hudPredictorPill = document.getElementById('hud-predictor-pill');
    const hudPredictorVal = document.getElementById('hud-predictor-val');
    const hudPredictorDot = document.getElementById('hud-predictor-dot');

    const heartEls = [
        document.getElementById('heart-0'),
        document.getElementById('heart-1'),
        document.getElementById('heart-2')
    ];

    // --- Hand Attack Mode Toggle (Combo / Punch / Slap) ---
    const modeIcons = {
        combo: '<svg class="hud-mode-icon" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
        punch: '<svg class="hud-mode-icon" viewBox="0 0 24 24"><path d="M19.5 7h-2.1c-.2-1.7-1.7-3-3.4-3-1 0-1.9.5-2.5 1.2C10.9 4.5 10 4 9 4c-1.7 0-3.2 1.3-3.4 3H4.5C3.1 7 2 8.1 2 9.5v5C2 17.5 4.5 20 7.5 20h7c3 0 5.5-2.5 5.5-5.5v-5c0-1.4-1.1-2.5-2.5-2.5z"/></svg>',
        slap: '<svg class="hud-mode-icon" viewBox="0 0 24 24"><path d="M21 9a2 2 0 0 0-2-2 1.99 1.99 0 0 0-1.73 1C16.89 7.42 16 7 15 7c-.38 0-.74.1-1.06.27A1.99 1.99 0 0 0 12 7c-.4 0-.77.11-1.1.32A2 2 0 0 0 9 6a2 2 0 0 0-2 2v6.5l-1.91-.76a1.99 1.99 0 0 0-2.5 1.09c-.35.91.06 1.94.94 2.37L9 20.5a8 8 0 0 0 6 1.5h1a6 6 0 0 0 6-6V9z"/></svg>'
    };

    const modesList = [
        { id: 'combo', label: 'COMBO' },
        { id: 'punch', label: 'PUNCH' },
        { id: 'slap', label: 'SLAP' }
    ];
    let currentModeIndex = 0;

    if (btnHandMode) {
        btnHandMode.addEventListener('click', () => {
            currentModeIndex = (currentModeIndex + 1) % modesList.length;
            const current = modesList[currentModeIndex];
            if (textHandMode) textHandMode.textContent = current.label;
            if (iconHandMode) iconHandMode.innerHTML = modeIcons[current.id];
            game.setHandMode(current.id);
        });
    }

    // --- Grid Layout Toggle (Auto / 9 Holes / 12 Holes) (Requirement 1) ---
    const btnGridMode = document.getElementById('btn-grid-mode');
    const textGridMode = document.getElementById('text-grid-mode');
    const gridOptions = [
        { id: 'auto', label: 'GRID: AUTO' },
        { id: 9, label: 'GRID: 9 HOLES' },
        { id: 12, label: 'GRID: 12 HOLES' }
    ];
    let currentGridIdx = 0;
    if (btnGridMode) {
        btnGridMode.addEventListener('click', () => {
            currentGridIdx = (currentGridIdx + 1) % gridOptions.length;
            const current = gridOptions[currentGridIdx];
            if (textGridMode) textGridMode.textContent = current.label;
            game.setGridMode(current.id);
        });
    }

    // --- Audio and SFX Toggles ---
    const pathSfxOn = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z';
    const pathSfxOff = 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z';
    const pathMusicOn = 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z';
    const pathMusicOff = 'M4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73l5.73 5.73L21 19.73 4.27 3zM14 7h4V3h-6v5.18l2 2V7z';

    btnSfx.addEventListener('click', () => {
        const active = game.toggleAudio();
        btnSfx.classList.toggle('active', active);
        const p = svgSfx ? svgSfx.querySelector('path') : null;
        if (p) p.setAttribute('d', active ? pathSfxOn : pathSfxOff);
    });

    btnMusic.addEventListener('click', () => {
        const active = game.toggleMusic();
        btnMusic.classList.toggle('active', active);
        const p = svgMusic ? svgMusic.querySelector('path') : null;
        if (p) p.setAttribute('d', active ? pathMusicOn : pathMusicOff);
    });

    // --- Health UI (Hearts) ---
    function updateHeartsUI(health) {
        heartEls.forEach((el, idx) => {
            if (!el) return;
            if (idx < health) {
                el.classList.add('active');
                el.classList.remove('broken');
            } else {
                el.classList.remove('active');
                el.classList.add('broken');
            }
        });
    }

    // --- Predictor UI (Yellow -> Red cycle) ---
    function updatePredictorUI(remaining) {
        if (!hudPredictorVal || !hudPredictorPill) return;
        if (remaining === 1) {
            hudPredictorPill.classList.add('danger');
            if (hudPredictorDot) hudPredictorDot.classList.add('danger');
            hudPredictorVal.textContent = 'NEXT: RED!';
            hudPredictorVal.style.color = '#ef4444';
        } else {
            hudPredictorPill.classList.remove('danger');
            if (hudPredictorDot) hudPredictorDot.classList.remove('danger');
            hudPredictorVal.textContent = 'IN: ' + remaining;
            hudPredictorVal.style.color = '#fde047';
        }
    }

    // --- Event Listeners from GameManager ---
    window.addEventListener('playerhurt', (e) => {
        const { health, hitsUntilRed } = e.detail;
        updateHeartsUI(health);
        updatePredictorUI(hitsUntilRed);
        if (hudStreakVal) hudStreakVal.textContent = '0x';
        if (hudStreakPill) hudStreakPill.classList.remove('fire');

        hurtOverlay.classList.remove('flash');
        void hurtOverlay.offsetWidth;
        hurtOverlay.classList.add('flash');
        setTimeout(() => hurtOverlay.classList.remove('flash'), 300);
    });

    window.addEventListener('molehit', (e) => {
        const { stats, hitsUntilRed } = e.detail;
        if (hudScoreVal) hudScoreVal.textContent = stats.totalHits;
        if (hudScorePill) {
            hudScorePill.classList.remove('pop');
            void hudScorePill.offsetWidth;
            hudScorePill.classList.add('pop');
        }
        if (hudStreakVal) hudStreakVal.textContent = stats.currentStreak + 'x';
        if (hudStreakPill) {
            if (stats.currentStreak >= 3) {
                hudStreakPill.classList.add('fire');
            } else {
                hudStreakPill.classList.remove('fire');
            }
        }
        updatePredictorUI(hitsUntilRed);
    });

    window.addEventListener('molemiss', (e) => {
        const { hitsUntilRed } = e.detail;
        if (hudStreakVal) hudStreakVal.textContent = '0x';
        if (hudStreakPill) hudStreakPill.classList.remove('fire');
        updatePredictorUI(hitsUntilRed);
    });

    window.addEventListener('gameover', (e) => {
        const s = e.detail.stats;
        document.getElementById('go-hits').textContent = s.totalHits;
        document.getElementById('go-streak').textContent = s.highestStreak;
        document.getElementById('go-dodges').textContent = s.redDodges || 0;

        const totalSec = Math.floor(s.sessionTime);
        const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const secs = String(totalSec % 60).padStart(2, '0');
        document.getElementById('go-time').textContent = mins + ':' + secs;

        gameoverModal.classList.add('show');
        modalBackdrop.classList.add('show');
    });

    window.addEventListener('gamerestart', (e) => {
        const { health, hitsUntilRed } = e.detail;
        updateHeartsUI(health);
        updatePredictorUI(hitsUntilRed);
        if (hudScoreVal) hudScoreVal.textContent = '0';
        if (hudStreakVal) hudStreakVal.textContent = '0x';
        if (hudStreakPill) hudStreakPill.classList.remove('fire');
        gameoverModal.classList.remove('show');
        statsModal.classList.remove('show');
        modalBackdrop.classList.remove('show');
    });

    btnRestart.addEventListener('click', () => game.restartGame());
    window.addEventListener('keydown', (e) => {
        if (game.isGameOver && (e.code === 'Space' || e.code === 'Enter')) {
            e.preventDefault();
            game.restartGame();
        }
    });

    function updateStatsUI() {
        const s = game.stats;
        document.getElementById('stat-hits').textContent = s.totalHits;
        document.getElementById('stat-streak').textContent = s.highestStreak;
        document.getElementById('stat-misses').textContent = s.totalMisses;
        const totalSec = Math.floor(s.sessionTime);
        const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const secs = String(totalSec % 60).padStart(2, '0');
        document.getElementById('stat-time').textContent = mins + ':' + secs;
    }

    btnStats.addEventListener('click', () => {
        updateStatsUI();
        statsModal.classList.add('show');
        modalBackdrop.classList.add('show');
    });

    const closeStats = () => {
        statsModal.classList.remove('show');
        if (!game.isGameOver) modalBackdrop.classList.remove('show');
    };
    btnCloseStats.addEventListener('click', closeStats);
    modalBackdrop.addEventListener('click', () => {
        if (!game.isGameOver) closeStats();
    });

    btnFullscreen.addEventListener('click', () => {
        const doc = document;
        const docEl = document.documentElement;
        const isFull = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
        if (!isFull) {
            const rfs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
            if (rfs) rfs.call(docEl).catch(() => {});
        } else {
            const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (efs) efs.call(doc).catch(() => {});
        }
    });
'@

$headerHtml = @'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Whack-a-Mole | Punch &amp; Slap Arcade</title>
    <meta name="description" content="Infinite arcade Whack-a-Mole game featuring Punch and Slap hand animations, dynamic moving background, comic insult reactions, and predictable red rage mole pattern.">
    <style>
'@

$middleHtml = @'
    </style>
</head>
<body>
<div id="game-container">
    <!-- Floating Glassmorphism Arcade HUD -->
    <header class="arcade-hud" role="toolbar" aria-label="Game Controls">
        <div class="brand-badge">
            <svg viewBox="0 0 24 24"><path d="M19.7 7.3l-2.4-2.4c-.4-.4-1-.4-1.4 0l-1.9 1.9 3.8 3.8 1.9-1.9c.4-.4.4-1 0-1.4zM4.3 18.3l8.8-8.8 1.4 1.4-8.8 8.8c-.4.4-1 .4-1.4 0l-.01-.01c-.39-.39-.39-1.02.01-1.39zM14 6l4 4-1 1-4-4 1-1z"/></svg>
            WHACK-A-MOLE
        </div>

        <!-- Hand Attack Mode Toggle (Combo / Punch / Slap) -->
        <button id="btn-hand-mode" class="hud-btn btn-hand-mode" title="Switch Hand Mode" aria-label="Switch Hand Mode">
            <span id="icon-hand-mode"><svg class="hud-mode-icon" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg></span>
            <span id="text-hand-mode">COMBO</span>
        </button>

        <!-- Grid Layout Toggle (Auto / 9 Holes / 12 Holes) (Requirement 1) -->
        <button id="btn-grid-mode" class="hud-btn" title="Toggle 9 or 12 Holes Grid" aria-label="Toggle 9 or 12 Holes Grid">
            <svg class="hud-icon" viewBox="0 0 24 24"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>
            <span id="text-grid-mode">GRID</span>
        </button>

        <!-- Score Display Pill -->
        <div class="hud-pill hud-score-pill" title="Moles Whacked">
            <span class="hud-pill-label">SCORE</span>
            <span id="hud-score-val" class="hud-pill-val">0</span>
        </div>

        <!-- Red Rage Predictor Pill (Requirement 3: Yellow turns RED and explodes!) -->
        <div class="hud-pill hud-predictor-pill" id="hud-predictor-pill" title="Predicts when Yellow mole will turn RED and explode!">
            <span class="hud-pill-label">RAGE</span>
            <span class="hud-pill-val" id="hud-predictor-val-wrap"><span id="hud-predictor-dot" class="rage-indicator-dot"></span><span id="hud-predictor-val">IN: 4</span></span>
        </div>

        <!-- 3 Hearts Health Bar -->
        <div class="hud-pill hud-health-pill" id="hud-health-bar" title="3 Lives - Exploding Red Mole loses 1 heart!">
            <span class="hud-heart active" id="heart-0" aria-label="Heart 1">
                <svg class="heart-svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </span>
            <span class="hud-heart active" id="heart-1" aria-label="Heart 2">
                <svg class="heart-svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </span>
            <span class="hud-heart active" id="heart-2" aria-label="Heart 3">
                <svg class="heart-svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </span>
        </div>

        <!-- SFX Button -->
        <button id="btn-sfx" class="hud-btn active" title="Toggle Sound Effects" aria-label="Toggle Sound Effects">
            <svg id="svg-sfx" class="hud-icon" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <span>SFX</span>
        </button>

        <!-- Music Button -->
        <button id="btn-music" class="hud-btn active" title="Toggle Music" aria-label="Toggle Music">
            <svg id="svg-music" class="hud-icon" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <span>Music</span>
        </button>

        <!-- Stats Button -->
        <button id="btn-stats" class="hud-btn" title="View Stats" aria-label="View Stats">
            <svg class="hud-icon" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span>Stats</span>
        </button>

        <!-- Fullscreen Button -->
        <button id="btn-fullscreen" class="hud-btn" title="Fullscreen" aria-label="Fullscreen">
            <svg class="hud-icon" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
        </button>
    </header>

    <!-- Red Screen Hurt Flash Overlay -->
    <div id="hurt-overlay" class="hurt-overlay" aria-hidden="true"></div>

    <!-- Main Game Canvas -->
    <canvas id="game-canvas"></canvas>

    <!-- Gameplay Tip -->
    <div class="bottom-tip">
        <span>3 Rows (9 or 12 Holes) | Yellow that turns RED instantly EXPLODES!</span>
    </div>

    <!-- Backdrop -->
    <div id="modal-backdrop" class="modal-backdrop"></div>

    <!-- Game Over Modal -->
    <div id="gameover-modal" class="gameover-modal" role="dialog" aria-modal="true" aria-labelledby="go-title">
        <div class="modal-header">
            <h2 id="go-title" style="color: #ef4444;">GAME OVER!</h2>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Hits</div>
                <div id="go-hits" class="stat-value">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Best Streak</div>
                <div id="go-streak" class="stat-value">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Play Time</div>
                <div id="go-time" class="stat-value">00:00</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Rage Dodges</div>
                <div id="go-dodges" class="stat-value">0</div>
            </div>
        </div>
        <button id="btn-restart" class="btn-restart">PLAY AGAIN (SPACE)</button>
    </div>

    <!-- Stats Modal -->
    <div id="stats-modal" class="stats-modal" role="dialog" aria-modal="true" aria-labelledby="stats-title">
        <div class="modal-header">
            <h2 id="stats-title">ARCADE STATS</h2>
            <button id="btn-close-stats" class="stats-close-btn">&times;</button>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Whacks</div>
                <div id="stat-hits" class="stat-value">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Highest Streak</div>
                <div id="stat-streak" class="stat-value">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Play Time</div>
                <div id="stat-time" class="stat-value">00:00</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Misses</div>
                <div id="stat-misses" class="stat-value">0</div>
            </div>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); text-align: center;">
            Punch &bull; Slap &bull; 3 Lives &bull; Predictable Red Rage Pattern
        </p>
    </div>
</div>

<script>
(function() {
    'use strict';

    // --- Embedded Base64 Sprites & Background Assets ---
    const ASSETS_DATA = 
'@

$footerHtml = @'
})();
</script>
</body>
</html>
'@

$fullHtml = $headerHtml + $styleCss + $middleHtml + $assetsJson + ";" + $combinedModules + $uiWiring + $footerHtml

[System.IO.File]::WriteAllText((Join-Path (Get-Location) "index.html"), $fullHtml, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "whack-a-mole-standalone.html"), $fullHtml, [System.Text.UTF8Encoding]::new($false))

Write-Output "Successfully built index.html and whack-a-mole-standalone.html. File size: $((Get-Item index.html).Length)"
