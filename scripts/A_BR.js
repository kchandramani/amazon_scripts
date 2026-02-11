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
    });
})();
