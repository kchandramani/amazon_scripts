// Auto Dismiss Validation Failed Alert

(function() {
    'use strict';

    const DEBUG = true;
    let checkCount = 0;

    function log(...args) {
        if (DEBUG) console.log('[Alert Dismisser]', ...args);
    }

    function findAndDismissAlert() {
        checkCount++;
        if (DEBUG && checkCount % 100 === 0) log('Check count:', checkCount);

        const alertElements = [
            ...document.querySelectorAll('[mdn-alert-message]'),
            ...document.querySelectorAll('#alert-21361-children'),
            ...document.querySelectorAll('div[role="alert"]')
        ];

        for (const alert of alertElements) {
            if (alert && alert.textContent && alert.textContent.includes('Validation Failed')) {
                log('Alert found:', alert.textContent);

                const dismissButton = document.querySelector('button[aria-label="Dismiss"]');
                if (dismissButton) {
                    try {
                        dismissButton.click();
                        log('Alert dismissed via button click');
                    } catch (e) {
                        log('Click failed:', e);
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

    const intervals = [
        setInterval(findAndDismissAlert, 100),
        setInterval(findAndDismissAlert, 500),
        setInterval(findAndDismissAlert, 1000)
    ];

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                findAndDismissAlert();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
    });

    const events = ['load', 'DOMContentLoaded', 'click', 'mousemove', 'keydown'];
    events.forEach(event => {
        window.addEventListener(event, findAndDismissAlert);
    });

    const originalXHR = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', findAndDismissAlert);
        return originalXHR.apply(this, arguments);
    };

    const originalFetch = window.fetch;
    window.fetch = function() {
        return originalFetch.apply(this, arguments)
            .then(response => {
                findAndDismissAlert();
                return response;
            });
    };

    function rafCheck() {
        findAndDismissAlert();
        requestAnimationFrame(rafCheck);
    }
    requestAnimationFrame(rafCheck);

    setInterval(() => {
        findAndDismissAlert();
    }, Math.random() * 200 + 100);

    function cleanup() {
        intervals.forEach(interval => clearInterval(interval));
        observer.disconnect();
        log('Cleanup performed');
    }

    window.addEventListener('unload', cleanup);
    findAndDismissAlert();
    log('Alert dismisser initialized');
})();
