// CaseType Text Observer + GS Panel (DH & PDL via Intercept) + BDP Source Display

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const ATTRIBUTES_API_PATH = '/api/getSourceAddressAttributes';
    const ADDRESS_INFO_API_PATH = '/api/getAddressInfo';

    // ==================== STATE ====================
    let floatingDisplay = null;
    let textFound = false;
    let isChecking = false;
    let buttonClicked = false;
    let sharedDeliveryClicked = false;
    let editDetailsClicked = false;

    // GS Panel state
    let gsPanelCreated = false;
    let userDragged = false;
    let waitingForData = false;
    let interceptorsSetup = false;
    let dataTimeoutId = null;

    // BDP Source state
    let bdpSource = null;
    let bdpConfidence = null;
    let bdpScope = null;
    let bdpTolerance = null;
    let bdpDataReceived = false;
    let caseTypeDetected = false;

    // ==================== BDP SOURCE COLOR ====================
    function getBDPColor(src) {
        if (!src) return 'rgba(233, 69, 96, 0.9)';
        const s = src.toUpperCase();

        if (s.includes('PBG')) return 'rgba(233, 69, 96, 0.9)';
        if (s.includes('MANUAL') || s.includes('AID_MANUAL')) return 'rgba(14, 173, 105, 0.9)';
        if (s.includes('LIVE_GLS') || s.includes('GLS_ST_DIST')) return 'rgba(33, 150, 243, 0.9)';
        if (s.includes('NESO')) return 'rgba(123, 104, 238, 0.9)';
        if (s.includes('SCAN') || s.includes('GPS') || s.includes('LEARNABLE')) return 'rgba(0, 188, 212, 0.9)';

        return 'rgba(96, 125, 139, 0.9)';
    }

    // ==================== DH/PDL SOURCE NAME MAPPING ====================
    function cleanSourceName(src) {
        if (!src) return { label: 'UNKNOWN', type: 'other' };
        const s = src.toUpperCase();

        if (s.includes('CUSTOMER')) return { label: 'CUSTOMER', type: 'customer' };
        if (s.includes('LLM')) return { label: 'LLM', type: 'llm' };
        if (s.includes('AMZL')) return { label: 'AMZL', type: 'amzl' };
        if (s.includes('POSTAL')) return { label: 'POSTAL', type: 'postal' };
        if (s.includes('CAIMS')) return { label: 'CAIMS', type: 'caims' };
        if (s.includes('DERIVED')) return { label: 'DERIVED', type: 'derived' };
        if (s.includes('REGRID')) return { label: 'REGRID', type: 'regrid' };
        if (s.includes('RTS')) return { label: 'RTS', type: 'rts' };
        if (s.includes('SDS')) return { label: 'SDS', type: 'sds' };
        if (s.includes('TRANSPORTER')) return { label: 'TRANSPORTER', type: 'transporter' };

        let cleaned = src
            .replace(/^PROPAGATED\.(BUILDING|CAMPUS|CITY|REGION)\./i, '')
            .replace(/_/g, ' ')
            .trim();

        return { label: cleaned || src, type: 'other' };
    }

    // ==================== GS PANEL STYLES ====================
    const PANEL_CSS = `
        #gs-panel {
            position: fixed;
            width: 380px;
            max-height: 80vh;
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

        #gs-body {
            padding: 10px;
            overflow-y: auto;
            max-height: calc(80vh - 45px);
        }

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
            margin-bottom: 6px;
        }
        .gs-block.dh .gs-label { color: #e94560; }
        .gs-block.pdl .gs-label { color: #0ead69; }

        .gs-entry {
            padding: 5px 0;
        }
        .gs-entry-divider {
            border: none;
            border-top: 1px solid #333;
            margin: 6px 0;
        }

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
            flex-wrap: wrap;
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
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
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

        .gs-entry-num {
            font-size: 10px;
            color: #00d4ff;
            font-weight: 600;
            margin-bottom: 3px;
        }

        .gs-latest-badge {
            display: inline-block;
            background: #e94560;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 3px;
            margin-left: 5px;
            letter-spacing: 0.5px;
        }

        .gs-loading {
            text-align: center;
            color: #00d4ff;
            padding: 15px;
        }
    `;

    // ==================== INTERCEPTORS ====================
    function setupInterceptors() {
        if (interceptorsSetup) return;
        interceptorsSetup = true;

        // ---- Fetch Interceptor ----
        const origFetch = window.fetch;
        window.fetch = async function(...args) {
            const res = await origFetch.apply(this, args);
            try {
                const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

                if (url.includes(ADDRESS_INFO_API_PATH)) {
                    res.clone().json().then(data => {
                        handleAddressInfoReceived(data);
                    }).catch(() => {});
                }

                if (url.includes(ATTRIBUTES_API_PATH) && waitingForData) {
                    res.clone().json().then(data => {
                        if (data && data.attributeSummaryList) {
                            handleAttributesDataReceived(data);
                        }
                    }).catch(() => {});
                }
            } catch (e) {}
            return res;
        };

        // ---- XHR Interceptor (backup) ----
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._interceptUrl = url;
            return origOpen.apply(this, [method, url, ...rest]);
        };

        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', function() {
                try {
                    if (!this._interceptUrl) return;

                    if (this._interceptUrl.includes(ADDRESS_INFO_API_PATH)) {
                        const data = JSON.parse(this.responseText);
                        handleAddressInfoReceived(data);
                    }

                    if (this._interceptUrl.includes(ATTRIBUTES_API_PATH) && waitingForData) {
                        const data = JSON.parse(this.responseText);
                        if (data && data.attributeSummaryList) {
                            handleAttributesDataReceived(data);
                        }
                    }
                } catch (e) {}
            });
            return origSend.apply(this, args);
        };

        console.log('[GS Panel] Interceptors set up');
    }

    // ==================== HANDLE getAddressInfo RESPONSE ====================
    function handleAddressInfoReceived(data) {
        if (!data) return;

        try {
            const bdp = data.geospatialData && data.geospatialData.bestDeliveryPoint;

            if (bdp) {
                bdpSource = bdp.source || null;
                bdpConfidence = bdp.confidence || null;
                bdpScope = bdp.scope != null ? bdp.scope : null;
                bdpTolerance = bdp.tolerance != null ? bdp.tolerance : null;
                bdpDataReceived = true;
                console.log('[GS Panel] BDP Source intercepted:', bdpSource);
            } else {
                bdpSource = null;
                bdpConfidence = null;
                bdpScope = null;
                bdpTolerance = null;
                bdpDataReceived = true;
                console.log('[GS Panel] No bestDeliveryPoint in response');
            }

            if (caseTypeDetected) {
                showFloatingDisplay();
            }
        } catch (e) {
            console.log('[GS Panel] Error parsing getAddressInfo:', e);
        }
    }

    // ==================== FLOATING DISPLAY ====================
    function createFloatingDisplay() {
        if (floatingDisplay) return;
        floatingDisplay = document.createElement('div');
        floatingDisplay.id = 'caseTypeDisplay';
        floatingDisplay.style.cssText = 'position:fixed;top:10px;left:200px;padding:12px 18px;background-color:rgba(0,0,0,0.8);color:white;z-index:9999;border-radius:8px;max-width:600px;word-wrap:break-word;font-family:"Segoe UI",Arial,sans-serif;font-size:14px;font-weight:bold;pointer-events:none;line-height:1.5;display:none;align-items:center;gap:8px;';
        document.body.appendChild(floatingDisplay);
    }

    function showFloatingDisplay() {
        if (!floatingDisplay) createFloatingDisplay();
        if (!bdpDataReceived) return;

        if (bdpSource) {
            const color = getBDPColor(bdpSource);
            floatingDisplay.style.backgroundColor = color;
            floatingDisplay.style.display = 'flex';

            let html = `<span style="font-size:16px;">📍</span>`;
            html += `<span style="display:flex;flex-direction:column;gap:2px;">`;
            html += `<span style="font-size:14px;font-weight:700;">${bdpSource}</span>`;

            let details = [];
            if (bdpConfidence) details.push(`Confidence: ${bdpConfidence}`);
            if (bdpScope != null) details.push(`Scope: ${bdpScope}`);
            if (bdpTolerance != null) details.push(`Tolerance: ${bdpTolerance}m`);

            if (details.length > 0) {
                html += `<span style="font-size:10px;font-weight:400;opacity:0.85;">${details.join(' | ')}</span>`;
            }
            html += `</span>`;

            floatingDisplay.innerHTML = html;
        } else {
            floatingDisplay.style.backgroundColor = 'rgba(233, 69, 96, 0.9)';
            floatingDisplay.style.display = 'flex';
            floatingDisplay.innerHTML = '<span style="font-size:16px;">⚠️</span><span>No BDP Source Found</span>';
        }
    }

    // ==================== CASE TYPE DETECTION (INTERNAL ONLY) ====================
    function checkForCaseType() {
        if (textFound || isChecking) return;
        isChecking = true;
        const elements = document.querySelectorAll('.css-wncc9b');
        let found = false;

        elements.forEach(element => {
            if (found) return;
            const text = element.textContent;
            if (text && text.toLowerCase().includes('source1')) {
                found = true;
                handleCaseTypeFound();
            }
        });

        if (!found) {
            elements.forEach(element => {
                if (found) return;
                const text = element.textContent;
                if (text && text.toLowerCase().includes('casetype')) {
                    found = true;
                    handleCaseTypeFound();
                }
            });
        }

        isChecking = false;
    }

    function handleCaseTypeFound() {
        if (textFound) return;
        textFound = true;
        caseTypeDetected = true;

        console.log('[GS Panel] CaseType detected — triggering actions');

        if (bdpDataReceived) {
            showFloatingDisplay();
        }

        setTimeout(clickTargetButton, 100);
        setTimeout(() => { clickSharedDeliveryArea(0); }, 100);
        triggerGSPanel();
    }

    // ==================== CLICK TARGET BUTTON ====================
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
            } catch (e) {}
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
        } catch (e) {}

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
            } catch (e) {}
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
            } catch (e) {}
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
        } catch (e) {}

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
            } catch (e) {}
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
            } catch (e) {}
        }

        if (!found && retryCount < maxRetries) {
            setTimeout(() => { clickEditDetails(retryCount + 1); }, 100);
        }
    }

    // ==================== ACCORDION CONTROL ====================
    function findAttributesAccordion() {
        const summaries = document.querySelectorAll('.MuiButtonBase-root.MuiAccordionSummary-root[role="button"]');
        for (const el of summaries) {
            if (el.textContent && el.textContent.includes('Attributes sources')) {
                return el;
            }
        }
        const allButtons = document.querySelectorAll('[role="button"]');
        for (const el of allButtons) {
            if (el.textContent && el.textContent.includes('Attributes sources')) {
                return el;
            }
        }
        return null;
    }

    function openAttributesAccordion(retryCount) {
        retryCount = retryCount || 0;
        const acc = findAttributesAccordion();

        if (acc) {
            const isExpanded = acc.getAttribute('aria-expanded') === 'true';
            if (!isExpanded) {
                waitingForData = true;
                acc.click();
                console.log('[GS Panel] Accordion opened, waiting for data...');

                if (dataTimeoutId) clearTimeout(dataTimeoutId);
                dataTimeoutId = setTimeout(() => {
                    if (waitingForData) {
                        waitingForData = false;
                        console.log('[GS Panel] Timeout - no data received');
                        const body = document.getElementById('gs-body');
                        if (body) body.innerHTML = '<div class="gs-loading" style="color:#e94560;">❌ Timeout — No data received. Click 🔄 to retry.</div>';
                        closeAttributesAccordion();
                    }
                }, 15000);
            } else {
                acc.click();
                setTimeout(() => openAttributesAccordion(0), 600);
            }
        } else if (retryCount < 30) {
            setTimeout(() => openAttributesAccordion(retryCount + 1), 200);
        } else {
            console.log('[GS Panel] Accordion not found after retries');
            const body = document.getElementById('gs-body');
            if (body) body.innerHTML = '<div class="gs-loading" style="color:#e94560;">❌ "Attributes sources" accordion not found</div>';
        }
    }

    function closeAttributesAccordion() {
        const acc = findAttributesAccordion();
        if (acc && acc.getAttribute('aria-expanded') === 'true') {
            acc.click();
            console.log('[GS Panel] Accordion closed');
        }
    }

    // ==================== HANDLE getSourceAddressAttributes RESPONSE ====================
    function handleAttributesDataReceived(data) {
        if (!waitingForData) return;
        waitingForData = false;

        if (dataTimeoutId) {
            clearTimeout(dataTimeoutId);
            dataTimeoutId = null;
        }

        console.log('[GS Panel] Attributes data received, parsing DH & PDL...');

        let dhEntries = [];
        let pdlEntries = [];

        data.attributeSummaryList.forEach(attr => {
            const collectEntries = (attrObj, target) => {
                if (attrObj.aidDetails) target.push(...attrObj.aidDetails);
                if (attrObj.pidSummary) target.push(...attrObj.pidSummary);
                if (attrObj.authoritativeValue) target.push(attrObj.authoritativeValue);
            };

            if (attr.attributeName === 'DELIVERY_HINT') collectEntries(attr, dhEntries);
            if (attr.attributeName === 'PREFERRED_DELIVERY_LOCATIONS') collectEntries(attr, pdlEntries);
        });

        dhEntries = dedup(dhEntries);
        pdlEntries = dedup(pdlEntries);

        // Sort by timestamp — newest first
        const sortByTime = (a, b) => {
            const ta = new Date(a.formattedDateTime || a.timestamp || 0).getTime();
            const tb = new Date(b.formattedDateTime || b.timestamp || 0).getTime();
            return tb - ta;
        };

        // DH: sort all, newest on top — show ALL
        dhEntries.sort(sortByTime);

        // PDL: sort and pick ONLY the latest one
        pdlEntries.sort(sortByTime);
        const latestPDL = pdlEntries.length > 0 ? pdlEntries[0] : null;

        renderPanel(dhEntries, latestPDL);

        setTimeout(closeAttributesAccordion, 300);
    }

    // ==================== HELPERS ====================
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
        const info = cleanSourceName(src);
        return `<span class="gs-src ${info.type}">${info.label}</span>`;
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

    // ==================== RENDER PANEL ====================
    function renderPanel(dhEntries, latestPDL) {
        const body = document.getElementById('gs-body');
        if (!body) return;

        let html = '';

        // ---- Delivery Hints (ALL — newest first) ----
        html += '<div class="gs-block dh">';
        html += `<div class="gs-label">🔴 Delivery Hints (${dhEntries.length})</div>`;
        if (dhEntries.length > 0) {
            dhEntries.forEach((entry, i) => {
                if (i > 0) html += '<hr class="gs-entry-divider">';
                html += '<div class="gs-entry">';
                html += `<div class="gs-entry-num">#${i + 1}${i === 0 ? '<span class="gs-latest-badge">LATEST</span>' : ''}</div>`;
                html += `<div class="gs-val">${clean(entry.value)}</div>`;
                html += `<div class="gs-meta">${srcBadge(entry.attributeSrc)} <span class="gs-sep">|</span> <span class="gs-date">${fmtDate(entry.formattedDateTime)}</span></div>`;
                html += '</div>';
            });
        } else {
            html += '<div class="gs-val empty">No delivery hint found</div>';
        }
        html += '</div>';

        // ---- Preferred Delivery Location (ONLY LATEST) ----
        html += '<div class="gs-block pdl">';
        html += '<div class="gs-label">🟢 Preferred Delivery Location</div>';
        if (latestPDL) {
            html += '<div class="gs-entry">';
            html += `<div class="gs-val">${parsePDL(latestPDL.value)}</div>`;
            html += `<div class="gs-meta">${srcBadge(latestPDL.attributeSrc)} <span class="gs-sep">|</span> <span class="gs-date">${fmtDate(latestPDL.formattedDateTime)}</span></div>`;
            html += '</div>';
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

    // ==================== GS PANEL: POSITION ====================
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
                <div class="gs-loading">⏳ Waiting for data...</div>
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
            const body = document.getElementById('gs-body');
            if (body) body.innerHTML = '<div class="gs-loading">⏳ Refreshing...</div>';
            openAttributesAccordion(0);
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

    // ==================== TRIGGER GS PANEL ====================
    function triggerGSPanel() {
        if (!gsPanelCreated) createPanel();

        const body = document.getElementById('gs-body');
        if (body) body.innerHTML = '<div class="gs-loading">⏳ Opening attributes...</div>';

        const panel = document.getElementById('gs-panel');
        if (panel) panel.style.display = 'block';

        openAttributesAccordion(0);
    }

    // ==================== RESET ====================
    function resetSearch() {
        textFound = false;
        isChecking = false;
        buttonClicked = false;
        sharedDeliveryClicked = false;
        editDetailsClicked = false;
        waitingForData = false;
        caseTypeDetected = false;

        bdpSource = null;
        bdpConfidence = null;
        bdpScope = null;
        bdpTolerance = null;
        bdpDataReceived = false;

        if (dataTimeoutId) {
            clearTimeout(dataTimeoutId);
            dataTimeoutId = null;
        }

        if (floatingDisplay) {
            floatingDisplay.style.display = 'none';
            floatingDisplay.innerHTML = '';
        }

        const body = document.getElementById('gs-body');
        if (body) body.innerHTML = '<div class="gs-loading">⏳ Waiting for data...</div>';

        const panel = document.getElementById('gs-panel');
        if (panel) {
            panel.style.display = 'none';
            panel.style.borderColor = '#00d4ff';
        }
    }

    // ==================== INITIALIZE ====================
    function initialize() {
        console.log('[GS Panel] Initializing v4.2 (multi DH + single latest PDL)...');

        setupInterceptors();
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
