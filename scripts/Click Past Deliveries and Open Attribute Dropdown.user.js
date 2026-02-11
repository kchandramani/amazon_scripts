// ==UserScript==
// @name         Click Past Deliveries and Open Attribute Dropdown
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Clicks "Past deliveries" then opens the real "Attribute" dropdown
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function clickPastDeliveriesThenAttributeDropdown() {
        // Step 1: Click "Past deliveries"
        const pastDeliveries = Array.from(document.querySelectorAll('p.css-1oqpb4x')).find(
            el => el.innerText.trim() === "Past deliveries"
        );

        if (pastDeliveries) {
            console.log("✅ Clicking 'Past deliveries'...");
            pastDeliveries.scrollIntoView({ behavior: "smooth", block: "center" });
            pastDeliveries.click();

            // Step 2: Wait for dropdown, then click the interactive "Attribute" combobox container
            // Change this part in the script:
setTimeout(() => {
    // First handle Attributes dropdown
    const elements = document.querySelectorAll('div[role="combobox"]');
    elements.forEach((el, index) => {
        if (el.textContent.includes('Attribute')) {
            const spaceEvent = new KeyboardEvent('keydown', {
                key: ' ',
                code: 'Space',
                bubbles: true,
                cancelable: true
            });
            el.dispatchEvent(spaceEvent);

            setTimeout(() => {
                console.log("Trying to find Count option...");

                const optionsMethod1 = document.querySelectorAll('div[role="option"]');
                console.log(`Found ${optionsMethod1.length} options with role="option"`);

                const optionsMethod2 = document.querySelectorAll('li');
                console.log(`Found ${optionsMethod2.length} li elements`);

                const allElements = document.querySelectorAll('div, span, li');

                [optionsMethod1, optionsMethod2, allElements].forEach(collection => {
                    collection.forEach(element => {
                        if (element.textContent.trim() === 'Count') {
                            console.log("Found Count option, attempting to click");
                            element.click();
                            element.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
                            element.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
                        }
                    });
                });

                // After handling Attributes, handle Recent 10
                setTimeout(() => {
                    const elements = document.querySelectorAll('div[role="combobox"]');
                    elements.forEach((el, index) => {
                        if (el.textContent.includes('Recent 10')) {
                            console.log("Found Recent 10, attempting to click");
                            const spaceEvent = new KeyboardEvent('keydown', {
                                key: ' ',
                                code: 'Space',
                                bubbles: true,
                                cancelable: true
                            });
                            el.dispatchEvent(spaceEvent);

                            // Add timeout to select "All" after dropdown opens
                            setTimeout(() => {
                                console.log("Trying to find All option...");
                                const allOptions = document.querySelectorAll('div[role="option"], li, div, span');
                                allOptions.forEach(element => {
                                    if (element.textContent.trim() === 'All') {
                                        console.log("Found All option, attempting to click");
                                        element.click();
                                        element.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
                                        element.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
                                    }
                                });
                            }, 100);
                        }
                    });
                }, 100);

            }, 100);
        }
    });
}, 1500);
        } else {
            console.warn("❌ 'Past deliveries' not found.");
        }
    }

    // 🔥 Press "P" to trigger the automation
    document.addEventListener("keydown", function(event) {
        if (event.key.toLowerCase() === "q") {
            console.log("🚀 P key pressed — starting...");
            clickPastDeliveriesThenAttributeDropdown();
        }
    });

})();
