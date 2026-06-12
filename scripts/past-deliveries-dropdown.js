// Click Past Deliveries and Open Attribute Dropdown
// Press Q to trigger

(function() {
    'use strict';

    // Helper function to safely wait for an element to appear in the DOM
    function waitForElement(selector, text, timeout = 2000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elements = document.querySelectorAll(selector);
                const found = Array.from(elements).find(el => el.textContent.trim() === text);
                
                if (found) {
                    clearInterval(interval);
                    resolve(found);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    reject(new Error(`Timeout waiting for ${selector} with text "${text}"`));
                }
            }, 50);
        });
    }

    async function clickPastDeliveriesThenAttributeDropdown() {
        try {
            // 1. Find and click "Past deliveries"
            const pastDeliveries = Array.from(document.querySelectorAll('p.css-1oqpb4x')).find(
                el => el.innerText.trim() === "Past deliveries"
            );

            if (!pastDeliveries) {
                console.warn("❌ 'Past deliveries' not found.");
                return;
            }

            console.log("✅ Clicking 'Past deliveries'...");
            pastDeliveries.scrollIntoView({ behavior: "smooth", block: "center" });
            pastDeliveries.click();

            // 2. Wait for the Attribute combobox to become available after the view updates
            // (Replaced the fixed 1500ms delay with a safe loop)
            await new Promise(r => setTimeout(r, 1000)); 

            const comboboxes = document.querySelectorAll('div[role="combobox"]');
            const attributeBox = Array.from(comboboxes).find(el => el.textContent.includes('Attribute'));

            if (!attributeBox) {
                console.warn("❌ 'Attribute' combobox not found.");
                return;
            }

            // 3. Open the Attribute dropdown
            console.log("🔓 Opening Attribute dropdown...");
            attributeBox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));

            // 4. STRATEGIC FIX: Wait for the specific option inside appropriate tags ONLY
            // Instead of searching all divs/spans globally, we narrow it down.
            const countOption = await waitForElement('div[role="option"], li', 'Count');
            console.log("🎯 Found Count option, clicking...");
            countOption.click();

            // 5. Find the next combobox that now handles 'Recent 10'
            await new Promise(r => setTimeout(r, 200)); 
            const comboboxes2 = document.querySelectorAll('div[role="combobox"]');
            const recentBox = Array.from(comboboxes2).find(el => el.textContent.includes('Recent 10'));

            if (recentBox) {
                console.log("🔓 Opening Recent 10 dropdown...");
                recentBox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));

                // 6. STRATEGIC FIX: Target 'All' cleanly
                const allOption = await waitForElement('div[role="option"], li', 'All');
                console.log("🎯 Found All option, clicking...");
                allOption.click();
            }

        } catch (error) {
            console.error("⚠️ Script automation stalled:", error.message);
        }
    }

    document.addEventListener("keydown", function(event) {
        if (event.key.toLowerCase() === "q") {
            console.log("🚀 Q key pressed — starting...");
            clickPastDeliveriesThenAttributeDropdown();
        }
    });
})();
