(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    //  📋 CONFIGURATION & STATE
    // ═══════════════════════════════════════════════════════

    const IS_TEMPLATES_FRAME = window.location.href.includes('templates.geostudio.last-mile.amazon.dev');
    const IS_GEOEDITOR_FRAME = window.location.href.includes('geoeditor.app.amazon.dev');

    const TIMER_MISSING_THRESHOLD = 5;
    const TIMER_PATTERN = /^\d{1,2}:\d{2}$/;
    const RESET_COOLDOWN = 1000;
    const DEBUG = true;

    let caseExpiryTriggered = false;
    let autoSubmitEnabled = false;
    let autoSubmittedThisTask = false;

    let cachedVoice = null;
    let cachedTimerEl = null;
    let cachedTimerElValid = false;
    let domObserver = null;

    let timerMissingCount = 0;
    let staleCleanupDone = false;
    let resetThisLoop = false;
    let lastResetTime = 0;

    let toastTimeout = null;

    // ═══════════════════════════════════════════════════════
    //  🌐 CROSS-FRAME COMMUNICATION (postMessage)
    // ═══════════════════════════════════════════════════════

    function broadcastStateChange(type, data = {}) {
        const payload = { source: 'TM_CASE_MONITOR', type, ...data };
        window.postMessage(payload, '*');
        if (window.top && window.top !== window) {
            window.top.postMessage(payload, '*');
        }
        for (let i = 0; i < window.frames.length; i++) {
            window.frames[i].postMessage(payload, '*');
        }
    }

    window.addEventListener('message', (event) => {
        if (!event.data || event.data.source !== 'TM_CASE_MONITOR') return;

        // Sync toggle state across frames
        if (event.data.type === 'TOGGLE_AUTO_SUBMIT') {
            autoSubmitEnabled = event.data.enabled;
            if (event.data.showToast) {
                showToastNotification(autoSubmitEnabled);
            }
            if (autoSubmitEnabled) {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            }
            debug('auto', `Synced Auto-Submit state: ${autoSubmitEnabled ? 'ON' : 'OFF'}`);
        }

        // Action command to trigger submit on the templates frame
        if (event.data.type === 'TRIGGER_SUBMIT' && IS_TEMPLATES_FRAME) {
            attemptAutoSubmit();
        }

        // Sync reset across frames
        if (event.data.type === 'FULL_RESET') {
            fullReset(`Frame sync reset (${event.data.reason})`, false);
        }
    });

    // ═══════════════════════════════════════════════════════
    //  🐛 DEBUG
    // ═══════════════════════════════════════════════════════

    function debug(category, message, data) {
        if (!DEBUG) return;
        const frameLabel = IS_TEMPLATES_FRAME ? '[Templates]' : (IS_GEOEDITOR_FRAME ? '[GeoEditor]' : '[Main]');
        const prefix = {
            'expiry': `[Expiry 🔊]${frameLabel}`,
            'reset': `[Reset 🔄]${frameLabel}`,
            'loop': `[Loop ⏱️]${frameLabel}`,
            'auto': `[AutoSubmit 🚀]${frameLabel}`
        }[category] || `[Monitor]${frameLabel}`;

        if (data !== undefined) console.log(`${prefix} ${message}`, data);
        else console.log(`${prefix} ${message}`);
    }

    // ═══════════════════════════════════════════════════════
    //  🧹 CLEANUP & RESET
    // ═══════════════════════════════════════════════════════

    function fullReset(reason, shouldBroadcast = true) {
        const now = Date.now();
        if (now - lastResetTime < RESET_COOLDOWN) return false;
        if (resetThisLoop) return false;

        debug('reset', `🔄 FULL RESET — ${reason}`);
        lastResetTime = now;

        caseExpiryTriggered = false;
        autoSubmittedThisTask = false;
        timerMissingCount = 0;
        staleCleanupDone = false;

        cachedVoice = null;
        cachedTimerEl = null;
        cachedTimerElValid = false;

        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        resetThisLoop = true;

        if (shouldBroadcast) {
            broadcastStateChange('FULL_RESET', { reason });
        }
        return true;
    }

    function staleCleanup() {
        if (staleCleanupDone) return;
        staleCleanupDone = true;
        debug('reset', '🗑️ Timer disappeared — stale cleanup');

        caseExpiryTriggered = false;
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        cachedTimerEl = null;
        cachedTimerElValid = false;
    }

    function pageCleanup() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (domObserver) domObserver.disconnect();
        cachedVoice = null;
        cachedTimerEl = null;
        cachedTimerElValid = false;
    }

    // ═══════════════════════════════════════════════════════
    //  🎨 STYLES (Bottom-Right Toast)
    // ═══════════════════════════════════════════════════════

    GM_addStyle(`
        #tm-toast-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 2147483647;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .tm-status-toast {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            opacity: 0;
            transform: translateY(12px) scale(0.96);
        }
        .tm-status-toast.tm-toast-show {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        .tm-status-toast.tm-toast-on {
            background: #00000000;
            border-left: 5px solid #00000000;
        }
        .tm-status-toast.tm-toast-on .tm-toast-dot {
            background: #00000000;
            box-shadow: 0 0 10px #00000000;
        }
        .tm-status-toast.tm-toast-off {
            background: #00000000;
            border-left: 5px solid #00000000;
        }
        .tm-status-toast.tm-toast-off .tm-toast-dot {
            background: #00000000;
            box-shadow: 0 0 10px #00000000;
        }
        .tm-toast-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }
    `);

    // ═══════════════════════════════════════════════════════
    //  🍞 TOAST NOTIFICATION UI
    // ═══════════════════════════════════════════════════════

    function showToastNotification(enabled) {
        let container = document.getElementById('tm-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'tm-toast-container';
            document.body.appendChild(container);
        }

        container.innerHTML = `
            <div class="tm-status-toast ${enabled ? 'tm-toast-on' : 'tm-toast-off'}">
                <span>ROBO: ${enabled ? 'ON' : 'OFF'}</span>
            </div>
        `;

        const toast = container.querySelector('.tm-status-toast');
        requestAnimationFrame(() => {
            toast.classList.add('tm-toast-show');
        });

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            if (toast) {
                toast.classList.remove('tm-toast-show');
                setTimeout(() => {
                    if (container && container.contains(toast)) toast.remove();
                }, 250);
            }
        }, 1800);
    }

    // ═══════════════════════════════════════════════════════
    //  ⌨️ KEYBOARD SHORTCUT (TOGGLE ON '0')
    // ═══════════════════════════════════════════════════════

    window.addEventListener('keydown', (e) => {
        // Ignore key if typed into inputs, text areas, or editable surfaces
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
            return;
        }

        if (e.key === '0') {
            e.preventDefault();
            autoSubmitEnabled = !autoSubmitEnabled;

            showToastNotification(autoSubmitEnabled);

            if (autoSubmitEnabled) {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            }

            broadcastStateChange('TOGGLE_AUTO_SUBMIT', {
                enabled: autoSubmitEnabled,
                showToast: true
            });

            debug('auto', `Auto-Submit toggled via '0': ${autoSubmitEnabled ? 'ON' : 'OFF'}`);
        }
    });

    // ═══════════════════════════════════════════════════════
    //  ⏱️ TIMER PARSING & DOM SEARCH (GeoEditor Frame)
    // ═══════════════════════════════════════════════════════

    function findTimerElement() {
        const timerIcons = document.querySelectorAll('svg[data-testid="TimerOutlinedIcon"]');
        for (const icon of timerIcons) {
            const parent = icon.parentElement;
            if (parent) {
                const pTag = parent.querySelector('p');
                if (pTag && TIMER_PATTERN.test(pTag.textContent.trim())) {
                    return pTag;
                }
            }
        }

        const allP = document.querySelectorAll('p');
        for (const p of allP) {
            if (TIMER_PATTERN.test(p.textContent.trim())) {
                return p;
            }
        }
        return null;
    }

    function getTimerElement() {
        if (cachedTimerElValid && cachedTimerEl && cachedTimerEl.isConnected) {
            if (TIMER_PATTERN.test(cachedTimerEl.textContent.trim())) {
                return cachedTimerEl;
            }
            cachedTimerElValid = false;
        }

        cachedTimerEl = findTimerElement();
        cachedTimerElValid = !!cachedTimerEl;
        return cachedTimerEl;
    }

    function parseTimerValue(timerText) {
        const parts = timerText.trim().split(':');
        if (parts.length === 2) {
            const mins = parseInt(parts[0], 10);
            const secs = parseInt(parts[1], 10);
            if (!isNaN(mins) && !isNaN(secs)) {
                return mins * 60 + secs;
            }
        }
        return 0;
    }

    // ═══════════════════════════════════════════════════════
    //  🔘 SUBMIT ACTION (Templates Frame)
    // ═══════════════════════════════════════════════════════

    function attemptAutoSubmit() {
        if (autoSubmittedThisTask) return;

        const buttons = document.querySelectorAll('button:not([disabled])');
        for (const btn of buttons) {
            const text = btn.textContent.trim().toLowerCase();
            if (text === 'submit and claim task' || text === 'Submit and Claim Task') {
                debug('auto', `⚡ Enabled submit button ("${btn.textContent.trim()}") clicked!`);
                btn.click();
                autoSubmittedThisTask = true;
                break;
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    //  🔊 VOICE ANNOUNCEMENT
    // ═══════════════════════════════════════════════════════

    function getPreferredVoice() {
        if (cachedVoice) return cachedVoice;
        const voices = window.speechSynthesis.getVoices();
        cachedVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Female')) ||
                      voices.find(v => v.lang.startsWith('en')) || null;
        return cachedVoice;
    }

    function speakMessage(seconds) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(`Your case will expire in ${seconds} seconds.`);
        msg.rate = 1;
        msg.pitch = 1;
        msg.volume = 1;
        msg.lang = 'en-US';
        const voice = getPreferredVoice();
        if (voice) msg.voice = voice;
        window.speechSynthesis.speak(msg);
    }

    // ═══════════════════════════════════════════════════════
    //  🔔 EXPIRY & AUTO-SUBMIT LOGIC
    // ═══════════════════════════════════════════════════════

    function checkCaseExpiry(remainingSeconds) {
        if (resetThisLoop) return;

        // Auto-reset state when timer goes back above 10 minutes (600s)
        if (remainingSeconds >= 600) {
            if (autoSubmitEnabled) {
                autoSubmitEnabled = false;
                showToastNotification(false);
                broadcastStateChange('TOGGLE_AUTO_SUBMIT', { enabled: false, showToast: true });
                debug('auto', '🔄 Timer above 10 min — Auto-Submit reset to OFF.');
            }
            if (caseExpiryTriggered || autoSubmittedThisTask) {
                fullReset('Timer reset above 10 minutes');
                return;
            }
        }

        // Auto Submit Mode
        if (autoSubmitEnabled) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();

            if (remainingSeconds < 63) {
                if (IS_TEMPLATES_FRAME) {
                    attemptAutoSubmit();
                } else {
                    broadcastStateChange('TRIGGER_SUBMIT');
                }
            }
            return;
        }

        // Normal Expiry Audio Warning (10s – 59s)
        const inRange = remainingSeconds <= 59 && remainingSeconds >= 10;
        const aboveRange = remainingSeconds > 59;

        if (inRange && !caseExpiryTriggered) {
            caseExpiryTriggered = true;
            speakMessage(remainingSeconds);
            debug('expiry', `⚠️ SPEECH TRIGGERED at ${remainingSeconds}s`);
        }

        if (aboveRange && caseExpiryTriggered) {
            fullReset('Case Expiry — Timer above 59s');
        }
    }

    // ═══════════════════════════════════════════════════════
    //  👁️ OBSERVER & MAIN LOOP
    // ═══════════════════════════════════════════════════════

    function setupMutationObserver() {
        domObserver = new MutationObserver(() => {
            cachedTimerElValid = false;
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
    }

    function mainLoop() {
        resetThisLoop = false;

        // Timer reading only runs where the timer lives (GeoEditor frame)
        if (!IS_GEOEDITOR_FRAME && !findTimerElement()) return;

        const timerEl = getTimerElement();

        if (!timerEl) {
            timerMissingCount++;
            if (timerMissingCount >= TIMER_MISSING_THRESHOLD && !staleCleanupDone) {
                staleCleanup();
            }
            return;
        }

        if (timerMissingCount > 0) {
            debug('loop', `✓ Timer back after ${timerMissingCount} misses`);
            timerMissingCount = 0;
            if (staleCleanupDone) {
                fullReset('Timer re-appeared');
                staleCleanupDone = false;
                return;
            }
        }

        const remainingSeconds = parseTimerValue(timerEl.textContent);
        checkCaseExpiry(remainingSeconds);
    }

    // ═══════════════════════════════════════════════════════
    //  🚀 INITIALIZATION
    // ═══════════════════════════════════════════════════════

    setupMutationObserver();
    setInterval(mainLoop, 1000);
    window.addEventListener('beforeunload', pageCleanup);

    debug('loop', '🚀 Case Expiry & Auto-Submit Monitor Initialized (Stealth Key 0 Toggle)');
})();
