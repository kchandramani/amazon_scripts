// GS 2.0 Remarks for US

(function () {
    'use strict';

    const selectList = document.createElement('select');
    selectList.style.position = 'absolute';
    selectList.style.left = '40%';
    selectList.style.bottom = '1%';
    selectList.style.padding = '5px';
    selectList.style.border = '1px solid';
    selectList.style.borderRadius = '4px';
    selectList.style.backgroundColor = '#fff';
    selectList.style.color = '#333';
    selectList.style.fontSize = '18px';
    selectList.style.fontFamily = '"Amazon Ember"';
    selectList.style.cursor = 'pointer';
    selectList.style.outline = 'none';
    selectList.style.zIndex = '9999';
    selectList.style.width = '150px';

    const defaultOption = document.createElement('option');
    defaultOption.value = -1;
    defaultOption.text = 'US Remarks';
    selectList.appendChild(defaultOption);

    const options = [
        'Delivery Hints',
        'Preferred UPID Delivery',
        'RE and DP is disabled',
        'DP is disabled',
        'RE is disabled',
        'Leasing / Locker not Found',
        'Mailroom not Found',
        'Traffic Road issue',
        'NotFoundin3P'
    ];

    const textToInsert = {
        'Delivery Hints': 'Geocorrected based on delivery hints provided by the customer',
        'Preferred UPID Delivery': 'Geocorrected based on the UPID Delivery',
        'RE and DP is disabled': 'RE and DP is disabled.',
        'DP is disabled': 'DP is disabled.',
        'RE is disabled': 'RE is disabled',
        'Leasing / Locker not Found': 'Leasing office or Locker not Found in any of the 3P and site map',
        'Mailroom not Found': 'Mailroom not Found in any of the 3P and site map',
        'Traffic Road issue': 'Traffic roads  service roads not enabling  GS issue.',
        'NotFoundin3P': 'Not able to locate in 3P'
    };

    options.forEach((optionText, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = optionText;
        selectList.appendChild(option);
    });

    let isPressed = false;
    let isTextboxFocused = false;

    selectList.addEventListener('mousedown', () => {
        isPressed = true;
        selectList.style.backgroundColor = '#d3e5ff';
    });

    selectList.addEventListener('mouseup', () => {
        isPressed = false;
        selectList.style.backgroundColor = '#fff';
    });

    selectList.addEventListener('mouseout', () => {
        if (!isPressed && !isTextboxFocused) {
            selectList.style.backgroundColor = '#fff';
        }
    });

    selectList.addEventListener('mouseenter', () => {
        if (!isPressed) {
            selectList.style.backgroundColor = '#f2f2f2';
        }
    });

    selectList.addEventListener('change', () => {
        const selectedIndex = selectList.value;
        if (selectedIndex >= 0) {
            const selectedText = options[selectedIndex];
            const textbox = document.querySelector("#remarks");
            if (!textbox) {
                const taskButton = document.getElementById("task-panel-button");
                if (taskButton) {
                    taskButton.click();
                    setTimeout(() => {
                        const updatedTextbox = document.querySelector("#remarks");
                        if (updatedTextbox) {
                            updatedTextbox.focus();
                            document.execCommand('selectAll');
                            document.execCommand('insertText', false, textToInsert[selectedText]);
                            selectList.value = -1;
                            selectList.blur();
                            isPressed = false;
                            isTextboxFocused = false;
                            selectList.style.backgroundColor = '#fff';
                        }
                    }, 100);
                }
            } else {
                try {
                    textbox.focus();
                    document.execCommand('selectAll');
                    document.execCommand('insertText', false, textToInsert[selectedText]);
                    selectList.value = -1;
                    selectList.blur();
                    isPressed = false;
                    isTextboxFocused = false;
                    selectList.style.backgroundColor = '#fff';
                } catch (error) {
                    console.error('Failed to paste into remarks box', error);
                }
            }
        }
    });

    selectList.addEventListener('focus', () => {
        selectList.classList.add('open');
    });

    selectList.addEventListener('blur', () => {
        selectList.classList.remove('open');
        if (!isTextboxFocused) {
            selectList.style.width = '150px';
        }
    });

    selectList.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            const selectedIndex = selectList.selectedIndex;
            if (event.key === 'ArrowUp' && selectedIndex > 0) {
                selectList.selectedIndex = selectedIndex - 1;
            } else if (event.key === 'ArrowDown' && selectedIndex < selectList.options.length - 1) {
                selectList.selectedIndex = selectedIndex + 1;
            }
            event.preventDefault();
        }
    });

    document.body.appendChild(selectList);

    const textbox = document.querySelector("#remarks");
    if (textbox) {
        textbox.addEventListener('focus', () => {
            isTextboxFocused = true;
            selectList.style.width = '150px';
        });
        textbox.addEventListener('blur', () => {
            isTextboxFocused = false;
            if (!selectList.classList.contains('open')) {
                selectList.style.width = '150px';
            }
        });
    }
})();
