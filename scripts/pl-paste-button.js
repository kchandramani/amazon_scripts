
(function() {
    'use strict';

    let trackedElements = []; // { input: HTMLElement, button: HTMLElement }

    function triggerReactChange(element, value) {
        if (!element || element.disabled) return;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(element, value);

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        element.focus();

        setTimeout(() => {
            if (element.value !== value) {
                nativeInputValueSetter.call(element, value);
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
            element.focus();
            const len = element.value.length;
            element.setSelectionRange(len, len);
        }, 50);
    }

    function createPasteButton(inputField) {
        const button = document.createElement('button');
        button.className = "custom-stealth-paste-btn";
        button.style.position = 'absolute';
        button.style.padding = '0';
        button.style.zIndex = '9999';
        button.style.background = 'transparent';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.width = '48px';
        button.style.height = '36px';
        button.style.opacity = '0';
        button.style.userSelect = 'none';
        button.style.outline = 'none';

        document.body.appendChild(button);

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (inputField.disabled) return;

            try {
                const clipboardText = await navigator.clipboard.readText();
                if (clipboardText) {
                    triggerReactChange(inputField, clipboardText.trim());
                }
            } catch (error) {
                console.error("[Parking Paste] Clipboard operation failed:", error);
            }
        });

        return button;
    }

    function updateButtonPosition(inputField, button) {
        if (!inputField || !button || !document.body.contains(inputField)) return;

        const rect = inputField.getBoundingClientRect();

        // If input is collapsed, hidden, or zero-sized, hide button off-screen
        if (rect.width === 0 || rect.height === 0 || rect.top < -100) {
            button.style.display = 'none';
            return;
        }

        button.style.display = 'block';
        button.style.left = (window.scrollX + rect.left - 52) + 'px';
        button.style.top = (window.scrollY + rect.top + (rect.height / 2) - 18) + 'px';
    }

    // Resilient detection: finds parking inputs whether class names change or not
    function isParkingLocationInput(input) {
        // 1. Check known obfuscated container class
        if (input.closest('.O3EtSPy1nbRuHJIAr1QM\\+g\\=\\=')) return true;

        // 2. Check if parent section/accordion has "Parking" in text
        const container = input.closest('.MuiAccordion-root, .MuiPaper-root, section, form, div[class*="css-"]');
        if (container) {
            const heading = container.querySelector('h1, h2, h3, h4, h5, h6, p, span, [role="button"]');
            if (heading && /parking\s*locations?/i.test(heading.textContent)) {
                return true;
            }
        }

        // 3. Check preceding label or text sibling
        let prev = input.previousElementSibling || input.parentElement?.previousElementSibling;
        if (prev && /parking/i.test(prev.textContent)) {
            return true;
        }

        return false;
    }

    function scanAndAttachButtons() {
        // Find inputs that look like coordinate/parking text fields
        const allCandidates = document.querySelectorAll('input[id^="input-"], input[type="text"], input:not([type])');

        const parkingInputs = Array.from(allCandidates).filter(input => {
            return input.id && isParkingLocationInput(input);
        });

        // 1. Prune buttons whose inputs were detached or deleted
        trackedElements = trackedElements.filter(item => {
            if (!document.body.contains(item.input) || !parkingInputs.includes(item.input)) {
                if (item.button && item.button.parentNode) {
                    item.button.remove();
                }
                return false;
            }
            return true;
        });

        // 2. Attach invisible trigger to newly detected parking inputs
        parkingInputs.forEach(input => {
            const alreadyTracked = trackedElements.some(item => item.input === input);
            if (!alreadyTracked && !input.disabled) {
                const button = createPasteButton(input);
                if (button) {
                    trackedElements.push({ input, button });
                    updateButtonPosition(input, button);
                }
            }
        });

        // 3. Align positions with existing inputs
        trackedElements.forEach(item => {
            updateButtonPosition(item.input, item.button);
        });
    }

    // Keep trigger aligned during scroll or viewport resizing
    window.addEventListener('scroll', () => {
        trackedElements.forEach(item => updateButtonPosition(item.input, item.button));
    }, { passive: true });

    window.addEventListener('resize', () => {
        trackedElements.forEach(item => updateButtonPosition(item.input, item.button));
    }, { passive: true });

    // Active loop (250ms) to ensure coordinates lock immediately upon layout shifts
    setInterval(scanAndAttachButtons, 250);

    // Mutation observer for immediate capture when accordions expand or tasks load
    const observer = new MutationObserver(() => {
        scanAndAttachButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'disabled']
    });

    // Initial check
    setTimeout(scanAndAttachButtons, 500);
})();
