(function () {
'use strict';

// ==================== CONFIGURATION ====================
const API = {
    ATTRIBUTES: '/api/getSourceAddressAttributes',
    ADDRESS_INFO: '/api/getAddressInfo',
};
const MAX_RETRIES = 30;
const DATA_TIMEOUT_MS = 15000;
const SCRAPER_WAIT_MS = 2000; // Wait 2s for network, then scrape DOM

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

    const cleaned = src
        .replace(/^PROPAGATED\.(BUILDING|CAMPUS|CITY|REGION)\./i, '')
        .replace(/_/g, ' ')
        .trim();
    return { label: cleaned || src, type: 'other' };
}

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
.gs-val.empty { color: #555; font-style: italic; }
.gs-meta { font-size: 10px; color: #ccc; margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.gs-meta .gs-date { color: #fff; font-weight: 500; }
.gs-meta .gs-sep  { color: #555; }
.gs-src { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; letter-spacing: 0.3px; }
.gs-src.customer    { background: #e94560; color: #fff; }
.gs-src.llm         { background: #7b68ee; color: #fff; }
.gs-src.amzl        { background: #f5a623; color: #1a1a2e; }
.gs-src.postal      { background: #2196f3; color: #fff; }
.gs-src.caims       { background: #00bcd4; color: #1a1a2e; }
.gs-src.derived     { background: #78909c; color: #fff; }
.gs-src.regrid      { background: #26a69a; color: #fff; }
.gs-src.rts         { background: #ff7043; color: #fff; }
.gs-src.sds         { background: #ab47bc; color: #fff; }
.gs-src.transporter { background: #5c6bc0; color: #fff; }
.gs-src.other       { background: #607d8b; color: #fff; }
.gs-entry-num { font-size: 10px; color: #00d4ff; font-weight: 600; margin-bottom: 3px; }
.gs-latest-badge { display: inline-block; background: #e94560; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px; margin-left: 5px; letter-spacing: 0.5px; }
.gs-translate-btn { background: none; border: 1px solid #00d4ff; color: #00d4ff; cursor: pointer; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; margin-left: 6px; transition: all 0.2s; }
.gs-translate-btn:hover { background: #00d4ff; color: #1a1a2e; }
.gs-loading { text-align: center; color: #00d4ff; padding: 15px; }
`;

// ==================== HELPERS ====================
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function clean(val) { return val ? val.replace(/^"|"\$/g, '').trim() : 'N/A'; }

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
        const parsed = (typeof val === 'string') ? JSON.parse(val) : val;
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

// ==================== DATA HANDLERS ====================

function handleAddressInfoReceived(data) {
    if (!state.active || !data) return;
    const bdp = data.geospatialData?.bestDeliveryPoint;
    state.bdp.source     = bdp?.source || null;
    state.bdp.confidence = bdp?.confidence || null;
    state.bdp.scope      = bdp?.scope ?? null;
    state.bdp.tolerance  = bdp?.tolerance ?? null;
    state.bdp.received   = true;
    if (state.caseTypeDetected) showFloatingDisplay();
}

function handleAttributesDataReceived(data) {
    if (!state.active || !state.waitingForData) return;
    state.waitingForData = false;
    if (state.dataTimeoutId) { clearTimeout(state.dataTimeoutId); state.dataTimeoutId = null; }

    const dhEntries  = [];
    const pdlEntries = [];

    for (const attr of data.attributeSummaryList) {
        const collect = (a) => (a.aidDetails?.length > 0 ? [...a.aidDetails] : (a.authoritativeValue ? [a.authoritativeValue] : []));
        if (attr.attributeName === 'DELIVERY_HINT') {
            dhEntries.push(...collect(attr));
        } else if (attr.attributeName === 'PREFERRED_DELIVERY_LOCATIONS') {
            pdlEntries.push(...collect(attr));
        }
    }

    const dh  = dedup(dhEntries).sort(sortByTimeDesc);
    const pdl = dedup(pdlEntries).sort(sortByTimeDesc);
    renderPanel(dh, pdl[0] || null);
    
    setTimeout(() => {
        closeAttributesAccordion();
        setTimeout(() => openPastDeliveriesAccordion(0), 400);
    }, 300);
}

/**
 * FE REGION FALLBACK: Scrapes the DOM if network interceptor misses the data
 */
function scrapeAttributesFromDOM() {
    if (!state.active || !state.waitingForData) return false;
    console.log('[GS Panel] Attempting DOM scrape (FE Fallback)...');

    const dhEntries = [];
    let latestPDL = null;

    // The css-s8qwt0 represents the attribute container blocks in your HTML
    const blocks = $$('.css-s8qwt0');
    
    blocks.forEach(block => {
        const titleEl = block.querySelector('b');
        const title = titleEl ? titleEl.textContent.trim() : "";
        
        // Find Value, Source, Timestamp by looking for labels
        const labels = block.querySelectorAll('.css-oshm15'); // Labels like "Value |", "Source |"
        let entry = { value: null, attributeSrc: null, formattedDateTime: null };

        labels.forEach(lbl => {
            const labelText = lbl.textContent.toLowerCase();
            const valEl = lbl.nextElementSibling;
            if (!valEl) return;

            if (labelText.includes('value')) entry.value = valEl.textContent.trim();
            if (labelText.includes('source')) entry.attributeSrc = valEl.textContent.trim();
            if (labelText.includes('timestamp')) entry.formattedDateTime = valEl.textContent.trim();
        });

        if (title.includes('DELIVERY_HINT')) {
            dhEntries.push(entry);
        } else if (title.includes('Preferred delivery locations')) {
            if (!latestPDL) latestPDL = entry; // Take the first one (usually authoritative)
        }
    });

    if (dhEntries.length > 0 || latestPDL) {
        console.log('[GS Panel] Scrape successful!');
        state.waitingForData = false;
        if (state.dataTimeoutId) { clearTimeout(state.dataTimeoutId); state.dataTimeoutId = null; }
        
        const dhSorted = dhEntries.sort(sortByTimeDesc);
        renderPanel(dhSorted, latestPDL);
        
        setTimeout(() => {
            closeAttributesAccordion();
            setTimeout(() => openPastDeliveriesAccordion(0), 400);
        }, 300);
        return true;
    }
    return false;
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
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._interceptUrl = url;
        return origOpen.apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function (...args) {
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
        return origSend.apply(this, args);
    };
}

// ==================== FLOATING DISPLAY ====================
function createFloatingDisplay() {
    destroyFloatingDisplay();
    const el = document.createElement('div');
    el.id = 'caseTypeDisplay';
    el.style.cssText = `position:fixed; top:10px; left:200px; padding:12px 18px; background-color:rgba(0,0,0,0.8); color:white; z-index:9999; border-radius:8px; max-width:600px; word-wrap:break-word; font-family:"Segoe UI",Arial,sans-serif; font-size:14px; font-weight:bold; pointer-events:none; line-height:1.5; display:none; align-items:center; gap:8px;`;
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
        el.innerHTML = `<span style="font-size:18px">🔴</span><span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:700;letter-spacing:0.5px">LIVE CASE</span><span style="font-size:11px;font-weight:400;opacity:0.9">${state.caseTypeText || 'Unknown'}</span></span>`;
        return;
    }

    if (!state.bdp.received) return;
    const { source, confidence, scope, tolerance } = state.bdp;
    if (source) {
        el.style.backgroundColor = getBDPColor(source);
        const details = [confidence && `Confidence: ${confidence}`, scope != null && `Scope: ${scope}`, tolerance != null && `Tolerance: ${tolerance}m`].filter(Boolean).join(' | ');
        el.innerHTML = `<span style="font-size:16px">📍</span><span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:14px;font-weight:700">${source}</span>${details ? `<span style="font-size:10px;font-weight:400;opacity:0.85">${details}</span>` : ''}</span>`;
    } else {
        el.style.backgroundColor = 'rgba(233, 69, 96, 0.9)';
        el.innerHTML = '<span style="font-size:16px">⚠️</span><span>No BDP Source Found</span>';
    }
    el.style.display = 'flex';
}

// ==================== AUTOMATION LOGIC ====================
function checkForCaseType() {
    if (!state.active || state.textFound || state.isChecking) return;
    state.isChecking = true;
    const elements = $$('.css-wncc9b');
    const keywords = ['source1', 'casetype'];
    for (const keyword of keywords) {
        for (const el of elements) {
            const text = el.textContent;
            if (text?.toLowerCase().includes(keyword)) {
                state.caseTypeText = text.trim();
                state.textFound = true;
                state.caseTypeDetected = true;
                state.isLiveCase = state.caseTypeText.toLowerCase().includes('live');
                stopPolling();
                if (state.isLiveCase) showFloatingDisplay();
                else if (state.bdp.received) showFloatingDisplay();
                
                setTimeout(clickTargetButton, 100);
                setTimeout(() => clickSharedDeliveryArea(0), 100);
                triggerGSPanel();
                state.isChecking = false;
                return;
            }
        }
    }
    state.isChecking = false;
}

function startPolling() {
    stopPolling();
    state.pollId = setInterval(checkForCaseType, 150);
}
function stopPolling() {
    if (state.pollId) { clearInterval(state.pollId); state.pollId = null; }
}

function clickTargetButton() {
    if (!state.active || state.buttonClicked) return;
    const btn = $('button.css-px7qg4') || $('button[mdn-popover-offset="-4"]');
    if (btn) { btn.click(); state.buttonClicked = true; }
    else setTimeout(clickTargetButton, 200);
}

function clickSharedDeliveryArea(retry) {
    if (!state.active || state.sharedDeliveryClicked || retry >= MAX_RETRIES) return;
    const accordion = findByText('.MuiAccordion-root', 'Shared Delivery Area');
    if (accordion) {
        const clickable = accordion.querySelector('[role="button"]') || accordion;
        clickable.click();
        state.sharedDeliveryClicked = true;
        setTimeout(() => clickEditDetails(0), 150);
    } else setTimeout(() => clickSharedDeliveryArea(retry + 1), 200);
}

function clickEditDetails(retry) {
    if (!state.active || state.editDetailsClicked || retry >= MAX_RETRIES) return;
    const btn = findByText('button, span, div', 'Edit Details');
    if (btn) {
        btn.click();
        state.editDetailsClicked = true;
    } else setTimeout(() => clickEditDetails(retry + 1), 200);
}

function findAttributesAccordion() {
    return findByText('[role="button"]', 'Attributes sources');
}

function openAttributesAccordion(retry) {
    if (!state.active) return;
    if (retry >= MAX_RETRIES) {
        // One last attempt to scrape before failing
        if (!scrapeAttributesFromDOM()) {
            const body = $('#gs-body');
            if (body) body.innerHTML = '<div class="gs-loading" style="color:#e94560">❌ Timeout — No data received.</div>';
        }
        return;
    }

    const acc = findAttributesAccordion();
    if (!acc) {
        setTimeout(() => openAttributesAccordion(retry + 1), 200);
        return;
    }

    state.waitingForData = true;
    if (acc.getAttribute('aria-expanded') !== 'true') {
        acc.click();
    }

    // FE REGION FIX: 
    // If network data doesn't arrive in 2 seconds, trigger the DOM scraper
    setTimeout(() => {
        if (state.waitingForData) {
            scrapeAttributesFromDOM();
        }
    }, SCRAPER_WAIT_MS);

    if (state.dataTimeoutId) clearTimeout(state.dataTimeoutId);
    state.dataTimeoutId = setTimeout(() => {
        if (!state.waitingForData) return;
        state.waitingForData = false;
        const body = $('#gs-body');
        if (body) body.innerHTML = '<div class="gs-loading" style="color:#e94560">❌ Timeout — No data received.</div>';
        closeAttributesAccordion();
    }, DATA_TIMEOUT_MS);
}

function closeAttributesAccordion() {
    const acc = findAttributesAccordion();
    if (acc?.getAttribute('aria-expanded') === 'true') acc.click();
}

function openPastDeliveriesAccordion(retry = 0) {
    if (!state.active || retry >= MAX_RETRIES) return;
    const accordion = findByText('[role="button"]', 'Past deliveries');
    if (accordion) {
        if (accordion.getAttribute('aria-expanded') !== 'true') accordion.click();
    } else setTimeout(() => openPastDeliveriesAccordion(retry + 1), 200);
}

// ==================== RENDER PANEL ====================
function renderPanel(dhEntries, latestPDL) {
    if (!state.active) return;
    const body = $('#gs-body');
    if (!body) return;

    let html = '';
    html += '<div class="gs-block dh"><div class="gs-label">🔴 Delivery Hints (' + dhEntries.length + ')</div>';
    if (dhEntries.length) {
        dhEntries.forEach((entry, i) => {
            const val = clean(entry.value);
            if (i > 0) html += '<hr class="gs-entry-divider">';
            html += `<div class="gs-entry"><div class="gs-entry-num">#${i + 1}${i === 0 ? '<span class="gs-latest-badge">LATEST</span>' : ''}</div><div class="gs-val">${val}</div><div class="gs-meta">${srcBadge(entry.attributeSrc)}<span class="gs-sep">|</span><span class="gs-date">${fmtDate(entry.formattedDateTime)}</span><button class="gs-translate-btn" data-text="${encodeURIComponent(val)}">🌐 Translate</button></div></div>`;
        });
    } else html += '<div class="gs-val empty">No delivery hint found</div>';
    html += '</div>';

    html += '<div class="gs-block pdl"><div class="gs-label">🟢 Preferred Delivery Location</div>';
    if (latestPDL) {
        html += `<div class="gs-entry"><div class="gs-val">${parsePDL(latestPDL.value)}</div><div class="gs-meta">${srcBadge(latestPDL.attributeSrc)}<span class="gs-sep">|</span><span class="gs-date">${fmtDate(latestPDL.formattedDateTime)}</span></div></div>`;
    } else html += '<div class="gs-val empty">No preferred delivery location found</div>';
    html += '</div>';

    body.innerHTML = html;
    body.querySelectorAll('.gs-translate-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); openBingTranslate(decodeURIComponent(btn.dataset.text)); });
    });

    const panel = $('#gs-panel');
    if (panel) {
        panel.style.display = 'block';
        setInitialPosition();
        panel.style.borderColor = '#0ead69';
        setTimeout(() => { if (panel) panel.style.borderColor = '#00d4ff'; }, 1000);
    }
}

// ==================== PANEL MGMT ====================
function setInitialPosition() {
    if (state.userDragged) return;
    const panel = $('#gs-panel');
    const anchor = $('[class*="jPF-XYLaPtejuJ7hQXRjog"]') || $('.css-bbz95s');
    if (anchor && panel) {
        const rect = anchor.getBoundingClientRect();
        panel.style.left = Math.max(5, rect.left - (panel.offsetWidth || 380) - 10) + 'px';
        panel.style.top = (window.innerHeight * 0.05) + 'px';
        panel.style.right = 'auto';
    }
}

function createPanel() {
    destroyPanel();
    const style = document.createElement('style');
    style.id = 'gs-panel-css';
    style.textContent = PANEL_CSS;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'gs-panel';
    panel.style.display = 'none';
    panel.innerHTML = `<div id="gs-header"><span class="title">📦 DH & PDL</span><div><button id="gs-min">—</button></div></div><div id="gs-body"><div class="gs-loading">⏳ Waiting for data...</div></div>`;
    document.body.appendChild(panel);

    setInitialPosition();
    setupDrag(panel);

    panel.querySelector('#gs-min').addEventListener('click', () => {
        panel.classList.toggle('minimized');
        panel.querySelector('#gs-min').textContent = panel.classList.contains('minimized') ? '▢' : '—';
    });
    state.gsPanelCreated = true;
}

function destroyPanel() { $('#gs-panel')?.remove(); $('#gs-panel-css')?.remove(); state.gsPanelCreated = false; }

function setupDrag(panel) {
    const header = panel.querySelector('#gs-header');
    let dragging = false, startX, startY, startLeft, startTop;
    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        const rect = panel.getBoundingClientRect();
        startLeft = rect.left; startTop = rect.top;
        panel.style.right = 'auto';
        panel.style.left = startLeft + 'px'; panel.style.top = startTop + 'px';
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        state.userDragged = true;
        panel.style.left = (startLeft + e.clientX - startX) + 'px';
        panel.style.top = (startTop + e.clientY - startY) + 'px';
    }, { signal: state.abortController?.signal });
    document.addEventListener('mouseup', () => dragging = false, { signal: state.abortController?.signal });
}

function triggerGSPanel() {
    if (!state.active) return;
    if (!state.gsPanelCreated) createPanel();
    const body = $('#gs-body');
    if (body) body.innerHTML = '<div class="gs-loading">⏳ Opening attributes...</div>';
    $('#gs-panel').style.display = 'block';
    openAttributesAccordion(0);
}

function fullCleanup() {
    state.active = false;
    stopPolling();
    if (state.dataTimeoutId) clearTimeout(state.dataTimeoutId);
    state.abortController?.abort();
    destroyPanel();
    destroyFloatingDisplay();
    // Reset state flags
    state.textFound = false; state.isChecking = false; state.buttonClicked = false;
    state.sharedDeliveryClicked = false; state.editDetailsClicked = false;
    state.waitingForData = false; state.caseTypeDetected = false;
    state.gsPanelCreated = false; state.userDragged = false;
    state.bdp.received = false;
    setTimeout(startFresh, 500);
}

function startFresh() {
    state.abortController = new AbortController();
    state.active = true;
    startPolling();
}

function initialize() {
    setupInterceptors();
    startFresh();
    document.addEventListener('click', (e) => {
        if (e.target?.id === 'submit-btn') setTimeout(fullCleanup, 100);
    }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
else initialize();

})();
