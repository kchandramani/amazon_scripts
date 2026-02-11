// ==UserScript==
// @name         Auto Dismiss Validation Failed Alert
// @namespace    http://tampermonkey.net/
// @version      2025-10-07
// @description  utomatically dismisses "Validation Failed" alerts
// @author       You
// @match        https://na.geostudio.last-mile.amazon.dev/place
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.dev
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = true;
    let checkCount = 0;

    function log(...args) {
        if (DEBUG) {
            console.log('[Alert Dismisser]', ...args);
        }
    }

    // Function to find and dismiss alert
    function findAndDismissAlert() {
        checkCount++;
        if (DEBUG && checkCount % 100 === 0) {
            log('Check count:', checkCount);
        }

        // Find alert using multiple methods
        const alertElements = [
            ...document.querySelectorAll('[mdn-alert-message]'),
            ...document.querySelectorAll('#alert-21361-children'),
            ...document.querySelectorAll('div[role="alert"]')
        ];

        for (const alert of alertElements) {
            if (alert && alert.textContent && alert.textContent.includes('Validation Failed')) {
                log('Alert found:', alert.textContent);

                // Find dismiss button
                const dismissButton = document.querySelector('button[aria-label="Dismiss"]');
                if (dismissButton) {
                    try {
                        dismissButton.click();
                        log('Alert dismissed via button click');
                    } catch (e) {
                        log('Click failed:', e);
                        // Try to remove alert directly
                        try {
                            const alertContainer = alert.closest('[role="alert"]') || alert.parentElement;
                            if (alertContainer) {
                                alertContainer.remove();
                                log('Alert removed directly from DOM');
                            }
                        } catch (e2) {
                            log('Direct removal failed:', e2);
                        }
                    }
                }
            }
        }
    }

    // Multiple interval checks with different frequencies
    const intervals = [
        setInterval(findAndDismissAlert, 100),  // Every 100ms
        setInterval(findAndDismissAlert, 500),  // Every 500ms
        setInterval(findAndDismissAlert, 1000)  // Every 1000ms
    ];

    // MutationObserver setup
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                findAndDismissAlert();
            }
        });
    });

    // Start observing with all possible options
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
    });

    // Additional event listeners
    const events = ['load', 'DOMContentLoaded', 'click', 'mousemove', 'keydown'];
    events.forEach(event => {
        window.addEventListener(event, findAndDismissAlert);
    });

    // Monitor XHR requests
    const originalXHR = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', findAndDismissAlert);
        return originalXHR.apply(this, arguments);
    };

    // Monitor Fetch requests
    const originalFetch = window.fetch;
    window.fetch = function() {
        return originalFetch.apply(this, arguments)
            .then(response => {
                findAndDismissAlert();
                return response;
            });
    };

    // RAF loop for continuous checking
    function rafCheck() {
        findAndDismissAlert();
        requestAnimationFrame(rafCheck);
    }
    requestAnimationFrame(rafCheck);

    // Backup interval with random timing to catch any missed alerts
    setInterval(() => {
        findAndDismissAlert();
    }, Math.random() * 200 + 100); // Random interval between 100-300ms

    // Cleanup function
    function cleanup() {
        intervals.forEach(interval => clearInterval(interval));
        observer.disconnect();
        log('Cleanup performed');
    }

    // Cleanup on page unload
    window.addEventListener('unload', cleanup);

    // Initial check
    findAndDismissAlert();

    // Log startup
    log('Alert dismisser initialized');
})();