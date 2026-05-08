(function () {
    'use strict';

    // ==================== CONFIGURATION ====================
    const API = {
        ATTRIBUTES: '/api/getSourceAddressAttributes',
        ADDRESS_INFO: '/api/getAddressInfo',
    };
    const MAX_RETRIES = 30;
    const DATA_TIMEOUT_MS = 15000;
    const SCRAPER_POLL_MS = 500;

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

        // Case type info
        caseTypeText: null,
        isLiveCase: false,

        // Timers
        pollId: null,
        dataTimeoutId: null,
        scraperIntervalId: null,
        positionRetryId: null,

        // Listeners cleanup
        abortController: null,

        // DOM references
        floatingDisplay: null,

        // BDP data
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
    .gs-block.dh { border-left: 4px solid #e94560; }
    .gs-block.pdl { border-left: 4px solid #0ead69; }
    .gs-label { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
    .gs-block.dh .gs-label { color: #e94560; }
    .gs-block.pdl .gs-label { color: #0ead69; }
    .gs-entry { padding: 5px 0; }
    .gs-entry-divider { border: none; border-top: 1px solid #333; margin: 6px 0; }
    .gs-val { color: #fff; font-size: 13px; line-height: 1.4; word-wrap: break-word; padding: 4px 6px; background: rgba(255,255,255,0.04); border-radius: 4px; }
    .gs-val.empty { color: #555; font-style: italic; }
    .gs-meta { font-size: 10px; color: #ccc; margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .gs-meta .gs-date { color: #fff; font-weight: 500; }
    .gs-meta .gs-sep { color: #555; }
    .gs-src { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; letter-spacing: 0.3px; }
    .gs-src.customer { background: #e94560; color: #fff; }
    .gs-src.other { background: #607d8b; color: #fff; }
    .gs-translate-btn { background: none; border: 1px solid #00d4ff; color: #00d4ff; cursor: pointer; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: 6px; transition: all 0.2s; }
    .gs-translate-btn:hover { background: #00d4ff; color: #1a1a2e; }
    .gs-loading { text-align: center; color: #00d4ff; padding: 15px; }
    `;

    // ==================== HELPERS ====================
    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }
    function clean(val) { return val ? val.replace(/^"|"\$/g, '').trim() : 'N/A'; }

    function getBDPColor(src) {
        if (!src) return 'rgba(233, 69, 96, 0.9)';
        const upper = src.toUpperCase();
        const found = BDP_COLORS.find((e) => upper.includes(e.match));
        return found ? found.color : 'rgba(96, 125, 139, 0.9)';
    }

    function cleanSourceName(src) {
        if (!src) return { label: 'UNKNOWN', type: 'other' };
        const upper = src.toUpperCase();
        const match = SOURCE_LABELS.find((l) => upper.includes(l));
        if (match) return { label: match, type: match.toLowerCase() };
        const cleaned = src.replace(/^PROPAGATED\.(BUILDING|CAMPUS|CITY|REGION)\./i, '').replace(/_/g, ' ').trim();
        return { label: cleaned || src, type: 'other' };
    }

    function fmtDate(d) {
        if (!d) return '';
        try {
            return new Date(d).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch { return d; }
    }

    function dedup(entries) {
        const seen = new Set();
        return entries.filter((e) => {
            const key = `${e.value || ''}|${e.attributeSrc || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function sortByTimeDesc(a, b) {
        const ta = new Date(a.formattedDateTime || a.timestamp || 0).getTime();
        const tb = new Date(b.formattedDateTime || b.timestamp || 0).getTime();
        return tb - ta;
    }

    function srcBadge(src) {
        const info = cleanSourceName(src);
        return `<span class="gs-src ${info.type}">${info.label}</span>`;
    }

    function parsePDL(val) {
        try {
            const parsed = JSON.parse(val);
            if (parsed.Locations_ && Array.isArray(parsed.Locations_)) {
                return parsed.Locations_.map((loc) => {
                    const place = loc.SafePlaceLocation_ || loc.MailroomLocation_ || loc.NeighborLocation_ || 'Unknown';
                    return '📍 ' + place.replace(/_/g, ' ');
                }).join(', ');
            }
        } catch { /* not JSON */ }
        return clean(val);
    }

    function openBingTranslate(text) {
        const url = `https://www.bing.com/translator/?text=${encodeURIComponent(text)}&from=auto&to=en`;
        window.open(url, 'BingTranslate', 'width=800,height=500,scrollbars=yes,resizable=yes');
    }

    function findByText(selector, text) {
        for (const el of $$(selector)) {
            if (el.textContent?.includes(text)) return el;
        }
        return null;
    }

    function findAncestor(el, predicate, maxDepth = 10) {
        let current = el;
        for (let i = 0; i < maxDepth && current; i++) {
            if (predicate(current)) return current;
            current = current.parentElement;
        }
        return null;
    }

    function collectEntries(attr) {
        if (attr.aidDetails && attr.aidDetails.length > 0) return [...attr.aidDetails];
        if (attr.authoritativeValue) return [attr.authoritativeValue];
        return [];
    }

    // ==================== NETWORK INTERCEPTORS ====================
    function setupInterceptors() {
        if (state.interceptorsSetup) return;
        state.interceptorsSetup = true;

        const origFetch = window.fetch;
        window.fetch = async function (...args) {
            const res = await origFetch.apply(this, args);
            if (!state.active) return res;
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

            if (url.includes(API.ADDRESS_INFO)) {
                res.clone().json().then(handleAddressInfoReceived).catch(() => {});
            } else if (url.includes(API.ATTRIBUTES) && state.waitingForData) {
                res.clone().json().then((data) => {
                    if (data?.attributeSummaryList) handleAttributesDataReceived(data);
                }).catch(() => {});
            }
            return res;
        };

        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._interceptUrl = url;
            return origOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function () {
            const url = this._interceptUrl || '';
            if (state.active && (url.includes(API.ADDRESS_INFO) || url.includes(API.ATTRIBUTES))) {
                this.addEventListener('load', function () {
                    if (!state.active) return;
                    try {
                        const data = JSON.parse(this.responseText);
                        if (url.includes(API.ADDRESS_INFO)) handleAddressInfoReceived(data);
                        else if (url.includes(API.ATTRIBUTES) && state.waitingForData && data?.attributeSummaryList) {
                            handleAttributesDataReceived(data);
                        }
                    } catch { }
                }, { once: true });
            }
            return origSend.apply(this, arguments);
        };
        console.log('[GS Panel] Smart interceptors ready');
    }

    // ==================== DATA HANDLERS ====================
    function handleAddressInfoReceived(data) {
        if (!state.active || !data) return;
        const bdp = data.geospatialData?.bestDeliveryPoint;
        state.bdp.source = bdp?.source || null;
        state.bdp.confidence = bdp?.confidence || null;
        state.bdp.scope = bdp?.scope ?? null;
        state.bdp.tolerance = bdp?.tolerance ?? null;
        state.bdp.received = true;
        if (state.caseTypeDetected) showFloatingDisplay();
    }

    function handleAttributesDataReceived(data) {
        if (!state.active || !state.waitingForData) return;
        state.waitingForData = false;

        if (state.dataTimeoutId) { clearTimeout(state.dataTimeoutId); state.dataTimeoutId = null; }
        if (state.scraperIntervalId) { clearInterval(state.scraperIntervalId); state.scraperIntervalId = null; }

        const dhEntries = [];
        const pdlEntries = [];

        for (const attr of data.attributeSummaryList) {
            if (attr.attributeName === 'DELIVERY_HINT') {
                dhEntries.push(...collectEntries(attr));
            } else if (attr.attributeName === 'PREFERRED_DELIVERY_LOCATIONS') {
                pdlEntries.push(...collectEntries(attr));
            }
        }

        renderPanel(dedup(dhEntries).sort(sortByTimeDesc), dedup(pdlEntries).sort(sortByTimeDesc)[0] || null);
        
        setTimeout(() => {
            closeAttributesAccordion();
            setTimeout(() => openPastDeliveriesAccordion(0), 400);
        }, 300);
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
            renderPanel(dhEntries.sort(sortByTimeDesc), latestPDL);
            setTimeout(() => {
                closeAttributesAccordion();
                setTimeout(() => openPastDeliveriesAccordion(0), 400);
            }, 300);
            return true;
        }
        return false;
    }

    // ==================== UI COMPONENTS ====================
    function createFloatingDisplay() {
        destroyFloatingDisplay();
        const el = document.createElement('div');
        el.id = 'caseTypeDisplay';
        el.style.cssText = `position:fixed; top:10px; left:200px; padding:12px 18px; background-color:rgba(0,0,0,0.8); color:white; z-index:9999; border-radius:8px; max-width:600px; word-wrap:break-word; font-family:"Segoe UI",sans-serif; font-size:14px; font-weight:bold; pointer-events:none; line-height:1.5; display:none; align-items:center; gap:8px;`;
        document.body.appendChild(el);
        state.floatingDisplay = el;
    }

    function destroyFloatingDisplay() {
        state.floatingDisplay?.remove();
        state.floatingDisplay = null;
        $('#caseTypeDisplay')?.remove();
    }

    function showFloatingDisplay() {
        if (!state.active) return;
        if (!state.floatingDisplay) createFloatingDisplay();
        const el = state.floatingDisplay;

        if (state.isLiveCase) {
            el.style.backgroundColor = 'rgba(220, 20, 20, 0.95)';
            el.style.display = 'flex';
            el.innerHTML = `🔴 <span>LIVE CASE: ${state.caseTypeText || 'Unknown'}</span>`;
            return;
        }

        if (!state.bdp.received) return;
        const { source, confidence, scope, tolerance } = state.bdp;
        if (source) {
            el.style.backgroundColor = getBDPColor(source);
            const details = [confidence && `C: ${confidence}`, scope != null && `S: ${scope}`, tolerance != null && `T: ${tolerance}m`].filter(Boolean).join(' | ');
            el.innerHTML = `📍 <span style="display:flex;flex-direction:column;"><span>${source}</span><span style="font-size:10px;opacity:0.85">${details}</span></span>`;
        } else {
            el.style.backgroundColor = 'rgba(233, 69, 96, 0.9)';
            el.innerHTML = '⚠️ No BDP Found';
        }
        el.style.display = 'flex';
    }

    // ==================== CORE LOGIC ====================
    function checkForCaseType() {
        if (!state.active || state.textFound || state.isChecking) return;
        state.isChecking = true;
        const keywords = ['source1', 'casetype'];
        for (const el of $$('.css-wncc9b')) {
            const text = el.textContent?.toLowerCase() || "";
            if (keywords.some(k => text.includes(k))) {
                state.caseTypeText = el.textContent.trim();
                state.textFound = true;
                state.caseTypeDetected = true;
                state.isLiveCase = state.caseTypeText.toLowerCase().includes('live');
                stopPolling();
                showFloatingDisplay();
                setTimeout(clickTargetButton, 100);
                setTimeout(() => clickSharedDeliveryArea(0), 100);
                triggerGSPanel();
                state.isChecking = false;
                return;
            }
        }
        state.isChecking = false;
    }

    function startPolling() { stopPolling(); state.pollId = setInterval(checkForCaseType, 200); }
    function stopPolling() { if (state.pollId) { clearInterval(state.pollId); state.pollId = null; } }

    function clickTargetButton() {
        if (!state.active || state.buttonClicked) return;
        const btn = $('button.css-px7qg4') || $('button[mdn-popover-offset="-4"]');
        if (btn) { btn.click(); state.buttonClicked = true; }
        else setTimeout(clickTargetButton, 100);
    }

    function clickSharedDeliveryArea(retry) {
        if (!state.active || state.sharedDeliveryClicked || retry >= MAX_RETRIES) return;
        const acc = findByText('.MuiAccordion-root', 'Shared Delivery Area');
        if (acc) {
            (acc.querySelector('[role="button"]') || acc).click();
            state.sharedDeliveryClicked = true;
            setTimeout(() => clickEditDetails(0), 100);
        } else setTimeout(() => clickSharedDeliveryArea(retry + 1), 200);
    }

    function clickEditDetails(retry) {
        if (!state.active || state.editDetailsClicked || retry >= MAX_RETRIES) return;
        const btn = findByText('button, span, div', 'Edit Details');
        if (btn) { btn.click(); state.editDetailsClicked = true; }
        else setTimeout(() => clickEditDetails(retry + 1), 200);
    }

    function openAttributesAccordion(retry) {
        if (!state.active) return;
        const acc = findByText('[role="button"]', 'Attributes sources');
        if (!acc) {
            if (retry < MAX_RETRIES) setTimeout(() => openAttributesAccordion(retry + 1), 200);
            return;
        }
        state.waitingForData = true;
        if (acc.getAttribute('aria-expanded') !== 'true') acc.click();
        
        state.scraperIntervalId = setInterval(scrapeAttributesFromDOM, SCRAPER_POLL_MS);
        state.dataTimeoutId = setTimeout(() => {
            if (state.waitingForData) {
                state.waitingForData = false;
                clearInterval(state.scraperIntervalId);
                const body = $('#gs-body');
                if (body) body.innerHTML = '<div class="gs-loading" style="color:red">❌ Timeout — No data.</div>';
            }
        }, DATA_TIMEOUT_MS);
    }

    function closeAttributesAccordion() {
        const acc = findByText('[role="button"]', 'Attributes sources');
        if (acc?.getAttribute('aria-expanded') === 'true') acc.click();
    }

    function openPastDeliveriesAccordion(retry) {
        if (!state.active || retry >= MAX_RETRIES) return;
        const acc = findByText('[role="button"]', 'Past deliveries');
        if (acc) { if (acc.getAttribute('aria-expanded') !== 'true') acc.click(); }
        else setTimeout(() => openPastDeliveriesAccordion(retry + 1), 200);
    }

    function renderPanel(dhEntries, latestPDL) {
        const body = $('#gs-body');
        if (!body || !state.active) return;

        let html = `<div class="gs-block dh"><div class="gs-label">🔴 Delivery Hints (${dhEntries.length})</div>`;
        if (dhEntries.length) {
            dhEntries.forEach((e, i) => {
                html += `${i > 0 ? '<hr class="gs-entry-divider">' : ''}<div class="gs-entry"><div class="gs-val">${clean(e.value)}</div><div class="gs-meta">${srcBadge(e.attributeSrc)} | ${fmtDate(e.formattedDateTime)} <button class="gs-translate-btn" onclick="window.open('https://www.bing.com/translator/?text=${encodeURIComponent(e.value)}&to=en')">🌐</button></div></div>`;
            });
        } else html += '<div class="gs-val empty">No hints</div>';
        html += `</div><div class="gs-block pdl"><div class="gs-label">🟢 PDL</div>`;
        if (latestPDL) {
            html += `<div class="gs-entry"><div class="gs-val">${parsePDL(latestPDL.value)}</div><div class="gs-meta">${srcBadge(latestPDL.attributeSrc)}</div></div>`;
        } else html += '<div class="gs-val empty">None</div>';
        html += '</div>';

        body.innerHTML = html;
        const p = $('#gs-panel');
        if (p) { p.style.display = 'block'; setInitialPosition(); }
    }

    function setInitialPosition() {
        if (state.userDragged) return;
        const panel = $('#gs-panel');
        const anchor = $('[class*="jPF-XYLaPtejuJ7hQXRjog"]') || $('.css-bbz95s');
        if (anchor && panel) {
            const rect = anchor.getBoundingClientRect();
            panel.style.left = Math.max(5, rect.left - (panel.offsetWidth || 380) - 10) + 'px';
            panel.style.top = '5%';
        }
    }

    function createPanel() {
        $('#gs-panel')?.remove();
        const style = document.createElement('style');
        style.textContent = PANEL_CSS;
        document.head.appendChild(style);
        const p = document.createElement('div');
        p.id = 'gs-panel';
        p.innerHTML = `<div id="gs-header"><span class="title">📦 DH & PDL</span><button id="gs-min">—</button></div><div id="gs-body"><div class="gs-loading">⏳ Loading...</div></div>`;
        document.body.appendChild(p);
        p.querySelector('#gs-min').onclick = () => p.classList.toggle('minimized');
        state.gsPanelCreated = true;
        setupDrag(p);
    }

    function setupDrag(panel) {
        const header = panel.querySelector('#gs-header');
        let dragging = false, startX, startY, startLeft, startTop;
        header.onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON') return;
            dragging = true;
            startX = e.clientX; startY = e.clientY;
            startLeft = panel.offsetLeft; startTop = panel.offsetTop;
            e.preventDefault();
        };
        document.onmousemove = (e) => {
            if (!dragging) return;
            state.userDragged = true;
            panel.style.left = (startLeft + e.clientX - startX) + 'px';
            panel.style.top = (startTop + e.clientY - startY) + 'px';
        };
        document.onmouseup = () => dragging = false;
    }

    function triggerGSPanel() { if (state.active) { createPanel(); openAttributesAccordion(0); } }

    function fullCleanup() {
        state.active = false;
        stopPolling();
        clearInterval(state.scraperIntervalId);
        clearTimeout(state.dataTimeoutId);
        state.abortController?.abort();
        $('#gs-panel')?.remove();
        destroyFloatingDisplay();
        // Reset state
        state.textFound = false; state.waitingForData = false;
        state.buttonClicked = false; state.sharedDeliveryClicked = false;
        state.editDetailsClicked = false; state.gsPanelCreated = false;
        state.userDragged = false; state.bdp.received = false;
        setTimeout(startFresh, 500);
    }

    function startFresh() {
        console.log('[GS Panel] Ready');
        state.abortController = new AbortController();
        state.active = true;
        startPolling();
    }

    function initialize() {
        setupInterceptors();
        startFresh();
        document.addEventListener('click', (e) => {
            if (e.target?.id === 'submit-btn') fullCleanup();
        }, true);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
