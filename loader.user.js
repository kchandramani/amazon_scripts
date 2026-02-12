// ==UserScript==
// @name         🔧 GeoStudio Scripts - Master Loader
// @namespace    https://github.com/kchandramani/amazon_scripts
// @version      1.3.0
// @description  Centralized GeoStudio script loader by kchandramani - Install once, auto-updates on page refresh
// @author       kchandramani
// @match        https://na.geostudio.last-mile.amazon.dev/place*
// @match        https://eu.geostudio.last-mile.amazon.dev/place*
// @match        https://fe.geostudio.last-mile.amazon.dev/place*
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
// @noframes
// @downloadURL  https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/loader.user.js
// @updateURL    https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/loader.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ╔══════════════════════════════════════════════════════════╗
    // ║  CONFIGURATION                                           ║
    // ╚══════════════════════════════════════════════════════════╝

    const CONFIG = {
        GITHUB_USERNAME: 'kchandramani',
        REPO_NAME: 'amazon_scripts',
        BRANCH: 'main',
        DEBUG: false,
        LOADER_VERSION: '1.3.0'
    };

    const BASE_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/${CONFIG.BRANCH}`;
    const MANIFEST_URL = `${BASE_URL}/manifest.json`;
    const SCRIPTS_BASE = `${BASE_URL}/scripts`;
    const CURRENT_URL = window.location.href;
    const IS_PLACE_PAGE = CURRENT_URL.includes('geostudio.last-mile.amazon.dev/place');
    const IS_TEMPLATE_PAGE = CURRENT_URL.includes('templates.geostudio.last-mile.amazon.dev');


    // ╔══════════════════════════════════════════════════════════╗
    // ║  LOGGER                                                  ║
    // ╚══════════════════════════════════════════════════════════╝

    const Logger = {
        prefix: '[🔧 GS Loader]',
        info: function (msg) {
            console.log(`%c${this.prefix} ${msg}`, 'color: #FF9900; font-weight: bold;');
        },
        warn: function (msg) {
            console.warn(`${this.prefix} ${msg}`);
        },
        error: function (msg) {
            console.error(`${this.prefix} ${msg}`);
        },
        debug: function (msg) {
            if (CONFIG.DEBUG) {
                console.log(`%c${this.prefix} [DEBUG] ${msg}`, 'color: #9E9E9E;');
            }
        },
        success: function (scriptName) {
            console.log(`%c${this.prefix} ✅ ${scriptName}`, 'color: #4CAF50; font-weight: bold;');
        },
        skip: function (scriptName, reason) {
            if (CONFIG.DEBUG) {
                console.log(`%c${this.prefix} ⏭️ ${scriptName} (${reason})`, 'color: #9E9E9E;');
            }
        },
        fail: function (scriptName, error) {
            console.error(`${this.prefix} ❌ ${scriptName}:`, error);
        },
        iframe: function (msg) {
            console.log(`%c${this.prefix} 📦 [IFRAME] ${msg}`, 'color: #2196F3; font-weight: bold;');
        }
    };


    // ╔══════════════════════════════════════════════════════════╗
    // ║  URL MATCHER                                             ║
    // ╚══════════════════════════════════════════════════════════╝

    function shouldRunOnPage(matchPatterns, pageUrl) {
        if (!matchPatterns || matchPatterns.length === 0) return true;
        for (let i = 0; i < matchPatterns.length; i++) {
            if (pageUrl.includes(matchPatterns[i])) return true;
        }
        return false;
    }

    function shouldRunOnCurrentPage(matchPatterns) {
        return shouldRunOnPage(matchPatterns, CURRENT_URL);
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  CACHE MANAGER                                           ║
    // ╚══════════════════════════════════════════════════════════╝

    const Cache = {
        getManifest: function () {
            try {
                const data = GM_getValue('manifest', null);
                return data ? JSON.parse(data) : null;
            } catch (e) { return null; }
        },
        setManifest: function (manifest) {
            GM_setValue('manifest', JSON.stringify(manifest));
        },
        getScript: function (filename) {
            return GM_getValue('script_' + filename, null);
        },
        setScript: function (filename, code) {
            GM_setValue('script_' + filename, code);
        },
        getVersion: function () {
            return GM_getValue('manifestVersion', '0');
        },
        setVersion: function (version) {
            GM_setValue('manifestVersion', version);
        },
        isFirstRun: function () {
            return GM_getValue('firstRunComplete', false) === false;
        },
        setFirstRunComplete: function () {
            GM_setValue('firstRunComplete', true);
        },
        clearAll: function () {
            const keys = GM_listValues();
            keys.forEach(function (key) { GM_deleteValue(key); });
        }
    };


    // ╔══════════════════════════════════════════════════════════╗
    // ║  NETWORK                                                 ║
    // ╚══════════════════════════════════════════════════════════╝

    function fetchFromGitHub(url) {
        return new Promise(function (resolve, reject) {
            Logger.debug('Fetching: ' + url);
            GM_xmlhttpRequest({
                method: 'GET',
                url: url + '?t=' + Date.now(),
                timeout: 15000,
                headers: { 'Cache-Control': 'no-cache' },
                onload: function (response) {
                    if (response.status === 200) resolve(response.responseText);
                    else reject(new Error('HTTP ' + response.status));
                },
                onerror: function () { reject(new Error('Network error')); },
                ontimeout: function () { reject(new Error('Timeout')); }
            });
        });
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  GM_ BRIDGE                                              ║
    // ╚══════════════════════════════════════════════════════════╝

    window.__GM_BRIDGE = {
        GM_setValue: GM_setValue,
        GM_getValue: GM_getValue,
        GM_deleteValue: GM_deleteValue,
        GM_xmlhttpRequest: GM_xmlhttpRequest,
        GM_addStyle: GM_addStyle,
        GM_notification: GM_notification,
        GM_registerMenuCommand: GM_registerMenuCommand
    };


    // ╔══════════════════════════════════════════════════════════╗
    // ║  SCRIPT EXECUTOR (for current page)                      ║
    // ╚══════════════════════════════════════════════════════════╝

    function executeScript(code, scriptName) {
        try {
            const wrappedCode = `
                (function() {
                    'use strict';
                    var GM_setValue = window.__GM_BRIDGE.GM_setValue;
                    var GM_getValue = window.__GM_BRIDGE.GM_getValue;
                    var GM_deleteValue = window.__GM_BRIDGE.GM_deleteValue;
                    var GM_xmlhttpRequest = window.__GM_BRIDGE.GM_xmlhttpRequest;
                    var GM_addStyle = window.__GM_BRIDGE.GM_addStyle;
                    var GM_notification = window.__GM_BRIDGE.GM_notification;
                    var GM_registerMenuCommand = window.__GM_BRIDGE.GM_registerMenuCommand;
                    try {
                        ${code}
                    } catch(e) {
                        console.error('[${scriptName}] Runtime Error:', e);
                    }
                })();
            `;
            eval(wrappedCode);
            Logger.success(scriptName);
            return true;
        } catch (e) {
            Logger.fail(scriptName, e.message);
            return false;
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  IFRAME SCRIPT INJECTOR                                  ║
    // ║  Injects template scripts directly into iframe           ║
    // ╚══════════════════════════════════════════════════════════╝

    function injectScriptIntoIframe(iframeDoc, code, scriptName) {
        try {
            const scriptEl = iframeDoc.createElement('script');
            scriptEl.textContent = `
                (function() {
                    'use strict';
                    try {
                        ${code}
                    } catch(e) {
                        console.error('[${scriptName}] Runtime Error:', e);
                    }
                })();
            `;
            iframeDoc.body.appendChild(scriptEl);
            Logger.iframe('✅ ' + scriptName);
            return true;
        } catch (e) {
            Logger.iframe('❌ ' + scriptName + ': ' + e.message);
            return false;
        }
    }

    function loadScriptsIntoIframe(iframe) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeUrl = iframe.src || '';

            if (!iframeUrl.includes('templates.geostudio.last-mile.amazon.dev')) {
                return; // Not a templates iframe, skip
            }

            Logger.iframe('Found templates iframe: ' + iframeUrl);

            const manifest = Cache.getManifest();
            if (!manifest) return;

            const templateScripts = manifest.scripts
                .filter(function (s) { return s.enabled; })
                .filter(function (s) { return shouldRunOnPage(s.matchPatterns, iframeUrl); })
                .sort(function (a, b) { return a.priority - b.priority; });

            if (templateScripts.length === 0) {
                Logger.iframe('No matching scripts for this iframe');
                return;
            }

            Logger.iframe('Injecting ' + templateScripts.length + ' scripts...');

            let loaded = 0;
            templateScripts.forEach(function (script) {
                const code = Cache.getScript(script.file);
                if (code) {
                    if (injectScriptIntoIframe(iframeDoc, code, script.name)) {
                        loaded++;
                    }
                } else {
                    Logger.iframe('⚠️ No cache: ' + script.name);
                }
            });

            Logger.iframe('🎉 Done! Injected ' + loaded + ' scripts into iframe');

        } catch (e) {
            Logger.iframe('❌ Cannot access iframe: ' + e.message);
            Logger.iframe('This might be a cross-origin iframe restriction');
        }
    }

    // ╔══════════════════════════════════════════════════════════╗
    // ║  IFRAME WATCHER                                          ║
    // ║  Watches for templates iframe to appear, then injects    ║
    // ╚══════════════════════════════════════════════════════════╝

    function watchForIframes() {
        // Only watch for iframes on the place page
        if (!IS_PLACE_PAGE) return;

        Logger.info('👁️ Watching for template iframes...');

        const processedIframes = new WeakSet();

        function checkIframes() {
            const iframes = document.querySelectorAll('iframe');

            iframes.forEach(function (iframe) {
                // Skip already processed iframes
                if (processedIframes.has(iframe)) return;

                const src = iframe.src || '';
                if (src.includes('templates.geostudio.last-mile.amazon.dev')) {

                    // Mark as processed
                    processedIframes.add(iframe);

                    // If iframe is already loaded
                    if (iframe.contentDocument && iframe.contentDocument.body) {
                        Logger.iframe('Iframe already loaded, injecting now...');
                        loadScriptsIntoIframe(iframe);
                    }

                    // Also listen for load event (in case it reloads)
                    iframe.addEventListener('load', function () {
                        Logger.iframe('Iframe loaded/reloaded, injecting scripts...');
                        // Small delay to let iframe DOM settle
                        setTimeout(function () {
                            loadScriptsIntoIframe(iframe);
                        }, 500);
                    });
                }
            });
        }

        // Check immediately
        checkIframes();

        // Watch for new iframes being added to DOM
        const observer = new MutationObserver(function (mutations) {
            let hasNewNodes = false;
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes.length > 0) {
                    hasNewNodes = true;
                }
            });
            if (hasNewNodes) {
                checkIframes();
            }
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                observer.observe(document.body, { childList: true, subtree: true });
            });
        }

        // Also check periodically (backup)
        setInterval(checkIframes, 2000);
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  LOADING OVERLAY                                         ║
    // ╚══════════════════════════════════════════════════════════╝

    function showLoadingOverlay(message) {
        const overlay = document.createElement('div');
        overlay.id = 'gs-loader-overlay';
        overlay.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:Arial,sans-serif;">
                <div style="background:white;padding:30px 50px;border-radius:10px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);border-top:4px solid #FF9900;">
                    <div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #FF9900;border-radius:50%;animation:gsSpin 1s linear infinite;margin:0 auto 15px;"></div>
                    <div style="font-size:16px;color:#333;font-weight:bold;">🔧 ${message}</div>
                    <div style="font-size:12px;color:#999;margin-top:8px;">Please wait...</div>
                </div>
            </div>
            <style>@keyframes gsSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
        `;
        if (document.body) document.body.appendChild(overlay);
        else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(overlay); });
    }

    function removeLoadingOverlay() {
        const overlay = document.getElementById('gs-loader-overlay');
        if (overlay) overlay.remove();
    }

    function showStatusBadge(message, type) {
        const colors = {
            success: '#4CAF50', error: '#f44336',
            update: '#FF9900', info: '#2196F3'
        };
        const badge = document.createElement('div');
        badge.style.cssText = `
            position:fixed;bottom:20px;right:20px;background:${colors[type] || colors.info};
            color:white;padding:12px 20px;border-radius:8px;z-index:999999;
            font-family:Arial,sans-serif;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,0.3);
            cursor:pointer;transition:opacity 0.3s;
        `;
        badge.textContent = message;
        badge.onclick = function () { badge.remove(); };

        if (document.body) document.body.appendChild(badge);
        else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(badge); });

        setTimeout(function () {
            if (badge.parentNode) {
                badge.style.opacity = '0';
                setTimeout(function () { badge.remove(); }, 300);
            }
        }, 5000);
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  MAIN LOGIC                                              ║
    // ╚══════════════════════════════════════════════════════════╝

    async function main() {
        Logger.info('🚀 Master Loader v' + CONFIG.LOADER_VERSION + ' starting...');
        Logger.info('📍 Page: ' + window.location.hostname + window.location.pathname);

        if (IS_PLACE_PAGE) Logger.info('📍 Detected: Place Page');
        if (IS_TEMPLATE_PAGE) Logger.info('📍 Detected: Template Page (direct access)');

        // CASE 1: First time
        if (Cache.isFirstRun()) {
            await firstTimeDownload();
            return;
        }

        // CASE 2: Has cache
        const manifest = Cache.getManifest();

        if (!manifest) {
            Logger.warn('⚠️ Cache corrupted. Re-downloading...');
            await firstTimeDownload();
            return;
        }

        // Kill switch
        if (manifest.globalSettings && manifest.globalSettings.killSwitch) {
            Logger.warn('🛑 Kill switch is ON');
            showStatusBadge('🛑 Scripts disabled by admin', 'error');
            return;
        }

        // Load scripts for CURRENT page from cache
        loadScriptsFromCache(manifest);

        // If on place page, watch for template iframes
        if (IS_PLACE_PAGE) {
            Logger.info('👁️ Starting iframe watcher for template scripts...');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', watchForIframes);
            } else {
                watchForIframes();
            }
        }

        // Check for updates
        Logger.info('🔍 Checking for updates...');
        checkForUpdates();
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  LOAD FROM CACHE (for current page only)                 ║
    // ╚══════════════════════════════════════════════════════════╝

    function loadScriptsFromCache(manifest) {
        const activeScripts = manifest.scripts
            .filter(function (s) { return s.enabled; })
            .sort(function (a, b) { return a.priority - b.priority; });

        Logger.info('⚡ Loading scripts from cache (v' + Cache.getVersion() + ')...');

        let loaded = 0;
        let skipped = 0;
        let failed = 0;
        let iframeScripts = 0;

        activeScripts.forEach(function (script) {
            if (!shouldRunOnCurrentPage(script.matchPatterns)) {
                // Check if it's a template script (will be loaded via iframe injection)
                if (IS_PLACE_PAGE && shouldRunOnPage(script.matchPatterns, 'templates.geostudio.last-mile.amazon.dev')) {
                    Logger.skip(script.name, 'will load in iframe');
                    iframeScripts++;
                } else {
                    Logger.skip(script.name, 'URL mismatch');
                }
                skipped++;
                return;
            }

            const code = Cache.getScript(script.file);
            if (code) {
                if (executeScript(code, script.name)) {
                    loaded++;
                } else {
                    failed++;
                }
            } else {
                Logger.warn('⚠️ No cache: ' + script.name);
                failed++;
            }
        });

        let summary = '🎉 Done! ✅ Loaded: ' + loaded + ' | ⏭️ Skipped: ' + skipped;
        if (iframeScripts > 0) {
            summary += ' (' + iframeScripts + ' for iframe)';
        }
        summary += ' | ❌ Failed: ' + failed;
        Logger.info(summary);

        if (manifest.announcement && manifest.announcement.length > 0) {
            Logger.info('📢 ' + manifest.announcement);
            showStatusBadge('📢 ' + manifest.announcement, 'info');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  FIRST TIME DOWNLOAD                                     ║
    // ╚══════════════════════════════════════════════════════════╝

    async function firstTimeDownload() {
        try {
            showLoadingOverlay('Downloading GeoStudio scripts for first time...');
            Logger.info('🆕 First time setup...');

            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);

            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);

            Logger.info('📦 Downloading ' + manifest.scripts.length + ' scripts...');

            const results = await Promise.all(
                manifest.scripts.map(function (script) {
                    return fetchFromGitHub(SCRIPTS_BASE + '/' + script.file)
                        .then(function (code) {
                            Cache.setScript(script.file, code);
                            return { script: script, code: code, success: true };
                        })
                        .catch(function (err) {
                            Logger.error('Download failed: ' + script.name + ' - ' + err.message);
                            return { script: script, code: null, success: false };
                        });
                })
            );

            let loaded = 0;
            results.forEach(function (result) {
                if (result.success && result.code) {
                    if (shouldRunOnCurrentPage(result.script.matchPatterns) && result.script.enabled) {
                        if (executeScript(result.code, result.script.name)) {
                            loaded++;
                        }
                    }
                }
            });

            Cache.setFirstRunComplete();
            removeLoadingOverlay();

            Logger.info('🎉 Setup complete! Loaded ' + loaded + ' scripts (v' + manifest.version + ')');
            showStatusBadge('✅ GeoStudio Scripts installed! (' + loaded + ' scripts)', 'success');

            // Start iframe watcher after first download
            if (IS_PLACE_PAGE) {
                Logger.info('👁️ Starting iframe watcher...');
                watchForIframes();
            }

        } catch (e) {
            Logger.error('❌ First time download failed: ' + e.message);
            removeLoadingOverlay();
            showStatusBadge('❌ Failed to download scripts. Refresh to retry.', 'error');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  CHECK FOR UPDATES                                       ║
    // ╚══════════════════════════════════════════════════════════╝

    async function checkForUpdates() {
        try {
            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const remoteManifest = JSON.parse(manifestRaw);
            const currentVersion = Cache.getVersion();

            if (remoteManifest.version === currentVersion) {
                Logger.info('✅ Up to date (v' + currentVersion + ')');
                return;
            }

            Logger.info('🔄 Update: v' + currentVersion + ' → v' + remoteManifest.version);

            Cache.setManifest(remoteManifest);
            Cache.setVersion(remoteManifest.version);

            let updated = 0;
            for (let i = 0; i < remoteManifest.scripts.length; i++) {
                const script = remoteManifest.scripts[i];
                try {
                    const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + script.file);
                    Cache.setScript(script.file, code);
                    updated++;
                    Logger.debug('📥 ' + script.name);
                } catch (e) {
                    Logger.warn('⚠️ Failed: ' + script.name);
                }
            }

            Logger.info('✅ ' + updated + ' scripts updated to v' + remoteManifest.version);
            Logger.info('🔄 Refresh page to use updated scripts.');
            showStatusBadge('🔄 Scripts updated to v' + remoteManifest.version + ' - Refresh to apply!', 'update');

        } catch (e) {
            Logger.debug('⚠️ Update check failed: ' + e.message);
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  FORCE UPDATE                                            ║
    // ╚══════════════════════════════════════════════════════════╝

    async function forceUpdate() {
        try {
            Logger.info('🔄 Force updating...');
            showLoadingOverlay('Force updating GeoStudio scripts...');

            GM_setValue('manifestVersion', '0');

            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);

            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);

            let count = 0;
            for (let i = 0; i < manifest.scripts.length; i++) {
                const script = manifest.scripts[i];
                try {
                    const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + script.file);
                    Cache.setScript(script.file, code);
                    count++;
                    Logger.info('📥 ' + script.name);
                } catch (e) {
                    Logger.warn('⚠️ Failed: ' + script.name);
                }
            }

            removeLoadingOverlay();
            Logger.info('✅ Force update complete! ' + count + ' scripts (v' + manifest.version + ')');
            setTimeout(function () { location.reload(); }, 500);

        } catch (e) {
            Logger.error('❌ Force update failed: ' + e.message);
            removeLoadingOverlay();
            alert('❌ Update failed! Check internet connection.');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  TAMPERMONKEY MENU                                       ║
    // ╚══════════════════════════════════════════════════════════╝

    GM_registerMenuCommand('🔄 Force Update Scripts', function () {
        if (confirm('Download latest scripts from GitHub?')) forceUpdate();
    });

    GM_registerMenuCommand('📋 Script Status', function () {
        const manifest = Cache.getManifest();
        if (!manifest) { alert('No scripts loaded yet.'); return; }

        let s = '╔═══════════════════════════════════════╗\n';
        s += '║   🔧 GeoStudio Scripts Status          ║\n';
        s += '╚═══════════════════════════════════════╝\n\n';
        s += '📦 Version: ' + Cache.getVersion() + '\n';
        s += '🔧 Loader: v' + CONFIG.LOADER_VERSION + '\n';
        s += '🛑 Kill Switch: ' + (manifest.globalSettings.killSwitch ? 'ON ⚠️' : 'OFF ✅') + '\n';
        s += '📍 Current Page: ' + window.location.hostname + '\n';
        s += '📦 Iframe Injection: ' + (IS_PLACE_PAGE ? 'Active ✅' : 'N/A') + '\n';
        s += '🔄 Updates: Every manual page refresh\n';
        s += '\n────── Scripts ──────\n\n';

        manifest.scripts.forEach(function (sc) {
            const cached = Cache.getScript(sc.file) ? '💾' : '⚠️';
            const enabled = sc.enabled ? '✅' : '❌';
            const matchesCurrent = shouldRunOnCurrentPage(sc.matchPatterns) ? '🟢' : '🔴';
            const matchesIframe = shouldRunOnPage(sc.matchPatterns, 'templates.geostudio.last-mile.amazon.dev') ? '📦' : '';
            s += enabled + ' ' + cached + ' ' + matchesCurrent + ' ' + matchesIframe + ' [P' + sc.priority + '] ' + sc.name + '\n';
            s += '   📝 ' + sc.description + '\n';
            s += '   🌐 ' + (sc.matchPatterns ? sc.matchPatterns.join(', ') : 'All pages') + '\n\n';
        });

        s += '────── Legend ──────\n';
        s += '✅/❌ = Enabled/Disabled\n';
        s += '💾/⚠️ = Cached/Not cached\n';
        s += '🟢/🔴 = Runs on this page / Not this page\n';
        s += '📦 = Injected into template iframe\n';

        alert(s);
    });

    GM_registerMenuCommand('🗑️ Clear Cache & Redownload', function () {
        if (confirm('Clear all cached scripts and redownload?')) {
            Cache.clearAll();
            location.reload();
        }
    });

    GM_registerMenuCommand('🐛 Toggle Debug Mode', function () {
        CONFIG.DEBUG = !CONFIG.DEBUG;
        GM_setValue('debugMode', CONFIG.DEBUG);
        alert('Debug mode: ' + (CONFIG.DEBUG ? 'ON 🟢' : 'OFF 🔴') + '\nRefresh to see logs.');
    });

    GM_registerMenuCommand('📦 Re-inject Iframe Scripts', function () {
        Logger.info('📦 Re-injecting iframe scripts...');
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(function(iframe) {
            if (iframe.src && iframe.src.includes('templates.geostudio.last-mile.amazon.dev')) {
                loadScriptsIntoIframe(iframe);
            }
        });
    });

    GM_registerMenuCommand('ℹ️ About', function () {
        alert('🔧 GeoStudio Scripts Loader\n\nAuthor: kchandramani\nGitHub: github.com/kchandramani/amazon_scripts\nLoader: v' + CONFIG.LOADER_VERSION + '\nScripts: v' + Cache.getVersion() + '\nUpdates: Every manual page refresh\nIframe Injection: ✅ Enabled');
    });


    // ╔══════════════════════════════════════════════════════════╗
    // ║  START                                                   ║
    // ╚══════════════════════════════════════════════════════════╝

    CONFIG.DEBUG = GM_getValue('debugMode', false);
    main();

})();
