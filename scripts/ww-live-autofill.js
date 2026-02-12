(function() {
    function createButton(label, left, action) {
        var button = document.createElement("button");
        button.innerHTML = label;
        button.setAttribute('style', `position: absolute; z-index: 2500; padding: 2px; left:${left}%; top: 38.5%; background-color: #E8E845; color: #000000; border: 4px #E8E845 #CCCCCC; border-radius: 8px; font-size: 17px; font-family: "Amazon Ember"; font-weight: bold; transition: background-color 0.3s, border-color 0.3s;`);

        button.addEventListener('click', async () => {
            try {
                await delay(10);
                await action();
            } catch (error) {
                showError(error);
            }
        });

        button.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#E8E845';
            this.style.borderColor = '#E8E845';
        });

        button.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#E8E845';
            this.style.borderColor = '#E8E845';
        });

        button.addEventListener('mousedown', function() {
            this.style.backgroundColor = '#E8E845';
            this.style.borderColor = '#E8E845';
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

    async function selectRadioButton(value, isAddressClassification = false) {
        let container = document;
        if (isAddressClassification) {
            const addressClassificationDiv = document.querySelector('div.css-19hedjk');
            if (!addressClassificationDiv) throw 'Address Classification section not found.';
            container = addressClassificationDiv;
        }

        const labels = container.querySelectorAll('label.css-rzgavw');
        for (let label of labels) {
            const input = label.querySelector(`input[value="${value}"]`);
            if (input) {
                label.click(); // Click the label instead of the input
                await delay(10); // Small delay to allow for any UI updates
                return;
            }
        }
        throw `Radio button with value ${value} not found.`;
    }

    async function selectOptionById(id, optionIndex) {
        var element = document.getElementById(id);
        if (!element) throw `Element with ID ${id} not found.`;
        var event = new Event("mousedown", { bubbles: true });
        element.dispatchEvent(event);

        await delay(10);

        var optionsListId = element.getAttribute("aria-controls");
        var optionsList = document.getElementById(optionsListId);
        if (!optionsList) throw `Options list for element with ID ${id} not found.`;

        var options = optionsList.querySelectorAll('[role="option"]');
        if (options.length > optionIndex) {
            options[optionIndex].click();
        } else {
            throw `Option at index ${optionIndex} not found for element with ID ${id}.`;
        }
    }

    async function selectSourceOption(optionIndex) {
        try {
            await selectOptionById("source", optionIndex);
        } catch (error) {
            // If the source selection fails, we can log the error or handle it accordingly.
        }
    }

    async function svBuAction() {
        await selectRadioButton("FIXED(Actionable)");
        await selectOptionById("granularity", 0);
        await selectRadioButton("Perfect Address");
        await selectOptionById("UTLReason", 6);
        await selectSourceOption(0);
    }

    async function svRdAction() {
        await selectRadioButton("FIXED(Actionable)");
        await selectOptionById("granularity", 1);
        await selectSourceOption(0);
        await selectOptionById("UTLReason", 6);
        await selectRadioButton("Perfect Address");;
    }

    async function svNdAction() {
        await selectRadioButton("FIXED(Actionable)");
        await selectOptionById("granularity", 3);
        await selectSourceOption(0);
        await selectOptionById("UTLReason", 6);
        await selectRadioButton("Perfect Address");
    }

    async function svCAction() {
        await selectRadioButton("FIXED(Actionable)");
        await selectOptionById("granularity", 2);
        await selectSourceOption(0);
        await selectOptionById("UTLReason", 6);
        await selectRadioButton("Perfect Address");
    }

    async function utlAction() {
        await selectRadioButton("NEI(Non-actionable)");
        await selectOptionById("granularity", 4);
        await selectSourceOption(7);
        await selectRadioButton("Perfect Address");
        await selectOptionById("UTLReason", 6);
    }

    async function nakAction() {
        await selectRadioButton("NFR(Non-actionable)");
        await selectOptionById("granularity", 5);
        await selectSourceOption(7);
        await selectRadioButton("Perfect Address");
        await selectOptionById("UTLReason", 6);
    }

    async function dfPoAction() {
        await selectRadioButton("NEI(Non-actionable)"); // For actionTaken
        await selectOptionById("granularity", 5);
        await selectSourceOption(6);
        await selectRadioButton("Perfect Address", true); // For addressClassification
        await selectOptionById("UTLReason", 6);
    }

    async function nrbAction() {
        await selectRadioButton("FIXED(Actionable)");
        await selectOptionById("granularity", 1);
        await selectSourceOption(0);
        await selectOptionById("roadLevelReason", 1);
        await selectRadioButton("Perfect Address");
        await selectOptionById("UTLReason", 6);
    }

    async function utnfAction() {
        await selectRadioButton("NEI(Non-actionable)");
        await selectOptionById("granularity", 4);
        await selectSourceOption(7);
        await selectOptionById("UTLReason", 1);
        await selectRadioButton("Perfect Address");
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

    // Create buttons at the top of the screen, spaced evenly
    createButton("Sv-BD", 3, svBuAction);
    createButton("Sv-RD", 13, svRdAction);
    createButton("Sv-ND", 23, svNdAction);
    createButton("Sv-C", 33, svCAction);
    createButton("UTL", 43, utlAction);
    createButton("NAK", 53, nakAction);
    createButton("DF|PO", 63, dfPoAction);
    createButton("NRB", 73, nrbAction);
    createButton("UTNF", 83, utnfAction);
})();
