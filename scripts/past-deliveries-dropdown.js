// Q -> Past deliveries: Count / All
// W -> Past deliveries: Reasons / Other + Unattended
// E -> Past deliveries: Reasons / Near Door
 
(function() {
    'use strict';
 
    // ---------- Helpers ----------
 
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
 
    function waitForVisibleOption(text, timeout = 2000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elements = document.querySelectorAll('[role="option"], li, [class*="menu"], [class*="dropdown"]');
 
                const found = Array.from(elements).find(el => {
                    return el.textContent.trim() === text && isElementVisible(el);
                });
 
                if (found) {
                    clearInterval(interval);
                    resolve(found);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    reject(new Error(`Timeout waiting for visible option: "${text}"`));
                }
            }, 50);
        });
    }
 
    // Ensures the "Past deliveries" accordion is open. Returns true if ready.
    async function ensurePastDeliveriesOpen() {
        const pastDeliveries = Array.from(document.querySelectorAll('p.css-1oqpb4x')).find(
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
            await new Promise(r => setTimeout(r, 1200));
        } else {
            pastDeliveries.scrollIntoView({ behavior: "smooth", block: "center" });
        }
 
        return true;
    }
 
    // Returns [attributeBox, recentBox] visible comboboxes in the filter panel
    function getFilterCombos() {
        const panel = document.querySelector('.css-1e269i6') || document;
        return Array.from(panel.querySelectorAll('div[role="combobox"]')).filter(isElementVisible);
    }
 
    function openCombo(box) {
        box.focus();
        box.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    }
 
    // Closes an open dropdown menu (Escape works for MUI Select/Menu popups)
    function closeOpenDropdown(box) {
        box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    }
 
    // Selects one option from an already-open dropdown
    async function selectOption(text) {
        const option = await waitForVisibleOption(text);
        console.log(`🎯 Selecting "${text}"...`);
        option.click();
        return option;
    }
 
    // ---------- Core flow ----------
    // firstBoxOption: option text to pick in the 1st combobox (e.g. 'Count' / 'Reasons')
    // secondBoxOptions: array of option texts to pick in the 2nd combobox (supports multi-select)
    async function runFlow(firstBoxOption, secondBoxOptions) {
        try {
            const ready = await ensurePastDeliveriesOpen();
            if (!ready) return;
 
            const [attributeBox, recentBox] = getFilterCombos();
 
            if (!attributeBox) {
                console.warn("❌ 1st (Attribute) combobox not found.");
                return;
            }
 
            // --- 1st dropdown ---
            console.log(`🔓 Opening 1st dropdown to pick "${firstBoxOption}"...`);
            openCombo(attributeBox);
            await selectOption(firstBoxOption);
            await new Promise(r => setTimeout(r, 400));
 
            // --- 2nd dropdown ---
            if (!recentBox) {
                console.warn("❌ 2nd combobox not found.");
                return;
            }
 
            console.log("🔓 Opening 2nd dropdown...");
            openCombo(recentBox);
 
            for (const optionText of secondBoxOptions) {
                await selectOption(optionText);
                await new Promise(r => setTimeout(r, 300)); // small gap between multi-selects
            }
 
            // --- Close the 2nd dropdown ---
            console.log("🔒 Closing 2nd dropdown...");
            closeOpenDropdown(recentBox);
 
        } catch (error) {
            console.error("⚠️ Script automation stalled:", error.message);
        }
    }
 
    // ---------- Key bindings ----------
 
    document.addEventListener("keydown", function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
 
        const key = event.key.toLowerCase();
 
        if (key === "q") {
            console.log("🚀 Q pressed — Count / All");
            runFlow('Count', ['All']);
        }
 
        if (key === "w") {
            console.log("🚀 W pressed — Reasons / Other + Unattended");
            runFlow('Reasons', ['Other', 'Unattended']);
        }
 
        if (key === "e") {
            console.log("🚀 E pressed — Reasons / Near Door");
            runFlow('Reasons', ['Near Door']);
        }
    });
})();
 
