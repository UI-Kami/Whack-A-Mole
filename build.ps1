$ErrorActionPreference = "Stop"

$utf8 = [System.Text.UTF8Encoding]::new($true)

$styleCss = [System.IO.File]::ReadAllText((Resolve-Path "style.css"), $utf8)
$assetsJson = [System.IO.File]::ReadAllText((Resolve-Path "assets\normalized\assets_base64.json"), $utf8)

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
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
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
                <div class="hud-progress-gauge" title="Progress toward Mystery Box (30 Hits)">
                    <img id="mystery-icon" class="mystery-box-icon" src="" alt="Box" />
                    <div class="progress-track">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                    <span id="progress-text" class="progress-text">0 / 30</span>
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

        <!-- Home / Menu Screen Modal (Single-Language Title, Compact Typography) -->
        <div id="menu-modal" class="modal-overlay show" role="dialog" aria-modal="true">
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
                            <span class="rule-text"><strong>30 Hits</strong> unlock the Mystery Box</span>
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

        <!-- Cool-Down Overlay: Fullscreen Blur + Prominent Error Window Asset + Large Single-Language Text -->
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
                            <button id="btn-continue" class="btn-continue">Continue (-1s)</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Lose Sequence Overlay (Time's Up inside Error Screen Asset) -->
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
                <button id="btn-lose-next" class="btn-pixel-nav" style="display:none;" title="Next">
                    <img id="btn-lose-next-img" class="btn-pixel-nav-img" src="" alt="Next" />
                </button>
                <button id="btn-lose-restart" class="btn-pixel-nav" style="display:none;" title="Play Again">
                    <img id="btn-lose-restart-img" class="btn-pixel-nav-img" src="" alt="Play Again" />
                </button>
            </div>
        </div>

        <!-- Win Sequence Overlay (Mystery Box + Single-Language Dialogue + High Score Asset) -->
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
                            <div class="pb-stat-lbl">Fastest Time</div>
                        </div>
                        <div>
                            <div id="pb-bombs-val" class="pb-stat-val">0</div>
                            <div class="pb-stat-lbl">Red Hits</div>
                        </div>
                    </div>
                </div>
                <button id="btn-win-next" class="btn-pixel-nav" style="display:none;" title="Next">
                    <img id="btn-win-next-img" class="btn-pixel-nav-img" src="" alt="Next" />
                </button>
                <button id="btn-win-restart" class="btn-pixel-nav" style="display:none;" title="Play Again">
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
    const btnContinue = document.getElementById('btn-continue');

    const pauseModal = document.getElementById('pause-modal');
    const btnResume = document.getElementById('btn-resume');

    const loseModal = document.getElementById('lose-modal');
    const loseWindowImg = document.getElementById('lose-window-img');
    const loseTitle = document.getElementById('lose-title');
    const loseTextEl = document.getElementById('lose-text');
    const btnLoseNext = document.getElementById('btn-lose-next');
    const btnLoseRestart = document.getElementById('btn-lose-restart');

    const winModal = document.getElementById('win-modal');
    const winHeroImg = document.getElementById('win-hero-img');
    const winTitle = document.getElementById('win-title');
    const winTextEl = document.getElementById('win-text');
    const winPbBox = document.getElementById('win-pb-box');
    const pbTimeVal = document.getElementById('pb-time-val');
    const pbBombsVal = document.getElementById('pb-bombs-val');
    const btnWinNext = document.getElementById('btn-win-next');
    const btnWinRestart = document.getElementById('btn-win-restart');

    const hudHeartImg = document.getElementById('hud-heart-img');
    const btnPauseImg = document.getElementById('btn-pause-img');
    const btnSoundImg = document.getElementById('btn-sound-img');
    const btnStartImg = document.getElementById('btn-start-img');
    const btnLoseNextImg = document.getElementById('btn-lose-next-img');
    const btnLoseRestartImg = document.getElementById('btn-lose-restart-img');
    const winWindowImg = document.getElementById('win-window-img');
    const btnWinNextImg = document.getElementById('btn-win-next-img');
    const btnWinRestartImg = document.getElementById('btn-win-restart-img');
    const btnResumeImg = document.getElementById('btn-resume-img');

    // Populate authentic UI button & window assets from ASSETS_DATA
    if (typeof ASSETS_DATA !== 'undefined') {
        if (hudHeartImg) hudHeartImg.src = ASSETS_DATA.healthBarFull || ASSETS_DATA.heartClean;
        if (btnPauseImg) btnPauseImg.src = ASSETS_DATA.btnGreenPause;
        if (btnSoundImg) btnSoundImg.src = ASSETS_DATA.btnCirclePlay;
        if (btnStartImg) btnStartImg.src = ASSETS_DATA.btnGreenStart;
        if (cooldownWindowBg) cooldownWindowBg.src = ASSETS_DATA.windowErrorCooldown || ASSETS_DATA.windowErrorPink;
        if (loseWindowImg) loseWindowImg.src = ASSETS_DATA.windowErrorCooldown || ASSETS_DATA.windowErrorPink;
        if (menuHeroImg && ASSETS_DATA.homeScreen) menuHeroImg.src = ASSETS_DATA.homeScreen;
        if (mysteryIcon && ASSETS_DATA.mysteryClosed) mysteryIcon.src = ASSETS_DATA.mysteryClosed;
        if (btnLoseNextImg) btnLoseNextImg.src = ASSETS_DATA.btnGreenNext;
        if (btnLoseRestartImg) btnLoseRestartImg.src = ASSETS_DATA.btnGreenStart;
        if (winWindowImg) winWindowImg.src = ASSETS_DATA.windowHighScore;
        if (btnWinNextImg) btnWinNextImg.src = ASSETS_DATA.btnGreenNext;
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

    // Single-Language Text Renderer (Strictly NO duplicate bilingual text on same element!)
    // Applies .font-ur + RTL for Urdu entries, and .font-en + LTR for English entries.
    function setSingleLanguageText(elem, entry) {
        if (!elem) return;
        if (!entry) {
            elem.textContent = '';
            return;
        }
        const text = (typeof entry === 'string') ? entry : (entry.text || '');
        const isUrdu = (typeof entry === 'object' && entry.lang)
            ? (entry.lang === 'ur')
            : /[\u0600-\u06FF]/.test(text);

        elem.textContent = text;
        if (isUrdu) {
            elem.classList.add('font-ur');
            elem.classList.remove('font-en');
            elem.setAttribute('dir', 'rtl');
        } else {
            elem.classList.add('font-en');
            elem.classList.remove('font-ur');
            elem.setAttribute('dir', 'ltr');
        }
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

    // Menu Start Button
    if (btnStartGame) {
        btnStartGame.addEventListener('click', () => {
            if (menuModal) menuModal.classList.remove('show');
            game.startGame();
        });
    }

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
        const { heartCrackLevel } = e.detail;
        if (hudHeartWrap) {
            hudHeartWrap.className = `hud-side-lives crack-${heartCrackLevel}`;
        }
        if (hudHeartImg && typeof ASSETS_DATA !== 'undefined') {
            if (heartCrackLevel === 1) hudHeartImg.src = ASSETS_DATA.healthBarHalf || ASSETS_DATA.heartCrack1;
            else if (heartCrackLevel >= 2) hudHeartImg.src = ASSETS_DATA.healthBarEmpty || ASSETS_DATA.heartCrack2;
            else hudHeartImg.src = ASSETS_DATA.healthBarFull || ASSETS_DATA.heartClean;
        }
        if (hurtOverlay) {
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

    // Auto-fit Cool-Down text inside Error window interior bounds
    function autoFitCooldownText() {
        const inner = cooldownModal ? cooldownModal.querySelector('.cooldown-error-inner') : null;
        if (!inner || !cooldownRefEl || !cooldownFactEl) return;
        let refSize = parseFloat(window.getComputedStyle(cooldownRefEl).fontSize);
        let factSize = parseFloat(window.getComputedStyle(cooldownFactEl).fontSize);
        while (inner.scrollHeight > inner.clientHeight && (refSize > 13 || factSize > 13)) {
            if (refSize > 13) {
                refSize = Math.max(13, refSize - 1);
                cooldownRefEl.style.fontSize = `${refSize}px`;
            }
            if (factSize > 13) {
                factSize = Math.max(13, factSize - 1);
                cooldownFactEl.style.fontSize = `${factSize}px`;
            }
        }
    }

    // Cool-Down Pop-Up
    window.addEventListener('cooldownshow', (e) => {
        const { reflection, fact } = e.detail;
        if (cooldownRefEl) cooldownRefEl.style.fontSize = '';
        if (cooldownFactEl) cooldownFactEl.style.fontSize = '';
        setSingleLanguageText(cooldownRefEl, reflection);
        setSingleLanguageText(cooldownFactEl, fact);
        cooldownModal.classList.add('show');
        autoFitCooldownText();
    });

    window.addEventListener('cooldownhide', () => {
        cooldownModal.classList.remove('show');
    });

    btnContinue.addEventListener('click', () => {
        game.skipCoolDownEarly();
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
            if (isPaused) pauseModal.classList.add('show');
            else pauseModal.classList.remove('show');
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

    // Lose Sequence Flow
    let loseStep = 0;

    function advanceLoseSequence() {
        loseStep++;
        const lines = CONFIG.LOSE_DIALOGUE_LINES;

        if (loseStep < lines.length) {
            setSingleLanguageText(loseTextEl, lines[loseStep]);
            btnLoseNext.style.display = 'inline-block';
            btnLoseRestart.style.display = 'none';
        } else if (loseStep === lines.length) {
            setSingleLanguageText(loseTextEl, CONFIG.FINAL_LOSE_INSULT);
            btnLoseNext.style.display = 'inline-block';
            btnLoseRestart.style.display = 'none';
        } else if (loseStep === lines.length + 1) {
            setSingleLanguageText(loseTextEl, CONFIG.FINAL_LOSE_REFLECTION);
            btnLoseNext.style.display = 'inline-block';
            btnLoseRestart.style.display = 'none';
        } else {
            loseTitle.textContent = CONFIG.LOSE_LAST_HEADING;
            setSingleLanguageText(loseTextEl, CONFIG.LOSE_LAST_LINE);
            btnLoseNext.style.display = 'none';
            btnLoseRestart.style.display = 'inline-block';
        }
    }

    window.addEventListener('gamelose', () => {
        loseStep = 0;
        loseTitle.textContent = "TIME'S UP";
        setSingleLanguageText(loseTextEl, CONFIG.LOSE_DIALOGUE_LINES[0]);
        btnLoseNext.style.display = 'inline-block';
        btnLoseRestart.style.display = 'none';
        loseModal.classList.add('show');
    });

    btnLoseNext.addEventListener('click', () => {
        advanceLoseSequence();
    });

    btnLoseRestart.addEventListener('click', () => {
        loseModal.classList.remove('show');
        game.restartGame();
    });

    // Win Sequence Flow
    let winStep = 0;

    function advanceWinSequence(bestRun) {
        winStep++;
        const lines = CONFIG.WIN_BOX_LINES;

        if (winStep < lines.length) {
            setSingleLanguageText(winTextEl, lines[winStep]);
            btnWinNext.style.display = 'inline-block';
            btnWinRestart.style.display = 'none';
            winPbBox.style.display = 'none';
        } else {
            winTitle.textContent = "REFLECT";
            setSingleLanguageText(winTextEl, CONFIG.WIN_LAST_LINE);

            if (bestRun && bestRun.isNewRecord) {
                pbTimeVal.textContent = formatTime(bestRun.timeTaken);
                pbBombsVal.textContent = bestRun.bombHits;
                winPbBox.style.display = 'block';
            } else {
                winPbBox.style.display = 'none';
            }

            btnWinNext.style.display = 'none';
            btnWinRestart.style.display = 'inline-block';
        }
    }

    window.addEventListener('gamewin', (e) => {
        winStep = 0;
        const { bestRun } = e.detail;
        if (winHeroImg && typeof ASSETS_DATA !== 'undefined') {
            winHeroImg.src = ASSETS_DATA.mysteryOpen;
        }
        winTitle.textContent = "MYSTERY BOX OPENED!";
        setSingleLanguageText(winTextEl, CONFIG.WIN_BOX_LINES[0]);
        btnWinNext.style.display = 'inline-block';
        btnWinRestart.style.display = 'none';
        winPbBox.style.display = 'none';
        winModal.classList.add('show');

        btnWinNext.onclick = () => advanceWinSequence(bestRun);
    });

    btnWinRestart.addEventListener('click', () => {
        winModal.classList.remove('show');
        game.restartGame();
    });

    window.addEventListener('gamerestart', (e) => {
        const { targetHits } = e.detail;
        if (hudHitsVal) hudHitsVal.textContent = 'Hits: 0';
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = `0 / ${targetHits}`;
        if (hudHeartWrap) hudHeartWrap.className = 'hud-side-lives';
        if (hudHeartImg && typeof ASSETS_DATA !== 'undefined') hudHeartImg.src = ASSETS_DATA.healthBarFull || ASSETS_DATA.heartClean;
        if (hudTimerVal) hudTimerVal.textContent = '1:30';
        if (timerPenaltyBadge) timerPenaltyBadge.classList.remove('pulse');

        if (menuModal) menuModal.classList.remove('show');
        cooldownModal.classList.remove('show');
        loseModal.classList.remove('show');
        winModal.classList.remove('show');
        pauseModal.classList.remove('show');

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
