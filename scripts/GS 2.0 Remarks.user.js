// ==UserScript==
// @name         GS 2.0 Remarks
// @author       @manichk
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add remarks for different scenarios
// @match        https://eu.templates.geostudio.last-mile.amazon.dev/*
// @match        https://na.templates.geostudio.last-mile.amazon.dev/*
// @match        https://fe.templates.geostudio.last-mile.amazon.dev/*
// ==/UserScript==
(function () {
    'use strict';
    const selectList = document.createElement('select');
    selectList.style.position = 'absolute';
    selectList.style.left = '70%';
    selectList.style.bottom = '2%';
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
    selectList.style.width = '110px';
    const defaultOption = document.createElement('option');
    defaultOption.value = -1;
    defaultOption.text = 'Remarks';
    selectList.appendChild(defaultOption);
    const options = [
        'Delivery Hints',
        'Preferred Delivery loc',
        'Customer preference',
        //'New development',
       // 'Nearby DP',
        'Locality Mismatch',
        'Zip Issue',
        //'City_Country Mismatch',
        'NotFoundin3P',
        'long road',
        'Zip is on the same road.',
        'CX_Hint Address Coflict',
       // 'NAK Issue',
        'Within Locality',
        'Multiple Road',
        'Partially Matching Road',
        'Adjacent locality',
        'Long Road / No GCRS',
        'Combination Not Found',
        'Traffic Road issue',
       // 'Direct Search'
    ];
    const textToInsert = {
        'Delivery Hints': 'Geocorrected based on delivery hints provided by the customer',
        'Preferred Delivery loc': 'Geocorrected based on the Preferred Delivery location',
        'Customer preference': 'Geocorrected based on details mentioned by the Customer in the customer name column of geostudio.',
        'New development': 'Customer mentioned address is a new development area as per the GDE layer, hence geocorrected based on 3P resources (Bing, OSM, Kibana/FR GIS) to the best possible location.',
        'Nearby DP': 'Geocorrected based on Nearby Delivery points with 3P maps confirmation, AID-Nearby DP',
        'NotFoundin3P': 'Not able to locate in 3P',
        'long road': 'long road and no GCRS and bing is also not taking to the building or nearby building number.',
        'Zip is on the same road.': 'Zip is on the same road.',
        'Zip Issue': 'ZIP is Not Matching.',
        'City_Country Mismatch': 'City , Country Not Matching',
        'CX_Hint Address Coflict':'CX address and delivery hint address are conflicting',
        'NAK Issue': 'Different Road or Locality or building number Learned',
        'Locality Mismatch':'Locality is not Matching  or Not locatable or too far.',
        'Within Locality':'Marked within locality , using bing right click validation wrtx Locality bouandry.',
        'Multiple Road':'Multiple roads with same name or Multiple Prefix, Suffix',
        'Partially Matching Road':'Partially Matching street',
        'Adjacent locality':'Adjacent locality Found',
        'Long Road / No GCRS':'long road and no GCRS and bing is also not taking to the building or nearby building number ',
        'Combination Not Found':'Not found the road combination mentioned By CX',
        'Traffic Road issue': 'Traffic roads  service roads not enabling  GS issue.',
        'Direct Search':'Marked till road level based on bing direct search + nearby number'
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
            selectList.style.width = '110px';
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
            selectList.style.width = '110px';
        });
        textbox.addEventListener('blur', () => {
            isTextboxFocused = false;
            if (!selectList.classList.contains('open')) {
                selectList.style.width = '110px';
            }
        });
    }
})();