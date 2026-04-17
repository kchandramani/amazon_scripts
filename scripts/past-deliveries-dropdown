// Click Past Deliveries and Open Attribute Dropdown
// Press Q to trigger

(function() {
    'use strict';

    function clickPastDeliveriesThenAttributeDropdown() {
        const pastDeliveries = Array.from(document.querySelectorAll('p.css-1oqpb4x')).find(
            el => el.innerText.trim() === "Past deliveries"
        );

        if (pastDeliveries) {
            console.log("✅ Clicking 'Past deliveries'...");
            pastDeliveries.scrollIntoView({ behavior: "smooth", block: "center" });
            pastDeliveries.click();

            setTimeout(() => {
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
                            const optionsMethod2 = document.querySelectorAll('li');
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

                            setTimeout(() => {
                                const elements2 = document.querySelectorAll('div[role="combobox"]');
                                elements2.forEach((el2, index2) => {
                                    if (el2.textContent.includes('Recent 10')) {
                                        console.log("Found Recent 10, attempting to click");
                                        const spaceEvent2 = new KeyboardEvent('keydown', {
                                            key: ' ',
                                            code: 'Space',
                                            bubbles: true,
                                            cancelable: true
                                        });
                                        el2.dispatchEvent(spaceEvent2);

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

    document.addEventListener("keydown", function(event) {
        if (event.key.toLowerCase() === "q") {
            console.log("🚀 Q key pressed — starting...");
            clickPastDeliveriesThenAttributeDropdown();
        }
    });
})();
