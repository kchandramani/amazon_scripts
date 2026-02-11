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
