// ==UserScript==
// @name         🔧 GeoStudio Scripts - Master Loader
// @namespace    https://github.com/kchandramani/amazon_scripts
// @version      3.0.0
// @description  Centralized GeoStudio script loader - ONE loader for all pages including iframes
// @author       kchandramani
// @match        https://na.geostudio.last-mile.amazon.dev/*
// @match        https://eu.geostudio.last-mile.amazon.dev/*
// @match        https://fe.geostudio.last-mile.amazon.dev/*
// @match        https://na.templates.geostudio.last-mile.amazon.dev/*
// @match        https://eu.templates.geostudio.last-mile.amazon.dev/*
// @match        https://fe.templates.geostudio.last-mile.amazon.dev/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @connect      raw.githubusercontent.com
// @run-at       document-end
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
        LOADER_VERSION: '3.0.0'
    };

    const BASE_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/${CONFIG.BRANCH}`;
    const MANIFEST_URL = `${BASE_URL}/manifest.json`;
    const SCRIPTS_BASE = `${BASE_URL}/scripts`;
    const CURRENT_URL = window.location.href;

    // ── Detect context ──
    const IS_IFRAME = (window.self !== window.top);
    const IS_PLACE_PAGE = CURRENT_URL.includes('geostudio.last-mile.amazon.dev/place');
    const IS_TEMPLATE_PAGE = CURRENT_URL.includes('templates.geostudio.last-mile.amazon.dev');


    // ╔══════════════════════════════════════════════════════════╗
    // ║  LOGGER                                                  ║
    // ╚══════════════════════════════════════════════════════════╝

    const Logger = {
        prefix: IS_IFRAME ? '[🔧 Loader 📦 IFRAME]' : '[🔧 Loader]',
        color: IS_IFRAME ? '#2196F3' : '#FF9900',

        info: function (msg) {
            console.log(`%c${this.prefix} ${msg}`, `color: ${this.color}; font-weight: bold;`);
        },
        warn: function (msg) {
            console.warn(`${this.prefix} ${msg}`);
        },
        error: function (msg) {
            console.error(`${this.prefix} ${msg}`);
        },
        success: function (name) {
            console.log(`%c${this.prefix} ✅ ${name}`, 'color: #4CAF50; font-weight: bold;');
        },
        skip: function (name) {
            console.log(`%c${this.prefix} ⏭️ ${name} (not for this page)`, 'color: #9E9E9E;');
        },
        fail: function (name, err) {
            console.error(`${this.prefix} ❌ ${name}:`, err);
        }
    };


    // ╔══════════════════════════════════════════════════════════╗
    // ║  URL MATCHER                                             ║
    // ╚══════════════════════════════════════════════════════════╝

    function shouldRunOnCurrentPage(matchPatterns) {
        if (!matchPatterns || matchPatterns.length === 0) return true;
        for (let i = 0; i < matchPatterns.length; i++) {
            if (CURRENT_URL.includes(matchPatterns[i])) return true;
        }
        return false;
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  CACHE MANAGER                                           ║
    // ╚══════════════════════════════════════════════════════════╝

    const Cache = {
        getManifest: function () {
            try {
                const d = GM_getValue('manifest', null);
                return d ? JSON.parse(d) : null;
            } catch (e) { return null; }
        },
        setManifest: function (m) {
            GM_setValue('manifest', JSON.stringify(m));
        },
        getScript: function (f) {
            return GM_getValue('script_' + f, null);
        },
        setScript: function (f, c) {
            GM_setValue('script_' + f, c);
        },
        getVersion: function () {
            return GM_getValue('manifestVersion', '0');
        },
        setVersion: function (v) {
            GM_setValue('manifestVersion', v);
        },
        isFirstRun: function () {
            return GM_getValue('firstRunComplete', false) === false;
        },
        setFirstRunComplete: function () {
            GM_setValue('firstRunComplete', true);
        },
        clearAll: function () {
            GM_listValues().forEach(function (k) { GM_deleteValue(k); });
        }
    };


    // ╔══════════════════════════════════════════════════════════╗
    // ║  NETWORK                                                 ║
    // ╚══════════════════════════════════════════════════════════╝

    function fetchFromGitHub(url) {
        return new Promise(function (resolve, reject) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url + '?t=' + Date.now(),
                timeout: 15000,
                headers: { 'Cache-Control': 'no-cache' },
                onload: function (r) {
                    if (r.status === 200) resolve(r.responseText);
                    else reject(new Error('HTTP ' + r.status));
                },
                onerror: function () { reject(new Error('Network error')); },
                ontimeout: function () { reject(new Error('Timeout')); }
            });
        });
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  SCRIPT EXECUTOR - createElement('script')               ║
    // ║  This is the KEY change - works in all iframes           ║
    // ╚══════════════════════════════════════════════════════════╝

    function executeScript(code, scriptName) {
        try {
            const scriptEl = document.createElement('script');
            scriptEl.setAttribute('data-source', scriptName);
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
            document.body.appendChild(scriptEl);
            Logger.success(scriptName);
            return true;
        } catch (e) {
            Logger.fail(scriptName, e.message);
            return false;
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  UI (Only on parent page, never in iframe)               ║
    // ╚══════════════════════════════════════════════════════════╝

    function showLoadingOverlay(message) {
        if (IS_IFRAME) return;
        const o = document.createElement('div');
        o.id = 'gs-loader-overlay';
        o.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:Arial,sans-serif;">
                <div style="background:white;padding:30px 50px;border-radius:10px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);border-top:4px solid #FF9900;">
                    <div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #FF9900;border-radius:50%;animation:gsSpin 1s linear infinite;margin:0 auto 15px;"></div>
                    <div style="font-size:16px;color:#333;font-weight:bold;">🔧 ${message}</div>
                    <div style="font-size:12px;color:#999;margin-top:8px;">Please wait...</div>
                </div>
            </div>
            <style>@keyframes gsSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
        `;
        document.body.appendChild(o);
    }

    function removeLoadingOverlay() {
        if (IS_IFRAME) return;
        const o = document.getElementById('gs-loader-overlay');
        if (o) o.remove();
    }

    function showStatusBadge(message, type) {
        if (IS_IFRAME) return;
        const colors = {
            success: '#4CAF50', error: '#f44336',
            update: '#FF9900', info: '#2196F3'
        };
        const b = document.createElement('div');
        b.style.cssText = `
            position:fixed;bottom:20px;right:20px;
            background:${colors[type] || colors.info};
            color:white;padding:12px 20px;border-radius:8px;
            z-index:999999;font-family:Arial,sans-serif;
            font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,0.3);
            cursor:pointer;transition:opacity 0.3s;
        `;
        b.textContent = message;
        b.onclick = function () { b.remove(); };
        document.body.appendChild(b);
        setTimeout(function () {
            if (b.parentNode) {
                b.style.opacity = '0';
                setTimeout(function () { b.remove(); }, 300);
            }
        }, 5000);
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  MAIN LOGIC                                              ║
    // ╚══════════════════════════════════════════════════════════╝

    async function main() {
        const startTime = performance.now();

        Logger.info('🚀 Loader v' + CONFIG.LOADER_VERSION + ' starting...');
        Logger.info('📍 ' + window.location.hostname + window.location.pathname);

        if (IS_IFRAME && IS_TEMPLATE_PAGE) {
            Logger.info('📦 Running inside TEMPLATE IFRAME');
        } else if (IS_PLACE_PAGE) {
            Logger.info('📍 Running on PLACE PAGE');
        } else if (IS_TEMPLATE_PAGE) {
            Logger.info('📍 Running on TEMPLATE PAGE (direct access)');
        }

        // ── First time: Download everything ──
        if (Cache.isFirstRun()) {
            if (IS_IFRAME) {
                Logger.info('⏳ First run in iframe - waiting for cache...');
                waitForCacheThenLoad(startTime);
                return;
            }
            await firstTimeDownload(startTime);
            return;
        }

        // ── Has cache: Load from it ──
        const manifest = Cache.getManifest();

        if (!manifest) {
            if (IS_IFRAME) {
                Logger.info('⏳ No cache in iframe - waiting...');
                waitForCacheThenLoad(startTime);
                return;
            }
            Logger.warn('⚠️ Cache corrupted. Re-downloading...');
            await firstTimeDownload(startTime);
            return;
        }

        // ── Kill switch ──
        if (manifest.globalSettings && manifest.globalSettings.killSwitch) {
            Logger.warn('🛑 Kill switch is ON - no scripts will load');
            if (!IS_IFRAME) showStatusBadge('🛑 Scripts disabled by admin', 'error');
            return;
        }

        // ── Load matching scripts from cache ──
        loadScriptsFromCache(manifest, startTime);

        // ── Check for updates (parent only) ──
        if (!IS_IFRAME) {
            checkForUpdates();
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  WAIT FOR CACHE (Iframe waits for parent to download)    ║
    // ╚══════════════════════════════════════════════════════════╝

    function waitForCacheThenLoad(startTime) {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds

        const timer = setInterval(function () {
            attempts++;
            const manifest = Cache.getManifest();

            if (manifest) {
                clearInterval(timer);
                Logger.info('✅ Cache ready!');
                loadScriptsFromCache(manifest, startTime);
                return;
            }

            if (attempts >= maxAttempts) {
                clearInterval(timer);
                Logger.warn('⚠️ Cache timeout. Downloading directly...');
                directDownload(startTime);
            }
        }, 100);
    }

    async function directDownload(startTime) {
        try {
            Logger.info('📡 Downloading directly from GitHub...');

            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);

            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);
            Cache.setFirstRunComplete();

            const needed = manifest.scripts
                .filter(function (s) { return s.enabled && shouldRunOnCurrentPage(s.matchPatterns); })
                .sort(function (a, b) { return a.priority - b.priority; });

            let loaded = 0;
            for (let i = 0; i < needed.length; i++) {
                try {
                    const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + needed[i].file);
                    Cache.setScript(needed[i].file, code);
                    if (executeScript(code, needed[i].name)) loaded++;
                } catch (e) {
                    Logger.fail(needed[i].name, e.message);
                }
            }

            const time = Math.round(performance.now() - startTime);
            Logger.info('🎉 Direct download complete! ' + loaded + ' scripts (' + time + 'ms)');
        } catch (e) {
            Logger.error('❌ Direct download failed: ' + e.message);
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  LOAD FROM CACHE                                         ║
    // ╚══════════════════════════════════════════════════════════╝

    function loadScriptsFromCache(manifest, startTime) {
        const scripts = manifest.scripts
            .filter(function (s) { return s.enabled; })
            .sort(function (a, b) { return a.priority - b.priority; });

        Logger.info('⚡ Loading from cache (v' + Cache.getVersion() + ')...');

        let loaded = 0, skipped = 0, failed = 0;

        scripts.forEach(function (script) {
            // Check if script should run on this page
            if (!shouldRunOnCurrentPage(script.matchPatterns)) {
                Logger.skip(script.name);
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
                Logger.warn('⚠️ No cache: ' + script.name + ' - downloading...');
                downloadSingleScript(script);
                failed++;
            }
        });

        const time = Math.round(performance.now() - startTime);
        Logger.info('🎉 Done! ✅ ' + loaded + ' | ⏭️ ' + skipped + ' | ❌ ' + failed + ' (' + time + 'ms)');

        // Announcement (parent only)
        if (!IS_IFRAME && manifest.announcement && manifest.announcement.length > 0) {
            Logger.info('📢 ' + manifest.announcement);
            showStatusBadge('📢 ' + manifest.announcement, 'info');
        }
    }

    async function downloadSingleScript(script) {
        try {
            const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + script.file);
            Cache.setScript(script.file, code);
            executeScript(code, script.name + ' (fresh)');
        } catch (e) {
            Logger.error('❌ Download failed: ' + script.name);
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  FIRST TIME DOWNLOAD                                     ║
    // ╚══════════════════════════════════════════════════════════╝

    async function firstTimeDownload(startTime) {
        try {
            showLoadingOverlay('Downloading GeoStudio scripts...');
            Logger.info('🆕 First time setup...');

            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);

            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);

            Logger.info('📦 Downloading ' + manifest.scripts.length + ' scripts...');

            // Download ALL scripts in parallel
            const results = await Promise.allSettled(
                manifest.scripts.map(function (script) {
                    return fetchFromGitHub(SCRIPTS_BASE + '/' + script.file)
                        .then(function (code) {
                            Cache.setScript(script.file, code);
                            return { script: script, code: code };
                        });
                })
            );

            // Execute only scripts matching current page
            let loaded = 0;
            results.forEach(function (result) {
                if (result.status === 'fulfilled') {
                    const r = result.value;
                    if (r.script.enabled && shouldRunOnCurrentPage(r.script.matchPatterns)) {
                        if (executeScript(r.code, r.script.name)) loaded++;
                    }
                } else {
                    Logger.warn('⚠️ Download failed for a script');
                }
            });

            Cache.setFirstRunComplete();
            removeLoadingOverlay();

            const time = Math.round(performance.now() - startTime);
            Logger.info('🎉 Setup complete! ' + loaded + ' scripts (v' + manifest.version + ') in ' + time + 'ms');
            showStatusBadge('✅ Scripts installed! (' + loaded + ' scripts)', 'success');

        } catch (e) {
            Logger.error('❌ Download failed: ' + e.message);
            removeLoadingOverlay();
            showStatusBadge('❌ Failed. Refresh to retry.', 'error');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  CHECK FOR UPDATES (Parent page only)                    ║
    // ╚══════════════════════════════════════════════════════════╝

    async function checkForUpdates() {
        try {
            Logger.info('🔍 Checking for updates...');

            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const remote = JSON.parse(manifestRaw);

            if (remote.version === Cache.getVersion()) {
                Logger.info('✅ Up to date (v' + Cache.getVersion() + ')');
                return;
            }

            Logger.info('🔄 Update: v' + Cache.getVersion() + ' → v' + remote.version);

            Cache.setManifest(remote);
            Cache.setVersion(remote.version);

            let updated = 0;
            for (let i = 0; i < remote.scripts.length; i++) {
                try {
                    const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + remote.scripts[i].file);
                    Cache.setScript(remote.scripts[i].file, code);
                    updated++;
                } catch (e) {
                    Logger.warn('⚠️ Failed: ' + remote.scripts[i].name);
                }
            }

            Logger.info('✅ ' + updated + ' scripts updated. Refresh to apply.');
            showStatusBadge('🔄 Updated to v' + remote.version + ' - Refresh!', 'update');

        } catch (e) {
            Logger.warn('⚠️ Update check failed (offline?)');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  FORCE UPDATE                                            ║
    // ╚══════════════════════════════════════════════════════════╝

    async function forceUpdate() {
        try {
            showLoadingOverlay('Force updating scripts...');
            GM_setValue('manifestVersion', '0');

            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);

            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);

            let count = 0;
            for (let i = 0; i < manifest.scripts.length; i++) {
                try {
                    const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + manifest.scripts[i].file);
                    Cache.setScript(manifest.scripts[i].file, code);
                    count++;
                    Logger.info('📥 ' + manifest.scripts[i].name);
                } catch (e) {
                    Logger.warn('⚠️ Failed: ' + manifest.scripts[i].name);
                }
            }

            removeLoadingOverlay();
            Logger.info('✅ Updated ' + count + ' scripts to v' + manifest.version);
            setTimeout(function () { location.reload(); }, 500);

        } catch (e) {
            removeLoadingOverlay();
            alert('❌ Update failed! Check internet connection.');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  KEYBOARD SHORTCUTS                                      ║
    // ╚══════════════════════════════════════════════════════════╝

    document.addEventListener('keydown', function (e) {
        // Ctrl+Shift+C = Clear cache
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
            e.preventDefault();
            Cache.clearAll();
            console.log('🗑️ Cache cleared! Press Ctrl+Shift+R to reload.');
        }

        // Ctrl+Shift+R = Clear cache and reload
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyR') {
            e.preventDefault();
            Cache.clearAll();
            console.log('🔄 Cache cleared! Reloading...');
            setTimeout(function () { location.reload(); }, 500);
        }

        // Ctrl+Shift+S = Show cache status
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
            e.preventDefault();
            showCacheStatus();
        }
    });

    function showCacheStatus() {
        const manifest = Cache.getManifest();
        if (!manifest) {
            console.log('No scripts cached.');
            return;
        }

        console.log('%c📦 GeoStudio Scripts Cache Status', 'color: #FF9900; font-size: 14px; font-weight: bold;');
        console.log('Version: ' + Cache.getVersion());
        console.log('Loader: v' + CONFIG.LOADER_VERSION);
        console.log('Page: ' + window.location.hostname);
        console.log('Context: ' + (IS_IFRAME ? 'IFRAME' : 'Parent Page'));
        console.log('');

        const items = [];
        manifest.scripts.forEach(function (sc) {
            const cached = Cache.getScript(sc.file);
            items.push({
                Name: sc.name,
                Enabled: sc.enabled ? '✅' : '❌',
                Cached: cached ? '💾 ' + Math.round(cached.length / 1024) + 'KB' : '⚠️ No',
                'This Page': shouldRunOnCurrentPage(sc.matchPatterns) ? '🟢 Yes' : '🔴 No',
                Priority: sc.priority
            });
        });

        console.table(items);
        console.log('');
        console.log('Shortcuts: Ctrl+Shift+C=Clear | Ctrl+Shift+R=Clear+Reload | Ctrl+Shift+S=Status');
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  TAMPERMONKEY MENU (Parent page only)                    ║
    // ╚══════════════════════════════════════════════════════════╝

    if (!IS_IFRAME) {
        GM_registerMenuCommand('🔄 Force Update Scripts', function () {
            if (confirm('Download latest scripts from GitHub?')) forceUpdate();
        });

        GM_registerMenuCommand('📋 Script Status', function () {
            const m = Cache.getManifest();
            if (!m) { alert('No scripts loaded yet.'); return; }

            let s = '╔═══════════════════════════════════════╗\n';
            s += '║   🔧 GeoStudio Scripts v' + Cache.getVersion() + '          ║\n';
            s += '╚═══════════════════════════════════════╝\n\n';
            s += '🔧 Loader: v' + CONFIG.LOADER_VERSION + '\n';
            s += '🛑 Kill Switch: ' + (m.globalSettings.killSwitch ? 'ON ⚠️' : 'OFF ✅') + '\n';
            s += '📍 Page: ' + window.location.hostname + '\n\n';

            s += '── Place Page Scripts ──\n\n';
            m.scripts.forEach(function (sc) {
                if (sc.matchPatterns && sc.matchPatterns.some(function (p) { return p.includes('templates'); })) return;
                s += (sc.enabled ? '✅' : '❌') + ' ' + (Cache.getScript(sc.file) ? '💾' : '⚠️') + ' ' + sc.name + '\n';
            });

            s += '\n── Template/Iframe Scripts ──\n\n';
            m.scripts.forEach(function (sc) {
                if (!sc.matchPatterns || !sc.matchPatterns.some(function (p) { return p.includes('templates'); })) return;
                s += (sc.enabled ? '✅' : '❌') + ' ' + (Cache.getScript(sc.file) ? '💾' : '⚠️') + ' 📦 ' + sc.name + '\n';
            });

            s += '\n── Shortcuts ──\n';
            s += 'Ctrl+Shift+C = Clear cache\n';
            s += 'Ctrl+Shift+R = Clear + Reload\n';
            s += 'Ctrl+Shift+S = Status (console)\n';

            alert(s);
        });

        GM_registerMenuCommand('🗑️ Clear Cache & Redownload', function () {
            if (confirm('Clear all cached scripts and redownload?')) {
                Cache.clearAll();
                location.reload();
            }
        });

        GM_registerMenuCommand('ℹ️ About', function () {
            alert(
                '🔧 GeoStudio Scripts Loader\n\n' +
                'Author: kchandramani\n' +
                'GitHub: github.com/kchandramani/amazon_scripts\n' +
                'Loader: v' + CONFIG.LOADER_VERSION + '\n' +
                'Scripts: v' + Cache.getVersion() + '\n' +
                'Updates: On page refresh\n' +
                'Iframe: ✅ Supported (createElement method)\n\n' +
                'Shortcuts:\n' +
                'Ctrl+Shift+C = Clear cache\n' +
                'Ctrl+Shift+R = Clear + Reload\n' +
                'Ctrl+Shift+S = Status'
            );
        });
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  START                                                   ║
    // ╚══════════════════════════════════════════════════════════╝

    main();

})();
