
// Z MX - Geofence Setter
// Press A to set Geofence to 25
// Press Z to set Geofence to 50

(function() {
    'use strict';

    document.addEventListener('keydown', (event) => {
        if (event.key === 'a' || event.key === 'A') {
            const textbox = document.querySelector('#geofence');
            if (textbox) {
                textbox.select();
                document.execCommand('insertText', false, '25');
            }
        }

        if (event.key === 'z' || event.key === 'Z') {
            const textbox = document.querySelector('#geofence');
            if (textbox) {
                textbox.select();
                document.execCommand('insertText', false, '50');
            }
        }
    });
})();
