// CaseType Text Observer + GS Panel (DH & PDL via API)

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const API_URL = 'https://api-gam.na.prod.geostudio.last-mile.amazon.dev/api/getSourceAddressAttributes';
    const API_PATH = '/api/getSourceAddressAttributes';

    // ==================== STATE ====================
    let floatingDisplay = null;
    let textFound = false;
    let isChecking = false;
    let buttonClicked = false;
    let sharedDeliveryClicked = false;
    let editDetailsClicked = false;

    // GS Panel state
    let currentAddressId = null;
    let lastFetchedId = null;
    let userDragged = false;
    let gsPanelCreated = false;
    let addressWatcherInterval = null;
    let addressObserver = null;

    // ==================== SOURCE PRIORITY ====================
    function getSourcePriority(src) {
        if (!src) return 99;
        const s = src.toUpperCase();
        if (s.includes('CUSTOMER')) return 1;
        if (s.includes('LLM')) return 2;
        if (s.includes('AMZL')) return 3;
        return 50;
    }

    function pickBestEntry(entries) {
        if (!entries || entries.length === 0) return null;
        const sorted = [...entries].sort((a, b) => {
            const pa = getSourcePriority(a.attributeSrc);
            const pb = getSourcePriority(b.attributeSrc);
            if (pa !== pb) return pa - pb;
            return (b.timestamp || 0) - (a.timestamp || 0);
        });
        return sorted[0];
    }

    // ==================== GS PANEL STYLES ====================
    const PANEL_CSS = `
        #gs-panel {
            position: fixed;
            width: 380px;
            background: #1a1a2e;
            color: #e0e0e0;
            border: 2px solid #00d4ff;
            border-radius: 10px;
            z-index: 999999;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
            box-shadow: 0 6px 24px rgba(0, 212, 255, 0.25);
            overflow: hidden;
            transition: border-color 0.5s;
        }
        #gs-panel.minimized #gs-body { display: none; }
        #gs-panel.minimized { width: 200px; }

        #gs-header {
            background: #0f3460;
            padding: 8px 12px;
            cursor: grab;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            border-bottom: 1px solid #00d4ff;
        }
        #gs-header:active { cursor: grabbing; }
        #gs-header .title {
            font-weight: 700;
            font-size: 13px;
            color: #00d4ff;
        }
        #gs-header button {
            background: none;
            border: 1px solid #00d4ff;
            color: #00d4ff;
            cursor: pointer;
            padding: 1px 7px;
            border-radius: 3px;
            font-size: 11px;
            margin-left: 4px;
        }
        #gs-header button:hover {
            background: #00d4ff;
            color: #1a1a2e;
        }

        #gs-body { padding: 10px; }

        .gs-aid {
            font-size: 11px;
            color: #888;
            margin-bottom: 8px;
            font-family: monospace;
        }
        .gs-aid span { color: #00d4ff; font-weight: 600; }

        .gs-block {
            margin-bottom: 10px;
            background: #16213e;
            border-radius: 6px;
            padding: 8px 10px;
        }
        .gs-block.dh { border-left: 4px solid #e94560; }
        .gs-block.pdl { border-left: 4px solid #0ead69; }

        .gs-label {
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }
        .gs-block.dh .gs-label { color: #e94560; }
        .gs-block.pdl .gs-label { color: #0ead69; }

        .gs-val {
            color: #fff;
            font-size: 13px;
            line-height: 1.4;
            word-wrap: break-word;
            padding: 4px 6px;
            background: rgba(255,255,255,0.04);
            border-radius: 4px;
        }
        .gs-val.empty { color: #555; font-style: italic; }

        .gs-meta {
            font-size: 10px;
            color: #ccc;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .gs-meta .gs-date {
            color: #ffffff;
            font-weight: 500;
        }
        .gs-meta .gs-sep {
            color: #555;
        }
        .gs-src {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
        }
        .gs-src.customer { background: #e94560; color: #fff; }
        .gs-src.llm { background: #7b68ee; color: #fff; }
        .gs-src.amzl { background: #f5a623; color: #1a1a2e; }
        .gs-src.other { background: #607d8b; color: #fff; }

        .gs-loading {
            text-align: center;
            color: #00d4ff;
            padding: 15px;
        }
    `;

    // ==================== CASE TYPE DISPLAY ====================
    function createFloatingDisplay() {
        if (floatingDisplay) return;
        floatingDisplay = document.createElement('div');
        floatingDisplay.id = 'caseTypeDisplay';
        floatingDisplay.style.cssText = 'position:fixed;top:10px;left:200px;padding:15px;background-color:rgba(0,0,0,0.8);color:white;z-index:9999;border-radius:5px;max-width:400px;word-wrap:break-word;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;pointer-events:none;line-height:1.4;';
        document.body.appendChild(floatingDisplay);
    }

    function clickTargetButton() {
        if (buttonClicked) return;
        const buttonSelectors = [
            'button.css-px7qg4',
            'button[mdn-popover-offset="-4"]',
            'button.z4S49pH1wMwtRBSedw1lug\\=\\=',
            'button.css-px7qg4[type="button"]'
        ];
        let targetButton = null;
        for (const selector of buttonSelectors) {
            try {
                targetButton = document.querySelector(selector);
                if (targetButton) break;
            } catch (e) { }
        }
        if (targetButton) {
            targetButton.click();
            buttonClicked = true;
        } else {
            setTimeout(clickTargetButton, 100);
        }
    }

    // ==================== SHARED DELIVERY AREA & EDIT DETAILS ====================
    function clickSharedDeliveryArea(retryCount) {
        if (sharedDeliveryClicked) return;
        retryCount = retryCount || 0;
        const maxRetries = 30;
        let found = false;

        try {
            const accordions = document.querySelectorAll('.MuiAccordion-root.css-sqxyby');
            for (const acc of accordions) {
                if (acc.textContent && acc.textContent.includes('Shared Delivery Area')) {
                    const summary = acc.querySelector('.MuiAccordionSummary-root, .MuiButtonBase-root, [role="button"]');
                    if (summary) { summary.click(); } else { acc.click(); }
                    sharedDeliveryClicked = true;
                    found = true;
                    break;
                }
            }
        } catch (e) { }

        if (!found) {
            try {
                const allElements = document.querySelectorAll('div[class*="MuiAccordion"], div[class*="css-sqxyby"]');
                for (const el of allElements) {
                    if (el.textContent && el.textContent.includes('Shared Delivery Area')) {
                        const clickable = el.querySelector('[role="button"], button, .MuiAccordionSummary-root, .MuiButtonBase-root') || el;
                        clickable.click();
                        sharedDeliveryClicked = true;
                        found = true;
                        break;
                    }
                }
            } catch (e) { }
        }

        if (!found) {
            try {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                    acceptNode: function(node) {
                        return node.nodeValue && node.nodeValue.trim().includes('Shared Delivery Area') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                });
                while (walker.nextNode()) {
                    let target = walker.currentNode.parentElement;
                    let attempts = 0;
                    while (target && attempts < 10) {
                        if (target.classList && (target.classList.contains('MuiAccordion-root') || target.classList.contains('MuiAccordionSummary-root') || target.classList.contains('MuiButtonBase-root') || target.getAttribute('role') === 'button')) {
                            const clickTarget = target.querySelector('.MuiAccordionSummary-root, .MuiButtonBase-root, [role="button"]') || target;
                            clickTarget.click();
                            sharedDeliveryClicked = true;
                            found = true;
                            break;
                        }
                        target = target.parentElement;
                        attempts++;
                    }
                    if (found) break;
                }
            } catch (e) { }
        }

        if (found) {
            setTimeout(() => { clickEditDetails(0); }, 100);
        } else if (retryCount < maxRetries) {
            setTimeout(() => { clickSharedDeliveryArea(retryCount + 1); }, 100);
        }
    }

    function clickEditDetails(retryCount) {
        if (editDetailsClicked) return;
        retryCount = retryCount || 0;
        const maxRetries = 30;
        let found = false;

        try {
            const elements = document.querySelectorAll('.css-1lnv98w');
            for (const el of elements) {
                if (el.textContent && el.textContent.trim() === 'Edit Details') {
                    el.click();
                    editDetailsClicked = true;
                    found = true;
                    break;
                }
            }
        } catch (e) { }

        if (!found) {
            try {
                const allClickables = document.querySelectorAll('button, a, span, div, p, [role="button"]');
                for (const el of allClickables) {
                    if (el.textContent && el.textContent.trim() === 'Edit Details') {
                        el.click();
                        editDetailsClicked = true;
                        found = true;
                        break;
                    }
                }
            } catch (e) { }
        }

        if (!found) {
            try {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                    acceptNode: function(node) {
                        return node.nodeValue && node.nodeValue.trim() === 'Edit Details' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                });
                while (walker.nextNode()) {
                    let target = walker.currentNode.parentElement;
                    if (target) {
                        let clickTarget = target;
                        let attempts = 0;
                        while (clickTarget && attempts < 5) {
                            if (clickTarget.classList && clickTarget.classList.contains('css-1lnv98w')) {
                                clickTarget.click();
                                editDetailsClicked = true;
                                found = true;
                                break;
                            }
                            clickTarget = clickTarget.parentElement;
                            attempts++;
                        }
                        if (!found) {
                            target.click();
                            editDetailsClicked = true;
                            found = true;
                        }
                        break;
                    }
                }
            } catch (e) { }
        }

        if (!found && retryCount < maxRetries) {
            setTimeout(() => { clickEditDetails(retryCount + 1); }, 100);
        }
    }

    // ==================== UPDATE DISPLAY ====================
    function updateDisplay(text, source) {
        if (!floatingDisplay) createFloatingDisplay();
        if (text) {
            if (source === 'source1') {
                floatingDisplay.style.backgroundColor = 'rgba(255,0,0,0.8)';
            } else {
                floatingDisplay.style.backgroundColor = 'rgba(180,100,0,0.8)';
            }
            floatingDisplay.textContent = text;
            textFound = true;

            setTimeout(clickTargetButton, 100);
            setTimeout(() => { clickSharedDeliveryArea(0); }, 100);
            triggerGSPanel();
        } else {
            floatingDisplay.style.backgroundColor = 'rgba(0,0,0,0.8)';
            floatingDisplay.textContent = 'CaseType: Not Found';
            textFound = false;
        }
    }

    function checkForCaseType() {
        if (textFound || isChecking) return;
        isChecking = true;
        const elements = document.querySelectorAll('.css-wncc9b');
        let found = false;

        elements.forEach(element => {
            if (found) return;
            const text = element.textContent;
            if (text && text.includes('source1')) {
                found = true;
                updateDisplay(text, 'source1');
            }
        });

        if (!found) {
            elements.forEach(element => {
                if (found) return;
                const text = element.textContent;
                if (text && text.includes('casetype')) {
                    found = true;
                    updateDisplay(text, 'casetype');
                }
            });
        }

        if (!found) {
            updateDisplay(null, null);
        }
        isChecking = false;
    }

    // ==================== GS PANEL: GET ADDRESS ID FROM DOM ====================
    function getAddressIdFromDOM() {
        const allP = document.querySelectorAll('p[mdn-text]');
        for (const p of allP) {
            if (p.textContent.trim() === 'Address ID:') {
                const parent = p.parentElement;
                if (parent) {
                    const link = parent.querySelector('a[mdn-link] p[mdn-text]');
                    if (link) {
                        const id = link.textContent.trim();
                        if (/^\d+$/.test(id)) return id;
                    }
                }
            }
        }
        const container = document.querySelector('div.css-1tibrdl');
        if (container) {
            const link = container.querySelector('a p');
            if (link) {
                const id = link.textContent.trim();
                if (/^\d+$/.test(id)) return id;
            }
        }
        return null;
    }

    // ==================== GS PANEL: INITIAL POSITION ====================
    function setInitialPosition() {
        if (userDragged) return;

        const panel = document.getElementById('gs-panel');
        if (!panel) return;

        const targetDiv = document.querySelector('[class*="jPF-XYLaPtejuJ7hQXRjog"]')
            || document.querySelector('.css-bbz95s');

        if (targetDiv) {
            const rect = targetDiv.getBoundingClientRect();
            const panelWidth = panel.offsetWidth || 380;
            const leftPos = rect.left - panelWidth - 10;
            const topPos = window.innerHeight * 0.05;

            panel.style.left = Math.max(5, leftPos) + 'px';
            panel.style.top = topPos + 'px';
            panel.style.right = 'auto';
        } else {
            panel.style.top = '5%';
            panel.style.right = '10px';
            panel.style.left = 'auto';
        }
    }

    // ==================== GS PANEL: CREATE ====================
    function createPanel() {
        const old = document.getElementById('gs-panel');
        if (old) old.remove();
        const oldStyle = document.getElementById('gs-panel-css');
        if (oldStyle) oldStyle.remove();

        const style = document.createElement('style');
        style.id = 'gs-panel-css';
        style.textContent = PANEL_CSS;
        document.head.appendChild(style);

        const panel = document.createElement('div');
        panel.id = 'gs-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <div id="gs-header">
                <span class="title">📦 DH & PDL</span>
                <div>
                    <button id="gs-ref">🔄</button>
                    <button id="gs-min">—</button>
                </div>
            </div>
            <div id="gs-body">
                <div class="gs-loading">⏳ Fetching...</div>
            </div>
        `;
        document.body.appendChild(panel);

        setInitialPosition();

        let retries = 0;
        const retryPos = setInterval(() => {
            if (userDragged || retries > 10) { clearInterval(retryPos); return; }
            setInitialPosition();
            retries++;
        }, 1000);

        window.addEventListener('resize', () => {
            if (!userDragged) setInitialPosition();
        });

        setupDrag(panel);

        panel.querySelector('#gs-min').addEventListener('click', () => {
            panel.classList.toggle('minimized');
            panel.querySelector('#gs-min').textContent = panel.classList.contains('minimized') ? '▢' : '—';
        });

        panel.querySelector('#gs-ref').addEventListener('click', () => {
            const id = getAddressIdFromDOM();
            if (id) { currentAddressId = id; fetchData(id); }
            else if (currentAddressId) fetchData(currentAddressId);
        });

        gsPanelCreated = true;
    }

    // ==================== GS PANEL: DRAG ====================
    function setupDrag(panel) {
        const header = panel.querySelector('#gs-header');
        let isDragging = false, startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            panel.style.right = 'auto';
            panel.style.left = startLeft + 'px';
            panel.style.top = startTop + 'px';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            userDragged = true;
            const newLeft = startLeft + e.clientX - startX;
            const newTop = startTop + e.clientY - startY;

            const maxLeft = window.innerWidth - (panel.offsetWidth || 380);
            const maxTop = window.innerHeight - 50;

            panel.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
            panel.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
        });

        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    // ==================== GS PANEL: FETCH ====================
    function fetchData(addressId) {
        if (!addressId) return;
        lastFetchedId = addressId;

        const body = document.getElementById('gs-body');
        if (body) body.innerHTML = '<div class="gs-loading">⏳ Fetching...</div>';

        fetch(API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'Accept': '*/*' },
            body: JSON.stringify({ searchId: addressId, idType: 'ADDRESS_ID' })
        })
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(data => render(data, addressId))
            .catch(err => {
                const body = document.getElementById('gs-body');
                if (body) body.innerHTML = `<div class="gs-loading" style="color:#e94560;">❌ ${err.message}</div>`;
                const panel = document.getElementById('gs-panel');
                if (panel) panel.style.display = 'block';
            });
    }

    // ==================== GS PANEL: RENDER ====================
    function render(data, addressId) {
        const body = document.getElementById('gs-body');
        if (!body || !data || !data.attributeSummaryList) return;

        let dhEntries = [];
        let pdlEntries = [];

        data.attributeSummaryList.forEach(attr => {
            if (attr.attributeName === 'DELIVERY_HINT') {
                if (attr.aidDetails) dhEntries.push(...attr.aidDetails);
                if (attr.pidSummary) dhEntries.push(...attr.pidSummary);
                if (attr.authoritativeValue) dhEntries.push(attr.authoritativeValue);
            }
            if (attr.attributeName === 'PREFERRED_DELIVERY_LOCATIONS') {
                if (attr.aidDetails) pdlEntries.push(...attr.aidDetails);
                if (attr.pidSummary) pdlEntries.push(...attr.pidSummary);
                if (attr.authoritativeValue) pdlEntries.push(attr.authoritativeValue);
            }
        });

        dhEntries = dedup(dhEntries);
        pdlEntries = dedup(pdlEntries);

        const bestDH = pickBestEntry(dhEntries);
        const bestPDL = pickBestEntry(pdlEntries);

        let html = `<div class="gs-aid">Address ID: <span>${addressId}</span></div>`;

        html += '<div class="gs-block dh">';
        html += '<div class="gs-label">🔴 Delivery Hint</div>';
        if (bestDH) {
            html += `<div class="gs-val">${clean(bestDH.value)}</div>`;
            html += `<div class="gs-meta">Source: ${srcBadge(bestDH.attributeSrc)} <span class="gs-sep">|</span> <span class="gs-date">${fmtDate(bestDH.formattedDateTime)}</span></div>`;
        } else {
            html += '<div class="gs-val empty">No delivery hint found</div>';
        }
        html += '</div>';

        html += '<div class="gs-block pdl">';
        html += '<div class="gs-label">🟢 Preferred Delivery Locations</div>';
        if (bestPDL) {
            html += `<div class="gs-val">${parsePDL(bestPDL.value)}</div>`;
            html += `<div class="gs-meta">Source: ${srcBadge(bestPDL.attributeSrc)} <span class="gs-sep">|</span> <span class="gs-date">${fmtDate(bestPDL.formattedDateTime)}</span></div>`;
        } else {
            html += '<div class="gs-val empty">No preferred delivery location found</div>';
        }
        html += '</div>';

        body.innerHTML = html;

        const panel = document.getElementById('gs-panel');
        if (panel) {
            panel.style.display = 'block';
            setInitialPosition();
            panel.style.borderColor = '#0ead69';
            setTimeout(() => panel.style.borderColor = '#00d4ff', 1000);
        }
    }

    // ==================== GS PANEL: HELPERS ====================
    function dedup(entries) {
        const seen = new Set();
        return entries.filter(e => {
            const key = (e.value || '') + '|' + (e.attributeSrc || '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function clean(val) {
        if (!val) return 'N/A';
        return val.replace(/^"|"$/g, '').trim();
    }

    function parsePDL(val) {
        try {
            const p = JSON.parse(val);
            if (p.Locations_ && Array.isArray(p.Locations_)) {
                return p.Locations_.map(loc => {
                    const l = loc.SafePlaceLocation_ || loc.MailroomLocation_ || loc.NeighborLocation_ || 'Unknown';
                    return '📍 ' + l.replace(/_/g, ' ');
                }).join(', ');
            }
            return clean(val);
        } catch (e) {
            return clean(val);
        }
    }

    function srcBadge(src) {
        if (!src) return '<span class="gs-src other">UNKNOWN</span>';
        const s = src.toUpperCase();
        let cls = 'other', label = src;
        if (s.includes('CUSTOMER')) { cls = 'customer'; label = 'CUSTOMER'; }
        else if (s.includes('LLM')) { cls = 'llm'; label = 'LLM'; }
        else if (s.includes('AMZL')) { cls = 'amzl'; label = 'AMZL'; }
        else { label = src.replace('PROPAGATED.CAMPUS.', '').replace(/_/g, ' '); }
        return `<span class="gs-src ${cls}">${label}</span>`;
    }

    function fmtDate(d) {
        if (!d) return '';
        try {
            return new Date(d).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return d; }
    }

    // ==================== GS PANEL: TRIGGER & WATCHER ====================
    function triggerGSPanel() {
        if (!gsPanelCreated) {
            createPanel();
        }
        startAddressWatcher();
    }

    function startAddressWatcher() {
        stopAddressWatcher();

        const id = getAddressIdFromDOM();
        if (id && id !== lastFetchedId) {
            currentAddressId = id;
            fetchData(id);
        }

        addressWatcherInterval = setInterval(() => {
            const id = getAddressIdFromDOM();
            if (id && id !== lastFetchedId) {
                currentAddressId = id;
                fetchData(id);
            }
        }, 2000);

        addressObserver = new MutationObserver(() => {
            const id = getAddressIdFromDOM();
            if (id && id !== lastFetchedId) {
                currentAddressId = id;
                fetchData(id);
            }
        });
        addressObserver.observe(document.body, { childList: true, subtree: true });
    }

    function stopAddressWatcher() {
        if (addressWatcherInterval) {
            clearInterval(addressWatcherInterval);
            addressWatcherInterval = null;
        }
        if (addressObserver) {
            addressObserver.disconnect();
            addressObserver = null;
        }
    }

    // ==================== FETCH INTERCEPT (BACKUP) ====================
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        const res = await origFetch.apply(this, args);
        try {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            if (url.includes(API_PATH)) {
                if (args[1]?.body) {
                    try {
                        const b = JSON.parse(args[1].body);
                        if (b.searchId) currentAddressId = b.searchId;
                    } catch (e) {}
                }
                res.clone().json().then(data => render(data, currentAddressId)).catch(() => {});
            }
        } catch (e) {}
        return res;
    };

    // ==================== RESET ====================
    function resetSearch() {
        textFound = false;
        isChecking = false;
        buttonClicked = false;
        sharedDeliveryClicked = false;
        editDetailsClicked = false;

        if (floatingDisplay) {
            floatingDisplay.textContent = 'Searching...';
            floatingDisplay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        }

        currentAddressId = null;
        lastFetchedId = null;
        stopAddressWatcher();

        const body = document.getElementById('gs-body');
        if (body) {
            body.innerHTML = '<div class="gs-loading">⏳ Fetching...</div>';
        }

        const panel = document.getElementById('gs-panel');
        if (panel) {
            panel.style.display = 'none';
            panel.style.borderColor = '#00d4ff';
        }
    }

    // ==================== INITIALIZE ====================
    function initialize() {
        console.log('Initializing CaseType Observer + GS Panel v2.3...');

        createFloatingDisplay();

        setInterval(() => {
            if (!textFound) {
                checkForCaseType();
            }
        }, 100);

        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'submit-btn') {
                setTimeout(resetSearch, 100);
            }
        }, true);

        setTimeout(checkForCaseType, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
