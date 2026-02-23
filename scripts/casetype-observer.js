// ==UserScript==
// @name         DH PDL
// @namespace    http://tampermonkey.net/
// @version      2026-02-20
// @description  CaseType Observer + GS Panel (DH & PDL via Intercept) + BDP Source + Bing Translate + Memory Optimized
// @author       manichk
// @match        https://na.geostudio.last-mile.amazon.dev/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.dev
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ==================== CONFIGURATION ====================
  const API = {
    ATTRIBUTES: '/api/getSourceAddressAttributes',
    ADDRESS_INFO: '/api/getAddressInfo',
  };

  const MAX_RETRIES = 30;
  const DATA_TIMEOUT_MS = 15000;

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

    // Timers
    pollId: null,
    dataTimeoutId: null,
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
    { match: 'LIVE_GLS',    color: 'rgba(33, 150, 243, 0.9)'  },
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
    #gs-panel {
      position: fixed; width: 380px; max-height: 80vh;
      background: #1a1a2e; color: #e0e0e0;
      border: 2px solid #00d4ff; border-radius: 10px;
      z-index: 999999; font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px; box-shadow: 0 6px 24px rgba(0, 212, 255, 0.25);
      overflow: hidden; transition: border-color 0.5s;
    }
    #gs-panel.minimized #gs-body { display: none; }
    #gs-panel.minimized { width: 200px; }

    #gs-header {
      background: #0f3460; padding: 8px 12px; cursor: grab;
      display: flex; justify-content: space-between; align-items: center;
      user-select: none; border-bottom: 1px solid #00d4ff;
    }
    #gs-header:active { cursor: grabbing; }
    #gs-header .title { font-weight: 700; font-size: 13px; color: #00d4ff; }
    #gs-header button {
      background: none; border: 1px solid #00d4ff; color: #00d4ff;
      cursor: pointer; padding: 1px 7px; border-radius: 3px;
      font-size: 11px; margin-left: 4px;
    }
    #gs-header button:hover { background: #00d4ff; color: #1a1a2e; }

    #gs-body { padding: 10px; overflow-y: auto; max-height: calc(80vh - 45px); }

    .gs-block {
      margin-bottom: 10px; background: #16213e;
      border-radius: 6px; padding: 8px 10px;
    }
    .gs-block.dh  { border-left: 4px solid #e94560; }
    .gs-block.pdl { border-left: 4px solid #0ead69; }

    .gs-label {
      font-weight: 700; font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.8px; margin-bottom: 6px;
    }
    .gs-block.dh  .gs-label { color: #e94560; }
    .gs-block.pdl .gs-label { color: #0ead69; }

    .gs-entry { padding: 5px 0; }
    .gs-entry-divider { border: none; border-top: 1px solid #333; margin: 6px 0; }

    .gs-val {
      color: #fff; font-size: 13px; line-height: 1.4; word-wrap: break-word;
      padding: 4px 6px; background: rgba(255,255,255,0.04); border-radius: 4px;
    }
    .gs-val.empty { color: #555; font-style: italic; }

    .gs-meta {
      font-size: 10px; color: #ccc; margin-top: 4px;
      display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
    }
    .gs-meta .gs-date { color: #fff; font-weight: 500; }
    .gs-meta .gs-sep  { color: #555; }

    .gs-src {
      display: inline-block; padding: 1px 6px; border-radius: 3px;
      font-size: 10px; font-weight: 600; letter-spacing: 0.3px;
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

    .gs-entry-num { font-size: 10px; color: #00d4ff; font-weight: 600; margin-bottom: 3px; }
    .gs-latest-badge {
      display: inline-block; background: #e94560; color: #fff;
      font-size: 9px; font-weight: 700; padding: 1px 5px;
      border-radius: 3px; margin-left: 5px; letter-spacing: 0.5px;
    }

    .gs-translate-btn {
      background: none; border: 1px solid #00d4ff; color: #00d4ff;
      cursor: pointer; padding: 1px 6px; border-radius: 3px;
      font-size: 10px; font-weight: 600; margin-left: 6px; transition: all 0.2s;
    }
    .gs-translate-btn:hover { background: #00d4ff; color: #1a1a2e; }
    .gs-loading { text-align: center; color: #00d4ff; padding: 15px; }
  `;

  // ==================== HELPERS ====================
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function clean(val) {
    return val ? val.replace(/^"|"$/g, '').trim() : 'N/A';
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
          const place =
            loc.SafePlaceLocation_ || loc.MailroomLocation_ ||
            loc.NeighborLocation_ || 'Unknown';
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

  // ==================== COLLECT ENTRIES (AID PRIORITY) ====================
  function collectEntries(attr) {
    if (attr.aidDetails && attr.aidDetails.length > 0) {
      return [...attr.aidDetails];
    }
    if (attr.authoritativeValue) {
      return [attr.authoritativeValue];
    }
    return [];
  }

  // ==================== NETWORK INTERCEPTORS (SMART) ====================
  function setupInterceptors() {
    if (state.interceptorsSetup) return;
    state.interceptorsSetup = true;

    // -- Smart Fetch Intercept --
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      const res = await origFetch.apply(this, args);

      // Skip everything if not active
      if (!state.active) return res;

      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

      // Only process our specific APIs
      if (url.includes(API.ADDRESS_INFO)) {
        try {
          res.clone().json().then(handleAddressInfoReceived).catch(() => {});
        } catch { /* ignore */ }
      } else if (url.includes(API.ATTRIBUTES) && state.waitingForData) {
        try {
          res.clone().json().then((data) => {
            if (data?.attributeSummaryList) handleAttributesDataReceived(data);
          }).catch(() => {});
        } catch { /* ignore */ }
      }

      return res;
    };

    // -- Smart XHR Intercept --
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this._interceptUrl = url;
      return origOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function (...args) {
      const url = this._interceptUrl || '';

      // Only attach listener if active AND URL matches our APIs
      if (state.active && (url.includes(API.ADDRESS_INFO) || url.includes(API.ATTRIBUTES))) {
        this.addEventListener('load', function () {
          if (!state.active) return;
          try {
            const data = JSON.parse(this.responseText);
            if (url.includes(API.ADDRESS_INFO)) {
              handleAddressInfoReceived(data);
            } else if (url.includes(API.ATTRIBUTES) && state.waitingForData && data?.attributeSummaryList) {
              handleAttributesDataReceived(data);
            }
          } catch { /* ignore */ }
        }, { once: true }); // Self-destructs after firing
      }

      return origSend.apply(this, args);
    };

    console.log('[GS Panel] Smart interceptors ready');
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

    console.log('[GS Panel] BDP:', state.bdp.source || 'none');
    if (state.caseTypeDetected) showFloatingDisplay();
  }

  function handleAttributesDataReceived(data) {
    if (!state.active || !state.waitingForData) return;
    state.waitingForData = false;

    if (state.dataTimeoutId) {
      clearTimeout(state.dataTimeoutId);
      state.dataTimeoutId = null;
    }

    const dhEntries  = [];
    const pdlEntries = [];

    for (const attr of data.attributeSummaryList) {
      if (attr.attributeName === 'DELIVERY_HINT') {
        dhEntries.push(...collectEntries(attr));
      } else if (attr.attributeName === 'PREFERRED_DELIVERY_LOCATIONS') {
        pdlEntries.push(...collectEntries(attr));
      }
    }

    const dh  = dedup(dhEntries).sort(sortByTimeDesc);
    const pdl = dedup(pdlEntries).sort(sortByTimeDesc);

    renderPanel(dh, pdl[0] || null);
    setTimeout(closeAttributesAccordion, 300);
  }

  // ==================== FLOATING DISPLAY (BDP) ====================
  function createFloatingDisplay() {
    destroyFloatingDisplay(); // Clean any existing one first
    const el = document.createElement('div');
    el.id = 'caseTypeDisplay';
    el.style.cssText = `
      position:fixed; top:10px; left:200px; padding:12px 18px;
      background-color:rgba(0,0,0,0.8); color:white; z-index:9999;
      border-radius:8px; max-width:600px; word-wrap:break-word;
      font-family:"Segoe UI",Arial,sans-serif; font-size:14px;
      font-weight:bold; pointer-events:none; line-height:1.5;
      display:none; align-items:center; gap:8px;
    `;
    document.body.appendChild(el);
    state.floatingDisplay = el;
  }

  function destroyFloatingDisplay() {
    if (state.floatingDisplay) {
      state.floatingDisplay.remove();
      state.floatingDisplay = null;
    }
    // Also remove any orphaned display
    $('#caseTypeDisplay')?.remove();
  }

  function showFloatingDisplay() {
    if (!state.active) return;
    if (!state.floatingDisplay) createFloatingDisplay();
    if (!state.bdp.received) return;

    const el = state.floatingDisplay;
    const { source, confidence, scope, tolerance } = state.bdp;

    if (source) {
      el.style.backgroundColor = getBDPColor(source);
      const details = [
        confidence && `Confidence: ${confidence}`,
        scope != null && `Scope: ${scope}`,
        tolerance != null && `Tolerance: ${tolerance}m`,
      ].filter(Boolean).join(' | ');

      el.innerHTML = `
        <span style="font-size:16px">📍</span>
        <span style="display:flex;flex-direction:column;gap:2px">
          <span style="font-size:14px;font-weight:700">${source}</span>
          ${details ? `<span style="font-size:10px;font-weight:400;opacity:0.85">${details}</span>` : ''}
        </span>`;
    } else {
      el.style.backgroundColor = 'rgba(233, 69, 96, 0.9)';
      el.innerHTML = '<span style="font-size:16px">⚠️</span><span>No BDP Source Found</span>';
    }
    el.style.display = 'flex';
  }

  // ==================== CASE TYPE DETECTION ====================
  function checkForCaseType() {
    if (!state.active || state.textFound || state.isChecking) return;
    state.isChecking = true;

    const elements = $$('.css-wncc9b');
    const keywords = ['source1', 'casetype'];

    for (const keyword of keywords) {
      for (const el of elements) {
        if (el.textContent?.toLowerCase().includes(keyword)) {
          handleCaseTypeFound();
          state.isChecking = false;
          return;
        }
      }
    }
    state.isChecking = false;
  }

  function handleCaseTypeFound() {
    if (state.textFound) return;
    state.textFound = true;
    state.caseTypeDetected = true;

    // STOP polling — no need to look anymore
    stopPolling();

    console.log('[GS Panel] CaseType detected — polling stopped');

    if (state.bdp.received) showFloatingDisplay();

    setTimeout(clickTargetButton, 100);
    setTimeout(() => clickSharedDeliveryArea(0), 100);
    triggerGSPanel();
  }

  // ==================== POLLING CONTROL ====================
  function startPolling() {
    stopPolling(); // Clear any existing
    state.pollId = setInterval(() => {
      if (!state.active || state.textFound) {
        stopPolling();
        return;
      }
      checkForCaseType();
    }, 100);
    console.log('[GS Panel] Polling started');
  }

  function stopPolling() {
    if (state.pollId) {
      clearInterval(state.pollId);
      state.pollId = null;
      console.log('[GS Panel] Polling stopped');
    }
  }

  // ==================== AUTO-CLICK ACTIONS ====================
  function clickTargetButton() {
    if (!state.active || state.buttonClicked) return;

    const selectors = [
      'button.css-px7qg4',
      'button[mdn-popover-offset="-4"]',
      'button.css-px7qg4[type="button"]',
    ];

    for (const sel of selectors) {
      try {
        const btn = $(sel);
        if (btn) { btn.click(); state.buttonClicked = true; return; }
      } catch { /* ignore */ }
    }
    if (state.active) setTimeout(clickTargetButton, 100);
  }

  function clickSharedDeliveryArea(retry) {
    if (!state.active || state.sharedDeliveryClicked || retry >= MAX_RETRIES) return;

    const accordion =
      findByText('.MuiAccordion-root.css-sqxyby', 'Shared Delivery Area') ||
      findByText('div[class*="MuiAccordion"], div[class*="css-sqxyby"]', 'Shared Delivery Area');

    if (accordion) {
      const clickable =
        accordion.querySelector('.MuiAccordionSummary-root, .MuiButtonBase-root, [role="button"]') ||
        accordion;
      clickable.click();
      state.sharedDeliveryClicked = true;
      setTimeout(() => clickEditDetails(0), 100);
      return;
    }

    // Text node walk — scoped search, no array storage
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.nodeValue?.trim().includes('Shared Delivery Area')
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });

    while (walker.nextNode()) {
      const ancestor = findAncestor(walker.currentNode.parentElement, (el) =>
        el.classList?.contains('MuiAccordion-root') ||
        el.classList?.contains('MuiAccordionSummary-root') ||
        el.getAttribute('role') === 'button'
      );
      if (ancestor) {
        const target =
          ancestor.querySelector('.MuiAccordionSummary-root, .MuiButtonBase-root, [role="button"]') ||
          ancestor;
        target.click();
        state.sharedDeliveryClicked = true;
        setTimeout(() => clickEditDetails(0), 100);
        return;
      }
    }

    if (state.active) setTimeout(() => clickSharedDeliveryArea(retry + 1), 100);
  }

  function clickEditDetails(retry) {
    if (!state.active || state.editDetailsClicked || retry >= MAX_RETRIES) return;

    for (const el of $$('.css-1lnv98w')) {
      if (el.textContent?.trim() === 'Edit Details') {
        el.click(); state.editDetailsClicked = true; return;
      }
    }

    for (const el of $$('button, a, span, div, p, [role="button"]')) {
      if (el.textContent?.trim() === 'Edit Details') {
        el.click(); state.editDetailsClicked = true; return;
      }
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.nodeValue?.trim() === 'Edit Details'
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });

    if (walker.nextNode() && walker.currentNode.parentElement) {
      const ancestor = findAncestor(
        walker.currentNode.parentElement,
        (el) => el.classList?.contains('css-1lnv98w'),
        5
      );
      (ancestor || walker.currentNode.parentElement).click();
      state.editDetailsClicked = true;
      return;
    }

    if (state.active) setTimeout(() => clickEditDetails(retry + 1), 100);
  }

  // ==================== ATTRIBUTES ACCORDION ====================
  function findAttributesAccordion() {
    return (
      findByText('.MuiButtonBase-root.MuiAccordionSummary-root[role="button"]', 'Attributes sources') ||
      findByText('[role="button"]', 'Attributes sources')
    );
  }

  function openAttributesAccordion(retry) {
    if (!state.active) return;

    if (retry >= MAX_RETRIES) {
      console.log('[GS Panel] Accordion not found');
      const body = $('#gs-body');
      if (body) body.innerHTML = '<div class="gs-loading" style="color:#e94560">❌ "Attributes sources" accordion not found</div>';
      return;
    }

    const acc = findAttributesAccordion();
    if (!acc) {
      setTimeout(() => openAttributesAccordion(retry + 1), 200);
      return;
    }

    if (acc.getAttribute('aria-expanded') === 'true') {
      acc.click();
      setTimeout(() => openAttributesAccordion(0), 600);
      return;
    }

    state.waitingForData = true;
    acc.click();
    console.log('[GS Panel] Accordion opened, waiting for data...');

    if (state.dataTimeoutId) clearTimeout(state.dataTimeoutId);
    state.dataTimeoutId = setTimeout(() => {
      if (!state.waitingForData) return;
      state.waitingForData = false;
      console.log('[GS Panel] Timeout — no data received');
      const body = $('#gs-body');
      if (body) body.innerHTML = '<div class="gs-loading" style="color:#e94560">❌ Timeout — No data received.</div>';
      closeAttributesAccordion();
    }, DATA_TIMEOUT_MS);
  }

  function closeAttributesAccordion() {
    const acc = findAttributesAccordion();
    if (acc?.getAttribute('aria-expanded') === 'true') {
      acc.click();
      console.log('[GS Panel] Accordion closed');
    }
  }

  // ==================== RENDER PANEL ====================
  function renderPanel(dhEntries, latestPDL) {
    if (!state.active) return;
    const body = $('#gs-body');
    if (!body) return;

    let html = '';

    // Delivery Hints
    html += '<div class="gs-block dh">';
    html += `<div class="gs-label">🔴 Delivery Hints (${dhEntries.length})</div>`;
    if (dhEntries.length) {
      dhEntries.forEach((entry, i) => {
        const val = clean(entry.value);
        const encoded = encodeURIComponent(val);
        if (i > 0) html += '<hr class="gs-entry-divider">';
        html += `
          <div class="gs-entry">
            <div class="gs-entry-num">
              #${i + 1}${i === 0 ? '<span class="gs-latest-badge">LATEST</span>' : ''}
            </div>
            <div class="gs-val">${val}</div>
            <div class="gs-meta">
              ${srcBadge(entry.attributeSrc)}
              <span class="gs-sep">|</span>
              <span class="gs-date">${fmtDate(entry.formattedDateTime)}</span>
              <button class="gs-translate-btn" data-text="${encoded}">🌐 Translate</button>
            </div>
          </div>`;
      });
    } else {
      html += '<div class="gs-val empty">No delivery hint found</div>';
    }
    html += '</div>';

    // PDL (latest only)
    html += '<div class="gs-block pdl">';
    html += '<div class="gs-label">🟢 Preferred Delivery Location</div>';
    if (latestPDL) {
      html += `
        <div class="gs-entry">
          <div class="gs-val">${parsePDL(latestPDL.value)}</div>
          <div class="gs-meta">
            ${srcBadge(latestPDL.attributeSrc)}
            <span class="gs-sep">|</span>
            <span class="gs-date">${fmtDate(latestPDL.formattedDateTime)}</span>
          </div>
        </div>`;
    } else {
      html += '<div class="gs-val empty">No preferred delivery location found</div>';
    }
    html += '</div>';

    body.innerHTML = html;

    // Attach translate handlers
    body.querySelectorAll('.gs-translate-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBingTranslate(decodeURIComponent(btn.dataset.text));
      });
    });

    const panel = $('#gs-panel');
    if (panel) {
      panel.style.display = 'block';
      setInitialPosition();
      panel.style.borderColor = '#0ead69';
      setTimeout(() => {
        if (panel) panel.style.borderColor = '#00d4ff';
      }, 1000);
    }
  }

  // ==================== PANEL POSITIONING ====================
  function setInitialPosition() {
    if (state.userDragged) return;
    const panel = $('#gs-panel');
    if (!panel) return;

    const anchor = $('[class*="jPF-XYLaPtejuJ7hQXRjog"]') || $('.css-bbz95s');

    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      const panelW = panel.offsetWidth || 380;
      panel.style.left = Math.max(5, rect.left - panelW - 10) + 'px';
      panel.style.top = (window.innerHeight * 0.05) + 'px';
      panel.style.right = 'auto';
    } else {
      panel.style.top = '5%';
      panel.style.right = '10px';
      panel.style.left = 'auto';
    }
  }

  // ==================== PANEL CREATE / DESTROY ====================
  function createPanel() {
    destroyPanel(); // Clean any existing first

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
        <div><button id="gs-min">—</button></div>
      </div>
      <div id="gs-body">
        <div class="gs-loading">⏳ Waiting for data...</div>
      </div>`;
    document.body.appendChild(panel);

    setInitialPosition();
    setupDrag(panel);

    // Position retry with stored ID for cleanup
    let retries = 0;
    state.positionRetryId = setInterval(() => {
      if (state.userDragged || ++retries > 10) {
        clearInterval(state.positionRetryId);
        state.positionRetryId = null;
        return;
      }
      setInitialPosition();
    }, 1000);

    // Resize listener with AbortController
    window.addEventListener('resize', () => {
      if (!state.userDragged) setInitialPosition();
    }, { signal: state.abortController.signal });

    // Minimize button
    panel.querySelector('#gs-min').addEventListener('click', () => {
      panel.classList.toggle('minimized');
      panel.querySelector('#gs-min').textContent =
        panel.classList.contains('minimized') ? '▢' : '—';
    });

    state.gsPanelCreated = true;
  }

  function destroyPanel() {
    // Remove DOM elements
    $('#gs-panel')?.remove();
    $('#gs-panel-css')?.remove();

    // Clear position retry
    if (state.positionRetryId) {
      clearInterval(state.positionRetryId);
      state.positionRetryId = null;
    }

    state.gsPanelCreated = false;
  }

  // ==================== DRAG (uses AbortController) ====================
  function setupDrag(panel) {
    const header = panel.querySelector('#gs-header');
    let dragging = false, startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
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

    // Use AbortController for document-level listeners
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      state.userDragged = true;
      const maxX = window.innerWidth - (panel.offsetWidth || 380);
      const maxY = window.innerHeight - 50;
      panel.style.left = Math.max(0, Math.min(startLeft + e.clientX - startX, maxX)) + 'px';
      panel.style.top = Math.max(0, Math.min(startTop + e.clientY - startY, maxY)) + 'px';
    }, { signal: state.abortController.signal });

    document.addEventListener('mouseup', () => {
      dragging = false;
    }, { signal: state.abortController.signal });
  }

  // ==================== TRIGGER GS PANEL ====================
  function triggerGSPanel() {
    if (!state.active) return;
    if (!state.gsPanelCreated) createPanel();

    const body = $('#gs-body');
    if (body) body.innerHTML = '<div class="gs-loading">⏳ Opening attributes...</div>';

    const panel = $('#gs-panel');
    if (panel) panel.style.display = 'block';

    openAttributesAccordion(0);
  }

  // ==================== FULL CLEANUP (on submit) ====================
  function fullCleanup() {
    console.log('[GS Panel] 🧹 Full cleanup started');

    // 1. Deactivate — interceptors go dormant
    state.active = false;

    // 2. Stop all timers
    stopPolling();
    if (state.dataTimeoutId) {
      clearTimeout(state.dataTimeoutId);
      state.dataTimeoutId = null;
    }
    if (state.positionRetryId) {
      clearInterval(state.positionRetryId);
      state.positionRetryId = null;
    }

    // 3. Remove ALL document/window listeners at once
    if (state.abortController) {
      state.abortController.abort();
      state.abortController = null;
    }

    // 4. Destroy DOM elements completely
    destroyPanel();
    destroyFloatingDisplay();

    // 5. Reset all state flags
    state.textFound = false;
    state.isChecking = false;
    state.buttonClicked = false;
    state.sharedDeliveryClicked = false;
    state.editDetailsClicked = false;
    state.waitingForData = false;
    state.caseTypeDetected = false;
    state.gsPanelCreated = false;
    state.userDragged = false;

    // 6. Clear BDP data
    state.bdp.source = null;
    state.bdp.confidence = null;
    state.bdp.scope = null;
    state.bdp.tolerance = null;
    state.bdp.received = false;

    console.log('[GS Panel] 🧹 Cleanup complete — memory freed');

    // 7. Reactivate for next case
    startFresh();
  }

  // ==================== START FRESH (after cleanup) ====================
  function startFresh() {
    console.log('[GS Panel] 🔄 Ready for next case');

    // New AbortController for new listeners
    state.abortController = new AbortController();

    // Activate interceptors
    state.active = true;

    // Start polling for next case type
    startPolling();
  }

  // ==================== INITIALIZE ====================
  function initialize() {
    console.log('[GS Panel] Initializing (Memory Optimized)...');

    // Setup smart interceptors (one-time, permanent but dormant when inactive)
    setupInterceptors();

    // Create fresh AbortController
    state.abortController = new AbortController();

    // Activate
    state.active = true;

    // Start polling for case type
    startPolling();

    // Submit button listener (permanent — outside AbortController)
    document.addEventListener('click', (e) => {
      if (e.target?.id === 'submit-btn') {
        console.log('[GS Panel] Submit clicked — triggering cleanup');
        setTimeout(fullCleanup, 100);
      }
    }, true);

    // Initial check
    setTimeout(checkForCaseType, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
