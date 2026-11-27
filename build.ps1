$ErrorActionPreference = "Stop"

$utf8 = [System.Text.UTF8Encoding]::new($true)

$styleCss = [System.IO.File]::ReadAllText((Resolve-Path "style.css"), $utf8)
$assetsJson = [System.IO.File]::ReadAllText((Resolve-Path "assets\normalized\assets_base64.json"), $utf8)

$modules = @(
    "Config.js",
    "MissThrowSprites.js",
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
    $content = [System.IO.File]::ReadAllText((Resolve-Path "src\$m"), $utf8)
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, "(?m)^\s*import\s+[^;]+;\s*\r?\n?", "")
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, "(?m)^\s*export\s+(class|const|let|var|function|default)\s+", '$1 ')
    $combinedModules += "`n    // ========================================== `n    // Module: $m `n    // ========================================== `n" + $content + "`n"
}

$headerHtml = @'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Mazaaq Tha | Interactive Kiosk Experience</title>
    <meta name="description" content="Mazaaq Tha - Interactive Whack-A-Mole reflection on jokes, bullying, and spoken words.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
'@

$middleHtml = @'
    </style>
</head>
<body>
<div id="game-wrapper">
    <div id="game-container">
        <!-- Transparent Top HUD (Speed Limit Removed, Assets Transparent) -->
        <header class="kiosk-hud" role="toolbar" aria-label="Game Controls">
            <div class="hud-top-bar">
                <div class="hud-group-left">
                    <div class="hud-hits-pill" id="hud-hits-pill" title="Normal Hits">
                        <span id="hud-hits-val">Hits: 0</span>
                    </div>
                </div>

                <!-- Always Visible Main Timer (1:30 Countdown) -->
                <div class="hud-timer-wrap" id="hud-timer-wrap" title="Main Timeline">
                    <span class="hud-timer-label">TIMER</span>
                    <span class="hud-timer-val" id="hud-timer-val">1:30</span>
                    <span class="timer-penalty-badge" id="timer-penalty-badge">-3s</span>
                </div>

                <div class="hud-group-right">
                    <button id="btn-sound-toggle" class="hud-pixel-btn sound-toggle active" title="Toggle Sound">
                        <img id="btn-sound-img" class="hud-pixel-btn-img circle" src="" alt="Sound" />
                    </button>
                    <button id="btn-pause" class="hud-pixel-btn" title="Pause Game">
                        <img id="btn-pause-img" class="hud-pixel-btn-img" src="" alt="Pause" />
                    </button>
                </div>
            </div>

            <!-- Mystery Box Progress Bar (Box Icon Transparent Over Playfield) -->
            <div class="hud-sub-bar">
                <div class="hud-progress-gauge" title="Progress toward Mystery Box (50 Hits)">
                    <img id="mystery-icon" class="mystery-box-icon" src="" alt="Box" />
                    <div class="progress-track">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                    <span id="progress-text" class="progress-text">0 / 50</span>
                </div>
            </div>

            <!-- Header Row-3 Lives / Health Indicator (Right-Aligned below Progress Bar) -->
            <div class="hud-side-lives" id="hud-heart-wrap" title="Lives">
                <img id="hud-heart-img" class="hud-heart-img" src="" alt="Health Bar" />
            </div>
        </header>

        <!-- Red Hurt Flash Overlay -->
        <div id="hurt-overlay" class="hurt-overlay" aria-hidden="true"></div>

        <!-- Main Game Canvas (9:16 Portrait) -->
        <canvas id="game-canvas"></canvas>

        <!-- Gameplay Miss Screen-Splash Impact Layer (Above Canvas, Below Top HUD) -->
        <div id="screen-splash-layer" class="screen-splash-layer" aria-hidden="true"></div>

        <!-- Startup Loading Screen (Glitch Background + Logo + Segmented Bar -> Start Menu) -->
        <div id="loading-screen" class="startup-screen" role="status" aria-label="Loading Mazaaq Tha">
            <img id="loading-glitch-a" class="loading-glitch-layer" src="" alt="" aria-hidden="true" />
            <img id="loading-glitch-b" class="loading-glitch-layer" src="" alt="" aria-hidden="true" />
            <div class="loading-content">
                <img id="loading-logo-img" class="loading-logo-img" src="" alt="Mazaaq Tha" />
                <div class="loading-progress-zone">
                    <div class="loading-title font-en">Loading...</div>
                    <div id="loading-bar-track" class="loading-bar-track" aria-hidden="true"></div>
                    <div class="loading-tagline font-en">
                        <div class="loading-tagline-head font-en">SIDE EFFECTS MAY INCLUDE:</div>
                        <div class="loading-tagline-sub font-en">laughing along when you shouldn't.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Home / Menu Screen Modal (Single-Language Title, Compact Typography) -->
        <div id="menu-modal" class="modal-overlay" role="dialog" aria-modal="true">
            <div class="menu-card">
                <div class="menu-hero-wrap">
                    <img id="menu-hero-img" class="menu-hero-img" src="" alt="Mazaaq Tha" />
                    <div class="menu-hero-badge">1080 x 1920 KIOSK</div>
                </div>
                <div class="menu-content">
                    <h1 class="menu-title font-en">MAZAAQ THA</h1>
                    <p class="menu-subtitle font-en">Interactive Kiosk Reflection on Words &amp; Jokes</p>

                    <div class="menu-rules-box">
                        <div class="menu-rule-item">
                            <span class="rule-icon">&#127919;</span>
                            <span class="rule-text"><strong>50 Hits</strong> unlock the Mystery Box</span>
                        </div>
                        <div class="menu-rule-item">
                            <span class="rule-icon">&#9201;&#65039;</span>
                            <span class="rule-text"><strong>90-Second</strong> continuous countdown</span>
                        </div>
                        <div class="menu-rule-item">
                            <span class="rule-icon">&#9888;&#65039;</span>
                            <span class="rule-text"><strong>Red Traps</strong> trigger insults &amp; cool-downs</span>
                        </div>
                    </div>

                    <div id="menu-pb-box" class="menu-pb-box" style="display:none;">
                        <span class="menu-pb-label">PERSONAL BEST:</span>
                        <span id="menu-pb-time" class="menu-pb-val">--:--</span>
                        <span class="menu-pb-divider">&bull;</span>
                        <span id="menu-pb-bombs" class="menu-pb-val">0 Contacts</span>
                    </div>

                    <button id="btn-start-game" class="menu-pixel-start-btn" title="Start Game">
                        <img id="btn-start-img" class="menu-pixel-start-img" src="" alt="START" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Cool-Down Overlay: Larger Error Window + English-Only Text + 3.0s Auto-Dismiss (No Continue/OK button) -->
        <div id="cooldown-modal" class="modal-overlay" role="dialog" aria-modal="true">
            <div class="cooldown-error-wrap">
                <img id="cooldown-window-bg" class="cooldown-error-bg" src="" alt="System Error" />
                <div class="cooldown-error-inner">
                    <div class="cooldown-top-zone">
                        <div class="cooldown-tag">&#9888;&#65039; COOL-DOWN</div>
                        <p id="cooldown-reflection" class="cooldown-reflection-text"></p>
                    </div>
                    <div class="cooldown-bottom-zone">
                        <p id="cooldown-fact" class="cooldown-fact-text"></p>
                        <div class="cooldown-actions-row">
                            <span class="cooldown-penalty-notice">-3s Penalty</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Retro XP 3-Stage Crash Sequence Overlay (Stage 1: Loading... -> Stage 2: EROR! Cascade) -->
        <div id="lose-crash-overlay" class="modal-overlay" aria-hidden="true">
            <div id="lose-loading-box" class="lose-loading-box">
                <img id="lose-loading-img" class="lose-loading-img" src="" alt="Loading..." />
                <div id="lose-loading-track" class="lose-loading-track" aria-hidden="true"></div>
            </div>
            <div id="lose-cascade-layer" class="lose-cascade-layer"></div>
        </div>

        <!-- Lose Sequence Overlay (1 Rotating English Quote per Completed Game + Restart) -->
        <div id="lose-modal" class="modal-overlay" role="dialog" aria-modal="true">
            <div class="sequence-transparent-wrap">
                <div class="lose-error-frame">
                    <img id="lose-window-img" class="cooldown-error-bg" src="" alt="Error Window" />
                    <div class="lose-error-inner">
                        <h2 id="lose-title" class="sequence-title red">TIME'S UP</h2>
                        <div class="sequence-line-box">
                            <p id="lose-text" class="sequence-text-single dark"></p>
                        </div>
                    </div>
                </div>
                <button id="btn-lose-restart" class="btn-pixel-nav" style="display:inline-block;" title="Play Again">
                    <img id="btn-lose-restart-img" class="btn-pixel-nav-img" src="" alt="Play Again" />
                </button>
            </div>
        </div>

        <!-- Win Sequence Overlay (Mystery Box + 1 Rotating English Quote + High Score + Restart) -->
        <div id="win-modal" class="modal-overlay" role="dialog" aria-modal="true">
            <div class="sequence-transparent-wrap">
                <img id="win-hero-img" class="win-hero-transparent" src="" alt="Mystery Box" />
                <div class="win-glass-box">
                    <h2 id="win-title" class="sequence-title">MYSTERY BOX OPENED!</h2>
                    <div class="sequence-line-box">
                        <p id="win-text" class="sequence-text-single"></p>
                    </div>
                </div>
                <div id="win-pb-box" class="pb-window-wrap" style="display:none;">
                    <img id="win-window-img" class="pb-window-img" src="" alt="High Score" />
                    <div class="pb-window-stats">
                        <div>
                            <div id="pb-time-val" class="pb-stat-val">0:00</div>
                            <div class="pb-stat-lbl">Your Time</div>
                        </div>
                        <div>
                            <div id="pb-bombs-val" class="pb-stat-val">0</div>
                            <div class="pb-stat-lbl">Red Hits</div>
                        </div>
                    </div>
                </div>
                <button id="btn-win-restart" class="btn-pixel-nav" style="display:inline-block;" title="Play Again">
                    <img id="btn-win-restart-img" class="btn-pixel-nav-img" src="" alt="Play Again" />
                </button>
            </div>
        </div>

        <!-- Pause Modal -->
        <div id="pause-modal" class="modal-overlay" role="dialog" aria-modal="true">
            <div class="pause-card">
                <h2 class="pause-title">GAME PAUSED</h2>
                <button id="btn-resume" class="btn-pixel-nav" title="Resume">
                    <img id="btn-resume-img" class="btn-pixel-nav-img" src="" alt="Resume" />
                </button>
            </div>
        </div>
    </div>
