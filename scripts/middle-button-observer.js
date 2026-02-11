// Middle Button Observer
// Adds floating middle button to copy DP geocode to RE geocode

(function() {
    'use strict';

    let middleButton = null;

    function triggerReactChange(element, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(element, value);

        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        const blurEvent = new Event('blur', { bubbles: true });

        Object.defineProperty(inputEvent, 'target', { value: element });
        Object.defineProperty(changeEvent, 'target', { value: element });
        Object.defineProperty(blurEvent, 'target', { value: element });

        element.dispatchEvent(inputEvent);
        element.dispatchEvent(changeEvent);

        element.setAttribute('data-last-value', value);

        if (!element.hasAttribute('blur-handler-added')) {
            element.addEventListener('blur', function(e) {
                const lastValue = this.getAttribute('data-last-value');
                if (lastValue) {
                    setTimeout(() => {
                        if (this.value !== lastValue) {
                            nativeInputValueSetter.call(this, lastValue);
                            this.dispatchEvent(new Event('input', { bubbles: true }));
                            this.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, 0);
                }
            });
            element.setAttribute('blur-handler-added', 'true');
        }
    }

    function addButton(inputId, targetInputId, svgContent, isMiddle) {
        const inputField = document.getElementById(inputId);
        if (!inputField) return null;

        const parent = inputField.parentNode;
        if (window.getComputedStyle(parent).position === "static") {
            parent.style.position = "relative";
        }

        const button = document.createElement('button');
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

        if (isMiddle) {
            button.addEventListener('click', async () => {
                const sourceInput = document.getElementById(inputId);
                const targetInput = document.getElementById(targetInputId);

                if (sourceInput && targetInput) {
                    try {
                        await navigator.clipboard.writeText(sourceInput.value);
                        const clipboardText = await navigator.clipboard.readText();
                        triggerReactChange(targetInput, clipboardText);
                    } catch (error) {
                        console.error("Operation failed:", error);
                    }
                }
            });
        }

        return button;
    }

    function updateButtonPosition() {
        if (middleButton) {
            const input1 = document.getElementById('input-dp-geocode');
            const input2 = document.getElementById('input-re-geocode');
            if (input1 && input2) {
                const rect1 = input1.getBoundingClientRect();
                const rect2 = input2.getBoundingClientRect();
                middleButton.style.left = `${window.scrollX + rect1.left + 140}px`;
                middleButton.style.top = `${window.scrollY + (rect1.top + rect2.top) / 2 - 15}px`;
            }
        }
    }

    function addButtons() {
        if (!middleButton) {
            middleButton = addButton(
                'input-dp-geocode',
                'input-re-geocode',
                '<svg width="40px" height="40px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 8L14 8V10L8 16L2 10V8H6V0L10 4.76995e-08V8Z" fill="#000000"/></svg>',
                true
            );
        }
        updateButtonPosition();
    }

    setTimeout(addButtons, 1000);

    const observer = new MutationObserver(() => addButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(updateButtonPosition, 200);
})();
