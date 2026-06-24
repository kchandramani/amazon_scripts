(function() {
    'use strict';

    let isScriptActive = false;
    let trackedElements = []; // Holds objects: { input: HTMLElement, button: HTMLElement }

    function triggerReactChange(element, value) {
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

    function createPasteButton(inputField, svgContent) {
        const parent = inputField.parentNode;
        if (window.getComputedStyle(parent).position === "static") {
            parent.style.position = "relative";
        }

        const button = document.createElement('button');
        button.className = "custom-paste-btn";
        button.style.position = 'absolute';
        button.style.padding = '0';
        button.style.zIndex = '1000';
        button.style.background = 'transparent';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.width = '50px';
        button.style.height = '50px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';

        button.innerHTML = svgContent;
        document.body.appendChild(button);

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (inputField.disabled) return;

            try {
                const clipboardText = await navigator.clipboard.readText();
                triggerReactChange(inputField, clipboardText);
            } catch (error) {
                console.error("Clipboard operation failed:", error);
            }
        });

        return button;
    }

    function updateButtonPosition(inputField, button) {
        if (!inputField || !button) return;
        const rect = inputField.getBoundingClientRect();
        button.style.left = (window.scrollX + rect.left - 58) + 'px';
        button.style.top = (window.scrollY + rect.top - 14) + 'px';
    }

    const svgCircle = '<svg width="80px" height="80px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"/><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/><g id="SVGRepo_iconCarrier"><path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="0.45600000000000007" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';

    function cleanAllButtons() {
        trackedElements.forEach(item => {
            if (item.button && item.button.parentNode) {
                item.button.parentNode.removeChild(item.button);
            }
        });
        trackedElements = [];
    }

    function manageButtons() {
        if (!isScriptActive) {
            cleanAllButtons();
            return;
        }

        // Find all parking inputs based on their shared container or input properties
        const inputs = Array.from(document.querySelectorAll('input[id^="input-"]')).filter(input => {
            // Target elements matching your dynamic UI block
            return input.closest('.O3EtSPy1nbRuHJIAr1QM\\+g\\=\\=') !== null;
        });

        // Remove old buttons whose inputs are missing
        trackedElements = trackedElements.filter(item => {
            if (!inputs.includes(item.input)) {
                if (item.button && item.button.parentNode) item.button.parentNode.removeChild(item.button);
                return false;
            }
            return true;
        });

        // Add buttons for new inputs
        inputs.forEach(input => {
            const alreadyTracked = trackedElements.some(item => item.input === input);
            if (!alreadyTracked && !input.disabled) {
                const button = createPasteButton(input, svgCircle);
                if (button) {
                    trackedElements.push({ input, button });
                }
            }
        });

        // Refresh existing button positioning coordinates
        trackedElements.forEach(item => {
            updateButtonPosition(item.input, item.button);
        });
    }

    // Toggle logic whenever clicking "Parking Locations" text header
    document.body.addEventListener('click', (e) => {
        const targetText = e.target.textContent || "";
        if (targetText.trim() === "Parking Locations") {
            isScriptActive = !isScriptActive;
            console.log(`[Script Status]: ${isScriptActive ? "ENABLED" : "DISABLED"}`);
            manageButtons();
        }
    });

    // High frequency interval loop to maintain coordinate precision
    setInterval(() => {
        if (isScriptActive) {
            trackedElements.forEach(item => {
                updateButtonPosition(item.input, item.button);
            });
        }
    }, 200);

    // Watch for dynamic DOM modifications (adding/removing inputs 0-5)
    const observer = new MutationObserver(() => {
        manageButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
