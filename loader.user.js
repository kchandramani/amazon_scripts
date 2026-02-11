// ==UserScript==
// @name         🔧 Amazon Scripts - Master Loader
// @namespace    https://github.com/kchandramani/amazon_scripts
// @version      1.0.0
// @description  Centralized Amazon script loader by kchandramani - Install once, auto-updates on every page refresh
// @author       kchandramani
// @match        https://na.geostudio.last-mile.amazon.dev/
// @match        https://fe.geostudio.last-mile.amazon.dev/
// @match        https://eu.geostudio.last-mile.amazon.dev/
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

        // Update check interval: 1 hour (in milliseconds)
        // Update ONLY happens on page refresh, not during browsing
        UPDATE_INTERVAL: 60 * 60 * 1000,  // 1 hour

        // Debug mode
        DEBUG: false,

        // Loader version
        LOADER_VERSION: '1.0.0'
    };

    // Build URLs
    const BASE_URL = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/${CONFIG.BRANCH}`;
    const MANIFEST_URL = `${BASE_URL}/manifest.json`;
    const SCRIPTS_BASE = `${BASE_URL}/scripts`;


    // ╔══════════════════════════════════════════════════════════╗
    // ║  LOGGER                                                  ║
    // ╚══════════════════════════════════════════════════════════╝

    const Logger = {
        prefix: '[🔧 Amazon Loader]',

        info: function (msg) {
            console.log(
                `%c${this.prefix} ${msg}`,
                'color: #FF9900; font-weight: bold;'  // Amazon orange color
            );
        },
        warn: function (msg) {
            console.warn(`${this.prefix} ${msg}`);
        },
        error: function (msg) {
            console.error(`${this.prefix} ${msg}`);
        },
        debug: function (msg) {
            if (CONFIG.DEBUG) {
                console.log(
                    `%c${this.prefix} [DEBUG] ${msg}`,
                    'color: #9E9E9E;'
                );
            }
        },
        success: function (scriptName) {
            console.log(
                `%c${this.prefix} ✅ ${scriptName}`,
                'color: #4CAF50; font-weight: bold;'
            );
        },
        fail: function (scriptName, error) {
            console.error(`${this.prefix} ❌ ${scriptName}:`, error);
        }
    };


    // ╔══════════════════════════════════════════════════════════╗
    // ║  CACHE MANAGER                                           ║
    // ╚══════════════════════════════════════════════════════════╝

    const Cache = {
        getManifest: function () {
            try {
                const data = GM_getValue('manifest', null);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                return null;
            }
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

        getLastCheck: function () {
            return GM_getValue('lastUpdateCheck', 0);
        },
        setLastCheck: function () {
            GM_setValue('lastUpdateCheck', Date.now());
        },

        isFirstRun: function () {
            return GM_getValue('firstRunComplete', false) === false;
        },
        setFirstRunComplete: function () {
            GM_setValue('firstRunComplete', true);
        },

        clearAll: function () {
            const keys = GM_listValues();
            keys.forEach(function (key) {
                GM_deleteValue(key);
            });
        }
    };


    // ╔══════════════════════════════════════════════════════════╗
    // ║  NETWORK - Fetch from GitHub                             ║
    // ╚══════════════════════════════════════════════════════════╝

    function fetchFromGitHub(url) {
        return new Promise(function (resolve, reject) {
            Logger.debug('Fetching: ' + url);

            GM_xmlhttpRequest({
                method: 'GET',
                url: url + '?t=' + Date.now(),
                timeout: 15000,
                headers: {
                    'Cache-Control': 'no-cache'
                },
                onload: function (response) {
                    if (response.status === 200) {
                        resolve(response.responseText);
                    } else {
                        reject(new Error('HTTP ' + response.status));
                    }
                },
                onerror: function () {
                    reject(new Error('Network error'));
                },
                ontimeout: function () {
                    reject(new Error('Timeout'));
                }
            });
        });
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  GM_ BRIDGE - Makes GM functions available to scripts    ║
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
    // ║  SCRIPT EXECUTOR                                         ║
    // ╚══════════════════════════════════════════════════════════╝

    function executeScript(code, scriptName) {
        try {
            const wrappedCode = `
                (function() {
                    'use strict';

                    // GM_ functions available
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
    // ║  LOADING OVERLAY UI                                      ║
    // ╚══════════════════════════════════════════════════════════╝

    function showLoadingOverlay(message) {
        const overlay = document.createElement('div');
        overlay.id = 'amazon-script-loader-overlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 30px 50px;
                    border-radius: 10px;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    border-top: 4px solid #FF9900;
                ">
                    <div style="
                        width: 40px; height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #FF9900;
                        border-radius: 50%;
                        animation: amzSpin 1s linear infinite;
                        margin: 0 auto 15px;
                    "></div>
                    <div style="font-size: 16px; color: #333; font-weight: bold;">
                        🔧 ${message}
                    </div>
                    <div style="font-size: 12px; color: #999; margin-top: 8px;">
                        Please wait...
                    </div>
                </div>
            </div>
            <style>
                @keyframes amzSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        if (document.body) {
            document.body.appendChild(overlay);
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                document.body.appendChild(overlay);
            });
        }
    }

    function removeLoadingOverlay() {
        const overlay = document.getElementById('amazon-script-loader-overlay');
        if (overlay) overlay.remove();
    }

    function showStatusBadge(message, type) {
        const colors = {
            success: { bg: '#4CAF50', text: 'white' },
            error: { bg: '#f44336', text: 'white' },
            update: { bg: '#FF9900', text: 'white' },
            info: { bg: '#2196F3', text: 'white' }
        };
        const color = colors[type] || colors.info;

        const badge = document.createElement('div');
        badge.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${color.bg};
            color: ${color.text};
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 13px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: opacity 0.3s;
        `;
        badge.textContent = message;
        badge.onclick = function () { badge.remove(); };

        if (document.body) {
            document.body.appendChild(badge);
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                document.body.appendChild(badge);
            });
        }

        // Auto remove after 5 seconds
        setTimeout(function () {
            if (badge.parentNode) {
                badge.style.opacity = '0';
                setTimeout(function () { badge.remove(); }, 300);
            }
        }, 5000);
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  MAIN LOGIC: LOAD FROM CACHE → CHECK UPDATE ON REFRESH   ║
    // ╚══════════════════════════════════════════════════════════╝

    async function main() {
        Logger.info('🚀 Master Loader v' + CONFIG.LOADER_VERSION + ' starting...');
        Logger.info('📍 Page: ' + window.location.pathname);

        // ────────────────────────────────────────
        // CASE 1: First time ever (no cache)
        // ────────────────────────────────────────
        if (Cache.isFirstRun()) {
            await firstTimeDownload();
            return;
        }

        // ────────────────────────────────────────
        // CASE 2: Has cache - Load immediately
        // ────────────────────────────────────────
        const manifest = Cache.getManifest();

        if (!manifest) {
            Logger.warn('⚠️ Cache corrupted. Re-downloading...');
            await firstTimeDownload();
            return;
        }

        // Kill switch check
        if (manifest.globalSettings && manifest.globalSettings.killSwitch) {
            Logger.warn('🛑 Kill switch is ON - no scripts will load');
            showStatusBadge('🛑 Scripts disabled by admin', 'error');
            return;
        }

        // Load scripts from cache IMMEDIATELY
        loadScriptsFromCache(manifest);

        // ────────────────────────────────────────
        // CASE 3: Check for updates (only on refresh, respecting interval)
        // ────────────────────────────────────────
        const lastCheck = Cache.getLastCheck();
        const now = Date.now();
        const timeSinceLastCheck = now - lastCheck;

        if (timeSinceLastCheck >= CONFIG.UPDATE_INTERVAL) {
            Logger.info('🔍 Checking for updates (last check: ' +
                Math.round(timeSinceLastCheck / 60000) + ' min ago)...');
            checkForUpdates();
        } else {
            Logger.debug('⏭️ Skipping update check (last check: ' +
                Math.round(timeSinceLastCheck / 60000) + ' min ago, next in: ' +
                Math.round((CONFIG.UPDATE_INTERVAL - timeSinceLastCheck) / 60000) + ' min)');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  LOAD SCRIPTS FROM CACHE (Instant)                       ║
    // ╚══════════════════════════════════════════════════════════╝

    function loadScriptsFromCache(manifest) {
        const activeScripts = manifest.scripts
            .filter(function (s) { return s.enabled; })
            .sort(function (a, b) { return a.priority - b.priority; });

        Logger.info('⚡ Loading ' + activeScripts.length + ' scripts from cache (v' + Cache.getVersion() + ')...');

        let loaded = 0;
        let failed = 0;

        activeScripts.forEach(function (script) {
            const code = Cache.getScript(script.file);
            if (code) {
                if (executeScript(code, script.name)) {
                    loaded++;
                } else {
                    failed++;
                }
            } else {
                Logger.warn('⚠️ No cache for: ' + script.name + ' (will download on next update)');
                failed++;
            }
        });

        Logger.info('🎉 Done! ✅ Loaded: ' + loaded + ' | ❌ Failed: ' + failed);

        // Show announcement if any
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
            showLoadingOverlay('Downloading Amazon scripts for first time...');
            Logger.info('🆕 First time setup - downloading all scripts...');

            // Download manifest
            Logger.info('📡 Fetching script list...');
            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);

            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);

            // Get enabled scripts
            const activeScripts = manifest.scripts
                .filter(function (s) { return s.enabled; })
                .sort(function (a, b) { return a.priority - b.priority; });

            Logger.info('📦 Downloading ' + activeScripts.length + ' scripts...');

            // Download ALL in parallel
            const results = await Promise.all(
                activeScripts.map(function (script) {
                    return fetchFromGitHub(SCRIPTS_BASE + '/' + script.file)
                        .then(function (code) {
                            Cache.setScript(script.file, code);
                            return { script: script, code: code, success: true };
                        })
                        .catch(function (err) {
                            Logger.error('Failed: ' + script.name + ' - ' + err.message);
                            return { script: script, code: null, success: false };
                        });
                })
            );

            // Execute all
            let loaded = 0;
            results.forEach(function (result) {
                if (result.success && result.code) {
                    if (executeScript(result.code, result.script.name)) {
                        loaded++;
                    }
                }
            });

            Cache.setFirstRunComplete();
            Cache.setLastCheck();
            removeLoadingOverlay();

            Logger.info('🎉 First time setup complete! Loaded ' + loaded + ' scripts (v' + manifest.version + ')');
            Logger.info('⚡ Next page refresh will be INSTANT from cache!');

            showStatusBadge('✅ Amazon Scripts installed! (' + loaded + ' scripts)', 'success');

        } catch (e) {
            Logger.error('❌ First time download failed: ' + e.message);
            removeLoadingOverlay();
            showStatusBadge('❌ Failed to download scripts. Refresh to retry.', 'error');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  CHECK FOR UPDATES (On page refresh only)                ║
    // ╚══════════════════════════════════════════════════════════╝

    async function checkForUpdates() {
        try {
            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const remoteManifest = JSON.parse(manifestRaw);
            const currentVersion = Cache.getVersion();

            Cache.setLastCheck();

            // No update needed
            if (remoteManifest.version === currentVersion) {
                Logger.info('✅ Scripts are up to date (v' + currentVersion + ')');
                return;
            }

            // Update found!
            Logger.info('🔄 Update found: v' + currentVersion + ' → v' + remoteManifest.version);

            // Save new manifest
            Cache.setManifest(remoteManifest);
            Cache.setVersion(remoteManifest.version);

            // Download all scripts
            let updated = 0;
            let failed = 0;

            for (let i = 0; i < remoteManifest.scripts.length; i++) {
                const script = remoteManifest.scripts[i];
                try {
                    const code = await fetchFromGitHub(SCRIPTS_BASE + '/' + script.file);
                    Cache.setScript(script.file, code);
                    updated++;
                    Logger.debug('📥 Updated: ' + script.name);
                } catch (e) {
                    failed++;
                    Logger.warn('⚠️ Failed to update: ' + script.name);
                }
            }

            Logger.info('✅ Updated ' + updated + ' scripts to v' + remoteManifest.version);
            Logger.info('🔄 Refresh page to use updated scripts.');

            showStatusBadge(
                '🔄 Scripts updated to v' + remoteManifest.version + ' - Refresh to apply!',
                'update'
            );

            // Check if kill switch was turned on
            if (remoteManifest.globalSettings && remoteManifest.globalSettings.killSwitch) {
                Logger.warn('🛑 Kill switch activated in update!');
                showStatusBadge('🛑 Scripts have been disabled by admin', 'error');
            }

        } catch (e) {
            Logger.debug('⚠️ Update check failed (offline?): ' + e.message);
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  FORCE UPDATE                                            ║
    // ╚══════════════════════════════════════════════════════════╝

    async function forceUpdate() {
        try {
            Logger.info('🔄 Force updating all scripts...');
            showLoadingOverlay('Force updating Amazon scripts...');

            // Reset timers
            GM_setValue('lastUpdateCheck', 0);
            GM_setValue('manifestVersion', '0');

            // Fetch fresh manifest
            const manifestRaw = await fetchFromGitHub(MANIFEST_URL);
            const manifest = JSON.parse(manifestRaw);

            Cache.setManifest(manifest);
            Cache.setVersion(manifest.version);

            // Download all scripts
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

            Cache.setLastCheck();
            removeLoadingOverlay();

            Logger.info('✅ Force update complete! ' + count + ' scripts updated to v' + manifest.version);
            Logger.info('🔄 Reloading page...');

            setTimeout(function () {
                location.reload();
            }, 500);

        } catch (e) {
            Logger.error('❌ Force update failed: ' + e.message);
            removeLoadingOverlay();
            alert('❌ Update failed! Check internet connection and try again.');
        }
    }


    // ╔══════════════════════════════════════════════════════════╗
    // ║  TAMPERMONKEY MENU COMMANDS                              ║
    // ╚══════════════════════════════════════════════════════════╝

    GM_registerMenuCommand('🔄 Force Update Scripts', function () {
        if (confirm('Download latest scripts from GitHub?')) {
            forceUpdate();
        }
    });

    GM_registerMenuCommand('📋 Script Status', function () {
        const manifest = Cache.getManifest();
        if (!manifest) {
            alert('No scripts loaded yet. Refresh the page.');
            return;
        }

        let status = '';
        status += '╔══════════════════════════════════════╗\n';
        status += '║   🔧 Amazon Scripts Status            ║\n';
        status += '╚══════════════════════════════════════╝\n\n';
        status += '📦 Version: ' + Cache.getVersion() + '\n';
        status += '⏰ Last Update Check: ' + new Date(Cache.getLastCheck()).toLocaleString() + '\n';
        status += '🔧 Loader: v' + CONFIG.LOADER_VERSION + '\n';
        status += '🛑 Kill Switch: ' + (manifest.globalSettings.killSwitch ? 'ON ⚠️' : 'OFF ✅') + '\n';
        status += '\n────── Scripts ──────\n\n';

        manifest.scripts.forEach(function (s) {
            const cached = Cache.getScript(s.file) ? '💾' : '⚠️ No Cache';
            const enabled = s.enabled ? '✅' : '❌';
            status += enabled + ' ' + cached + ' [P' + s.priority + '] ' + s.name + '\n';
            status += '   📝 ' + s.description + '\n\n';
        });

        alert(status);
    });

    GM_registerMenuCommand('🗑️ Clear Cache & Redownload', function () {
        if (confirm('Clear all cached scripts and redownload?\n\nThis will reload the page.')) {
            Cache.clearAll();
            Logger.info('🗑️ Cache cleared!');
            location.reload();
        }
    });

    GM_registerMenuCommand('🐛 Toggle Debug Mode', function () {
        CONFIG.DEBUG = !CONFIG.DEBUG;
        GM_setValue('debugMode', CONFIG.DEBUG);
        alert('Debug mode: ' + (CONFIG.DEBUG ? 'ON 🟢' : 'OFF 🔴') + '\n\nRefresh page to see debug logs.');
    });

    GM_registerMenuCommand('ℹ️ About', function () {
        let info = '';
        info += '🔧 Amazon Scripts Loader\n\n';
        info += 'Author: kchandramani\n';
        info += 'GitHub: github.com/kchandramani/amazon_scripts\n';
        info += 'Loader Version: ' + CONFIG.LOADER_VERSION + '\n';
        info += 'Script Version: ' + Cache.getVersion() + '\n';
        info += 'Update Interval: 1 hour\n';
        info += 'Updates On: Page refresh only\n';
        alert(info);
    });


    // ╔══════════════════════════════════════════════════════════╗
    // ║  START                                                   ║
    // ╚══════════════════════════════════════════════════════════╝

    // Load debug setting
    CONFIG.DEBUG = GM_getValue('debugMode', false);

    // Run main logic
    main();

})();
