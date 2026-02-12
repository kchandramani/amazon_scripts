// ==UserScript==
// @name         🔧 GeoStudio Scripts - Master Loader
// @namespace    https://github.com/kchandramani/amazon_scripts
// @version      4.0.0
// @description  Single loader for all GeoStudio pages including iframes
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
// @connect      raw.githubusercontent.com
// @run-at       document-end
// @downloadURL  https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/loader.user.js
// @updateURL    https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/loader.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ── Config ──
    var GITHUB_USER = 'kchandramani';
    var REPO = 'amazon_scripts';
    var BRANCH = 'main';
    var VERSION = '4.0.0';

    var BASE = 'https://raw.githubusercontent.com/' + GITHUB_USER + '/' + REPO + '/' + BRANCH;
    var MANIFEST_URL = BASE + '/manifest.json';
    var SCRIPTS_URL = BASE + '/scripts';

    // ── Context Detection ──
    var IS_IFRAME = (window.self !== window.top);
    var HOSTNAME = window.location.hostname;
    var FULL_URL = window.location.href;
    var IS_TEMPLATE = HOSTNAME.includes('templates.geostudio');
    var IS_PLACE = HOSTNAME.includes('geostudio.last-mile') && !IS_TEMPLATE;

    // ── Logger ──
    var TAG = IS_IFRAME ? '[🔧 Loader 📦]' : '[🔧 Loader]';
    var CLR = IS_IFRAME ? 'color:#2196F3;font-weight:bold' : 'color:#FF9900;font-weight:bold';

    function log(msg) { console.log('%c' + TAG + ' ' + msg, CLR); }
    function logOk(msg) { console.log('%c' + TAG + ' ✅ ' + msg, 'color:#4CAF50;font-weight:bold'); }
    function logSkip(msg) { console.log('%c' + TAG + ' ⏭️ ' + msg, 'color:#9E9E9E'); }
    function logErr(msg) { console.error(TAG + ' ❌ ' + msg); }
    function logWarn(msg) { console.warn(TAG + ' ⚠️ ' + msg); }

    // ── URL Matcher ──
    function matchesPage(patterns) {
        if (!patterns || patterns.length === 0) return true;
        for (var i = 0; i < patterns.length; i++) {
            if (FULL_URL.includes(patterns[i])) return true;
        }
        return false;
    }

    // ── Network ──
    function fetch(url) {
        return new Promise(function (ok, fail) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url + '?t=' + Date.now(),
                timeout: 15000,
                headers: { 'Cache-Control': 'no-cache' },
                onload: function (r) {
                    if (r.status === 200) ok(r.responseText);
                    else fail('HTTP ' + r.status + ' for ' + url);
                },
                onerror: function () { fail('Network error: ' + url); },
                ontimeout: function () { fail('Timeout: ' + url); }
            });
        });
    }

    // ── Script Executor (createElement method) ──
    function runScript(code, name) {
        try {
            var el = document.createElement('script');
            el.setAttribute('data-source', name);
            el.textContent = '(function(){\'use strict\';try{' + code + '}catch(e){console.error(\'[' + name + '] Error:\',e);}})();';
            document.body.appendChild(el);
            logOk(name);
            return true;
        } catch (e) {
            logErr(name + ': ' + e.message);
            return false;
        }
    }

    // ── Cache ──
    function getCache(key) { return GM_getValue(key, null); }
    function setCache(key, val) { GM_setValue(key, val); }

    function getManifest() {
        try {
            var d = getCache('manifest');
            return d ? JSON.parse(d) : null;
        } catch (e) { return null; }
    }

    // ── Status Badge (parent only) ──
    function showBadge(msg, color) {
        if (IS_IFRAME) return;
        var b = document.createElement('div');
        b.style.cssText = 'position:fixed;bottom:20px;right:20px;background:' + color + ';color:white;padding:12px 20px;border-radius:8px;z-index:999999;font-family:Arial;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,0.3);cursor:pointer;';
        b.textContent = msg;
        b.onclick = function () { b.remove(); };
        document.body.appendChild(b);
        setTimeout(function () { if (b.parentNode) b.remove(); }, 5000);
    }

    // ── Loading Overlay (parent only) ──
    function showOverlay(msg) {
        if (IS_IFRAME) return;
        var o = document.createElement('div');
        o.id = 'gs-overlay';
        o.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999999;display:flex;justify-content:center;align-items:center;font-family:Arial"><div style="background:white;padding:30px 50px;border-radius:10px;text-align:center;border-top:4px solid #FF9900"><div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #FF9900;border-radius:50%;animation:gs 1s linear infinite;margin:0 auto 15px"></div><div style="font-size:16px;color:#333;font-weight:bold">🔧 ' + msg + '</div></div></div><style>@keyframes gs{to{transform:rotate(360deg)}}</style>';
        document.body.appendChild(o);
    }

    function hideOverlay() {
        if (IS_IFRAME) return;
        var o = document.getElementById('gs-overlay');
        if (o) o.remove();
    }

    // ══════════════════════════════════════════
    //  LOAD SCRIPTS FROM CACHE
    // ══════════════════════════════════════════

    function loadFromCache(manifest) {
        var scripts = manifest.scripts
            .filter(function (s) { return s.enabled; })
            .sort(function (a, b) { return a.priority - b.priority; });

        log('⚡ Loading from cache (v' + getCache('manifestVersion') + ')...');

        var loaded = 0, skipped = 0, failed = 0;

        scripts.forEach(function (s) {
            if (!matchesPage(s.matchPatterns)) {
                logSkip(s.name);
                skipped++;
                return;
            }

            var code = getCache('script_' + s.file);
            if (code) {
                if (runScript(code, s.name)) loaded++;
                else failed++;
            } else {
                logWarn('No cache: ' + s.name);
                // Download individually
                fetch(SCRIPTS_URL + '/' + s.file).then(function (code) {
                    setCache('script_' + s.file, code);
                    runScript(code, s.name + ' (downloaded)');
                }).catch(function () {
                    logErr('Download failed: ' + s.name);
                });
                failed++;
            }
        });

        log('🎉 Done! ✅ ' + loaded + ' | ⏭️ ' + skipped + ' | ❌ ' + failed);

        if (!IS_IFRAME && manifest.announcement && manifest.announcement.length > 0) {
            log('📢 ' + manifest.announcement);
            showBadge('📢 ' + manifest.announcement, '#2196F3');
        }
    }

    // ══════════════════════════════════════════
    //  FIRST TIME DOWNLOAD
    // ══════════════════════════════════════════

    async function firstDownload() {
        try {
            showOverlay('Downloading scripts...');
            log('🆕 First time setup...');

            var raw = await fetch(MANIFEST_URL);
            var manifest = JSON.parse(raw);

            setCache('manifest', raw);
            setCache('manifestVersion', manifest.version);

            log('📦 Downloading ' + manifest.scripts.length + ' scripts...');

            var results = await Promise.allSettled(
                manifest.scripts.map(function (s) {
                    return fetch(SCRIPTS_URL + '/' + s.file).then(function (code) {
                        setCache('script_' + s.file, code);
                        return { script: s, code: code };
                    });
                })
            );

            var loaded = 0;
            results.forEach(function (r) {
                if (r.status === 'fulfilled') {
                    var s = r.value.script;
                    if (s.enabled && matchesPage(s.matchPatterns)) {
                        if (runScript(r.value.code, s.name)) loaded++;
                    }
                }
            });

            setCache('firstRunComplete', true);
            hideOverlay();

            log('🎉 Setup complete! ' + loaded + ' scripts (v' + manifest.version + ')');
            showBadge('✅ Scripts installed! (' + loaded + ' scripts)', '#4CAF50');

        } catch (e) {
            logErr('Download failed: ' + e);
            hideOverlay();
            showBadge('❌ Failed. Refresh to retry.', '#f44336');
        }
    }

    // ══════════════════════════════════════════
    //  CHECK FOR UPDATES (parent only)
    // ══════════════════════════════════════════

    async function checkUpdates() {
        try {
            log('🔍 Checking for updates...');
            var raw = await fetch(MANIFEST_URL);
            var remote = JSON.parse(raw);
            var current = getCache('manifestVersion') || '0';

            if (remote.version === current) {
                log('✅ Up to date (v' + current + ')');
                return;
            }

            log('🔄 Update: v' + current + ' → v' + remote.version);
            setCache('manifest', raw);
            setCache('manifestVersion', remote.version);

            var count = 0;
            for (var i = 0; i < remote.scripts.length; i++) {
                try {
                    var code = await fetch(SCRIPTS_URL + '/' + remote.scripts[i].file);
                    setCache('script_' + remote.scripts[i].file, code);
                    count++;
                } catch (e) { }
            }

            log('✅ ' + count + ' scripts updated. Refresh to apply.');
            showBadge('🔄 Updated to v' + remote.version + ' - Refresh!', '#FF9900');

        } catch (e) {
            logWarn('Update check failed');
        }
    }

    // ══════════════════════════════════════════
    //  FORCE UPDATE
    // ══════════════════════════════════════════

    async function forceUpdate() {
        try {
            showOverlay('Force updating...');
            setCache('manifestVersion', '0');

            var raw = await fetch(MANIFEST_URL);
            var manifest = JSON.parse(raw);
            setCache('manifest', raw);
            setCache('manifestVersion', manifest.version);

            for (var i = 0; i < manifest.scripts.length; i++) {
                try {
                    var code = await fetch(SCRIPTS_URL + '/' + manifest.scripts[i].file);
                    setCache('script_' + manifest.scripts[i].file, code);
                } catch (e) { }
            }

            hideOverlay();
            location.reload();
        } catch (e) {
            hideOverlay();
            alert('❌ Update failed!');
        }
    }

    // ══════════════════════════════════════════
    //  KEYBOARD SHORTCUTS
    // ══════════════════════════════════════════

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
            e.preventDefault();
            GM_listValues().forEach(function (k) { GM_deleteValue(k); });
            console.log('🗑️ Cache cleared!');
        }
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyR') {
            e.preventDefault();
            GM_listValues().forEach(function (k) { GM_deleteValue(k); });
            location.reload();
        }
    });

    // ══════════════════════════════════════════
    //  MENU (parent only)
    // ══════════════════════════════════════════

    if (!IS_IFRAME) {
        GM_registerMenuCommand('🔄 Force Update', function () {
            if (confirm('Download latest?')) forceUpdate();
        });
        GM_registerMenuCommand('🗑️ Clear Cache & Reload', function () {
            if (confirm('Clear all?')) {
                GM_listValues().forEach(function (k) { GM_deleteValue(k); });
                location.reload();
            }
        });
        GM_registerMenuCommand('📋 Status', function () {
            var m = getManifest();
            if (!m) { alert('No scripts cached.'); return; }
            var s = '🔧 GeoStudio Scripts v' + getCache('manifestVersion') + '\n\n';
            m.scripts.forEach(function (sc) {
                var cached = getCache('script_' + sc.file) ? '💾' : '⚠️';
                var on = sc.enabled ? '✅' : '❌';
                var page = matchesPage(sc.matchPatterns) ? '🟢' : '🔴';
                s += on + cached + page + ' ' + sc.name + '\n';
            });
            alert(s);
        });
    }

    // ══════════════════════════════════════════
    //  MAIN
    // ══════════════════════════════════════════

    async function main() {
        log('🚀 Loader v' + VERSION);
        log('📍 ' + HOSTNAME);
        if (IS_IFRAME) log('📦 Inside IFRAME');
        if (IS_TEMPLATE) log('📋 Template page');
        if (IS_PLACE) log('🗺️ Place page');

        // First time?
        var isFirst = getCache('firstRunComplete') !== true;

        if (isFirst) {
            if (IS_IFRAME) {
                // Wait for parent to download
                log('⏳ Waiting for parent to download...');
                var tries = 0;
                var waitTimer = setInterval(function () {
                    tries++;
                    var m = getManifest();
                    if (m) {
                        clearInterval(waitTimer);
                        log('✅ Cache ready from parent!');
                        loadFromCache(m);
                    } else if (tries > 50) {
                        clearInterval(waitTimer);
                        log('⚠️ Timeout. Downloading directly...');
                        firstDownload();
                    }
                }, 200);
                return;
            }
            await firstDownload();
            return;
        }

        // Has cache
        var manifest = getManifest();

        if (!manifest) {
            if (IS_IFRAME) {
                log('⚠️ No cache. Downloading...');
                await firstDownload();
                return;
            }
            logWarn('Cache corrupted. Re-downloading...');
            await firstDownload();
            return;
        }

        // Kill switch
        if (manifest.globalSettings && manifest.globalSettings.killSwitch) {
            logWarn('Kill switch ON');
            return;
        }

        // Load scripts
        loadFromCache(manifest);

        // Update check (parent only)
        if (!IS_IFRAME) {
            checkUpdates();
        }
    }

    main();

})();
