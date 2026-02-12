// ==UserScript==
// @name         🔧 GeoStudio Scripts - Master Loader
// @namespace    https://github.com/kchandramani/amazon_scripts
// @version      1.5.0
// @description  Centralized GeoStudio script loader - Place page scripts
// @author       kchandramani
// @match        https://na.geostudio.last-mile.amazon.dev/place*
// @match        https://eu.geostudio.last-mile.amazon.dev/place*
// @match        https://fe.geostudio.last-mile.amazon.dev/place*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @connect      raw.githubusercontent.com
// @run-at       document-start
// @noframes
// @downloadURL  https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/loader.user.js
// @updateURL    https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/loader.user.js
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        GITHUB_USERNAME: 'kchandramani',
        REPO_NAME: 'amazon_scripts',
        BRANCH: 'main',
        DEBUG: false,
        LOADER_VERSION: '1.5.0'
    };

    const BASE_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/${CONFIG.BRANCH}`;
    const MANIFEST_URL = `${BASE_URL}/manifest.json`;
    const SCRIPTS_BASE = `${BASE_URL}/scripts`;
    const CURRENT_URL = window.location.href;

    const Logger = {
        prefix: '[🔧 GS Loader]',
        info: function (msg) { console.log(`%c${this.prefix} ${msg}`, 'color: #FF9900; font-weight: bold;'); },
        warn: function (msg) { console.warn(`${this.prefix} ${msg}`); },
        error: function (msg) { console.error(`${this.prefix} ${msg}`); },
        debug: function (msg) { if (CONFIG.DEBUG) console.log(`%c${this.prefix} [DEBUG] ${msg}`, 'color: #9E9E9E;'); },
        success: function (scriptName) { console.log(`%c${this.prefix} ✅ ${scriptName}`, 'color: #4CAF50; font-weight: bold;'); },
        skip: function (scriptName, reason) { if (CONFIG.DEBUG) console.log(`%c${this.prefix} ⏭️ ${scriptName} (${reason})`, 'color: #9E9E9E;'); },
        fail: function (scriptName, error) { console.error(`${this.prefix} ❌ ${scriptName}:`, error); }
    };

    function shouldRunOnCurrentPage(matchPatterns) {
        if (!matchPatterns || matchPatterns.length === 0) return true;
        for (let i = 0; i < matchPatterns.length; i++) {
            if (CURRENT_URL.includes(matchPatterns[i])) return true;
        }
        return false;
    }

    const Cache = {
        getManifest: function () { try { const d = GM_getValue('manifest', null); return d ? JSON.parse(d) : null; } catch (e) { return null; } },
        setManifest: function (m) { GM_setValue('manifest', JSON.stringify(m)); },
        getScript: function (f) { return GM_getValue('script_' + f, null); },
        setScript: function (f, c) { GM_setValue('script_' + f, c); },
        getVersion: function () { return GM_getValue('manifestVersion', '0'); },
        setVersion: function (v) { GM_setValue('manifestVersion', v); },
        isFirstRun: function () { return GM_getValue('firstRunComplete', false) === false; },
        setFirstRunComplete: function () { GM_setValue('firstRunComplete', true); },
        clearAll: function () { GM_listValues().forEach(function (k) { GM_deleteValue(k); }); }
    };

    function fetchFromGitHub(url) {
        return new Promise(function (resolve, reject) {
            GM_xmlhttpRequest({
                method: 'GET', url: url + '?t=' + Date.now(), timeout: 15000,
                headers: { 'Cache-Control': 'no-cache' },
                onload: function (r) { r.status === 200 ? resolve(r.responseText) : reject(new Error('HTTP ' + r.status)); },
                onerror: function () { reject(new Error('Network error')); },
                ontimeout: function () { reject(new Error('Timeout')); }
            });
        });
    }

    window.__GM_BRIDGE = {
        GM_setValue: GM_setValue, GM_getValue: GM_getValue, GM_deleteValue: GM_deleteValue,
        GM_xmlhttpRequest: GM_xmlhttpRequest, GM_addStyle: GM_addStyle,
        GM_notification: GM_notification, GM_registerMenuCommand: GM_registerMenuCommand
    };

    function executeScript(code, scriptName) {
        try {
            const wrappedCode = `(function(){'use strict';var GM_setValue=window.__GM_BRIDGE.GM_setValue;var GM_getValue=window.__GM_BRIDGE.GM_getValue;var GM_deleteValue=window.__GM_BRIDGE.GM_deleteValue;var GM_xmlhttpRequest=window.__GM_BRIDGE.GM_xmlhttpRequest;var GM_addStyle=window.__GM_BRIDGE.GM_addStyle;var GM_notification=window.__GM_BRIDGE.GM_notification;var GM_registerMenuCommand=window.__GM_BRIDGE.GM_registerMenuCommand;try{${code}}catch(e){console.error('[${scriptName}] Runtime Error:',e);}})();`;
            eval(wrappedCode);
            Logger.success(scriptName);
            return true;
        } catch (e) { Logger.fail(scriptName, e.message); return false; }
    }

    function showLoadingOverlay(message) {
        const overlay = document.createElement('div');
        overlay.id = 'gs-loader-overlay';
        overlay.innerHTML = `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:Arial,sans-serif;"><div style="background:white;padding:30px 50px;border-radius:10px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);border-top:4px solid #FF9900;"><div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #FF9900;border-radius:50%;animation:gsSpin 1s linear infinite;margin:0 auto 15px;"></div><div style="font-size:16px;color:#333;font-weight:bold;">🔧 ${message}</div><div style="font-size:12px;color:#999;margin-top:8px;">Please wait...</div></div></div><style>@keyframes gsSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
        if (document.body) document.body.appendChild(overlay);
        else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(overlay); });
    }

    function removeLoadingOverlay() { const o = document.getElementById('gs-loader-overlay'); if (o) o.remove(); }

    function showStatusBadge(message, type) {
        const colors = { success: '#4CAF50', error: '#f44336', update: '#FF9900', info: '#2196F3' };
        const badge = document.createElement('div');
        badge.style.cssText = `position:fixed;bottom:20px;right:20px;background:${colors[type] || colors.info};color:white;padding:12px 20px;border-radius:8px;z-index:999999;font-family:Arial,sans-serif;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,0.3);cursor:pointer;transition:opacity 0.3s;`;
        badge.textContent = message;
        badge.onclick = function () { badge.remove(); };
        if (document.body) document.body.appendChild(badge);
        else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(badge); });
        setTimeout(function () { if (badge.parentNode) { badge.style.opacity = '0'; setTimeout(function () { badge.remove(); }, 300); } }, 5000);
    }

    // ── Main Logic ──

    async function main() {
        Logger.info('🚀 Master Loader v' + CONFIG.LOADER_VERSION + ' starting...');
        Logger.info('📍 Place Page: ' + window.location.hostname);

        if (Cache.isFirstRun()) { await firstTimeDownload(); return; }

        const manifest = Cache.getManifest();
        if (!manifest) { await firstTimeDownload(); return; }
        if (manifest.globalSettings && manifest.globalSettings.killSwitch) {
            Logger.warn('🛑 Kill switch is ON');
            showStatusBadge('🛑 Scripts disabled by admin', 'error');
            return;
        }

        loadScriptsFromCache(manifest);
        Logger.info('🔍 Checking for updates...');
        checkForUpdates();
    }

    function loadScriptsFromCache(manifest) {
        const scripts = manifest.scripts.filter(function (s) { return s.enabled; }).sort(function (a, b) { return a.priority - b.priority; });
        Logger.info('⚡ Loading from cache (v' + Cache.getVersion() + ')...');
        let loaded = 0, skipped = 0, failed = 0;

        scripts.forEach(function (script) {
            if (!shouldRunOnCurrentPage(script.matchPatterns)) { Logger.skip(script.name, 'URL mismatch'); skipped++; return; }
            const code = Cache.getScript(script.file);
            if (code) { executeScript(code, script.name) ? loaded++ : failed++; }
            else { Logger.warn('⚠️ No cache: ' + script.name); failed++; }
        });

        Logger.info('🎉 Done! ✅ Loaded: ' + loaded + ' | ⏭️ Skipped: ' + skipped + ' | ❌ Failed: ' + failed);
        if (manifest.announcement && manifest.announcement.length > 0) {
            Logger.info('📢 ' + manifest.announcement);
            showStatusBadge('📢 ' + manifest.announcement, 'info');
        }
    }

    async function firstTimeDownload() {
        try {
            showLoadingOverlay('Downloading scripts for first time...');
            Logger.info('🆕 First time setup...');
            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);
            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);

            const results = await Promise.all(manifest.scripts.map(function (script) {
                return fetchFromGitHub(SCRIPTS_BASE + '/' + script.file)
                    .then(function (code) { Cache.setScript(script.file, code); return { script: script, code: code, success: true }; })
                    .catch(function (err) { return { script: script, code: null, success: false }; });
            }));

            let loaded = 0;
            results.forEach(function (r) {
                if (r.success && r.code && shouldRunOnCurrentPage(r.script.matchPatterns) && r.script.enabled) {
                    if (executeScript(r.code, r.script.name)) loaded++;
                }
            });

            Cache.setFirstRunComplete();
            removeLoadingOverlay();
            Logger.info('🎉 Setup complete! ' + loaded + ' scripts (v' + manifest.version + ')');
            showStatusBadge('✅ Scripts installed! (' + loaded + ' scripts)', 'success');
        } catch (e) {
            Logger.error('❌ Download failed: ' + e.message);
            removeLoadingOverlay();
            showStatusBadge('❌ Failed. Refresh to retry.', 'error');
        }
    }

    async function checkForUpdates() {
        try {
            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const remote = JSON.parse(manifestRaw);
            if (remote.version === Cache.getVersion()) { Logger.info('✅ Up to date (v' + Cache.getVersion() + ')'); return; }
            Logger.info('🔄 Update: v' + Cache.getVersion() + ' → v' + remote.version);
            Cache.setManifest(remote);
            Cache.setVersion(remote.version);
            let u = 0;
            for (let i = 0; i < remote.scripts.length; i++) {
                try { const c = await fetchFromGitHub(SCRIPTS_BASE + '/' + remote.scripts[i].file); Cache.setScript(remote.scripts[i].file, c); u++; } catch (e) { }
            }
            Logger.info('✅ ' + u + ' scripts updated. Refresh to apply.');
            showStatusBadge('🔄 Updated to v' + remote.version + ' - Refresh!', 'update');
        } catch (e) { Logger.debug('⚠️ Update check failed'); }
    }

    async function forceUpdate() {
        try {
            showLoadingOverlay('Force updating...');
            GM_setValue('manifestVersion', '0');
            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);
            Cache.setManifest(manifest); Cache.setVersion(manifest.version);
            for (let i = 0; i < manifest.scripts.length; i++) {
                try { const c = await fetchFromGitHub(SCRIPTS_BASE + '/' + manifest.scripts[i].file); Cache.setScript(manifest.scripts[i].file, c); } catch (e) { }
            }
            removeLoadingOverlay();
            setTimeout(function () { location.reload(); }, 500);
        } catch (e) { removeLoadingOverlay(); alert('❌ Update failed!'); }
    }

    GM_registerMenuCommand('🔄 Force Update Scripts', function () { if (confirm('Download latest?')) forceUpdate(); });
    GM_registerMenuCommand('📋 Script Status', function () {
        const m = Cache.getManifest(); if (!m) { alert('No scripts.'); return; }
        let s = '🔧 GeoStudio Scripts v' + Cache.getVersion() + '\nLoader: v' + CONFIG.LOADER_VERSION + '\n\n';
        m.scripts.forEach(function (sc) { s += (sc.enabled ? '✅' : '❌') + ' ' + (Cache.getScript(sc.file) ? '💾' : '⚠️') + ' ' + sc.name + '\n'; });
        alert(s);
    });
    GM_registerMenuCommand('🗑️ Clear Cache & Redownload', function () { if (confirm('Clear all?')) { Cache.clearAll(); location.reload(); } });
    GM_registerMenuCommand('🐛 Toggle Debug', function () { CONFIG.DEBUG = !CONFIG.DEBUG; GM_setValue('debugMode', CONFIG.DEBUG); alert('Debug: ' + (CONFIG.DEBUG ? 'ON' : 'OFF')); });

    CONFIG.DEBUG = GM_getValue('debugMode', false);
    main();
})();
