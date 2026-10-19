// Right Copy Buttons (Stealth Mode)

(function() {
    'use strict';

    function createCopyButton(inputField) {
        if (!inputField) return null;

        const parent = inputField.parentNode;
        if (window.getComputedStyle(parent).position === "static") {
            parent.style.position = "relative";
        }

        const button = document.createElement('button');

        button.style.position = 'absolute';
        button.style.right = '-12px';
        button.style.top = '50%';
        button.style.transform = 'translateY(-50%)';
        button.style.background = 'transparent';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.width = '36px';
        button.style.height = '36px';
        button.style.opacity = '0';
        button.style.userSelect = 'none';
        button.style.outline = 'none';
        button.style.zIndex = '1000';

        parent.appendChild(button);

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                await navigator.clipboard.writeText(inputField.value);
            } catch (error) {
                console.error("Clipboard write failed:", error);
            }
        });

        return button;
    }

    function addButtons() {
        const input1 = document.getElementById('input-dp-geocode');
        const input2 = document.getElementById('input-re-geocode');

        if (input1 && !input1.dataset.hasButton) {
            createCopyButton(input1);
            input1.dataset.hasButton = "true";
        }

        if (input2 && !input2.dataset.hasButton) {
            createCopyButton(input2);
            input2.dataset.hasButton = "true";
        }
    }

    const observer = new MutationObserver(() => addButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    addButtons();
})();
