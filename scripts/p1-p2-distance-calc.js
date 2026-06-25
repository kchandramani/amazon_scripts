(function() {
    'use strict';

    // 1. Haversine formula to calculate distance in meters
    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Radius of the Earth in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    }

    // 2. Locate coordinates from the specified page inputs
    function getCoordinates() {
        const paragraphs = Array.from(document.querySelectorAll('p.css-2lt2bb'));
        let p1Input = null;
        let p2Input = null;

        paragraphs.forEach(p => {
            const text = p.textContent.trim().toLowerCase();
            if (text === 'parking location 1') {
                const parentWrapper = p.closest('.O3EtSPy1nbRuHJIAr1QM\\+g\\=\\=');
                if (parentWrapper) p1Input = parentWrapper.querySelector('input.css-1k4cgj4');
            } else if (text === 'parking location 2') {
                const parentWrapper = p.closest('.O3EtSPy1nbRuHJIAr1QM\\+g\\=\\=');
                if (parentWrapper) p2Input = parentWrapper.querySelector('input.css-1k4cgj4');
            }
        });

        if (!p1Input || !p2Input) return null;

        const coord1 = p1Input.value.split(',').map(num => parseFloat(num.trim()));
        const coord2 = p2Input.value.split(',').map(num => parseFloat(num.trim()));

        if (coord1.length === 2 && coord2.length === 2 && !isNaN(coord1[0]) && !isNaN(coord2[0])) {
            return { c1: coord1, c2: coord2 };
        }
        return null;
    }

    // 3. Construct and mount UI with exact requested layout parameters
    function setupUI() {
        // Prevent duplicate containers if script reruns
        if (document.getElementById('tm-geo-container')) return;

        // Container setup
        const container = document.createElement('div');
        container.id = 'tm-geo-container';
        container.style.position = 'fixed';
        container.style.top = '830px';
        container.style.right = '310px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '5px';
        container.style.zIndex = '999999';
        container.style.pointerEvents = 'none';
        container.style.padding = '5px';

        // Button component matching requested styling parameters
        const button = document.createElement('button');
        button.textContent = 'P1-P2';
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

        // Text output panel matching the design hierarchy
        const outputText = document.createElement('div');
        outputText.style.padding = '5px 10px';
        outputText.style.backgroundColor = '#ffffff';
        outputText.style.color = '#333333';
        outputText.style.borderRadius = '4px';
        outputText.style.fontSize = '11px';
        outputText.style.fontWeight = 'bold';
        outputText.style.fontFamily = '"Amazon Ember", sans-serif';
        outputText.style.boxShadow = 'rgba(0, 0, 0, 0.1) 0px 1px 3px';
        outputText.style.border = '1px solid #ddd';
        outputText.style.textAlign = 'center';
        outputText.style.display = 'none'; // Hidden until calculated

        // Hover bindings
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgb(54, 104, 195)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgb(74, 144, 226)';
        });

        // Click Action
        button.addEventListener('click', () => {
            const coords = getCoordinates();
            if (coords) {
                const meters = calculateHaversineDistance(coords.c1[0], coords.c1[1], coords.c2[0], coords.c2[1]);
                outputText.textContent = `${meters.toFixed(2)} m`;
                outputText.style.display = 'block';
            } else {
                outputText.textContent = 'PL missing!';
                outputText.style.display = 'block';
            }
        });

        // Assemble elements
        container.appendChild(button);
        container.appendChild(outputText);
        document.body.appendChild(container);
    }

    // 4. Run initialization cleanly on DOM changes to guarantee UI placement
    function init() {
        setupUI();

        // Standard mutation safety observer for dynamic web layouts
        const observer = new MutationObserver(() => {
            setupUI();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    init();
})();
