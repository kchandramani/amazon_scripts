// ==UserScript==
// @name         Right buttons to copy
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds copy buttons to the right of input fields
// @author       You
// @match        https://na.geostudio.last-mile.amazon.dev/place*
// @match        https://eu.geostudio.last-mile.amazon.dev/place*
// @match        https://fe.geostudio.last-mile.amazon.dev/place*
// @sandbox      DOM
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function createCopyButton(inputField) {
        if (!inputField) return null;

        // Ensure parent is positioned relatively for absolute placement
        const parent = inputField.parentNode;
        if (window.getComputedStyle(parent).position === "static") {
            parent.style.position = "relative";
        }

        const button = document.createElement('button');
        button.innerHTML = `
            <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z" stroke="#1C274C" stroke-width="1.5"/>
                <path d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5" stroke="#1C274C" stroke-width="1.5"/>
            </svg>`;

        // Style the button
        button.style.position = 'absolute';
        button.style.right = '-12px'; // Position it 10px from the right
        button.style.top = '50%';
        button.style.transform = 'translateY(-50%)'; // Center vertically
        button.style.background = 'white';
        button.style.border = '1px solid #ccc';
        button.style.cursor = 'pointer';
        button.style.width = '36px';
        button.style.height = '36px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.borderRadius = '5px';

        // Append button inside parent, so it's positioned correctly
        parent.appendChild(button);

        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(inputField.value);
                //alert("Copied: " + inputField.value);
            } catch (error) {
                alert("Clipboard copy failed! Please allow clipboard permissions.");
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

    // Use MutationObserver to detect when elements are added dynamically
    const observer = new MutationObserver(() => addButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    // Run once in case elements are already loaded
    addButtons();
})();
