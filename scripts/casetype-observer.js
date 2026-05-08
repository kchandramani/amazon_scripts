(function () {
    'use strict';

    // ==================== CONFIGURATION ====================
    const API = {
        ATTRIBUTES: '/api/getSourceAddressAttributes',
        ADDRESS_INFO: '/api/getAddressInfo',
    };
    const MAX_RETRIES = 30;
    const DATA_TIMEOUT_MS = 15000;
    const SCRAPER_POLL_MS = 500; // Poll DOM every 500ms for data

    // ==================== STATE ====================
    const state = {
        active: false,
        textFound: false,
        isChecking: false,
        buttonClicked: false,
        sharedDeliveryClicked: false,
        editDetailsClicked: false,
        gsPanelCreated: false,
        userDragged: false,
        waitingForData: false,
        interceptorsSetup: false,
        caseTypeDetected: false,
        caseTypeText: null,
        isLiveCase: false,
        pollId: null,
        dataTimeoutId: null,
        scraperIntervalId: null,
        positionRetryId: null,
        abortController: null,
        floatingDisplay: null,
        bdp: {
            source: null,
            confidence: null,
            scope: null,
            tolerance: null,
            received: false,
        },
    };

    // ==================== COLOR / LABEL MAPS ====================
    const BDP_COLORS = [
        { match: 'PBG',         color: 'rgba(233, 69, 96, 0.9)'  },
        { match: 'MANUAL',      color: 'rgba(14, 173, 105, 0.9)'  },
        { match: 'AID_MANUAL',  color: 'rgba(14, 173, 105, 0.9)'  },
        { match: 'LIVE',        color: 'rgba(33, 150, 243, 0.9)'  },
        { match: 'GLS_ST_DIST', color: 'rgba(33, 150, 243, 0.9)'  },
        { match: 'NESO',        color: 'rgba(123, 104, 238, 0.9)' },
        { match: 'SCAN',        color: 'rgba(0, 188, 212, 0.9)'   },
        { match: 'GPS',         color: 'rgba(0, 188, 212, 0.9)'   },
        { match: 'LEARNABLE',   color: 'rgba(0, 188, 212, 0.9)'   },
    ];

    const SOURCE_LABELS = [
        'CUSTOMER', 'LLM', 'AMZL', 'POSTAL', 'CAIMS',
        'DERIVED', 'REGRID', 'RTS', 'SDS', 'TRANSPORTER',
    ];

    // ==================== CSS ====================
    const PANEL_CSS = `
    #gs-panel { position: fixed; width: 380px; max-height: 80vh; background: #1a1a2e; color: #e0e0e0; border: 2px solid #00d4ff; border-radius: 10px; z-index: 999999; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; box-shadow: 0 6px 24px rgba(0, 212, 255, 0.25); overflow: hidden; transition: border-color 0.5s; }
    #gs-panel.minimized #gs-body { display: none; }
    #gs-panel.minimized { width: 200px; }
    #gs-header { background: #0f3460; padding: 8px 12px; cursor: grab; display: flex; justify-content: space-between; align-items: center; user-select: none; border-bottom: 1px solid #00d4ff; }
    #gs-header:active { cursor: grabbing; }
    #gs-header .title { font-weight: 700; font-size: 13px; color: #00d4ff; }
    #gs-header button { background: none; border: 1px solid #00d4ff; color: #00d4ff; cursor: pointer; padding: 1px 7px; border-radius: 3px; font-size: 11px; margin-left: 4px; }
    #gs-header button:hover { background: #00d4ff; color: #1a1a2e; }
    #gs-body { padding: 10px; overflow-y: auto; max-height: calc(80vh - 45px); }
    .gs-block { margin-bottom: 10px; background: #16213e; border-radius: 6px; padding: 8px 10px; }
    .gs-block.dh  { border-left: 4px solid #e94560; }
    .gs-block.pdl { border-left: 4px solid #0ead69; }
    .gs-label { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
    .gs-block.dh .gs-label { color: #e94560; }
    .gs-block.pdl .gs-label { color: #0ead69; }
    .gs-entry { padding: 5px 0; }
    .gs-entry-divider { border: none; border-top: 1px solid #333; margin: 6px 0; }
    .gs-val { color: #fff; font-size: 13px; line-height: 1.4; word-wrap: break-word; padding: 4px 6px; background: rgba(255,255,255,0.04); border-radius: 4px; }
    .gs-meta { font-size: 10px; color: #ccc; margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .gs-src { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; }
    .gs-src.customer { background: #e94560; color: #fff; }
    .gs-src.other { background: #607d8b; color: #fff; }
    .gs-translate-btn { background: none; border: 1px solid #00d4ff; color: #00d4ff; cursor: pointer; padding: 1px 6px; border-radius: 3px; font-size: 10px; }
    .gs-loading { text-align: center; color: #00d4ff; padding: 15px; }
    `;

    // ==================== HELPERS ====================
    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }
    function clean(val) { return val ? val.replace(/^"|"\$/g, '').trim() : 'N/A'; }

    function getBDPColor(src) {
        if (!src) return 'rgba(233, 69, 96, 0.9)';
        const found = BDP_COLORS.find((e) => src.toUpperCase().includes(e.match));
        return found ? found.color : 'rgba(96, 125, 139, 0.9)';
    }

    function cleanSourceName(src) {
        if (!src) return { label: 'UNKNOWN', type: 'other' };
        const upper = src.toUpperCase();
        const match = SOURCE_LABELS.find((l) => upper.includes(l));
        if (match) return { label: match, type: match.toLowerCase() };
        return { label: src.replace(/_/g, ' ').trim(), type: 'other' };
    }

    function findByText(selector, text) {
        for (const el of $$(selector)) {
            if (el.textContent?.trim().includes(text)) return el;
        }
        return null;
    }

    function fmtDate(d) {
        if (!d) return '';
        try {
            const date = new Date(d);
            return isNaN(date) ? d : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return d; }
    }

    // ==================== DATA LOGIC ====================

    function handleAddressInfoReceived(data) {
        if (!state.active || !data) return;
        const bdp = data.geospatialData?.bestDeliveryPoint;
        state.bdp = { source: bdp?.source || null, confidence: bdp?.confidence || null, scope: bdp?.scope ?? null, tolerance: bdp?.tolerance ?? null, received: true };
        if (state.caseTypeDetected) showFloatingDisplay();
    }

    function handleAttributesDataReceived(data) {
        if (!state.active || !state.waitingForData) return;
        state.waitingForData = false;
        
        if (state.dataTimeoutId) { clearTimeout(state.dataTimeoutId); state.dataTimeoutId = null; }
        if (state.scraperIntervalId) { clearInterval(state.scraperIntervalId); state.scraperIntervalId = null; }

        const dhEntries = [], pdlEntries = [];
        data.attributeSummaryList.forEach(attr => {
            const vals = attr.aidDetails?.length > 0 ? [...attr.aidDetails] : (attr.authoritativeValue ? [attr.authoritativeValue] : []);
            if (attr.attributeName === 'DELIVERY_HINT') dhEntries.push(...vals);
            else if (attr.attributeName === 'PREFERRED_DELIVERY_LOCATIONS') pdlEntries.push(...vals);
        });

        renderPanel(dhEntries, pdlEntries[0] || null);
        finalizeAccordions();
    }

    function scrapeAttributesFromDOM() {
        if (!state.active || !state.waitingForData) return false;
        const blocks = $$('.css-s8qwt0');
        if (blocks.length === 0) return false;

        const dhEntries = [];
        let latestPDL = null;

        blocks.forEach(block => {
            const title = block.querySelector('b')?.textContent.toUpperCase() || "";
            const valueEl = block.querySelector('.css-1fslquw');
            const metaEls = block.querySelectorAll('.css-oz22nj');
            
            let src = "UNKNOWN", time = null;
            metaEls.forEach(el => {
                const txt = el.textContent.trim();
                if (txt.match(/^\d{4}/)) time = txt;
                else if (txt !== "Authoritative") src = txt;
            });

            if (valueEl) {
                const entry = { value: valueEl.textContent.trim(), attributeSrc: src, formattedDateTime: time };
                if (title.includes('DELIVERY_HINT')) dhEntries.push(entry);
                else if (title.includes('PREFERRED DELIVERY LOCATIONS')) latestPDL = latestPDL || entry;
            }
        });

        if (dhEntries.length > 0 || latestPDL) {
            state.waitingForData = false;
            clearInterval(state.scraperIntervalId);
            clearTimeout(state.dataTimeoutId);
            renderPanel(dhEntries, latestPDL);
            finalizeAccordions();
            return true;
        }
        return false;
    }

    function finalizeAccordions() {
        setTimeout(() => {
            const acc = findByText('[role="button"]', 'Attributes sources');
            if (acc?.getAttribute('aria-expanded') === 'true') acc.click();
            setTimeout(() => {
                const past = findByText('[role="button"]', 'Past deliveries');
                if (past && past.getAttribute('aria-expanded') !== 'true') past.click();
            }, 400);
        }, 300);
    }

    // ==================== INTERCEPTORS ====================
    function setupInterceptors() {
        if (state.interceptorsSetup) return;
        state.interceptorsSetup = true;

        const target = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

        const origFetch = target.fetch;
        target.fetch = async function (...args) {
            const res = await origFetch.apply(this, args);
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            if (url.includes(API.ADDRESS_INFO)) res.clone().json().then(handleAddressInfoReceived).catch(() => {});
            if (url.includes(API.ATTRIBUTES) && state.waitingForData) res.clone().json().then(handleAttributesDataReceived).catch(() => {});
            return res;
        };

        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (m, url) { this._url = url; return origOpen.apply(this, arguments); };
        XMLHttpRequest.prototype.send = function () {
            if (this._url.includes(API.ADDRESS_INFO) || this._url.includes(API.ATTRIBUTES)) {
                this.addEventListener('load', function () {
                    try {
                        const d = JSON.parse(this.responseText);
                        if (this._url.includes(API.ADDRESS_INFO)) handleAddressInfoReceived(d);
                        else if (state.waitingForData) handleAttributesDataReceived(d);
                    } catch {}
                });
            }
            return origSend.apply(this, arguments);
        };
    }

    // ==================== UI & RENDER ====================
    function showFloatingDisplay() {
        if (!state.active) return;
        if (!state.floatingDisplay) {
            const el = document.createElement('div');
            el.id = 'caseTypeDisplay';
            el.style.cssText = `position:fixed; top:10px; left:200px; padding:12px 18px; color:white; z-index:9999; border-radius:8px; font-family:sans-serif; font-weight:bold; display:none; align-items:center; gap:8px;`;
            document.body.appendChild(el);
            state.floatingDisplay = el;
        }
        const el = state.floatingDisplay;
        if (state.isLiveCase) {
            el.style.backgroundColor = 'rgba(220, 20, 20, 0.95)';
            el.innerHTML = `🔴 LIVE CASE | ${state.caseTypeText}`;
        } else if (state.bdp.received) {
            el.style.backgroundColor = getBDPColor(state.bdp.source);
            el.innerHTML = `📍 ${state.bdp.source || 'No BDP'}`;
        }
        el.style.display = 'flex';
    }

    function renderPanel(dh, pdl) {
        if (!state.active || !$('#gs-body')) return;
        let html = `<div class="gs-block dh"><div class="gs-label">🔴 Delivery Hints (${dh.length})</div>`;
        if (dh.length) {
            dh.forEach((e, i) => {
                const val = clean(e.value);
                html += `${i>0?'<hr class="gs-entry-divider">':''}<div class="gs-entry"><div class="gs-val">${val}</div><div class="gs-meta"><span class="gs-src other">${e.attributeSrc}</span> | ${fmtDate(e.formattedDateTime)} <button class="gs-translate-btn" onclick="window.open('https://www.bing.com/translator/?text=${encodeURIComponent(val)}&to=en')">🌐</button></div></div>`;
            });
        } else html += '<div class="gs-val">None</div>';
        html += `</div><div class="gs-block pdl"><div class="gs-label">🟢 PDL</div>`;
        if (pdl) html += `<div class="gs-entry"><div class="gs-val">${pdl.value}</div><div class="gs-meta">${pdl.attributeSrc}</div></div>`;
        else html += '<div class="gs-val">None</div>';
        html += '</div>';
        $('#gs-body').innerHTML = html;
        $('#gs-panel').style.display = 'block';
    }

    // ==================== AUTOMATION ====================
    function checkForCaseType() {
        if (!state.active || state.textFound) return;
        const els = $$('.css-wncc9b');
        for (const el of els) {
            const txt = el.textContent || "";
            if (txt.toLowerCase().includes('source1') || txt.toLowerCase().includes('casetype')) {
                state.caseTypeText = txt.trim();
                state.textFound = true;
                state.caseTypeDetected = true;
                state.isLiveCase = txt.toLowerCase().includes('live');
                showFloatingDisplay();
                triggerWorkflow();
                return;
            }
        }
    }

    function triggerWorkflow() {
        // Clicks target button
        const btn = $('button.css-px7qg4') || $('button[mdn-popover-offset="-4"]');
        if (btn) btn.click();

        // Open Shared Area
        const run = (retry) => {
            if (retry > 20) return;
            const acc = findByText('.MuiAccordion-root', 'Shared Delivery Area');
            if (acc) {
                acc.querySelector('[role="button"]')?.click();
                setTimeout(() => findByText('button, span', 'Edit Details')?.click(), 300);
                setTimeout(openAttributes, 600);
            } else setTimeout(() => run(retry + 1), 300);
        };
        run(0);
    }

    function openAttributes() {
        if (!$('#gs-panel')) {
            const s = document.createElement('style'); s.textContent = PANEL_CSS; document.head.appendChild(s);
            const p = document.createElement('div'); p.id = 'gs-panel';
            p.innerHTML = `<div id="gs-header"><span class="title">📦 DH & PDL</span><button onclick="this.closest('#gs-panel').classList.toggle('minimized')">—</button></div><div id="gs-body"><div class="gs-loading">⏳ Loading...</div></div>`;
            document.body.appendChild(p);
            p.style.top = "10%"; p.style.right = "10px";
        }
        
        const acc = findByText('[role="button"]', 'Attributes sources');
        if (acc) {
            state.waitingForData = true;
            if (acc.getAttribute('aria-expanded') !== 'true') acc.click();
            
            state.scraperIntervalId = setInterval(scrapeAttributesFromDOM, SCRAPER_POLL_MS);
            state.dataTimeoutId = setTimeout(() => {
                if (state.waitingForData) {
                    state.waitingForData = false;
                    clearInterval(state.scraperIntervalId);
                    if ($('#gs-body')) $('#gs-body').innerHTML = '<div class="gs-loading" style="color:red">❌ Timeout</div>';
                }
            }, DATA_TIMEOUT_MS);
        }
    }

    // ==================== INITIALIZATION ENGINE ====================
    function fullCleanup() {
        state.active = false;
        clearInterval(state.pollId);
        clearInterval(state.scraperIntervalId);
        clearTimeout(state.dataTimeoutId);
        $('#gs-panel')?.remove();
        state.floatingDisplay?.remove();
        state.textFound = false;
        state.waitingForData = false;
        setTimeout(startFresh, 1000);
    }

    function startFresh() {
        state.active = true;
        state.pollId = setInterval(checkForCaseType, 500);
        // Catch-up check in case page is already loaded
        checkForCaseType();
    }

    function init() {
        console.log('[GS Panel] Centralized Script Initializing...');
        setupInterceptors();
        startFresh();
        document.addEventListener('click', (e) => { if (e.target?.id === 'submit-btn') fullCleanup(); }, true);
    }

    // Robust Loader: Handles local, GitHub, and different readyStates
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        window.addEventListener('load', init);
    }

})();
