// CaseType Text Observer and Display with Auto-Click

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

    function createFloatingDisplay() {
        if (floatingDisplay) return;
        floatingDisplay = document.createElement('div');
        floatingDisplay.id = 'caseTypeDisplay';
        floatingDisplay.style.cssText = 'position:fixed;top:10px;left:200px;padding:15px;background-color:rgba(0,0,0,0.8);color:white;z-index:9999;border-radius:5px;max-width:400px;word-wrap:break-word;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;pointer-events:none;line-height:1.4;';
        document.body.appendChild(floatingDisplay);
    }

    function createAddressDisplay() {
        if (addressDisplay) return;
        addressDisplay = document.createElement('div');
        addressDisplay.id = 'addressDisplay';
        addressDisplay.style.cssText = 'position:fixed;top:70px;right:500px;padding:15px;padding-top:25px;background-color:rgba(0,100,0,0.8);color:white;z-index:9999;border-radius:5px;max-width:400px;word-wrap:break-word;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;line-height:1.8;display:none;';

        const closeButton = document.createElement('button');
        closeButton.id = 'addressCloseBtn';
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = 'position:absolute;top:5px;right:5px;width:20px;height:20px;border:none;background-color:rgba(255,255,255,0.3);color:white;font-size:16px;font-weight:bold;cursor:pointer;border-radius:3px;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;';
        closeButton.addEventListener('mouseenter', () => { closeButton.style.backgroundColor = 'rgba(255,0,0,0.7)'; });
        closeButton.addEventListener('mouseleave', () => { closeButton.style.backgroundColor = 'rgba(255,255,255,0.3)'; });
        closeButton.addEventListener('click', () => { addressDisplay.style.display = 'none'; });

        const contentDiv = document.createElement('div');
        contentDiv.id = 'addressContent';

        addressDisplay.appendChild(closeButton);
        addressDisplay.appendChild(contentDiv);
        document.body.appendChild(addressDisplay);
    }

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
            } catch (e) { }
        }
        if (targetButton) {
            targetButton.click();
            buttonClicked = true;
        } else {
            setTimeout(clickTargetButton, 100);
        }
    }

    function clickSharedDeliveryArea(retryCount) {
        if (sharedDeliveryClicked) return;
        retryCount = retryCount || 0;
        const maxRetries = 30;
        let found = false;

        try {
            const accordions = document.querySelectorAll('.MuiAccordion-root.css-sqxyby');
            for (const acc of accordions) {
                if (acc.textContent && acc.textContent.includes('Shared Delivery Area')) {
                    const summary = acc.querySelector('.MuiAccordionSummary-root, .MuiButtonBase-root, [role="button"]');
                    if (summary) { summary.click(); } else { acc.click(); }
                    sharedDeliveryClicked = true;
                    found = true;
                    break;
                }
            }
        } catch (e) { }

        if (!found) {
            try {
                const allElements = document.querySelectorAll('div[class*="MuiAccordion"], div[class*="css-sqxyby"]');
                for (const el of allElements) {
                    if (el.textContent && el.textContent.includes('Shared Delivery Area')) {
                        const clickable = el.querySelector('[role="button"], button, .MuiAccordionSummary-root, .MuiButtonBase-root') || el;
                        clickable.click();
                        sharedDeliveryClicked = true;
                        found = true;
                        break;
                    }
                }
            } catch (e) { }
        }

        if (!found) {
            try {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                    acceptNode: function(node) {
                        return node.nodeValue && node.nodeValue.trim().includes('Shared Delivery Area') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                });
                while (walker.nextNode()) {
                    let target = walker.currentNode.parentElement;
                    let attempts = 0;
                    while (target && attempts < 10) {
                        if (target.classList && (target.classList.contains('MuiAccordion-root') || target.classList.contains('MuiAccordionSummary-root') || target.classList.contains('MuiButtonBase-root') || target.getAttribute('role') === 'button')) {
                            const clickTarget = target.querySelector('.MuiAccordionSummary-root, .MuiButtonBase-root, [role="button"]') || target;
                            clickTarget.click();
                            sharedDeliveryClicked = true;
                            found = true;
                            break;
                        }
                        target = target.parentElement;
                        attempts++;
                    }
                    if (found) break;
                }
            } catch (e) { }
        }

        if (found) {
            setTimeout(() => { clickEditDetails(0); }, 100);
        } else if (retryCount < maxRetries) {
            setTimeout(() => { clickSharedDeliveryArea(retryCount + 1); }, 100);
        }
    }

    function clickEditDetails(retryCount) {
        if (editDetailsClicked) return;
        retryCount = retryCount || 0;
        const maxRetries = 30;
        let found = false;

        try {
            const elements = document.querySelectorAll('.css-1lnv98w');
            for (const el of elements) {
                if (el.textContent && el.textContent.trim() === 'Edit Details') {
                    el.click();
                    editDetailsClicked = true;
                    found = true;
                    break;
                }
            }
        } catch (e) { }

        if (!found) {
            try {
                const allClickables = document.querySelectorAll('button, a, span, div, p, [role="button"]');
                for (const el of allClickables) {
                    if (el.textContent && el.textContent.trim() === 'Edit Details') {
                        el.click();
                        editDetailsClicked = true;
                        found = true;
                        break;
                    }
                }
            } catch (e) { }
        }

        if (!found) {
            try {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                    acceptNode: function(node) {
                        return node.nodeValue && node.nodeValue.trim() === 'Edit Details' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                });
                while (walker.nextNode()) {
                    let target = walker.currentNode.parentElement;
                    if (target) {
                        let clickTarget = target;
                        let attempts = 0;
                        while (clickTarget && attempts < 5) {
                            if (clickTarget.classList && clickTarget.classList.contains('css-1lnv98w')) {
                                clickTarget.click();
                                editDetailsClicked = true;
                                found = true;
                                break;
                            }
                            clickTarget = clickTarget.parentElement;
                            attempts++;
                        }
                        if (!found) {
                            target.click();
                            editDetailsClicked = true;
                            found = true;
                        }
                        break;
                    }
                }
            } catch (e) { }
        }

        if (!found && retryCount < maxRetries) {
            setTimeout(() => { clickEditDetails(retryCount + 1); }, 100);
        }
    }

    function isUSAddress(text) {
        if (!text) return false;
        const parts = text.split(',').map(part => part.trim().toUpperCase());
        return parts.some(part => part === 'US' || part === 'USA' || part === 'UNITED STATES' || === 'MX' || part === 'BR' || part === 'CA');
    }

    function updateAddressDisplay(text) {
        if (!addressDisplay) createAddressDisplay();
        const contentDiv = document.getElementById('addressContent');

        if (text && isUSAddress(text)) {
            const parts = text.split(',').map(part => part.trim());
            const formattedText = parts.join('<br>');
            contentDiv.innerHTML = '<strong style="font-size:15px;text-decoration:underline;">Address:</strong><br><br>' + formattedText;
            addressDisplay.style.backgroundColor = 'rgba(0,100,0,0.8)';
            addressDisplay.style.display = 'block';
            addressFound = true;
        } else if (text) {
            
        
            contentDiv.innerHTML = '<strong style="font-size:15px;">Address:</strong><br><br>Not a valid Address';
            addressDisplay.style.backgroundColor = 'rgba(100,100,100,0.8)';
            addressDisplay.style.display = 'block';
            addressFound = true;
        } else {
            contentDiv.innerHTML = '<strong style="font-size:15px;">Address:</strong><br><br>Not Found';
            addressDisplay.style.backgroundColor = 'rgba(100,100,100,0.8)';
            addressDisplay.style.display = 'block';
            addressFound = true;
        }
    }

    function checkForAddress() {
        const addressSelectors = [
            'div.css-1t6ofyo p.css-hd6zo3', 'div.css-1t6ofyo p[mdn-text]',
            'div.css-1t6ofyo p', '.css-1t6ofyo p.css-hd6zo3',
            '.css-1t6ofyo p', 'p.css-hd6zo3', 'p[mdn-text]'
        ];
        let addressText = null;
        for (const selector of addressSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    for (const el of elements) {
                        if (el.textContent && el.textContent.trim() !== '') {
                            addressText = el.textContent.trim();
                            break;
                        }
                    }
                    if (addressText) break;
                }
            } catch (e) { }
        }
        updateAddressDisplay(addressText);
    }

    function updateDisplay(text) {
        if (!floatingDisplay) createFloatingDisplay();
        if (text) {
            floatingDisplay.style.backgroundColor = 'rgba(255,0,0,0.8)';
            floatingDisplay.textContent = text;
            textFound = true;
            setTimeout(clickTargetButton, 100);
            setTimeout(() => { checkForAddress(); }, 100);
            if (text.includes('source1')) {
                setTimeout(() => { clickSharedDeliveryArea(0); }, 100);
            }
        } else {
            floatingDisplay.style.backgroundColor = 'rgba(0,0,0,0.8)';
            floatingDisplay.textContent = 'CaseType: Not Found';
            textFound = false;
            if (addressDisplay) addressDisplay.style.display = 'none';
        }
    }

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

    function resetSearch() {
        textFound = false;
        addressFound = false;
        buttonClicked = false;
        sharedDeliveryClicked = false;
        editDetailsClicked = false;

        if (floatingDisplay) {
            floatingDisplay.textContent = 'Searching...';
            floatingDisplay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        }

        if (addressDisplay) {
            const contentDiv = document.getElementById('addressContent');
            if (contentDiv) {
                contentDiv.innerHTML = '<strong>Address:</strong><br><br>Searching...';
            }
            addressDisplay.style.backgroundColor = 'rgba(0,0,0,0.8)';
            addressDisplay.style.display = 'none';
        }
    }

    function initialize() {
        console.log('Initializing CaseType Observer v0.9...');

        createFloatingDisplay();
        createAddressDisplay();

        setInterval(() => {
            if (!textFound) {
                checkForCaseType();
            }
        }, 100);

        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'submit-btn') {
                setTimeout(resetSearch, 100);
            }
        }, true);

        setTimeout(checkForCaseType, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
