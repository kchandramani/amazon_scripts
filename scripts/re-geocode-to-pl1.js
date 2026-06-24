(function() {
    'use strict';

    let bridgeContainer = null;

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

    // Text-based process to locate the exact input element next to "Parking location 1"
    function findParkingLocation1Input() {
        const paragraphs = document.querySelectorAll('p');
        let targetLabelElement = null;

        for (let p of paragraphs) {
            if (p.textContent.trim() === "Parking location 1") {
                targetLabelElement = p;
                break;
            }
        }

        if (!targetLabelElement) return null;

        const containerBox = targetLabelElement.closest('.css-b1l7p0') || targetLabelElement.parentElement?.parentElement;
        if (!containerBox) return null;

        return containerBox.querySelector('input[type="text"]');
    }

    function createBridgeUI() {
        if (bridgeContainer) return;

        // Create container using your exact positioning rules
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '900px';
        container.style.right = '310px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '5px';
        container.style.zIndex = '999999';
        container.style.pointerEvents = 'none';
        container.style.padding = '5px';

        // Create button matching your exact visual design tokens
        const button = document.createElement('button');
        button.textContent = 'RE ➔ P1';
        //button.title = "Copy RE Geocode to Parking Location 1";

        button.style.padding = '5px 10px';
        button.style.backgroundColor = 'rgb(74, 144, 226)';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '12px';
        button.style.fontWeight = 'bold';
        button.style.fontFamily = '"Amazon Ember", sans-serif';
        button.style.transition = 'background-color 0.2s';
        button.style.boxShadow = 'rgba(0, 0, 0, 0.2) 0px 2px 4px';
        button.style.pointerEvents = 'auto';

        // Hover animations
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgb(54, 104, 195)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgb(74, 144, 226)';
        });

        // Click Logic
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const sourceREInput = document.getElementById('input-re-geocode');
            const targetParking1 = findParkingLocation1Input();

            if (!sourceREInput) {
                console.warn("[Bridge Script]: RE input field (#input-re-geocode) not found.");
                return;
            }

            if (!targetParking1) {
                console.warn("[Bridge Script]: Could not find active input box matching label 'Parking location 1'.");
                return;
            }

            if (targetParking1.disabled) {
                console.warn("[Bridge Script]: Parking Location 1 input is disabled.");
                return;
            }

            const geocodeValue = sourceREInput.value;
            if (!geocodeValue.trim()) {
                console.warn("[Bridge Script]: RE Geocode field value is empty.");
                return;
            }

            // Fire input events to change state values safely inside React
            triggerReactChange(targetParking1, geocodeValue);
            console.log(`[Bridge Script]: Successfully copied "${geocodeValue}" directly into Parking Location 1.`);
        });

        container.appendChild(button);
        document.body.appendChild(container);
        bridgeContainer = container;
    }

    // Monitoring Loop: Checks if the workspace panel is up
    setInterval(() => {
        const reInput = document.getElementById('input-re-geocode');
        if (reInput) {
            if (!bridgeContainer) {
                createBridgeUI();
            }
        } else {
            if (bridgeContainer && bridgeContainer.parentNode) {
                bridgeContainer.parentNode.removeChild(bridgeContainer);
                bridgeContainer = null;
            }
        }
    }, 500);

})();