</div>

<script>
(function() {
    'use strict';

    // --- Embedded Base64 Assets ---
    const ASSETS_DATA = 
'@

$uiWiring = @'
    // --- Instantiate Game Engine ---
    const game = new GameManager('game-canvas');
    window.game = game;

    // --- DOM Elements ---
    const hudHitsVal = document.getElementById('hud-hits-val');
    const hudHeartWrap = document.getElementById('hud-heart-wrap');
    const hudTimerVal = document.getElementById('hud-timer-val');
    const timerPenaltyBadge = document.getElementById('timer-penalty-badge');
    const btnSoundToggle = document.getElementById('btn-sound-toggle');
    const btnPause = document.getElementById('btn-pause');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const mysteryIcon = document.getElementById('mystery-icon');
    const hurtOverlay = document.getElementById('hurt-overlay');

    const loadingScreen = document.getElementById('loading-screen');
    const loadingGlitchA = document.getElementById('loading-glitch-a');
    const loadingGlitchB = document.getElementById('loading-glitch-b');
    const loadingLogoImg = document.getElementById('loading-logo-img');
    const loadingBarTrack = document.getElementById('loading-bar-track');
    const screenSplashLayer = document.getElementById('screen-splash-layer');

    const menuModal = document.getElementById('menu-modal');
    const menuHeroImg = document.getElementById('menu-hero-img');
    const btnStartGame = document.getElementById('btn-start-game');
    const menuPbBox = document.getElementById('menu-pb-box');
    const menuPbTime = document.getElementById('menu-pb-time');
    const menuPbBombs = document.getElementById('menu-pb-bombs');

    const cooldownModal = document.getElementById('cooldown-modal');
    const cooldownWindowBg = document.getElementById('cooldown-window-bg');
    const cooldownRefEl = document.getElementById('cooldown-reflection');
    const cooldownFactEl = document.getElementById('cooldown-fact');

    const pauseModal = document.getElementById('pause-modal');
    const btnResume = document.getElementById('btn-resume');

    const loseCrashOverlay = document.getElementById('lose-crash-overlay');
    const loseLoadingBox = document.getElementById('lose-loading-box');
    const loseLoadingImg = document.getElementById('lose-loading-img');
    const loseLoadingTrack = document.getElementById('lose-loading-track');
    const loseCascadeLayer = document.getElementById('lose-cascade-layer');

    const loseModal = document.getElementById('lose-modal');
    const loseWindowImg = document.getElementById('lose-window-img');
    const loseTitle = document.getElementById('lose-title');
    const loseTextEl = document.getElementById('lose-text');
    const btnLoseRestart = document.getElementById('btn-lose-restart');

    const winModal = document.getElementById('win-modal');
    const winHeroImg = document.getElementById('win-hero-img');
    const winTitle = document.getElementById('win-title');
    const winTextEl = document.getElementById('win-text');
    const winPbBox = document.getElementById('win-pb-box');
    const pbTimeVal = document.getElementById('pb-time-val');
    const pbBombsVal = document.getElementById('pb-bombs-val');
    const btnWinRestart = document.getElementById('btn-win-restart');

    const hudHeartImg = document.getElementById('hud-heart-img');
    const btnPauseImg = document.getElementById('btn-pause-img');
    const btnSoundImg = document.getElementById('btn-sound-img');
    const btnStartImg = document.getElementById('btn-start-img');
    const btnLoseRestartImg = document.getElementById('btn-lose-restart-img');
    const winWindowImg = document.getElementById('win-window-img');
    const btnWinRestartImg = document.getElementById('btn-win-restart-img');
    const btnResumeImg = document.getElementById('btn-resume-img');

    // Populate authentic UI button & window assets from ASSETS_DATA
    if (typeof ASSETS_DATA !== 'undefined') {
        if (loadingGlitchA && ASSETS_DATA.splashGlitchA) loadingGlitchA.src = ASSETS_DATA.splashGlitchA;
        if (loadingGlitchB && ASSETS_DATA.splashGlitchB) loadingGlitchB.src = ASSETS_DATA.splashGlitchB;
        if (loadingLogoImg && (ASSETS_DATA.splashLogo || ASSETS_DATA.splash01)) loadingLogoImg.src = ASSETS_DATA.splashLogo || ASSETS_DATA.splash01;
        if (hudHeartImg) hudHeartImg.src = ASSETS_DATA.healthBarFull || ASSETS_DATA.heartClean;
        if (btnPauseImg) btnPauseImg.src = ASSETS_DATA.btnGreenPause;
        if (btnSoundImg) btnSoundImg.src = ASSETS_DATA.btnCirclePlay;
        if (btnStartImg) btnStartImg.src = ASSETS_DATA.btnGreenStart;
        if (cooldownWindowBg) cooldownWindowBg.src = ASSETS_DATA.windowErrorCooldown || ASSETS_DATA.windowErrorPink;
        if (loseWindowImg) loseWindowImg.src = ASSETS_DATA.windowErrorCooldown || ASSETS_DATA.windowErrorPink;
        if (loseLoadingImg && ASSETS_DATA.barLoading) loseLoadingImg.src = ASSETS_DATA.barLoading;
        if (menuHeroImg && ASSETS_DATA.homeScreen) menuHeroImg.src = ASSETS_DATA.homeScreen;
        if (mysteryIcon && ASSETS_DATA.mysteryClosed) mysteryIcon.src = ASSETS_DATA.mysteryClosed;
        if (btnLoseRestartImg) btnLoseRestartImg.src = ASSETS_DATA.btnGreenStart;
        if (winWindowImg) winWindowImg.src = ASSETS_DATA.windowHighScore;
        if (btnWinRestartImg) btnWinRestartImg.src = ASSETS_DATA.btnGreenStart;
        if (btnResumeImg) btnResumeImg.src = ASSETS_DATA.btnGreenStart;
    }

    // Helper: format MM:SS
    function formatTime(seconds) {
        const s = Math.max(0, Math.ceil(seconds));
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Clean English-only text helper using --font-en
    function setEnglishText(elem, entry) {
        if (!elem) return;
        const text = (typeof entry === 'string') ? entry : (entry && entry.text ? entry.text : '');
        elem.textContent = text;
        elem.classList.add('font-en');
        elem.setAttribute('dir', 'ltr');
    }

    // Modal Open / Close Helpers: separate display:flex -> reflow -> rAF(.show) so opacity/blur fade smoothly
    const modalCloseTimers = new WeakMap();
    const modalOpenRafs = new WeakMap();

    function openModal(modal, beforeShow) {
        if (!modal) return;
        const prevTimer = modalCloseTimers.get(modal);
        if (prevTimer) {
            clearTimeout(prevTimer);
            modalCloseTimers.delete(modal);
        }
        const prevRaf = modalOpenRafs.get(modal);
        if (prevRaf) {
            cancelAnimationFrame(prevRaf);
            modalOpenRafs.delete(modal);
        }

        modal.classList.remove('show');
        modal.style.display = 'flex';
        modal.classList.add('is-open');
        if (typeof beforeShow === 'function') {
            beforeShow();
        }

        // Force layout reflow before adding .show on next frame so transitions never snap
        void modal.offsetWidth;

        const rafId = requestAnimationFrame(() => {
            modalOpenRafs.delete(modal);
            modal.classList.add('show');
        });
        modalOpenRafs.set(modal, rafId);
    }

    function closeModal(modal, immediate = false) {
        if (!modal) return;
        const prevRaf = modalOpenRafs.get(modal);
        if (prevRaf) {
            cancelAnimationFrame(prevRaf);
            modalOpenRafs.delete(modal);
        }
        const prevTimer = modalCloseTimers.get(modal);
        if (prevTimer) {
            clearTimeout(prevTimer);
            modalCloseTimers.delete(modal);
        }

        modal.classList.remove('show');
        if (immediate) {
            modal.classList.remove('is-open');
            modal.style.display = 'none';
            return;
        }
        const timerId = setTimeout(() => {
            modalCloseTimers.delete(modal);
            if (!modal.classList.contains('show')) {
                modal.classList.remove('is-open');
                modal.style.display = 'none';
            }
        }, 420);
        modalCloseTimers.set(modal, timerId);
    }

    // Update Menu Personal Best Display
    function updateMenuPB() {
        try {
            const raw = localStorage.getItem('mazaaq_tha_best_run');
            if (raw) {
                const pb = JSON.parse(raw);
                if (menuPbBox && menuPbTime && menuPbBombs) {
                    menuPbTime.textContent = formatTime(pb.timeTaken);
                    menuPbBombs.textContent = `${pb.bombHits} Red Hit${pb.bombHits === 1 ? '' : 's'}`;
                    menuPbBox.style.display = 'flex';
                }
            }
        } catch(e) {}
    }
    updateMenuPB();

    // Startup Sequence: Glitch Loading (~2.0s) -> Open Start Menu (#menu-modal) directly
    const STARTUP_LOADING_SEGMENTS = 18;
    const STARTUP_GLITCH_STEP_MS = 145; // 130ms-160ms alternating pixel-grid flips
    const STARTUP_LOADING_DURATION_MS = 2000;
    let startupActive = true;
    let startupGlitchTimer = null;
    let startupRafId = null;
    const startupTimers = [];

    function clearStartupTimers() {
        if (startupGlitchTimer) {
            clearInterval(startupGlitchTimer);
            startupGlitchTimer = null;
        }
        if (startupRafId) {
            cancelAnimationFrame(startupRafId);
            startupRafId = null;
        }
        while (startupTimers.length > 0) {
            clearTimeout(startupTimers.pop());
        }
    }

    function initStartupLoadingSegments() {
        if (!loadingBarTrack) return;
        loadingBarTrack.innerHTML = '';
        for (let i = 0; i < STARTUP_LOADING_SEGMENTS; i++) {
            const seg = document.createElement('div');
            seg.className = 'loading-bar-seg';
            loadingBarTrack.appendChild(seg);
        }
    }

    function setStartupLoadingProgress(fraction) {
        if (!loadingBarTrack) return;
        const clamped = Math.max(0, Math.min(1, fraction));
        const filledCount = Math.round(clamped * STARTUP_LOADING_SEGMENTS);
        const segs = loadingBarTrack.children;
        for (let i = 0; i < segs.length; i++) {
            segs[i].classList.toggle('filled', i < filledCount);
        }
    }

    function finishStartupSequence(suppressMenu = false) {
        if (!startupActive) return;
        startupActive = false;
        clearStartupTimers();

        if (loadingScreen) {
            loadingScreen.classList.remove('fade-out');
            loadingScreen.style.display = 'none';
        }
        if (!suppressMenu) {
            openModal(menuModal);
        }
    }

    function startLoadingScreenSequence() {
        initStartupLoadingSegments();
        setStartupLoadingProgress(0);

        if (loadingGlitchA && loadingGlitchB) {
            let glitchTick = 0;
            const applyGlitchStep = (tick) => {
                const mode = tick % 4;
                if (mode === 0) {
                    loadingGlitchA.style.opacity = '1';
                    loadingGlitchA.style.transform = 'scale(1, 1)';
                    loadingGlitchB.style.opacity = '0';
                } else if (mode === 1) {
                    loadingGlitchA.style.opacity = '0';
                    loadingGlitchB.style.opacity = '1';
                    loadingGlitchB.style.transform = 'scale(-1, 1)';
                } else if (mode === 2) {
                    loadingGlitchA.style.opacity = '1';
                    loadingGlitchA.style.transform = 'scale(1, -1)';
                    loadingGlitchB.style.opacity = '0';
                } else {
                    loadingGlitchA.style.opacity = '0';
                    loadingGlitchB.style.opacity = '1';
                    loadingGlitchB.style.transform = 'scale(-1, -1)';
                }
            };
            applyGlitchStep(0);
            startupGlitchTimer = setInterval(() => {
                if (!startupActive) return;
                glitchTick++;
                applyGlitchStep(glitchTick);
            }, STARTUP_GLITCH_STEP_MS);
        }

        const startTs = performance.now();
        const tickLoading = (now) => {
            if (!startupActive) return;
            const frac = Math.min(1, (now - startTs) / STARTUP_LOADING_DURATION_MS);
            setStartupLoadingProgress(frac);
            if (frac < 1) {
                startupRafId = requestAnimationFrame(tickLoading);
            } else {
                startupRafId = null;
                if (startupGlitchTimer) {
                    clearInterval(startupGlitchTimer);
                    startupGlitchTimer = null;
                }
                // Transition directly from loading screen into #menu-modal
                openModal(menuModal);
                if (loadingScreen) loadingScreen.classList.add('fade-out');
                startupTimers.push(setTimeout(() => finishStartupSequence(true), 340));
            }
        };
        startupRafId = requestAnimationFrame(tickLoading);
    }

    // Menu Start Button (also cleanly dismisses loading screen if triggered directly)
    if (btnStartGame) {
        btnStartGame.addEventListener('click', () => {
            finishStartupSequence(true);
            closeModal(menuModal, true);
            game.startGame();
        });
    }

    startLoadingScreenSequence();

    // Gameplay Miss Screen-Splash Impact Pool (Frames 7 -> 8 over #game-canvas, supporting concurrent overlaps)
    const activeSplashTimers = new Set();

    function clearScreenSplashes() {
        activeSplashTimers.forEach(t => clearTimeout(t));
        activeSplashTimers.clear();
        if (screenSplashLayer) screenSplashLayer.innerHTML = '';
    }

    function spawnScreenSplash(detail = {}) {
        if (!screenSplashLayer || typeof ASSETS_DATA === 'undefined') return;
        const f7 = ASSETS_DATA.splashBurst || ASSETS_DATA.splashFrame7;
        const f8 = ASSETS_DATA.splashSplat || ASSETS_DATA.splashFrame8;
        if (!f7 || !f8) return;

        // Place splash at viewport center impact coordinates (with subtle scatter only on rapid multi-misses)
        const activeCount = screenSplashLayer.children.length;
        const baseX = (typeof detail.x === 'number') ? (detail.x / (CONFIG.VIEWPORT_WIDTH || 1080)) * 100 : 50;
        const baseY = (typeof detail.y === 'number') ? (detail.y / (CONFIG.VIEWPORT_HEIGHT || 1920)) * 100 : 48;
        const jitterX = (activeCount === 0) ? 0 : (Math.random() * 18 - 9);
        const jitterY = (activeCount === 0) ? 0 : (Math.random() * 14 - 7);
        const posX = Math.max(32, Math.min(68, baseX + jitterX));
        const posY = Math.max(36, Math.min(62, baseY + jitterY));

        const wrap = document.createElement('div');
        wrap.className = 'screen-splash-instance';
        wrap.style.left = `${posX.toFixed(1)}%`;
        wrap.style.top = `${posY.toFixed(1)}%`;

        const img = document.createElement('img');
        img.className = 'screen-splash-img burst';
        img.src = f7;
        img.alt = '';
        wrap.appendChild(img);
        screenSplashLayer.appendChild(wrap);

        const burstMs = (CONFIG && CONFIG.MISS_SPLASH_BURST_MS) || 130;
        const splatMs = (CONFIG && CONFIG.MISS_SPLASH_SPLAT_MS) || 600;

        const tSwap = setTimeout(() => {
            activeSplashTimers.delete(tSwap);
            if (!wrap.isConnected) return;
            img.src = f8;
            img.className = 'screen-splash-img splat';
        }, burstMs);
        activeSplashTimers.add(tSwap);

        const tRemove = setTimeout(() => {
            activeSplashTimers.delete(tRemove);
            if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        }, burstMs + splatMs + 40);
        activeSplashTimers.add(tRemove);
    }

    window.addEventListener('misssplash', (e) => {
        spawnScreenSplash(e && e.detail ? e.detail : {});
    });
    window.addEventListener('gamestart', clearScreenSplashes);

    // Timer updates (Speed UI removed per spec)
    window.addEventListener('timertick', (e) => {
        const { timeRemaining } = e.detail;
        if (hudTimerVal) hudTimerVal.textContent = formatTime(timeRemaining);
    });

    window.addEventListener('normalhit', (e) => {
        const { normalHits, targetHits, progress } = e.detail;
        if (hudHitsVal) hudHitsVal.textContent = `Hits: ${normalHits}`;
        if (progressFill) progressFill.style.width = `${Math.round(progress * 100)}%`;
        if (progressText) progressText.textContent = `${normalHits} / ${targetHits}`;
    });

    window.addEventListener('bombhit', (e) => {
        const { heartCrackLevel, suppressFlash } = e.detail;
        if (hudHeartWrap) {
            hudHeartWrap.className = (heartCrackLevel > 0)
                ? `hud-side-lives crack-${heartCrackLevel}`
                : 'hud-side-lives';
        }
        if (hudHeartImg && typeof ASSETS_DATA !== 'undefined') {
            if (heartCrackLevel === 1) hudHeartImg.src = ASSETS_DATA.healthBarHalf || ASSETS_DATA.heartCrack1;
            else if (heartCrackLevel >= 2) hudHeartImg.src = ASSETS_DATA.healthBarEmpty || ASSETS_DATA.heartCrack2;
            else hudHeartImg.src = ASSETS_DATA.healthBarFull || ASSETS_DATA.heartClean;
        }
        if (hurtOverlay && !suppressFlash) {
            hurtOverlay.classList.remove('flash');
            void hurtOverlay.offsetWidth;
            hurtOverlay.classList.add('flash');
            setTimeout(() => hurtOverlay.classList.remove('flash'), 220);
        }
    });

    window.addEventListener('timerpenalty', (e) => {
        const { text } = e.detail;
        if (timerPenaltyBadge) {
            timerPenaltyBadge.textContent = text;
            timerPenaltyBadge.classList.remove('pulse');
            void timerPenaltyBadge.offsetWidth;
            timerPenaltyBadge.classList.add('pulse');
            setTimeout(() => timerPenaltyBadge.classList.remove('pulse'), 900);
        }
    });

    // Auto-fit Cool-Down English text comfortably inside enlarged Error window bounds
    function autoFitCooldownText() {
        const inner = cooldownModal ? cooldownModal.querySelector('.cooldown-error-inner') : null;
        if (!inner || !cooldownRefEl || !cooldownFactEl) return;

        cooldownRefEl.style.fontSize = '';
        cooldownFactEl.style.fontSize = '';
        if (inner.clientHeight <= 0) return;

        let refSize = parseFloat(window.getComputedStyle(cooldownRefEl).fontSize);
        let factSize = parseFloat(window.getComputedStyle(cooldownFactEl).fontSize);

        while (refSize > 12 || factSize > 12) {
            const refRect = cooldownRefEl.getBoundingClientRect();
            const factRect = cooldownFactEl.getBoundingClientRect();
            const verticalGap = factRect.top - refRect.bottom;
            if (inner.scrollHeight <= inner.clientHeight && verticalGap >= 10) {
                break;
            }
            if (refSize > 12) {
                refSize = Math.max(12, refSize - 1);
                cooldownRefEl.style.fontSize = `${refSize}px`;
            }
            if (factSize > 12) {
                factSize = Math.max(12, factSize - 1);
                cooldownFactEl.style.fontSize = `${factSize}px`;
            }
        }
    }

    // Cool-Down Pop-Up (1 Rotating English Quote & Matching Fact per bomb hit; 3.0s auto-dismiss)
    window.addEventListener('cooldownshow', (e) => {
        const { reflection, fact } = e.detail;
        openModal(cooldownModal, () => {
            if (cooldownRefEl) cooldownRefEl.style.fontSize = '';
            if (cooldownFactEl) cooldownFactEl.style.fontSize = '';
            setEnglishText(cooldownRefEl, reflection);
            setEnglishText(cooldownFactEl, fact);
            autoFitCooldownText();
        });
    });

    window.addEventListener('cooldownhide', () => {
        closeModal(cooldownModal, false);
    });

    // Pause Controls
    btnPause.addEventListener('click', () => {
        game.togglePause();
    });

    btnResume.addEventListener('click', () => {
        game.togglePause();
    });

    window.addEventListener('pausechange', (e) => {
        const { isPaused } = e.detail;
        if (pauseModal) {
            if (isPaused) openModal(pauseModal);
            else closeModal(pauseModal, true);
        }
    });

    // Sound Toggle
    if (btnSoundToggle) {
        btnSoundToggle.addEventListener('click', () => {
            const active = game.toggleAudio();
            btnSoundToggle.classList.toggle('active', active);
            if (btnSoundImg && typeof ASSETS_DATA !== 'undefined') {
                btnSoundImg.src = active ? ASSETS_DATA.btnCirclePlay : ASSETS_DATA.btnCircleClose;
            }
        });
    }

    // 3-Stage Retro Lose Crash Sequence Controller (Loading... -> EROR! Cascade -> #lose-modal)
    const LOSE_LOADING_SEGMENTS = 16;
    let loseCrashTimers = [];

    function initLoadingTrackSegments() {
        if (!loseLoadingTrack || loseLoadingTrack.children.length > 0) return;
        for (let i = 0; i < LOSE_LOADING_SEGMENTS; i++) {
            const seg = document.createElement('div');
            seg.className = 'loading-seg';
            loseLoadingTrack.appendChild(seg);
        }
    }
    initLoadingTrackSegments();

    function setLoadingProgressSegments(filledCount) {
        if (!loseLoadingTrack) return;
        const segs = loseLoadingTrack.children;
        for (let i = 0; i < segs.length; i++) {
            segs[i].classList.toggle('filled', i < filledCount);
        }
    }

    function clearLoseCrashSequence() {
        for (let i = 0; i < loseCrashTimers.length; i++) {
            clearTimeout(loseCrashTimers[i]);
        }
        loseCrashTimers = [];
        if (loseLoadingBox) loseLoadingBox.style.display = 'none';
        setLoadingProgressSegments(0);
        if (loseCascadeLayer) loseCascadeLayer.innerHTML = '';
        closeModal(loseCrashOverlay, true);
    }

    function buildErorCascadePoints(count) {
        const pts = [];
        let x = 6;
        let y = 7;
        let vx = 4.9;
        let vy = 5.4;
        for (let i = 0; i < count; i++) {
            pts.push({ x, y });
            x += vx;
            y += vy;
            if (x > 58) { x = 58; vx = -(4.4 + ((i * 7) % 15) * 0.12); }
            else if (x < 2) { x = 2; vx = 4.5 + ((i * 5) % 14) * 0.12; }
            if (y > 76) { y = 76; vy = -(5.1 + ((i * 11) % 13) * 0.15); }
            else if (y < 4) { y = 4; vy = 5.0 + ((i * 9) % 13) * 0.15; }
            // Periodic small diagonal jitter jump mid-drag so stamps blanket the full 9:16 canvas
            if (i === 11 || i === 22) {
                vx = -vx;
                y = Math.max(4, Math.min(76, (y + 16) % 72));
            }
        }
        return pts;
    }

    // Lose End Sequence: Stage 1 Loading (~0.9s) -> Stage 2 EROR! Cascade (~1.1s) -> Stage 3 #lose-modal
    window.addEventListener('gamelose', (e) => {
        const msg = (e && e.detail && e.detail.message) ? e.detail.message : CONFIG.LOSE_MESSAGES[0];
        clearScreenSplashes();
        clearLoseCrashSequence();
        closeModal(cooldownModal, true);
        closeModal(pauseModal, true);

        // Stage 1: Animated magenta-header "Loading..." bar (0% -> 75% with 120ms stutter -> 100% over ~0.9s)
        openModal(loseCrashOverlay, () => {
            initLoadingTrackSegments();
            setLoadingProgressSegments(0);
            if (loseCascadeLayer) loseCascadeLayer.innerHTML = '';
            if (loseLoadingBox) loseLoadingBox.style.display = 'block';
        });

        for (let s = 1; s <= 12; s++) {
            const delayMs = s * 48; // 48ms..576ms -> hits 75% (12/16)
            loseCrashTimers.push(setTimeout(() => setLoadingProgressSegments(s), delayMs));
        }
        // ~120ms retro stutter at 75% (576ms -> 700ms), then snap rapidly to 100% (16/16) by ~860ms
        for (let s = 13; s <= LOSE_LOADING_SEGMENTS; s++) {
            const delayMs = 700 + (s - 12) * 38; // 738ms..852ms
            loseCrashTimers.push(setTimeout(() => setLoadingProgressSegments(s), delayMs));
        }

        // Stage 2: Launch XP-style cascading "EROR!" windows (~32 windows @ 32ms intervals = ~1.05s)
        const stage2Start = 900;
        const totalStamps = 32;
        const stampStepMs = 32;
        const cascadePts = buildErorCascadePoints(totalStamps);
        const erorSrc = (typeof ASSETS_DATA !== 'undefined')
            ? (ASSETS_DATA.singleErrorWindow || ASSETS_DATA.windowErrorCascade)
            : '';

        loseCrashTimers.push(setTimeout(() => {
            if (loseLoadingBox) loseLoadingBox.style.display = 'none';
            for (let i = 0; i < totalStamps; i++) {
                loseCrashTimers.push(setTimeout(() => {
                    if (!loseCascadeLayer || !erorSrc) return;
                    const stamp = document.createElement('img');
                    stamp.src = erorSrc;
                    stamp.alt = 'EROR!';
                    stamp.className = 'lose-cascade-stamp';
                    stamp.style.left = `${cascadePts[i].x.toFixed(1)}%`;
                    stamp.style.top = `${cascadePts[i].y.toFixed(1)}%`;
                    stamp.style.zIndex = String(10 + i);
                    loseCascadeLayer.appendChild(stamp);
                }, i * stampStepMs));
            }
        }, stage2Start));

        // Stage 3: Settle the Pink Error Lose box (#lose-modal) smoothly over the EROR! cascade
        const stage3Start = stage2Start + totalStamps * stampStepMs + 60; // ~1984ms
        loseCrashTimers.push(setTimeout(() => {
            openModal(loseModal, () => {
                loseTitle.textContent = "TIME'S UP";
                setEnglishText(loseTextEl, msg);
                if (btnLoseRestart) btnLoseRestart.style.display = 'inline-block';
            });
        }, stage3Start));
    });

    if (btnLoseRestart) {
        btnLoseRestart.addEventListener('click', () => {
            clearScreenSplashes();
        clearLoseCrashSequence();
            closeModal(loseModal, true);
            game.restartGame();
        });
    }

    // Win End Screen (Opened Mystery Box + 1 Rotating English Message + Retro HIGH SCORE Window + Play Again)
    window.addEventListener('gamewin', (e) => {
        const { timeTaken, bombHits, bestRun, message } = e.detail || {};
        clearScreenSplashes();
        clearLoseCrashSequence();
        closeModal(cooldownModal, true);
        closeModal(pauseModal, true);
        openModal(winModal, () => {
            if (winHeroImg && typeof ASSETS_DATA !== 'undefined') {
                winHeroImg.src = ASSETS_DATA.mysteryOpen || ASSETS_DATA.mysteryClosed;
            }
            winTitle.textContent = "MYSTERY BOX OPENED!";
            setEnglishText(winTextEl, message || CONFIG.WIN_MESSAGES[0]);

            if (winPbBox) {
                const displayTime = (typeof timeTaken === 'number') ? timeTaken : (bestRun ? bestRun.timeTaken : 0);
                const displayBombs = (typeof bombHits === 'number') ? bombHits : (bestRun ? bestRun.bombHits : 0);
                pbTimeVal.textContent = formatTime(displayTime);
                pbBombsVal.textContent = displayBombs;
                winPbBox.style.display = 'block';
            }

            if (btnWinRestart) btnWinRestart.style.display = 'inline-block';
        });
    });

    if (btnWinRestart) {
        btnWinRestart.addEventListener('click', () => {
            clearScreenSplashes();
        clearLoseCrashSequence();
            closeModal(winModal, true);
            game.restartGame();
        });
    }

    window.addEventListener('gamerestart', (e) => {
        const { targetHits } = e.detail;
        if (hudHitsVal) hudHitsVal.textContent = 'Hits: 0';
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = `0 / ${targetHits}`;
        if (hudHeartWrap) hudHeartWrap.className = 'hud-side-lives';
        if (hudHeartImg && typeof ASSETS_DATA !== 'undefined') hudHeartImg.src = ASSETS_DATA.healthBarFull || ASSETS_DATA.heartClean;
        if (hudTimerVal) hudTimerVal.textContent = '1:30';
        if (timerPenaltyBadge) timerPenaltyBadge.classList.remove('pulse');

        clearScreenSplashes();
        clearLoseCrashSequence();
        closeModal(menuModal, true);
        closeModal(cooldownModal, true);
        closeModal(loseModal, true);
        closeModal(winModal, true);
        closeModal(pauseModal, true);

        updateMenuPB();
    });
'@

$footerHtml = @'
})();
</script>
</body>
</html>
'@

$fullHtml = $headerHtml + $styleCss + $middleHtml + $assetsJson + ";" + $combinedModules + $uiWiring + $footerHtml

[System.IO.File]::WriteAllText((Join-Path (Get-Location) "index.html"), $fullHtml, $utf8)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "whack-a-mole-standalone.html"), $fullHtml, $utf8)

Write-Output "Successfully built index.html and whack-a-mole-standalone.html. File size: $((Get-Item index.html).Length) bytes"
