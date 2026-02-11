// ==UserScript==
// @name         Left button to paste with observer
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Adds floating buttons next to input fields, detects elements dynamically, and pastes clipboard text on click
// @author       You
// @match        https://na.geostudio.last-mile.amazon.dev/place*
// @match        https://eu.geostudio.last-mile.amazon.dev/place*
// @match        https://fe.geostudio.last-mile.amazon.dev/place*
// @sandbox      DOM
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let button1 = null;
    let button2 = null;
    let lastReValue = null;

    function triggerReactChange(element, value) {
        // Store the value we want to maintain
        lastReValue = value;

        // Set the value using the native setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(element, value);

        // Create and dispatch events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // Focus the element
        element.focus();

        // Ensure the value stays and cursor is at the end
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

    function addButton(inputId, svgContent) {
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

    function updateButtonPosition(inputId, button, offsetY = 0) {
        const inputField = document.getElementById(inputId);
        if (!inputField || !button) return;

        const rect = inputField.getBoundingClientRect();
        button.style.left = `${window.scrollX + rect.left - 58}px`;
        button.style.top = `${window.scrollY + rect.top - 14 + offsetY}px`;
    }

    function addButtons() {
        if (!button1) {
            button1 = addButton('input-dp-geocode', `<svg width="80px" height="80px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"/>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
                <g id="SVGRepo_iconCarrier"> <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="0.45600000000000007" stroke-linecap="round" stroke-linejoin="round"/> </g>
            </svg>`);
        }

        if (!button2) {
            button2 = addButton('input-re-geocode', `<svg width="80px" height="80px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"/>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
                <g id="SVGRepo_iconCarrier"> <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="0.45600000000000007" stroke-linecap="round" stroke-linejoin="round"/> </g>
            </svg>`);
        }

        setInterval(() => {
            updateButtonPosition('input-dp-geocode', button1);
            updateButtonPosition('input-re-geocode', button2);
        }, 200);
    }

    // Initial setup with delay
    setTimeout(addButtons, 1000);

    // Observer setup
    const observer = new MutationObserver((mutations) => {
        addButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();