// ==UserScript==
// @name         Z MX
// @version      1.0
// @noframes
// @author       manichk
// @match        https://na.geostudio.last-mile.amazon.dev/place*
// @match        https://eu.geostudio.last-mile.amazon.dev/place*
// @description  Set Geofence to 25 Meter
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('keydown', (event) => {
        if (event.key === 'z' || event.key === 'Z') {
            const textbox = document.querySelector('#geofence');
            if (textbox) {
                textbox.select();
                document.execCommand('insertText', false, '50');
            }
        }
    });
})();