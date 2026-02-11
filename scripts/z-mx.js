function() {
    'use strict';

    document.addEventListener('keydown', (event) => {
        const textbox = document.querySelector('#geofence');
        if (!textbox) return;

        if (event.key === 'a' || event.key === 'A') {
            textbox.select();
            document.execCommand('insertText', false, '25');
        }

        if (event.key === 'z' || event.key === 'Z') {
            textbox.select();
            document.execCommand('insertText', false, '50');
        }
    });
})();
