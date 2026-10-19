// Left Paste Buttons with Observer (Stealth Mode)

(function() {
    'use strict';

    let button1 = null;
    let button2 = null;
    let lastReValue = null;

    function triggerReactChange(element, value) {
        lastReValue = value;
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

    function addButton(inputId) {
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
        button.style.opacity = '0';
        button.style.userSelect = 'none';
        button.style.outline = 'none';

        document.body.appendChild(button);

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const textbox = document.getElementById(inputId);
            if (!textbox) return;

            try {
                const clipboardText = await navigator.clipboard.readText();

                if (inputId === 'input-re-geocode') {
                    triggerReactChange(textbox, clipboardText);
                } else {
                    textbox.select();
                    document.execCommand('insertText', false, clipboardText);
                }
            } catch (error) {
                console.error("Clipboard operation failed:", error);
            }
        });

        return button;
    }

    function updateButtonPosition(inputId, button, offsetY) {
        offsetY = offsetY || 0;
        const inputField = document.getElementById(inputId);
        if (!inputField || !button) return;

        const rect = inputField.getBoundingClientRect();
        button.style.left = (window.scrollX + rect.left - 58) + 'px';
        button.style.top = (window.scrollY + rect.top - 14 + offsetY) + 'px';
    }

    function addButtons() {
        if (!button1) {
            button1 = addButton('input-dp-geocode');
        }
        if (!button2) {
            button2 = addButton('input-re-geocode');
        }

        setInterval(() => {
            updateButtonPosition('input-dp-geocode', button1);
            updateButtonPosition('input-re-geocode', button2);
        }, 200);
    }

    setTimeout(addButtons, 1000);

    const observer = new MutationObserver((mutations) => {
        addButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
