// ==UserScript==
// @name         CaseType Text Observer and Display with Auto-Click
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Observes CaseType text changes, displays them on screen, and auto-clicks button + Shared Delivery Area + Edit Details
// @author       manichk
// @match        https://na.geostudio.last-mile.amazon.dev/place
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.dev
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let floatingDisplay = null;
    let addressDisplay = null;
    let textFound = false;
    let addressFound = false;
    let isChecking = false;
    let buttonClicked = false;
    let sharedDeliveryClicked = false;
    let editDetailsClicked = false;

    // Create floating display for CaseType
    function createFloatingDisplay() {
        if (floatingDisplay) return;

        floatingDisplay = document.createElement('div');
        floatingDisplay.id = 'caseTypeDisplay';
        floatingDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 200px;
            padding: 15px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            z-index: 9999;
            border-radius: 5px;
            max-width: 400px;
            word-wrap: break-word;
            font-family: Arial, sans-serif;
            font-size: 15px;
            font-weight: bold;
            pointer-events: none;
            line-height: 1.4;
        `;
        document.body.appendChild(floatingDisplay);
    }

    // Create floating display for Address
    function createAddressDisplay() {
        if (addressDisplay) return;

        addressDisplay = document.createElement('div');
        addressDisplay.id = 'addressDisplay';
        addressDisplay.style.cssText = `
            position: fixed;
            top: 70px;
            right: 500px;
            padding: 15px;
            padding-top: 25px;
            background-color: rgba(0, 100, 0, 0.8);
            color: white;
            z-index: 9999;
            border-radius: 5px;
            max-width: 400px;
            word-wrap: break-word;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: bold;
            line-height: 1.8;
            display: none;
        `;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.id = 'addressCloseBtn';
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            width: 20px;
            height: 20px;
            border: none;
            background-color: rgba(255, 255, 255, 0.3);
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            line-height: 1;
        `;

        // Close button hover effect
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        });

        // Close button click handler
        closeButton.addEventListener('click', () => {
            addressDisplay.style.display = 'none';
            console.log('Address display closed by user');
        });

        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.id = 'addressContent';

        addressDisplay.appendChild(closeButton);
        addressDisplay.appendChild(contentDiv);
        document.body.appendChild(addressDisplay);
    }

    // Function to click the target button
    function clickTargetButton() {
        if (buttonClicked) return;

        const buttonSelectors = [
            'button.css-px7qg4',
            'button[mdn-popover-offset="-4"]',
            'button.z4S49pH1wMwtRBSedw1lug\\=\\=',
            'button.css-px7qg4[type="button"]'
        ];

        let targetButton = null;

        for (const selector of buttonSelectors) {
            try {
                targetButton = document.querySelector(selector);
                if (targetButton) break;
            } catch (e) {
                console.log('Selector failed:', selector);
            }
        }

        if (targetButton) {
            console.log('Button found! Clicking...');
            targetButton.click();
            buttonClicked = true;
            console.log('Button clicked successfully!');
        } else {
            console.log('Target button not found, retrying...');
            setTimeout(clickTargetButton, 100);
        }
    }

    // ==========================================
    // NEW: Function to click "Shared Delivery Area" accordion
    // ==========================================
    function clickSharedDeliveryArea(retryCount) {
        if (sharedDeliveryClicked) return;
        retryCount = retryCount || 0;
        const maxRetries = 30; // try for up to 3 seconds (30 * 100ms)

        console.log('Looking for "Shared Delivery Area" accordion... (attempt ' + (retryCount + 1) + ')');

        let found = false;

        // Strategy 1: Find by the exact compound class on the accordion
        try {
            const accordions = document.querySelectorAll('.MuiAccordion-root.css-sqxyby');
            for (const acc of accordions) {
                if (acc.textContent && acc.textContent.includes('Shared Delivery Area')) {
                    // Find the clickable summary/header inside the accordion
                    const summary = acc.querySelector('.MuiAccordionSummary-root, .MuiButtonBase-root, [role="button"]');
                    if (summary) {
                        summary.click();
                        sharedDeliveryClicked = true;
                        found = true;
                        console.log('Clicked "Shared Delivery Area" accordion summary!');
                        break;
                    } else {
                        // Click the accordion itself as fallback
                        acc.click();
                        sharedDeliveryClicked = true;
                        found = true;
                        console.log('Clicked "Shared Delivery Area" accordion directly!');
                        break;
                    }
                }
            }
        } catch (e) {
            console.log('Strategy 1 failed for Shared Delivery Area:', e);
        }

        // Strategy 2: Search all elements for text "Shared Delivery Area"
        if (!found) {
            try {
                const allElements = document.querySelectorAll('div[class*="MuiAccordion"], div[class*="css-sqxyby"]');
                for (const el of allElements) {
                    if (el.textContent && el.textContent.includes('Shared Delivery Area')) {
                        const clickable = el.querySelector('[role="button"], button, .MuiAccordionSummary-root, .MuiButtonBase-root') || el;
                        clickable.click();
                        sharedDeliveryClicked = true;
                        found = true;
                        console.log('Clicked "Shared Delivery Area" via Strategy 2!');
                        break;
                    }
                }
            } catch (e) {
                console.log('Strategy 2 failed for Shared Delivery Area:', e);
            }
        }

        // Strategy 3: Broad text search across all elements
        if (!found) {
            try {
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: function(node) {
                            return node.nodeValue && node.nodeValue.trim().includes('Shared Delivery Area')
                                ? NodeFilter.FILTER_ACCEPT
                                : NodeFilter.FILTER_REJECT;
                        }
                    }
                );

                while (walker.nextNode()) {
                    let target = walker.currentNode.parentElement;
                    // Walk up to find the accordion or clickable parent
                    let attempts = 0;
                    while (target && attempts < 10) {
                        if (target.classList &&
                            (target.classList.contains('MuiAccordion-root') ||
                             target.classList.contains('MuiAccordionSummary-root') ||
                             target.classList.contains('MuiButtonBase-root') ||
                             target.getAttribute('role') === 'button')) {

                            const clickTarget = target.querySelector('.MuiAccordionSummary-root, .MuiButtonBase-root, [role="button"]') || target;
                            clickTarget.click();
                            sharedDeliveryClicked = true;
                            found = true;
                            console.log('Clicked "Shared Delivery Area" via Strategy 3 (text walk)!');
                            break;
                        }
                        target = target.parentElement;
                        attempts++;
                    }
                    if (found) break;
                }
            } catch (e) {
                console.log('Strategy 3 failed for Shared Delivery Area:', e);
            }
        }

        if (found) {
            // After clicking Shared Delivery Area, wait and then click Edit Details
            console.log('Waiting 800ms before clicking "Edit Details"...');
            setTimeout(() => {
                clickEditDetails(0);
            }, 100);
        } else if (retryCount < maxRetries) {
            // Retry after 100ms
            setTimeout(() => {
                clickSharedDeliveryArea(retryCount + 1);
            }, 100);
        } else {
            console.log('"Shared Delivery Area" not found after max retries.');
        }
    }

    // ==========================================
    // NEW: Function to click "Edit Details"
    // ==========================================
    function clickEditDetails(retryCount) {
        if (editDetailsClicked) return;
        retryCount = retryCount || 0;
        const maxRetries = 30; // try for up to 3 seconds

        console.log('Looking for "Edit Details"... (attempt ' + (retryCount + 1) + ')');

        let found = false;

        // Strategy 1: Find by class css-1lnv98w with text "Edit Details"
        try {
            const elements = document.querySelectorAll('.css-1lnv98w');
            for (const el of elements) {
                if (el.textContent && el.textContent.trim() === 'Edit Details') {
                    el.click();
                    editDetailsClicked = true;
                    found = true;
                    console.log('Clicked "Edit Details" via class selector!');
                    break;
                }
            }
        } catch (e) {
            console.log('Strategy 1 failed for Edit Details:', e);
        }

        // Strategy 2: Find any element with exact text "Edit Details"
        if (!found) {
            try {
                const allClickables = document.querySelectorAll('button, a, span, div, p, [role="button"]');
                for (const el of allClickables) {
                    if (el.textContent && el.textContent.trim() === 'Edit Details') {
                        el.click();
                        editDetailsClicked = true;
                        found = true;
                        console.log('Clicked "Edit Details" via broad search!');
                        break;
                    }
                }
            } catch (e) {
                console.log('Strategy 2 failed for Edit Details:', e);
            }
        }

        // Strategy 3: Text walker approach
        if (!found) {
            try {
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: function(node) {
                            return node.nodeValue && node.nodeValue.trim() === 'Edit Details'
                                ? NodeFilter.FILTER_ACCEPT
                                : NodeFilter.FILTER_REJECT;
                        }
                    }
                );

                while (walker.nextNode()) {
                    let target = walker.currentNode.parentElement;
                    if (target) {
                        // Check if this element or its parent has the right class
                        let clickTarget = target;
                        let attempts = 0;
                        while (clickTarget && attempts < 5) {
                            if (clickTarget.classList && clickTarget.classList.contains('css-1lnv98w')) {
                                clickTarget.click();
                                editDetailsClicked = true;
                                found = true;
                                console.log('Clicked "Edit Details" via text walker with class match!');
                                break;
                            }
                            clickTarget = clickTarget.parentElement;
                            attempts++;
                        }
                        // If class not matched, click the direct parent
                        if (!found) {
                            target.click();
                            editDetailsClicked = true;
                            found = true;
                            console.log('Clicked "Edit Details" via text walker (direct parent)!');
                        }
                        break;
                    }
                }
            } catch (e) {
                console.log('Strategy 3 failed for Edit Details:', e);
            }
        }

        if (found) {
            console.log('"Edit Details" clicked successfully!');
        } else if (retryCount < maxRetries) {
            // Retry after 100ms
            setTimeout(() => {
                clickEditDetails(retryCount + 1);
            }, 100);
        } else {
            console.log('"Edit Details" not found after max retries.');
        }
    }

    // Function to check if address contains US
    function isUSAddress(text) {
        if (!text) return false;

        const parts = text.split(',').map(part => part.trim().toUpperCase());
        return parts.some(part => part === 'US' || part === 'USA' || part === 'UNITED STATES');
    }

    // Function to update Address display
    function updateAddressDisplay(text) {
        if (!addressDisplay) createAddressDisplay();

        const contentDiv = document.getElementById('addressContent');

        if (text && isUSAddress(text)) {
            const parts = text.split(',').map(part => part.trim());
            const formattedText = parts.join('<br>');

            contentDiv.innerHTML = `<strong style="font-size: 15px; text-decoration: underline;">Address:</strong><br><br>${formattedText}`;
            addressDisplay.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
            addressDisplay.style.display = 'block';
            addressFound = true;
            console.log('US Address found and displayed!');
        } else if (text) {
            contentDiv.innerHTML = '<strong style="font-size: 15px;">Address:</strong><br><br>Not a US Address';
            addressDisplay.style.backgroundColor = 'rgba(100, 100, 100, 0.8)';
            addressDisplay.style.display = 'block';
            addressFound = true;
            console.log('Address found but not a US address');
        } else {
            contentDiv.innerHTML = '<strong style="font-size: 15px;">Address:</strong><br><br>Not Found';
            addressDisplay.style.backgroundColor = 'rgba(100, 100, 100, 0.8)';
            addressDisplay.style.display = 'block';
            addressFound = true;
            console.log('No address found');
        }
    }

    // Function to check for Address
    function checkForAddress() {
        console.log('Checking for address...');

        const addressSelectors = [
            'div.css-1t6ofyo p.css-hd6zo3',
            'div.css-1t6ofyo p[mdn-text]',
            'div.css-1t6ofyo p',
            '.css-1t6ofyo p.css-hd6zo3',
            '.css-1t6ofyo p',
            'p.css-hd6zo3',
            'p[mdn-text]'
        ];

        let addressText = null;

        for (const selector of addressSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    for (const el of elements) {
                        if (el.textContent && el.textContent.trim() !== '') {
                            addressText = el.textContent.trim();
                            console.log('Address found with selector:', selector);
                            console.log('Address text:', addressText);
                            break;
                        }
                    }
                    if (addressText) break;
                }
            } catch (e) {
                console.log('Address selector failed:', selector, e);
            }
        }

        updateAddressDisplay(addressText);
    }

    // Function to update CaseType display
    function updateDisplay(text) {
        if (!floatingDisplay) createFloatingDisplay();

        if (text) {
            floatingDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            floatingDisplay.textContent = text;
            textFound = true;

            // Auto-click the button when CaseType is found
            console.log('CaseType detected! Triggering auto-click...');
            setTimeout(clickTargetButton, 100);

            // Wait 500ms then check for address
            console.log('Waiting 100ms before checking address...');
            setTimeout(() => {
                console.log('Now checking for address...');
                checkForAddress();
            }, 100);

            // ==========================================
            // NEW: If source1 is detected, click Shared Delivery Area and Edit Details
            // ==========================================
            if (text.includes('source1')) {
                console.log('source1 detected! Will click "Shared Delivery Area" and "Edit Details"...');
                // Wait 1000ms for the page to settle after initial button click, then start clicking
                setTimeout(() => {
                    clickSharedDeliveryArea(0);
                }, 100);
            }

        } else {
            floatingDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            floatingDisplay.textContent = 'CaseType: Not Found';
            textFound = false;

            if (addressDisplay) {
                addressDisplay.style.display = 'none';
            }
        }
    }

    // Function to check for CaseType
    function checkForCaseType() {
        if (textFound || isChecking) return;

        isChecking = true;
        const elements = document.querySelectorAll('.css-wncc9b');
        let found = false;

        elements.forEach(element => {
            const text = element.textContent;
            if (text && text.includes('source1')) {
                found = true;
                updateDisplay(text);
            }
        });

        if (!found) {
            updateDisplay(null);
        }

        isChecking = false;
    }

    // Reset function for submit button
    function resetSearch() {
        console.log('Resetting search...');

        // Reset all flags
        textFound = false;
        addressFound = false;
        buttonClicked = false;
        sharedDeliveryClicked = false;
        editDetailsClicked = false;

        // Clear CaseType display
        if (floatingDisplay) {
            floatingDisplay.textContent = 'Searching...';
            floatingDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        }

        // Hide and clear Address display
        if (addressDisplay) {
            const contentDiv = document.getElementById('addressContent');
            if (contentDiv) {
                contentDiv.innerHTML = '<strong>Address:</strong><br><br>Searching...';
            }
            addressDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            addressDisplay.style.display = 'none';
        }

        // Start checking for CaseType again
        console.log('Starting new search...');
    }

    // Initialize
    function initialize() {
        console.log('Initializing script v0.9 with Shared Delivery Area + Edit Details auto-click...');

        createFloatingDisplay();
        createAddressDisplay();

        // Check for CaseType periodically
        setInterval(() => {
            if (!textFound) {
                checkForCaseType();
            }
        }, 100);

        // Watch for submit button clicks
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'submit-btn') {
                console.log('Submit button clicked!');
                setTimeout(resetSearch, 100);
            }
        }, true);

        // Initial check
        setTimeout(checkForCaseType, 100);
    }

    // Start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();