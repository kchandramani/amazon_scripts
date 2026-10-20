(function() {
    'use strict';

    const PLACEHOLDER_TEXTS = ['', 'attribute', 'recent 10', 'loading', 'select'];
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function isElementVisible(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            window.getComputedStyle(el).display !== 'none' &&
            window.getComputedStyle(el).visibility !== 'hidden'
        );
    }

    function getComboValueText(box) {
        if (!box) return '';
        const valueNode = box.querySelector('[mdn-select-value], [id$="-value"]') || box;
        return valueNode.textContent.trim();
    }

    function isComboLoaded(box) {
        const text = getComboValueText(box);
        return text.length > 0 && !PLACEHOLDER_TEXTS.includes(text.toLowerCase());
    }

    function waitForComboReady(getBoxFn, timeout = 8000) {
        return new Promise((resolve, reject) => {
            const immediate = getBoxFn();
            if (isComboLoaded(immediate)) {
                resolve(immediate);
                return;
            }

            let settled = false;
            const observer = new MutationObserver(() => {
                if (settled) return;
                const box = getBoxFn();
                if (isComboLoaded(box)) {
                    settled = true;
                    observer.disconnect();
                    resolve(box);
                }
            });

            observer.observe(document.body, {
                subtree: true,
                childList: true,
                characterData: true
            });

            setTimeout(() => {
                if (settled) return;
                settled = true;
                observer.disconnect();
                const box = getBoxFn();
                if (isComboLoaded(box)) {
                    resolve(box);
                } else {
                    reject(new Error('Timed out waiting for combobox value to load.'));
                }
            }, timeout);
        });
    }

    function waitForVisibleOption(text, timeout = 4000) {
        return new Promise((resolve, reject) => {
            const findIt = () => {
                const elements = document.querySelectorAll('[role="option"], li, [class*="menu"], [class*="dropdown"]');
                return Array.from(elements).find(el => {
                    const elText = el.textContent.trim().toLowerCase();
                    return elText === text.toLowerCase() && isElementVisible(el);
                });
            };

            const immediate = findIt();
            if (immediate) {
                resolve(immediate);
                return;
            }

            let settled = false;
            const observer = new MutationObserver(() => {
                if (settled) return;
                const found = findIt();
                if (found) {
                    settled = true;
                    observer.disconnect();
                    resolve(found);
                }
            });

            observer.observe(document.body, {
                subtree: true,
                childList: true,
                characterData: true
            });

            setTimeout(() => {
                if (settled) return;
                settled = true;
                observer.disconnect();
                reject(new Error(`Timeout waiting for visible option: "${text}"`));
            }, timeout);
        });
    }

    async function ensurePastDeliveriesOpen() {
        const pastDeliveries = Array.from(document.querySelectorAll('p.css-1oqpb4x, p')).find(
            el => el.innerText.trim() === "Past deliveries"
        );

        if (!pastDeliveries) {
            console.warn("❌ 'Past deliveries' not found.");
            return false;
        }

        const header = pastDeliveries.closest('[role="button"][aria-expanded]');
        const alreadyOpen = header?.getAttribute('aria-expanded') === 'true';

        if (!alreadyOpen) {
            console.log("✅ Expanding 'Past deliveries'...");
            pastDeliveries.scrollIntoView({ behavior: "smooth", block: "center" });
            pastDeliveries.click();
            await sleep(300);
        } else {
            pastDeliveries.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        return true;
    }

    function getFilterCombos() {
        const panel = document.querySelector('.css-1e269i6') || document;
        return Array.from(panel.querySelectorAll('div[role="combobox"]')).filter(isElementVisible);
    }

    function openCombo(box) {
        box.focus();
        box.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
        box.click(); // Added simple click fallback in case space alone is ignored
    }

    function closeOpenDropdown(box) {
        box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    }

    async function selectOption(text) {
        const option = await waitForVisibleOption(text);
        console.log(`🎯 Selecting "${text}"...`);
        option.click();
        await sleep(200);
        return option;
    }

    // ---------- Identical flow for Q, W, and E ----------
    async function runFlow(firstBoxOption, secondBoxOptions) {
        try {
            const ready = await ensurePastDeliveriesOpen();
            if (!ready) return;

            // 1. Pick first dropdown (Count vs Reasons)
            console.log("⏳ Waiting for 1st dropdown...");
            const attributeBox = await waitForComboReady(() => getFilterCombos()[0]);

            const currentFirstVal = getComboValueText(attributeBox).toLowerCase();
            if (!currentFirstVal.includes(firstBoxOption.toLowerCase())) {
                console.log(`🔓 Opening 1st dropdown to pick "${firstBoxOption}"...`);
                openCombo(attributeBox);
                await selectOption(firstBoxOption);
                // Give the UI a moment to re-render the 2nd dropdown when switching between Count and Reasons
                await sleep(400);
            }

            // 2. Pick second dropdown (All vs Other/Unattended vs Near Door)
            console.log("⏳ Waiting for 2nd dropdown...");
            const recentBox = await waitForComboReady(() => getFilterCombos()[1]);

            console.log("🔓 Opening 2nd dropdown...");
            openCombo(recentBox);
            await sleep(200);

            for (const optionText of secondBoxOptions) {
                await selectOption(optionText);
            }

            console.log("🔒 Closing 2nd dropdown...");
            closeOpenDropdown(recentBox);

        } catch (error) {
            console.error("⚠️ Script automation stalled:", error.message);
        }
    }

    // ---------- Key bindings ----------
    let isBusy = false;
    document.addEventListener("keydown", async function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        const key = event.key.toLowerCase();
        if (!['q', 'w', 'e'].includes(key)) return;
        if (isBusy) return;

        isBusy = true;
        try {
            if (key === "q") {
                console.log("🚀 Q pressed — Count / All");
                await runFlow('Count', ['All']);
            }
            if (key === "w") {
                console.log("🚀 W pressed — Reasons / Other + Unattended");
                await runFlow('Reasons', ['Other', 'Unattended']);
            }
            if (key === "e") {
                console.log("🚀 E pressed — Reasons / Near Door");
                await runFlow('Reasons', ['Near Door']);
            }
        } finally {
            isBusy = false;
        }
    });
})();
