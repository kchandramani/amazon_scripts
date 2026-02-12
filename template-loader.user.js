// ==UserScript==
// @name         🔧 GeoStudio Scripts - Template Loader
// @namespace    https://github.com/kchandramani/amazon_scripts
// @version      1.5.0
// @description  Loads template scripts inside iframe - works with Master Loader
// @author       kchandramani
// @match        https://na.templates.geostudio.last-mile.amazon.dev/*
// @match        https://eu.templates.geostudio.last-mile.amazon.dev/*
// @match        https://fe.templates.geostudio.last-mile.amazon.dev/*
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
// @downloadURL  https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/template-loader.user.js
// @updateURL    https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/template-loader.user.js
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        GITHUB_USERNAME: 'kchandramani',
        REPO_NAME: 'amazon_scripts',
        BRANCH: 'main',
        LOADER_VERSION: '1.5.0'
    };

    const BASE_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/${CONFIG.BRANCH}`;
    const MANIFEST_URL = `${BASE_URL}/manifest.json`;
    const SCRIPTS_BASE = `${BASE_URL}/scripts`;
    const CURRENT_URL = window.location.href;
    const IS_IFRAME = (window.self !== window.top);

    const Logger = {
        prefix: IS_IFRAME ? '[🔧 GS Template 📦 IFRAME]' : '[🔧 GS Template]',
        info: function (msg) { console.log(`%c${this.prefix} ${msg}`, 'color: #2196F3; font-weight: bold;'); },
        warn: function (msg) { console.warn(`${this.prefix} ${msg}`); },
        error: function (msg) { console.error(`${this.prefix} ${msg}`); },
        success: function (scriptName) { console.log(`%c${this.prefix} ✅ ${scriptName}`, 'color: #4CAF50; font-weight: bold;'); },
        fail: function (scriptName, error) { console.error(`${this.prefix} ❌ ${scriptName}:`, error); }
    };

    function shouldRunOnCurrentPage(matchPatterns) {
        if (!matchPatterns || matchPatterns.length === 0) return true;
        for (let i = 0; i < matchPatterns.length; i++) {
            if (CURRENT_URL.includes(matchPatterns[i])) return true;
        }
        return false;
    }

    // ── Use same cache as Master Loader ──

    const Cache = {
        getManifest: function () { try { const d = GM_getValue('manifest', null); return d ? JSON.parse(d) : null; } catch (e) { return null; } },
        setManifest: function (m) { GM_setValue('manifest', JSON.stringify(m)); },
        getScript: function (f) { return GM_getValue('script_' + f, null); },
        setScript: function (f, c) { GM_setValue('script_' + f, c); },
        getVersion: function () { return GM_getValue('manifestVersion', '0'); },
        setVersion: function (v) { GM_setValue('manifestVersion', v); },
        isFirstRun: function () { return GM_getValue('firstRunComplete', false) === false; }
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

    // ── GM Bridge for template scripts ──

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

    // ── Main Logic ──

    async function main() {
        Logger.info('🚀 Template Loader v' + CONFIG.LOADER_VERSION + ' starting...');
        Logger.info('📍 URL: ' + window.location.hostname + window.location.pathname);
        if (IS_IFRAME) Logger.info('📦 Running INSIDE IFRAME (after Submit click)');

        // Check if Master Loader has already cached scripts
        let manifest = Cache.getManifest();

        if (!manifest) {
            Logger.info('⏳ No cache found. Downloading scripts directly...');
            await downloadAndRun();
            return;
        }

        // Kill switch
        if (manifest.globalSettings && manifest.globalSettings.killSwitch) {
            Logger.warn('🛑 Kill switch is ON');
            return;
        }

        // Load template scripts from cache
        loadTemplateScripts(manifest);
    }

    function loadTemplateScripts(manifest) {
        const scripts = manifest.scripts
            .filter(function (s) { return s.enabled; })
            .filter(function (s) { return shouldRunOnCurrentPage(s.matchPatterns); })
            .sort(function (a, b) { return a.priority - b.priority; });

        Logger.info('⚡ Loading ' + scripts.length + ' template scripts from cache (v' + Cache.getVersion() + ')...');

        let loaded = 0, failed = 0;

        scripts.forEach(function (script) {
            const code = Cache.getScript(script.file);
            if (code) {
                if (executeScript(code, script.name)) loaded++;
                else failed++;
            } else {
                Logger.warn('⚠️ No cache: ' + script.name + ' - downloading...');
                // Try to download individually
                downloadSingleScript(script);
                failed++;
            }
        });

        Logger.info('🎉 Done! ✅ Loaded: ' + loaded + ' | ❌ Failed: ' + failed);
    }

    async function downloadSingleScript(script) {
        try {
            const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + script.file);
            Cache.setScript(script.file, code);
            executeScript(code, script.name + ' (fresh download)');
        } catch (e) {
            Logger.error('❌ Failed to download: ' + script.name);
        }
    }

    async function downloadAndRun() {
        try {
            Logger.info('📡 Downloading manifest...');
            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);

            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);

            // Download only template scripts
            const templateScripts = manifest.scripts
                .filter(function (s) { return s.enabled; })
                .filter(function (s) { return shouldRunOnCurrentPage(s.matchPatterns); });

            Logger.info('📦 Downloading ' + templateScripts.length + ' template scripts...');

            for (let i = 0; i < templateScripts.length; i++) {
                const script = templateScripts[i];
                try {
                    const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + script.file);
                    Cache.setScript(script.file, code);
                    executeScript(code, script.name);
                } catch (e) {
                    Logger.error('❌ Failed: ' + script.name);
                }
            }

            Logger.info('🎉 Template scripts loaded!');

        } catch (e) {
            Logger.error('❌ Failed to download: ' + e.message);
        }
    }

    // ── Start ──

    main();

})();
