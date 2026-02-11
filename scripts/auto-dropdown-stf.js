// Auto Drop Down Selection STF

(function() {
    function createButton(label, left, action) {
        var button = document.createElement("button");
        button.innerHTML = label;
        button.setAttribute('style', 'position: absolute; z-index: 2500; padding: 2px; left:' + left + '%; top: 1%; background-color: #CCCCCC; color: #000000; border: 5px solid #CCCCCC; border-radius: 8px; font-size: 14px; font-family: "Amazon Ember"; font-weight: bold; transition: background-color 0.3s, border-color 0.3s;');

        button.addEventListener('click', async () => {
            try {
                await delay(10);
                await action();
            } catch (error) {
                showError(error);
            }
        });

        button.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#777777';
            this.style.borderColor = '#777777';
        });

        button.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#CCCCCC';
            this.style.borderColor = '#CCCCCC';
        });

        button.addEventListener('mousedown', function() {
            this.style.backgroundColor = '#444444';
            this.style.borderColor = '#444444';
        });

        button.addEventListener('mouseup', function() {
            this.style.backgroundColor = '#777777';
            this.style.borderColor = '#777777';
        });

        document.body.appendChild(button);
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function selectRadioByValue(containerClass, value) {
        var container = document.querySelector('.' + containerClass);
        if (!container) throw 'Container with class ' + containerClass + ' not found.';

        var radioButtons = container.querySelectorAll('input[type="radio"]');
        var selectedRadio = Array.from(radioButtons).find(radio => radio.value === value);

        if (selectedRadio) {
            selectedRadio.click();
        } else {
            throw 'Radio button with value "' + value + '" not found in ' + containerClass + '.';
        }
    }

    async function selectOptionById(id, optionIndex) {
        var element = document.getElementById(id);
        if (!element) throw 'Element with ID ' + id + ' not found.';
        var event = new Event("mousedown", { bubbles: true });
        element.dispatchEvent(event);

        await delay(10);

        var optionsListId = element.getAttribute("aria-controls");
        var optionsList = document.getElementById(optionsListId);
        if (!optionsList) throw 'Options list for element with ID ' + id + ' not found.';

        var options = optionsList.querySelectorAll('[role="option"]');
        if (options.length > optionIndex) {
            options[optionIndex].click();
        } else {
            throw 'Option at index ' + optionIndex + ' not found for element with ID ' + id + '.';
        }
    }

    async function selectSourceOption(optionIndex) {
        try {
            await selectOptionById("source", optionIndex);
        } catch (error) {
            // If the source selection fails, log or handle accordingly
        }
    }

    async function svBuAction() {
        await selectRadioByValue("css-gx29mt", "Save");
        await selectOptionById("granularity", 1);
        await selectOptionById("source", 4);
    }

    async function utlAction() {
        await selectRadioByValue("css-gx29mt", "NA");
        await selectOptionById("granularity", 0);
        await selectSourceOption(0);
    }

    function showError(errorMessage) {
        var errorDiv = document.createElement("div");
        errorDiv.innerHTML = errorMessage;
        errorDiv.style.color = "red";
        errorDiv.style.position = "absolute";
        errorDiv.style.top = "50%";
        errorDiv.style.left = "50%";
        errorDiv.style.transform = "translate(-50%, -50%)";
        errorDiv.style.zIndex = "9999";
        errorDiv.style.backgroundColor = "#FFFFFF";
        errorDiv.style.padding = "10px";
        errorDiv.style.border = "1px solid #CCCCCC";
        errorDiv.style.borderRadius = "4px";
        errorDiv.style.fontSize = "16px";
        errorDiv.style.fontFamily = "Amazon Ember";
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.style.opacity = 0;
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 20);
        }, 2000);
    }

    createButton("Sv-ST", -2, svBuAction);
    createButton("NA", 90, utlAction);
})();
