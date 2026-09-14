// Click Past Deliveries and Open Attribute Dropdown
// Press Q to trigger

(function() {
    'use strict';

    // Helper to check if an element is actually visible to the user
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

    // Safely wait for a truly visible option to appear
    function waitForVisibleOption(text, timeout = 2000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                // Target typical dropdown menu containers/items specifically
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

            // Give the page a moment to switch tabs/views completely
            await new Promise(r => setTimeout(r, 1200)); 

            // 2. Find the correct visible Attribute combobox
            const comboboxes = document.querySelectorAll('div[role="combobox"]');
            const attributeBox = Array.from(comboboxes).find(el => el.textContent.includes('Attribute') && isElementVisible(el));

            if (!attributeBox) {
                console.warn("❌ Visible 'Attribute' combobox not found.");
                return;
            }

            // 3. Open the Attribute dropdown
            console.log("🔓 Opening Attribute dropdown...");
            attributeBox.focus();
            attributeBox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));

            // 4. Find the dynamic 'Count' option that is VISIBLE
            const countOption = await waitForVisibleOption('Count');
            console.log("🎯 Found valid Count option, clicking...");
            countOption.click();

            // Give the UI a moment to register the selection and update the DOM
            await new Promise(r => setTimeout(r, 400)); 

            // 5. Find the next visible combobox handling 'Recent 10'
            const comboboxes2 = document.querySelectorAll('div[role="combobox"]');
            const recentBox = Array.from(comboboxes2).find(el => el.textContent.includes('Recent 10') && isElementVisible(el));

            if (recentBox) {
                console.log("🔓 Opening Recent 10 dropdown...");
                recentBox.focus();
                recentBox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));

                // 6. Find the dynamic 'All' option that is VISIBLE
                const allOption = await waitForVisibleOption('All');
                console.log("🎯 Found valid All option, clicking...");
                allOption.click();
            } else {
                console.warn("❌ 'Recent 10' combobox not found or not visible yet.");
            }

        } catch (error) {
            console.error("⚠️ Script automation stalled:", error.message);
        }
    }

    document.addEventListener("keydown", function(event) {
        // Ignore if typing inside an input or textarea
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        if (event.key.toLowerCase() === "q") {
            console.log("🚀 Q key pressed — starting...");
            clickPastDeliveriesThenAttributeDropdown();
        }
    });
})();
