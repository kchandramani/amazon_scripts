(function() {
    'use strict';

    const CASE_TIME_RANGE_MIN = 4;
    const CASE_TIME_RANGE_MAX = 15;
    const DEFAULT_CASE_TIME_ORDER = [12, 5, 8, 15, 4, 6, 7, 9, 10, 11, 13, 14];
    const CASE_TIME_ORDER_KEY = 'productivityPanelCaseTimeOrder';
    const WORKDAY_MINUTES = 480;
    const PRODUCTIVITY_TREND_MIN_INTERVAL = 45;
    const TREND_DATA_STORAGE_KEY_PREFIX = 'productivityTrends_';
    const DATA_ELEMENT_SELECTOR = ".a-form-label.a-text-normal";
    const TOTAL_AUDITBOOK_TIME_INDEX = 2;
    const GEOSTUDIO_TIME_INDEX = 4;
    const GEOSTUDIO_CASES_STRING_INDEX = 5;

    const FORM_DATE_FROM_SELECTOR = 'input[name="FROMDATE"]';
    const FORM_DATE_TO_SELECTOR = 'input[name="TODATE"]';
    const FORM_SUBMIT_BUTTON_SELECTOR = "#SUBMIT";

    const BREAKDOWN_TABLE_SELECTOR = 'table';

    const ICON_STYLE = `style="vertical-align: -0.2em; margin-right: 6px; width: 1.2em; height: 1.2em;"`;
    const ICON_STYLE_SMALL = `style="vertical-align: -0.15em; margin-right: 4px; width: 1em; height: 1em;"`;
    const ICON_CLOCK = `<svg ${ICON_STYLE} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    const ICON_TREND = `<svg ${ICON_STYLE} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
    const ICON_TARGET = `<svg ${ICON_STYLE} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`;
    const ICON_EDIT = `<svg ${ICON_STYLE_SMALL} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
    const ICON_TABLE = `<svg ${ICON_STYLE_SMALL} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"></path><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`;
    const ICON_INFO = `<svg ${ICON_STYLE_SMALL} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    const ICON_CALENDAR = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const ICON_CHEVRON_LEFT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    const ICON_CHEVRON_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    const ICON_ARROW_UP = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`;
    const ICON_ARROW_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`;
    const ICON_CALCULATOR = `<svg ${ICON_STYLE_SMALL} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><line x1="16" y1="10" x2="12" y2="10"></line><line x1="12" y1="14" x2="8" y2="14"></line><line x1="12" y1="18" x2="8" y2="18"></line><line x1="8" y1="10" x2="8" y2="10"></line></svg>`;
    const ICON_BAR_CHART = `<svg ${ICON_STYLE_SMALL} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>`;

    const REORDER_BUTTON_STYLE = `background: none; border: none; padding: 2px 4px; cursor: pointer; line-height: 0; border-radius: 3px; margin-left: 3px; color: #6c757d;`;
    const REORDER_BUTTON_HOVER_STYLE = `background-color: #e9ecef; color: #0056b3;`;
    const REORDER_BUTTON_HOVER_STYLE_PROPERTIES = {
        backgroundColor: '#e9ecef',
        color: '#0056b3'
    };

    let previousTableHTML = '';
    let lastFetchedDoc = null;
    let lastFetchedValues = null;
    let currentReportDate = null;
    let currentCaseTimeOrder = [...DEFAULT_CASE_TIME_ORDER];
    let calendarState = {
        visible: false,
        year: new Date().getFullYear(),
        month: new Date().getMonth()
    };
    let clickOutsideCalendarListener = null;

    let lastCalculatedMetrics = {
        utilizedTime: 0,
        nonTimedoutCases: 0,
        effectiveGeostudioTime: 0,
        totalGeostudioCases: 0,
        originalTimedoutGeostudioCasesTotal: 0
    };

    async function getCaseTimeOrder() {
        try {
            const storedOrder = await GM.getValue(CASE_TIME_ORDER_KEY, DEFAULT_CASE_TIME_ORDER);
            if (Array.isArray(storedOrder) && storedOrder.length > 0 && storedOrder.every(n => typeof n === 'number' && n >= CASE_TIME_RANGE_MIN && n <= CASE_TIME_RANGE_MAX)) {
                const expectedNumbers = new Set(Array.from({ length: CASE_TIME_RANGE_MAX - CASE_TIME_RANGE_MIN + 1 }, (_, i) => i + CASE_TIME_RANGE_MIN));
                const storedNumbers = new Set(storedOrder);
                if (expectedNumbers.size === storedNumbers.size && [...expectedNumbers].every(num => storedNumbers.has(num))) {
                    return storedOrder;
                } else {
                    await saveCaseTimeOrder(DEFAULT_CASE_TIME_ORDER);
                    return [...DEFAULT_CASE_TIME_ORDER];
                }
            } else {
                await saveCaseTimeOrder(DEFAULT_CASE_TIME_ORDER);
                return [...DEFAULT_CASE_TIME_ORDER];
            }
        } catch (error) {
            return [...DEFAULT_CASE_TIME_ORDER];
        }
    }

    async function saveCaseTimeOrder(orderArray) {
        try {
            await GM.setValue(CASE_TIME_ORDER_KEY, orderArray);
            currentCaseTimeOrder = [...orderArray];
        } catch (error) {}
    }

    function getDailyAdjustmentsStorageKey(dateString) {
        return `productivityAdjustments_${dateString}`;
    }

    async function getAdjustmentValuesForDate(dateString) {
        const key = getDailyAdjustmentsStorageKey(dateString);
        try {
            const storedData = await GM.getValue(key, {});
            const validatedAdjustments = {};
            for (let minute = CASE_TIME_RANGE_MIN; minute <= CASE_TIME_RANGE_MAX; minute++) {
                const keyStr = String(minute);
                validatedAdjustments[keyStr] = parseAndValidateInt(storedData[keyStr] || '0', `Adjustment ${minute}m`);
            }
            return validatedAdjustments;
        } catch (error) {
            const errorDefaults = {};
            for (let minute = CASE_TIME_RANGE_MIN; minute <= CASE_TIME_RANGE_MAX; minute++) {
                errorDefaults[String(minute)] = 0;
            }
            return errorDefaults;
        }
    }

    async function setAdjustmentValuesForDate(dateString, adjustments) {
        const key = getDailyAdjustmentsStorageKey(dateString);
        const validAdjustments = {};
        for (const minuteStr in adjustments) {
            if (adjustments.hasOwnProperty(minuteStr)) {
                const minute = parseInt(minuteStr, 10);
                if (!isNaN(minute) && minute >= CASE_TIME_RANGE_MIN && minute <= CASE_TIME_RANGE_MAX) {
                    validAdjustments[minuteStr] = parseAndValidateInt(adjustments[minuteStr] || '0', `Adjustment ${minute}m`);
                }
            }
        }
        try {
            const existingData = await GM.getValue(key, {});
            const dataToSave = { ...existingData, ...validAdjustments };
            await GM.setValue(key, dataToSave);
        } catch (error) {}
    }

    function getProductivityTrendStorageKey(dateString) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            dateString = getTodayDateString();
        }
        return `${TREND_DATA_STORAGE_KEY_PREFIX}${dateString}`;
    }

    async function getTrendDataForDate(dateString) {
        const key = getProductivityTrendStorageKey(dateString);
        try {
            const storedData = await GM.getValue(key, []);
            if (Array.isArray(storedData)) {
                return storedData.filter(item =>
                    item && typeof item.timestamp === 'string' &&
                    typeof item.effectiveGeostudioTime === 'number' &&
                    typeof item.nonTimedoutCases === 'number'
                );
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    async function saveTrendDataForDate(dateString, trendDataArray) {
        const key = getProductivityTrendStorageKey(dateString);
        try {
            if (!Array.isArray(trendDataArray)) return;
            await GM.setValue(key, trendDataArray);
        } catch (error) {}
    }

    async function updateAndSaveProductivityTrends(dateToUse, currentMetrics) {
        if (!dateToUse || !currentMetrics) return;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToUse)) {
            dateToUse = getTodayDateString();
        }
        const { effectiveGeostudioTime, nonTimedoutCases } = currentMetrics;
        let trends = await getTrendDataForDate(dateToUse);
        const lastTrend = trends.length > 0 ? trends[trends.length - 1] : null;
        const newEntry = {
            timestamp: new Date().toISOString(),
            effectiveGeostudioTime: parseFloat(effectiveGeostudioTime.toFixed(2)),
            nonTimedoutCases: nonTimedoutCases
        };
        if (!lastTrend) {
            if (newEntry.effectiveGeostudioTime > 0 || newEntry.nonTimedoutCases > 0) {
                trends.push(newEntry);
                await saveTrendDataForDate(dateToUse, trends);
            }
        } else {
            const lastTrendEffectiveTime = parseFloat(lastTrend.effectiveGeostudioTime.toFixed(2));
            const timeDiffSinceLastSave = newEntry.effectiveGeostudioTime - lastTrendEffectiveTime;
            const casesChanged = newEntry.nonTimedoutCases !== lastTrend.nonTimedoutCases;
            let shouldAddNewEntry = false;
            let shouldReplaceLastEntry = false;
            if (timeDiffSinceLastSave >= PRODUCTIVITY_TREND_MIN_INTERVAL) {
                if (newEntry.effectiveGeostudioTime > lastTrendEffectiveTime || casesChanged) {
                    shouldAddNewEntry = true;
                }
            } else {
                if (newEntry.effectiveGeostudioTime === lastTrendEffectiveTime && casesChanged) {
                    shouldReplaceLastEntry = true;
                }
            }
            if (shouldReplaceLastEntry) {
                trends[trends.length - 1] = newEntry;
                await saveTrendDataForDate(dateToUse, trends);
            } else if (shouldAddNewEntry) {
                if (lastTrendEffectiveTime !== newEntry.effectiveGeostudioTime || lastTrend.nonTimedoutCases !== newEntry.nonTimedoutCases) {
                    trends.push(newEntry);
                    await saveTrendDataForDate(dateToUse, trends);
                }
            }
        }
    }

    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDisplayDate(date) {
        const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
        if (isNaN(dateObj)) return "Invalid Date";
        return dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function createCalendarElement() {
        if (document.getElementById('tm-productivity-calendar')) return;
        const calendarDiv = document.createElement('div');
        calendarDiv.id = 'tm-productivity-calendar';
        calendarDiv.style.cssText = `
            position: absolute; z-index: 2147483647; background-color: white;
            border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            padding: 10px; display: none;
            font-family: system-ui, "Amazon Ember", sans-serif; font-size: 13px;
            width: 260px; box-sizing: border-box;
        `;
        calendarDiv.innerHTML = `
            <div class="tm-calendar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #eee;">
                <button class="tm-calendar-prev" title="Previous Month" style="background: none; border: none; cursor: pointer; padding: 3px 5px; border-radius: 3px;">${ICON_CHEVRON_LEFT}</button>
                <span class="tm-calendar-month-year" style="font-weight: 500;"></span>
                <button class="tm-calendar-next" title="Next Month" style="background: none; border: none; cursor: pointer; padding: 3px 5px; border-radius: 3px;">${ICON_CHEVRON_RIGHT}</button>
            </div>
            <div class="tm-calendar-days-header" style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.8em; color: #6c757d; margin-bottom: 5px; font-weight: 500;">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>
            <div class="tm-calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;"></div>
        `;
        document.body.appendChild(calendarDiv);
        calendarDiv.querySelector('.tm-calendar-prev').addEventListener('click', () => changeCalendarMonth(-1));
        calendarDiv.querySelector('.tm-calendar-next').addEventListener('click', () => changeCalendarMonth(1));
        calendarDiv.querySelectorAll('.tm-calendar-prev, .tm-calendar-next').forEach(btn => {
            btn.addEventListener('mouseover', () => { btn.style.backgroundColor = '#f0f0f0'; });
            btn.addEventListener('mouseout', () => { btn.style.backgroundColor = 'transparent'; });
        });
    }

    function renderCalendar(year, month) {
        const calendarDiv = document.getElementById('tm-productivity-calendar');
        if (!calendarDiv) return;
        const monthYearSpan = calendarDiv.querySelector('.tm-calendar-month-year');
        const grid = calendarDiv.querySelector('.tm-calendar-grid');
        const date = new Date(year, month, 1);
        monthYearSpan.textContent = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        grid.innerHTML = '';
        const firstDayOfMonth = date.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = getTodayDateString();
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.appendChild(document.createElement('span'));
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const daySpan = document.createElement('span');
            daySpan.textContent = day;
            const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            daySpan.dataset.date = currentDateStr;
            daySpan.style.cssText = `padding: 5px 0; text-align: center; cursor: pointer; border-radius: 4px; transition: background-color 0.2s ease;`;
            if (currentDateStr === todayStr) {
                daySpan.style.fontWeight = 'bold';
                daySpan.style.border = '1px solid #007bff';
            }
            if (currentDateStr === currentReportDate) {
                daySpan.style.backgroundColor = '#007bff';
                daySpan.style.color = 'white';
            } else {
                daySpan.addEventListener('mouseover', () => { if(currentDateStr !== currentReportDate) daySpan.style.backgroundColor = '#e9ecef'; });
                daySpan.addEventListener('mouseout', () => { if(currentDateStr !== currentReportDate) daySpan.style.backgroundColor = 'transparent'; });
            }
            daySpan.addEventListener('click', (event) => {
                event.stopPropagation();
                handleDateSelection(currentDateStr);
            });
            grid.appendChild(daySpan);
        }
    }

    function changeCalendarMonth(delta) {
        calendarState.month += delta;
        if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
        else if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
        renderCalendar(calendarState.year, calendarState.month);
    }

    function toggleCalendar() {
        const calendarDiv = document.getElementById('tm-productivity-calendar');
        const dateButton = document.getElementById('datePickerButton');
        if (!calendarDiv || !dateButton) return;
        calendarState.visible = !calendarState.visible;
        if (calendarState.visible) {
            const current = currentReportDate ? new Date(currentReportDate + 'T00:00:00') : new Date();
            if(!isNaN(current)){
                calendarState.year = current.getFullYear(); calendarState.month = current.getMonth();
            } else {
                const today = new Date(); calendarState.year = today.getFullYear(); calendarState.month = today.getMonth();
            }
            renderCalendar(calendarState.year, calendarState.month);
            const rect = dateButton.getBoundingClientRect();
            calendarDiv.style.top = `${rect.bottom + window.scrollY + 5}px`;
            calendarDiv.style.left = `${rect.left + window.scrollX}px`;
            calendarDiv.style.display = 'block';
            setTimeout(() => {
                clickOutsideCalendarListener = (event) => {
                    if (!calendarDiv.contains(event.target) && event.target !== dateButton && !dateButton.contains(event.target)) {
                        hideCalendar();
                    }
                };
                document.addEventListener('click', clickOutsideCalendarListener, { capture: true, once: false });
            }, 0);
        } else {
            hideCalendar();
        }
    }

    function hideCalendar() {
        const calendarDiv = document.getElementById('tm-productivity-calendar');
        if (calendarDiv) calendarDiv.style.display = 'none';
        calendarState.visible = false;
        if (clickOutsideCalendarListener) {
            document.removeEventListener('click', clickOutsideCalendarListener, { capture: true });
            clickOutsideCalendarListener = null;
        }
    }

    async function setupUIControls() {
        currentCaseTimeOrder = await getCaseTimeOrder();
        if (!document.getElementById('timeUtilisationButton')) {
            const button = document.createElement('button');
            button.id = 'timeUtilisationButton';
            button.title = 'Click to fetch and calculate data for the selected date (defaults to today)';
            button.textContent = 'Time & Productivity';
            button.style.cssText = `
                position: fixed; top: 3.25%; right: 47.5%; z-index: 2147483647;
                padding: 9px 16px; background-color: #5C7B9A; color: white;
                border: none; border-radius: 8px; font-weight: 500; cursor: pointer;
                font-size: 15px; font-family: system-ui, "Amazon Ember", sans-serif;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.2s ease;
            `;
            button.addEventListener('mouseover', () => { button.style.backgroundColor = '#4A6B8A'; button.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.15)'; });
            button.addEventListener('mouseout', () => { button.style.backgroundColor = '#5C7B9A'; button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; button.style.transform = 'scale(1)'; });
            button.addEventListener('mousedown', () => { button.style.transform = 'scale(0.98)'; });
            button.addEventListener('mouseup', () => { button.style.transform = 'scale(1)'; });
            button.addEventListener('click', () => fetchDataForDate(currentReportDate || getTodayDateString()));
            document.body.appendChild(button);
        }
        if (!document.getElementById('datePickerButton')) {
            const dateButton = document.createElement('button');
            dateButton.id = 'datePickerButton';
            dateButton.title = 'Select a date to view report';
            dateButton.innerHTML = ICON_CALENDAR;
            dateButton.style.cssText = `
                position: fixed; top: 3.25%; right: calc(47.5% - 55px);
                z-index: 2147483647; padding: 9px 10px;
                background-color: #6c757d; color: white; border: none;
                border-radius: 8px; cursor: pointer; line-height: 0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.2s ease;
            `;
            dateButton.addEventListener('mouseover', () => { dateButton.style.backgroundColor = '#5a6268'; });
            dateButton.addEventListener('mouseout', () => { dateButton.style.backgroundColor = '#6c757d'; });
            dateButton.addEventListener('mousedown', () => { dateButton.style.transform = 'scale(0.98)'; });
            dateButton.addEventListener('mouseup', () => { dateButton.style.transform = 'scale(1)'; });
            dateButton.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleCalendar();
            });
            document.body.appendChild(dateButton);
        }
        createCalendarElement();
        const hiddenPicker = document.getElementById('hiddenDatePicker');
        if (hiddenPicker) hiddenPicker.remove();
    }
        async function handleReorderClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        const row = button.closest('.case-time-row');
        if (!row) return;
        const caseTime = parseInt(row.dataset.caseTime, 10);
        if (isNaN(caseTime)) return;
        let currentOrder = await getCaseTimeOrder();
        const currentIndex = currentOrder.indexOf(caseTime);
        if (currentIndex === -1) return;
        let newIndex = -1;
        if (action === 'move-up' && currentIndex > 0) { newIndex = currentIndex - 1; }
        else if (action === 'move-down' && currentIndex < currentOrder.length - 1) { newIndex = currentIndex + 1; }
        if (newIndex !== -1) {
            const timedOutInputArea = document.getElementById('timedOutInputArea');
            const currentAdjustments = {};
            if (timedOutInputArea) {
                const defaultCaseTimeBeforeReorder = currentOrder[0];
                const manualInputs = timedOutInputArea.querySelectorAll(`input[type="number"][id^="case-input-"]`);
                manualInputs.forEach(input => {
                    const inputCaseTime = parseInt(input.dataset.caseTime, 10);
                    if (!isNaN(inputCaseTime) && inputCaseTime !== defaultCaseTimeBeforeReorder) {
                        currentAdjustments[String(inputCaseTime)] = input.value || '0';
                    }
                });
                const defaultDisplaySpan = timedOutInputArea.querySelector(`#case-display-${defaultCaseTimeBeforeReorder}`);
                if (defaultDisplaySpan) {
                    if (currentIndex === 0 || newIndex === 0) {
                        const currentDefaultValue = defaultDisplaySpan.textContent || '0';
                        currentAdjustments[String(defaultCaseTimeBeforeReorder)] = String(parseAndValidateInt(currentDefaultValue, `Default ${defaultCaseTimeBeforeReorder}m value`));
                    }
                }
                for (let minute = CASE_TIME_RANGE_MIN; minute <= CASE_TIME_RANGE_MAX; minute++) {
                    const minuteStr = String(minute);
                    if (minute !== defaultCaseTimeBeforeReorder && !currentAdjustments.hasOwnProperty(minuteStr)) {
                        currentAdjustments[minuteStr] = '0';
                    }
                }
                const dateToRecalculate = currentReportDate || getTodayDateString();
                await setAdjustmentValuesForDate(dateToRecalculate, currentAdjustments);
            }
            [currentOrder[currentIndex], currentOrder[newIndex]] = [currentOrder[newIndex], currentOrder[currentIndex]];
            await saveCaseTimeOrder(currentOrder);
            if (lastFetchedValues) {
                try {
                    const dateToRecalculate = currentReportDate || getTodayDateString();
                    await performCalculation(lastFetchedValues.totalAuditbookTimeStr, lastFetchedValues.geostudioTimeStr, lastFetchedValues.geostudioCasesStr, dateToRecalculate);
                    attachInputAreaListeners();
                    attachMainResultAreaListeners();
                    updateRequiredProductivityDisplay();
                } catch (error) {
                    const feedbackDiv = document.getElementById('productivityPanel')?.querySelector('#timedOutInputArea .feedback-message');
                    if(feedbackDiv) feedbackDiv.textContent = 'Error updating after reorder.';
                }
            }
        }
    }

    function attachInputAreaListeners() {
        const timedOutInputArea = document.getElementById('timedOutInputArea');
        if (!timedOutInputArea) return;
        timedOutInputArea.removeEventListener('click', handleReorderClick);
        timedOutInputArea.removeEventListener('input', handleInputValidationWrapper);
        timedOutInputArea.removeEventListener('focusout', handleInputValidationWrapper);
        timedOutInputArea.removeEventListener('focusin', handleInputFocus);
        timedOutInputArea.addEventListener('click', handleReorderClick);
        timedOutInputArea.addEventListener('input', handleInputValidationWrapper);
        timedOutInputArea.addEventListener('focusout', handleInputValidationWrapper);
        timedOutInputArea.addEventListener('focusin', handleInputFocus);
        const updateButton = timedOutInputArea.querySelector('#updateTimedOutCasesButton');
        if (updateButton) {
            updateButton.onclick = null;
            updateButton.addEventListener('click', () => {
                const currentOrder = currentCaseTimeOrder;
                const defaultCaseTime = currentOrder.length > 0 ? currentOrder[0] : null;
                const dateToSave = currentReportDate || getTodayDateString();
                const originalTimedoutGeostudioCasesTotal = lastCalculatedMetrics.originalTimedoutGeostudioCasesTotal;
                updateCalculations(defaultCaseTime, originalTimedoutGeostudioCasesTotal, dateToSave);
            });
            updateButton.addEventListener('mouseover', () => { if (!updateButton.disabled) { updateButton.style.backgroundColor = '#28a745'; updateButton.style.color = '#fff'; updateButton.style.borderColor = '#1e7e34'; } });
            updateButton.addEventListener('mouseout', () => { if (!updateButton.disabled) { updateButton.style.backgroundColor = '#a1cca5'; updateButton.style.color = '#155724'; updateButton.style.borderColor = '#86b98a'; } });
        }
    }

    function attachMainResultAreaListeners() {
        const mainResultArea = document.getElementById('mainResultArea');
        if (!mainResultArea) return;
        const targetInput = mainResultArea.querySelector('#targetProductivityInput');
        if (targetInput) {
            targetInput.removeEventListener('input', updateRequiredProductivityDisplay);
            targetInput.addEventListener('input', updateRequiredProductivityDisplay);
        }
    }

    function handleInputValidationWrapper(event) {
        const target = event.target;
        if (target.tagName === 'INPUT' && target.type === 'number' && target.id.startsWith('case-input-')) {
            const originalTimedoutGeostudioCasesTotal = lastCalculatedMetrics.originalTimedoutGeostudioCasesTotal;
            const currentOrder = currentCaseTimeOrder;
            const defaultCaseTime = currentOrder.length > 0 ? currentOrder[0] : null;
            validateTimedOutInputs(defaultCaseTime, originalTimedoutGeostudioCasesTotal);
        }
    }

    function handleInputFocus(event) {
        const target = event.target;
        if (target.tagName === 'INPUT' && target.type === 'number' && target.id.startsWith('case-input-')) {
            target.style.borderColor = '#007bff';
            target.style.boxShadow = 'none';
            target.style.outline = 'none';
        }
    }

    // *** NEW FUNCTION: Generates the percentage progress bar ***
    function generatePercentageBarHTML(utilizedMinutes) {
        const percentage = Math.min((utilizedMinutes / WORKDAY_MINUTES) * 100, 100);
        const displayPercentage = percentage.toFixed(1);
        let barColor;
        let textColor;
        if (percentage < 50) {
            barColor = '#ffc107';
            textColor = '#856404';
        } else if (percentage <= 90) {
            barColor = '#28a745';
            textColor = '#ffffff';
        } else {
            barColor = '#dc3545';
            textColor = '#ffffff';
        }
        const textInside = percentage >= 15;
        return `
            <div id="workPercentageBar" style="width: 90%; margin: 6px auto 2px auto;" title="Work Done: ${displayPercentage}% of ${WORKDAY_MINUTES} mins (${utilizedMinutes.toFixed(0)} mins utilized)">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
    <span style="font-size: 0.8em; font-weight: 500; color: #495057;">Work Progress: <strong style="color: ${barColor};">${displayPercentage}%</strong></span>
    <span style="font-size: 0.8em; font-weight: 600; color: #5a6268;" title="Remaining: ${(100 - percentage).toFixed(1)}% of ${WORKDAY_MINUTES} mins (${(WORKDAY_MINUTES - utilizedMinutes).toFixed(0)} mins left)">Remaining: ${(100 - percentage).toFixed(1)}%</span>
</div>
                <div style="width: 100%; background-color: #e9ecef; border-radius: 8px; overflow: hidden; height: 20px; position: relative; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);">
                    <div style="
                        width: ${displayPercentage}%;
                        height: 100%;
                        background-color: ${barColor};
                        border-radius: 8px;
                        transition: width 0.6s ease-in-out, background-color 0.4s ease;
                        display: flex;
                        align-items: center;
                        justify-content: ${textInside ? 'center' : 'flex-end'};
                        min-width: ${percentage > 0 ? '2px' : '0'};
                    ">
                        ${textInside ? `<span style="color: ${textColor}; font-size: 0.75em; font-weight: 600; text-shadow: 0 0 2px rgba(0,0,0,0.2); padding: 0 5px; white-space: nowrap;">${displayPercentage}%</span>` : ''}
                    </div>
                    ${!textInside && percentage > 0 ? `<span style="position: absolute; left: calc(${displayPercentage}% + 5px); top: 50%; transform: translateY(-50%); font-size: 0.75em; font-weight: 600; color: #495057; white-space: nowrap;">${displayPercentage}%</span>` : ''}
                </div>
            </div>`;
    }

    async function createOrUpdateMainPanel(calculatedTotalUtilizedTime, productivityRate, calculatedCounts, geostudioCasesStr, originalTimedoutGeostudioCasesTotal) {
        let panelElement = document.getElementById('productivityPanel');
        const isFirstCreation = !panelElement;
        let currentTargetValue = '';
        if (!isFirstCreation && panelElement) {
            const existingTargetInput = panelElement.querySelector('#mainResultArea #targetProductivityInput');
            if (existingTargetInput) { currentTargetValue = existingTargetInput.value; }
        }
        if (isFirstCreation) {
            panelElement = document.createElement('div');
            panelElement.id = 'productivityPanel';
            panelElement.style.cssText = `
                position: fixed; bottom: 0; left: 0; right: 0; width: 100%;
                background-color: #f8f9fa; border-top: 1px solid #dee2e6;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.08); z-index: 2147483644;
                display: flex; align-items: stretch;
                font-family: system-ui, "Amazon Ember", sans-serif; font-size: 13px; color: #343a40;
                border-radius: 6px 6px 0 0; overflow: hidden; padding: 0;
                box-sizing: border-box; max-height: 50vh;
            `;
            panelElement.innerHTML = `
                <div id="timedOutInputArea" style="flex: 1 1 260px; padding: 12px 15px; border-right: 1px solid #e9ecef; background-color: #ffffff; display: flex; flex-direction: column; gap: 5px; box-sizing: border-box; overflow-y: auto;"></div>
                <div id="mainResultArea" style="flex: 1.5 1 350px; padding: 15px 20px; border-right: 1px solid #e9ecef; background-color: #ffffff; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; position: relative; box-sizing: border-box; text-align: center; overflow-y: auto; font-size: 17px;"></div>
                <div id="rightColumnContainer" style="flex: 1.8 1 300px; background-color: #ffffff; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box;">
                    <div id="timeBreakdownArea" style="flex-basis: 50%; padding: 5px 6px; overflow-y: auto; box-sizing: border-box; min-height: 0; border-bottom: 1px solid #e9ecef;"></div>
                    <div id="productivityTrendArea" style="flex-basis: 50%; padding: 10px 12px; overflow-y: auto; box-sizing: border-box; min-height: 0;"></div>
                </div>
            `;
            document.body.appendChild(panelElement);
        }
        const timedOutInputArea = panelElement.querySelector('#timedOutInputArea');
        const mainResultArea = panelElement.querySelector('#mainResultArea');

        if (timedOutInputArea) {
            currentCaseTimeOrder = await getCaseTimeOrder();
            const defaultCaseTime = currentCaseTimeOrder.length > 0 ? currentCaseTimeOrder[0] : null;
            const dateForAdjustments = currentReportDate || getTodayDateString();
            const savedAdjustments = await getAdjustmentValuesForDate(dateForAdjustments);
            timedOutInputArea.innerHTML = '';
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 4px;`;
            const updateButtonHTML = `
                <button id="updateTimedOutCasesButton" title="Put Timedout task count for your task time. Click to update for ${formatDisplayDate(dateForAdjustments)}."
                    style="padding: 4px 8px; background-color: #a1cca5; color: #155724; border: 1px solid #86b98a; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: 500; transition: all 0.2s ease; margin-left: 10px; white-space: nowrap;">
                    Update
                </button>`;
            headerDiv.innerHTML = `
                <span style="font-weight: 500; color: #0056b3; font-size: 0.95em; display: inline-flex; align-items: center;">
                    ${ICON_EDIT}Timed-out Tasks (${formatDisplayDate(dateForAdjustments)})
                </span>
                ${updateButtonHTML}`;
            timedOutInputArea.appendChild(headerDiv);

            currentCaseTimeOrder.forEach((caseTime, index) => {
                const isDefault = (caseTime === defaultCaseTime);
                const isFirst = index === 0;
                const isLast = index === currentCaseTimeOrder.length - 1;
                const rowDiv = document.createElement('div');
                rowDiv.className = 'case-time-row';
                rowDiv.dataset.caseTime = caseTime;
                rowDiv.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border-radius: 4px; background-color: ${isDefault ? '#e9ecef' : '#fff'}; border: 1px solid ${isDefault ? '#e9ecef' : '#fff'};`;
                let labelHTML = `<label style="font-size: 0.85em; color: #5a6268; margin-right: 5px;">${caseTime}m ${isDefault ? '(Default Timeout):' : 'Timeout tasks:'}</label>`;
                let valueElementHTML = '';
                if (isDefault) {
                    const displayValue = calculatedCounts && calculatedCounts[String(caseTime)] !== undefined ? calculatedCounts[String(caseTime)] : '-';
                    valueElementHTML = `<span id="case-display-${caseTime}" data-case-time="${caseTime}" style="min-width: 35px; font-size: 0.9em; text-align: right; color: #343a40; font-weight: 500;">${displayValue}</span>`;
                } else {
                    const savedValue = savedAdjustments[String(caseTime)] || 0;
                    valueElementHTML = `<input type="number" id="case-input-${caseTime}" data-case-time="${caseTime}" name="case-input-${caseTime}" min="0" value="${savedValue > 0 ? savedValue : ''}" placeholder="0" style="width: 45px; padding: 3px 5px; border: 1px solid #ced4da; border-radius: 3px; font-size: 0.9em; text-align: right; background-color: #fff; transition: border-color 0.15s ease-in-out;">`;
                }
                let buttonsHTML = '<span style="display: inline-flex; align-items: center;">';
                if (!isFirst) buttonsHTML += `<button title="Move Up" data-action="move-up" style="${REORDER_BUTTON_STYLE}">${ICON_ARROW_UP}</button>`;
                else buttonsHTML += `<span style="width: 22px; display: inline-block;"></span>`;
                if (!isLast) buttonsHTML += `<button title="Move Down" data-action="move-down" style="${REORDER_BUTTON_STYLE}">${ICON_ARROW_DOWN}</button>`;
                else buttonsHTML += `<span style="width: 22px; display: inline-block;"></span>`;
                buttonsHTML += '</span>';
                rowDiv.innerHTML = `
                    <div style="flex-grow: 1;">${labelHTML}</div>
                    <div style="margin-left: auto; margin-right: 8px;">${valueElementHTML}</div>
                    <div>${buttonsHTML}</div>`;
                timedOutInputArea.appendChild(rowDiv);
            });
            timedOutInputArea.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('mouseover', () => { btn.style.backgroundColor = REORDER_BUTTON_HOVER_STYLE_PROPERTIES.backgroundColor; btn.style.color = REORDER_BUTTON_HOVER_STYLE_PROPERTIES.color; });
                btn.addEventListener('mouseout', () => { btn.style.backgroundColor = 'transparent'; btn.style.color = ''; });
            });
            const controlsDiv = document.createElement('div');
            controlsDiv.style.marginTop = '5px';
            controlsDiv.innerHTML = `<div class="feedback-message" style="color: #dc3545; font-size: 0.8em; margin-top: 4px; min-height: 1.1em; text-align: center;"></div>`;
            timedOutInputArea.appendChild(controlsDiv);
            attachInputAreaListeners();
            validateTimedOutInputs(defaultCaseTime, originalTimedoutGeostudioCasesTotal);
        }

        if (mainResultArea) {
            const hoursAndMinutes = convertToHoursAndMinutes(calculatedTotalUtilizedTime);
            const remainingMinutes = Math.max(WORKDAY_MINUTES - calculatedTotalUtilizedTime, 0);
            const remainingTime = convertToHoursAndMinutes(remainingMinutes);
            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const currentDisplayDate = currentReportDate ? formatDisplayDate(currentReportDate) : 'Today';
            const percentageBarHTML = generatePercentageBarHTML(calculatedTotalUtilizedTime);
            const targetProductivityHTML = `
                <div style="margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; width: 90%;">
                    <label for="targetProductivityInput" style="font-size: 0.9em; color: #0056b3; white-space: nowrap; font-weight: 500;" title="Enter your desired overall cases/hour target for the day.">Target Overall Productivity:</label>
                    <input type="number" id="targetProductivityInput" min="0" step="0.1" placeholder="e.g., 7.5"
                           style="width: 60px; padding: 3px 6px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; text-align: right;">
                    <span id="requiredProductivityDisplay" style="font-size: 0.9em; color: #0056b3; white-space: nowrap; display: inline-flex; align-items: center; min-width: 100px; justify-content: left;" title="Productivity needed in remaining time to hit the target.">
                        ${ICON_CALCULATOR} Required: --
                    </span>
                </div>`;

            mainResultArea.innerHTML = `
                <div style="line-height: 1.3;">
                    <div style="font-size: 0.85em; color: #6c757d; margin-bottom: px;"><strong>${currentDisplayDate}</strong></div>
                    <strong style="font-weight: 500; font-size: 1.0em; color: #333;">${ICON_CLOCK}Time Utilisation</strong><br>
                    <span style="font-size: 1.3em; font-weight: 600;">${calculatedTotalUtilizedTime.toFixed(0)} mins</span>
                    <div style="font-size: 0.95em; color: #0056b3;">${hoursAndMinutes}</div>
                </div>
                ${percentageBarHTML}
                <div style="line-height: 2.3; margin-top: -2px;">
    <strong style="font-weight: 500; font-size: 1.0em; color: #333;">${ICON_TARGET}Time Remaining</strong><br>
    <div style="font-size: 0.95em; color: #5a6268;">${remainingTime}</div>
    <div style="font-size: 1.85em; color: #0056b3; margin-top: 3px; font-weight: 500;" title="Estimated work end time based on current local time + remaining time">
        🏁 Work ends at: <strong>${(() => {
            if (remainingMinutes <= 0) return 'Completed!';
            const now = new Date();
            const endTime = new Date(now.getTime() + remainingMinutes * 60000);
            return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        })()}</strong>
    </div>
</div>
                <div style="border-top: 1px dashed #e9ecef; padding-top: 8px; margin-top: 5px; width: 85%; line-height: 1.3;">
                    <strong style="font-weight: 500; font-size: 1.0em; color: #1e7e34;">${ICON_TREND}Current Productivity</strong><br>
                    <span style="font-size: 1.3em; font-weight: 600; color: #1e7e34;">${productivityRate.toFixed(2)} <span style="font-size: 0.7em; font-weight: 400;">cases/hr</span></span>
                    <div style="font-size: 0.8em; color: #6c757d; margin-top: 3px;">${ICON_INFO}Timed-out tasks: ${originalTimedoutGeostudioCasesTotal} | Tasks submitted: ${lastCalculatedMetrics.nonTimedoutCases} </div>
                </div>
                ${targetProductivityHTML}
                <div style="font-size: 0.75em; color: #6c757d; position: absolute; bottom: 5px; right: 10px;">
                    Updated: ${currentTime}
                </div>`;

            const newTargetInput = mainResultArea.querySelector('#targetProductivityInput');
            if (newTargetInput && currentTargetValue !== '') { newTargetInput.value = currentTargetValue; }
            attachMainResultAreaListeners();
            updateRequiredProductivityDisplay();
        }
        if (lastFetchedDoc) { displayBreakdown(lastFetchedDoc); }
        const dateForTrends = currentReportDate || getTodayDateString();
        await displayProductivityTrends(dateForTrends);
    }

    async function displayProductivityTrends(dateToDisplay) {
        const trendArea = document.getElementById('productivityTrendArea');
        if (!trendArea) return;
        trendArea.innerHTML = `<div style="font-weight: 500; color: #0056b3; font-size: 0.9em; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e9ecef; display: flex; align-items: center;">${ICON_BAR_CHART}Productivity Trends(Approx.)(Min: 45 mins)</div>`;
        const trends = await getTrendDataForDate(dateToDisplay);
        if (trends.length < 2) {
            const noDataDiv = document.createElement('div');
            noDataDiv.textContent = trends.length === 1 ? "More data needed for the first trend slice." : "No productivity trend data for this date yet.";
            noDataDiv.style.fontSize = '0.85em'; noDataDiv.style.color = '#6c757d'; noDataDiv.style.padding = '10px 0'; noDataDiv.style.textAlign = 'center';
            trendArea.appendChild(noDataDiv);
            return;
        }
        const trendList = document.createElement('ul');
        trendList.style.listStyleType = 'none'; trendList.style.paddingLeft = '0'; trendList.style.margin = '0';
        let maxRateForScaling = 0;
        const periods = [];
        for (let i = 1; i < trends.length; i++) {
            const prev = trends[i - 1]; const curr = trends[i];
            const timeDeltaMinutes = curr.effectiveGeostudioTime - prev.effectiveGeostudioTime;
            const casesDelta = curr.nonTimedoutCases - prev.nonTimedoutCases;
            if (timeDeltaMinutes > 0) {
                const rate = (casesDelta / timeDeltaMinutes) * 60;
                periods.push({ startTime: prev.effectiveGeostudioTime, endTime: curr.effectiveGeostudioTime, startCases: prev.nonTimedoutCases, endCases: curr.nonTimedoutCases, timeDeltaMinutes, casesDelta, rate: Math.max(0, rate) });
                if (rate > maxRateForScaling) maxRateForScaling = rate;
            }
        }
        if (periods.length === 0) {
            const noDataDiv = document.createElement('div');
            noDataDiv.textContent = "Not enough change in data to display trend slices.";
            noDataDiv.style.fontSize = '0.85em'; noDataDiv.style.color = '#6c757d'; noDataDiv.style.padding = '10px 0'; noDataDiv.style.textAlign = 'center';
            trendArea.appendChild(noDataDiv);
            return;
        }
        if (maxRateForScaling === 0) maxRateForScaling = 10;

        periods.forEach(period => {
            const listItem = document.createElement('li');
            listItem.style.fontSize = '0.8em'; listItem.style.padding = '7px 4px'; listItem.style.borderBottom = '1px solid #f1f3f5'; listItem.style.display = 'flex'; listItem.style.alignItems = 'center'; listItem.style.gap = '10px';
            const periodEffectiveTimeStart = convertToHoursAndMinutes(period.startTime);
            const periodEffectiveTimeEnd = convertToHoursAndMinutes(period.endTime);
            const textInfo = document.createElement('div');
            textInfo.style.flex = '0 0 auto'; textInfo.style.lineHeight = '1.3'; textInfo.style.textAlign = 'right'; textInfo.style.minWidth = '150px';
            textInfo.innerHTML = `
                <span style="color: #343a40; font-size:0.9em;">${periodEffectiveTimeStart} &rarr; ${periodEffectiveTimeEnd}</span>
                <span style="color: #5a6268; font-size:0.85em;" title="Cases in this period / Duration of period">(${period.casesDelta} in ${convertToHoursAndMinutes(period.timeDeltaMinutes)})</span>
            `;
            const barContainer = document.createElement('div');
            barContainer.style.flex = '1 1 auto'; barContainer.style.height = '18px'; barContainer.style.backgroundColor = '#e9ecef'; barContainer.style.borderRadius = '4px'; barContainer.style.position = 'relative';
            const bar = document.createElement('div');
            const barWidthPercentage = maxRateForScaling > 0 ? (period.rate / maxRateForScaling) * 100 : 0;
            bar.style.width = `${Math.min(100, Math.max(0, barWidthPercentage))}%`;
            bar.style.height = '100%';
            if (period.rate <= 0) bar.style.backgroundColor = '#adb5bd';
            else if (period.rate > 7) bar.style.backgroundColor = '#28a745';
            else if (period.rate > 4) bar.style.backgroundColor = '#ffc107';
            else bar.style.backgroundColor = '#dc3545';
            bar.style.borderRadius = '4px'; bar.style.display = 'flex'; bar.style.alignItems = 'center'; bar.style.justifyContent = 'flex-end'; bar.style.overflow = 'hidden';
            const barText = document.createElement('span');
            barText.textContent = `${period.rate.toFixed(1)} c/hr`;
            barText.style.color = '#ffffff'; barText.style.fontSize = '0.85em'; barText.style.fontWeight = '500'; barText.style.paddingRight = '5px'; barText.style.textShadow = '0px 0px 2px rgba(0,0,0,0.5)';
            if (period.rate > 4 && period.rate <= 7) { barText.style.color = '#343a40'; barText.style.textShadow = 'none'; }
            else if (period.rate <= 0 && barWidthPercentage < 25) { barText.style.color = '#343a40'; barText.style.textShadow = 'none'; barText.style.paddingLeft = '5px'; barText.style.position = 'absolute'; barText.style.left = `${Math.min(100, Math.max(0, barWidthPercentage)) + 2}%`; barText.style.whiteSpace = 'nowrap'; }
            bar.appendChild(barText);
            barContainer.appendChild(bar);
            listItem.appendChild(textInfo);
            listItem.appendChild(barContainer);
            trendList.appendChild(listItem);
        });
        trendArea.appendChild(trendList);
    }
      function updateRequiredProductivityDisplay() {
        const targetInput = document.getElementById('targetProductivityInput');
        const displaySpan = document.getElementById('requiredProductivityDisplay');
        if (!targetInput || !displaySpan) return;
        const targetRateStr = targetInput.value;
        displaySpan.innerHTML = `${ICON_CALCULATOR} Req: --`;
        displaySpan.style.color = '#0056b3';
        displaySpan.title = "Productivity needed in remaining time to hit the target.";
        if (targetRateStr.trim() === '') return;
        const targetRate = parseFloat(targetRateStr);
        if (isNaN(targetRate) || targetRate <= 0) {
            displaySpan.innerHTML = `${ICON_CALCULATOR} <span style="color: #dc3545; font-weight: normal;">Invalid</span>`;
            displaySpan.title = "Please enter a positive number for the target rate.";
            return;
        }
        const { utilizedTime: utilizedTime_total_current, nonTimedoutCases: n_current, effectiveGeostudioTime: t_eff_current } = lastCalculatedMetrics;
        const remainingMinutes_total = Math.max(0, WORKDAY_MINUTES - utilizedTime_total_current);
        if (remainingMinutes_total <= 0) {
            displaySpan.innerHTML = `${ICON_CALCULATOR} <span style="color: #6c757d; font-weight: normal;">Day Over</span>`;
            displaySpan.title = "Workday finished, no time remaining.";
            return;
        }
        const currentRate = (t_eff_current > 0) ? (n_current / t_eff_current) * 60 : 0;
        if (targetRate <= currentRate && n_current > 0) {
            displaySpan.innerHTML = `${ICON_CALCULATOR} <span style="color: #28a745; font-weight: bold;">Met!</span>`;
            displaySpan.title = `Current rate (${currentRate.toFixed(2)}/hr) meets or exceeds target (${targetRate.toFixed(2)}/hr).`;
        } else {
            if (t_eff_current <= 0) {
                const requiredRate = targetRate;
                displaySpan.innerHTML = `${ICON_CALCULATOR} Req: <strong>${requiredRate.toFixed(2)}</strong>/hr`;
                displaySpan.style.color = '#ff7f0e';
                displaySpan.title = `No effective time logged yet. Need to maintain ${requiredRate.toFixed(2)}/hr for the remaining ${convertToHoursAndMinutes(remainingMinutes_total)}.`;
                return;
            }
            const n_target_for_current_time = targetRate * (t_eff_current / 60);
            const n_deficit = Math.max(0, n_target_for_current_time - n_current);
            const n_needed_for_remaining_time = targetRate * (remainingMinutes_total / 60);
            const n_total_needed_future = n_deficit + n_needed_for_remaining_time;
            const requiredRate = (remainingMinutes_total > 0) ? (n_total_needed_future / remainingMinutes_total) * 60 : Infinity;
            if (!isFinite(requiredRate) || requiredRate < 0) {
                displaySpan.innerHTML = `${ICON_CALCULATOR} <span style="color: #dc3545; font-weight: normal;">Impossible</span>`;
                displaySpan.title = "Target is mathematically impossible to reach in the remaining time.";
            } else {
                displaySpan.innerHTML = `${ICON_CALCULATOR} Req: <strong>${requiredRate.toFixed(2)}</strong>/hr`;
                if (requiredRate > targetRate * 1.2) {
                    displaySpan.style.color = '#dc3545';
                    displaySpan.title = `High rate needed! Must achieve ${requiredRate.toFixed(2)}/hr for the remaining ${convertToHoursAndMinutes(remainingMinutes_total)} to hit ${targetRate.toFixed(2)}/hr overall.`;
                } else if (requiredRate > targetRate) {
                    displaySpan.style.color = '#ff7f0e';
                    displaySpan.title = `Need to increase pace to ${requiredRate.toFixed(2)}/hr for the remaining ${convertToHoursAndMinutes(remainingMinutes_total)} to hit ${targetRate.toFixed(2)}/hr overall.`;
                } else {
                    displaySpan.style.color = '#0056b3';
                    displaySpan.title = `Maintain ${requiredRate.toFixed(2)}/hr for the remaining ${convertToHoursAndMinutes(remainingMinutes_total)} to hit ${targetRate.toFixed(2)}/hr overall.`;
                }
            }
        }
    }

    function displayBreakdown(doc) {
        const panelElement = document.getElementById('productivityPanel');
        if (!doc || !panelElement) return;
        const breakdownArea = panelElement.querySelector('#timeBreakdownArea');
        if (!breakdownArea) return;
        const tableElement = doc.querySelector(BREAKDOWN_TABLE_SELECTOR);
        if (tableElement) {
            breakdownArea.innerHTML = `<div style="font-weight: 500; color: #0056b3; font-size: 0.9em; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e9ecef;">${ICON_TABLE}Breakdown Details</div>`;
            const tableClone = tableElement.cloneNode(true);
            tableClone.style.width = '100%'; tableClone.style.borderCollapse = 'collapse'; tableClone.style.fontSize = '10.5px';
            Array.from(tableClone.querySelectorAll('th')).forEach(th => {
                th.style.border = '1px solid #eef0f2'; th.style.padding = '3px 5px';
                th.style.textAlign = 'left'; th.style.backgroundColor = '#f8f9fa';
                th.style.fontWeight = '500'; th.style.color = '#495057';
            });
            const tbody = tableClone.querySelector('tbody') || tableClone;
            Array.from(tbody.querySelectorAll('tr')).forEach((row) => {
                const isHeaderRow = row.querySelector('th');
                if (!isHeaderRow) {
                    const isEvenRow = Array.from(row.parentNode.children).filter(el => el.tagName === 'TR' && !el.querySelector('th')).indexOf(row) % 2 === 0;
                    row.style.backgroundColor = isEvenRow ? '#ffffff' : '#f8f9fa';
                    Array.from(row.querySelectorAll('td')).forEach(cell => {
                        cell.style.border = '1px solid #eef0f2'; cell.style.padding = '3px 5px';
                        cell.style.textAlign = 'left'; cell.style.color = '#343a40';
                    });
                }
            });
            highlightChanges(tableClone);
            breakdownArea.appendChild(tableClone);
            previousTableHTML = tableClone.outerHTML;
        } else {
            breakdownArea.innerHTML = `<div style="font-weight: 500; color: #0056b3; font-size: 0.9em; margin-bottom: 6px;">${ICON_TABLE}Breakdown Detail</div> <p style="color: #dc3545; font-size: 0.9em; padding: 10px;">No breakdown table found.</p>`;
            previousTableHTML = '';
        }
    }

    function highlightChanges(newTable) {
        if (!previousTableHTML) return;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = previousTableHTML;
        const oldTable = tempDiv.querySelector(BREAKDOWN_TABLE_SELECTOR);
        if (!oldTable) return;
        const newTbody = newTable.querySelector('tbody') || newTable;
        const oldTbody = oldTable.querySelector('tbody') || oldTable;
        const newRows = Array.from(newTbody.children).filter(el => el.tagName === 'TR');
        const oldRows = Array.from(oldTbody.children).filter(el => el.tagName === 'TR');
        for (let i = 0; i < newRows.length; i++) {
            const newRow = newRows[i]; const oldRow = oldRows[i];
            if (!oldRow) continue;
            const isHeaderRow = newRow.querySelector('th'); if (isHeaderRow) continue;
            const bodyRows = Array.from(newTbody.children).filter(el => el.tagName === 'TR' && !el.querySelector('th'));
            const rowIndexInBody = bodyRows.indexOf(newRow);
            const isEvenRow = rowIndexInBody % 2 === 0;
            const newCells = newRow.cells; const oldCells = oldRow.cells;
            for (let j = 0; j < newCells.length; j++) {
                const newCell = newCells[j]; const oldCell = oldCells[j];
                if (!oldCell) continue;
                if (newCell.tagName === 'TD' && oldCell.tagName === 'TD' && newCell.textContent !== oldCell.textContent) {
                    newCell.style.backgroundColor = '#fff3cd'; newCell.style.transition = 'background-color 0.5s ease-in-out';
                    const originalBgColor = isEvenRow ? '#ffffff' : '#f8f9fa';
                    setTimeout((cellToFade, bgColor) => { cellToFade.style.backgroundColor = bgColor; }, 5000, newCell, originalBgColor);
                }
            }
        }
    }

    function setReportDates(dateString) {
        const fromDateInput = document.querySelector(FORM_DATE_FROM_SELECTOR);
        const toDateInput = document.querySelector(FORM_DATE_TO_SELECTOR);
        if (fromDateInput && toDateInput) {
            fromDateInput.value = dateString; toDateInput.value = dateString;
            [fromDateInput, toDateInput].forEach(input => {
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
            return true;
        } else { return false; }
    }

    function fetchDataForDate(dateString) {
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) { dateString = getTodayDateString(); }
        currentReportDate = dateString;
        if (calendarState.visible) {
            const selectedDate = new Date(dateString + 'T00:00:00');
            if (!isNaN(selectedDate)) {
                calendarState.year = selectedDate.getFullYear();
                calendarState.month = selectedDate.getMonth();
                renderCalendar(calendarState.year, calendarState.month);
            }
        }
        if (setReportDates(dateString)) { submitFormAndGetData(); }
    }

    function handleDateSelection(selectedDateString) {
        hideCalendar();
        if (selectedDateString && selectedDateString !== currentReportDate) {
            fetchDataForDate(selectedDateString);
        }
    }

    function submitFormAndGetData() {
        const submitButton = document.querySelector(FORM_SUBMIT_BUTTON_SELECTOR);
        if (!submitButton) { alert("Submit button not found."); return; }
        const form = submitButton.closest('form');
        if (!form) { alert("Form element not found."); return; }
        const mainButton = document.getElementById('timeUtilisationButton');
        const dateButton = document.getElementById('datePickerButton');
        if (mainButton) { mainButton.textContent = 'Fetching...'; mainButton.disabled = true; }
        if (dateButton) dateButton.disabled = true;
        const formData = new FormData(form);
        const xhr = new XMLHttpRequest();
        xhr.open(form.method || 'POST', form.action || window.location.href, true);
        xhr.onreadystatechange = async function() {
            if (xhr.readyState === 4) {
                if (mainButton) { mainButton.textContent = 'Time & Productivity'; mainButton.disabled = false; }
                if (dateButton) dateButton.disabled = false;
                if (xhr.status === 200) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(xhr.responseText, 'text/html');
                    lastFetchedDoc = doc;
                    try {
                        const elements = doc.querySelectorAll(DATA_ELEMENT_SELECTOR);
                        const totalAuditbookTimeStr = elements[TOTAL_AUDITBOOK_TIME_INDEX]?.textContent ?? '0';
                        const geostudioTimeStr = elements[GEOSTUDIO_TIME_INDEX]?.textContent ?? '0';
                        const geostudioCasesStr = elements[GEOSTUDIO_CASES_STRING_INDEX]?.textContent?.trim() ?? "0 / 0";
                        lastFetchedValues = { totalAuditbookTimeStr, geostudioTimeStr, geostudioCasesStr };
                        await performCalculation(totalAuditbookTimeStr, geostudioTimeStr, geostudioCasesStr, currentReportDate);
                        displayBreakdown(doc);
                    } catch (e) {
                        const panelElement = document.getElementById('productivityPanel');
                        if(panelElement) panelElement.querySelector('#mainResultArea').innerHTML = `<p style="color: red;">Error processing data.</p>`;
                        displayBreakdown(doc);
                        lastFetchedValues = null;
                        lastCalculatedMetrics = { utilizedTime: 0, nonTimedoutCases: 0, effectiveGeostudioTime: 0, totalGeostudioCases: 0, originalTimedoutGeostudioCasesTotal: 0 };
                        updateRequiredProductivityDisplay();
                    }
                } else {
                    lastFetchedDoc = null; lastFetchedValues = null;
                    lastCalculatedMetrics = { utilizedTime: 0, nonTimedoutCases: 0, effectiveGeostudioTime: 0, totalGeostudioCases: 0, originalTimedoutGeostudioCasesTotal: 0 };
                    const panelElement = document.getElementById('productivityPanel');
                    if (panelElement) panelElement.remove();
                }
            }
        };
        xhr.onerror = function() {
            if (mainButton) { mainButton.textContent = 'Time & Productivity'; mainButton.disabled = false; }
            if (dateButton) dateButton.disabled = false;
            lastFetchedDoc = null; lastFetchedValues = null;
            lastCalculatedMetrics = { utilizedTime: 0, nonTimedoutCases: 0, effectiveGeostudioTime: 0, totalGeostudioCases: 0, originalTimedoutGeostudioCasesTotal: 0 };
            const panelElement = document.getElementById('productivityPanel');
            if (panelElement) panelElement.remove();
        };
        xhr.send(formData);
    }

    async function performCalculation(totalAuditbookTimeStr, geostudioTimeStr, geostudioCasesStr, dateToUse) {
        if (!dateToUse || !/^\d{4}-\d{2}-\d{2}$/.test(dateToUse)) {
            dateToUse = getTodayDateString();
            currentReportDate = dateToUse;
        }
        const caseTimeOrder = await getCaseTimeOrder();
        const defaultCaseTime = caseTimeOrder.length > 0 ? caseTimeOrder[0] : null;
        if (defaultCaseTime === null) {
            lastCalculatedMetrics = { utilizedTime: 0, nonTimedoutCases: 0, effectiveGeostudioTime: 0, totalGeostudioCases: 0, originalTimedoutGeostudioCasesTotal: 0 };
            updateRequiredProductivityDisplay();
            return;
        }
        const totalAuditbookTime = parseAndValidateFloat(totalAuditbookTimeStr, 'Total Auditbook Time');
        const geostudioTime = parseAndValidateFloat(geostudioTimeStr, 'Geostudio Time');
        let originalTimedoutGeostudioCasesTotal = 0;
        let totalGeostudioCases = 0;
        const geostudioParts = geostudioCasesStr.split('/').map(s => s.trim());
        if (geostudioParts.length >= 1) { originalTimedoutGeostudioCasesTotal = parseAndValidateInt(geostudioParts[0], 'Original Timed-Out Geostudio Cases'); }
        if (geostudioParts.length >= 2) { totalGeostudioCases = parseAndValidateInt(geostudioParts[1], 'Total Geostudio Cases'); }
        const adjustments = await getAdjustmentValuesForDate(dateToUse);
        let totalManualAdjustmentTime = 0;
        let sumManualInputs = 0;
        const calculatedCounts = {};
        for (let minute = CASE_TIME_RANGE_MIN; minute <= CASE_TIME_RANGE_MAX; minute++) {
            const minuteStr = String(minute);
            if (minute === defaultCaseTime) { calculatedCounts[minuteStr] = 0; continue; }
            const count = adjustments[minuteStr] || 0;
            calculatedCounts[minuteStr] = count;
            sumManualInputs += count;
            totalManualAdjustmentTime += count * minute;
        }
        let defaultCaseCount = 0;
        if (sumManualInputs <= originalTimedoutGeostudioCasesTotal) {
            defaultCaseCount = originalTimedoutGeostudioCasesTotal - sumManualInputs;
        } else { defaultCaseCount = 0; }
        calculatedCounts[String(defaultCaseTime)] = defaultCaseCount;
        const defaultCaseTimeAdjustment = defaultCaseCount * defaultCaseTime;
        const totalGeostudioAdjustmentTime = totalManualAdjustmentTime + defaultCaseTimeAdjustment;
        let calculatedTotalUtilizedTime = geostudioTime - totalGeostudioAdjustmentTime + totalAuditbookTime;
        calculatedTotalUtilizedTime = Math.max(0, calculatedTotalUtilizedTime);
        const nonTimedoutGeostudioCases = Math.max(0, totalGeostudioCases - originalTimedoutGeostudioCasesTotal);
        const effectiveGeostudioTime = Math.max(0, geostudioTime - totalGeostudioAdjustmentTime);
        let productivityRate = 0;
        if (nonTimedoutGeostudioCases > 0 && effectiveGeostudioTime > 0) {
            productivityRate = (nonTimedoutGeostudioCases / effectiveGeostudioTime) * 60;
            productivityRate = isNaN(productivityRate) || !isFinite(productivityRate) ? 0 : productivityRate;
        }
        lastCalculatedMetrics = {
            utilizedTime: calculatedTotalUtilizedTime,
            nonTimedoutCases: nonTimedoutGeostudioCases,
            effectiveGeostudioTime: effectiveGeostudioTime,
            totalGeostudioCases: totalGeostudioCases,
            originalTimedoutGeostudioCasesTotal: originalTimedoutGeostudioCasesTotal
        };
        await updateAndSaveProductivityTrends(dateToUse, lastCalculatedMetrics);
        await createOrUpdateMainPanel(calculatedTotalUtilizedTime, productivityRate, calculatedCounts, geostudioCasesStr, originalTimedoutGeostudioCasesTotal);
    }

    function parseAndValidateFloat(valueStr, label) {
        const num = parseFloat(valueStr);
        return isNaN(num) ? 0 : num;
    }

    function parseAndValidateInt(valueStr, label, radix = 10) {
        if (valueStr === null || valueStr === undefined || String(valueStr).trim() === '') return 0;
        const num = parseInt(String(valueStr).trim(), radix);
        return isNaN(num) ? 0 : num;
    }

    function convertToHoursAndMinutes(minutes) {
        if (minutes <= 0) return "0h 0m";
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (remainingMinutes > 0 || hours === 0) parts.push(`${remainingMinutes}m`);
        return parts.join(' ') || "0m";
    }

    function validateTimedOutInputs(defaultCaseTime, originalTimedoutGeostudioCasesTotal) {
        let isValid = true;
        let currentSumManualInputs = 0;
        const timedOutInputArea = document.getElementById('timedOutInputArea');
        if (!timedOutInputArea) return false;
        const feedbackDiv = timedOutInputArea.querySelector('.feedback-message');
        const updateButton = timedOutInputArea.querySelector('#updateTimedOutCasesButton');
        const defaultDisplaySpan = timedOutInputArea.querySelector(`#case-display-${defaultCaseTime}`);
        if (feedbackDiv) feedbackDiv.textContent = '';
        const errorBorderColor = '#dc3545';
        const normalBorderColor = '#ced4da';
        const manualInputs = timedOutInputArea.querySelectorAll(`input[type="number"][id^="case-input-"]`);
        manualInputs.forEach(input => {
            if (document.activeElement !== input) { input.style.borderColor = normalBorderColor; }
            input.classList.remove('is-invalid');
        });
        if(defaultDisplaySpan) defaultDisplaySpan.style.color = '#343a40';
        manualInputs.forEach(input => {
            const caseTime = parseInt(input.dataset.caseTime, 10);
            if (isNaN(caseTime) || caseTime === defaultCaseTime) return;
            const valueStr = input.value;
            if (valueStr !== '') {
                const value = parseAndValidateInt(valueStr, `Input ${caseTime}m`);
                if (String(value) !== valueStr.trim() || value < 0) {
                    if (feedbackDiv) feedbackDiv.textContent = 'Use positive whole numbers.';
                    isValid = false;
                    input.classList.add('is-invalid');
                    if (document.activeElement !== input) input.style.borderColor = errorBorderColor;
                } else {
                    currentSumManualInputs += value;
                    if (input.style.borderColor === errorBorderColor && document.activeElement !== input) { input.style.borderColor = normalBorderColor; }
                }
            } else {
                if (input.style.borderColor === errorBorderColor && document.activeElement !== input) { input.style.borderColor = normalBorderColor; }
            }
        });
        let currentDefaultCount = 0;
        if (isValid) {
            currentDefaultCount = originalTimedoutGeostudioCasesTotal - currentSumManualInputs;
            if (defaultDisplaySpan) {
                defaultDisplaySpan.textContent = currentDefaultCount;
                if (currentDefaultCount < 0) {
                    if (feedbackDiv) feedbackDiv.textContent = `Input sum (${currentSumManualInputs}) > Reported Geostudio total (${originalTimedoutGeostudioCasesTotal}). Check values.`;
                    isValid = false;
                    defaultDisplaySpan.style.color = errorBorderColor;
                    manualInputs.forEach(input => {
                        input.classList.add('is-invalid');
                        if (document.activeElement !== input) input.style.borderColor = errorBorderColor;
                    });
                } else {
                    defaultDisplaySpan.style.color = '#343a40';
                    manualInputs.forEach(input => {
                        if (!input.classList.contains('is-invalid')) {
                            if (input.style.borderColor === errorBorderColor && document.activeElement !== input) { input.style.borderColor = normalBorderColor; }
                        }
                    });
                }
            }
        } else {
            if (defaultDisplaySpan) { defaultDisplaySpan.textContent = '-'; defaultDisplaySpan.style.color = '#6c757d'; }
        }
        if (updateButton) {
            updateButton.disabled = !isValid;
            if (isValid) {
                updateButton.style.opacity = '1'; updateButton.style.cursor = 'pointer';
                updateButton.style.backgroundColor = '#a1cca5'; updateButton.style.color = '#155724'; updateButton.style.borderColor = '#86b98a';
            } else {
                updateButton.style.opacity = '0.6'; updateButton.style.cursor = 'not-allowed';
                updateButton.style.backgroundColor = '#e9ecef'; updateButton.style.color = '#6c757d'; updateButton.style.borderColor = '#ced4da';
            }
        }
        return isValid;
    }

    async function updateCalculations(defaultCaseTime, originalTimedoutGeostudioCasesTotal, dateToSave) {
        const timedOutInputArea = document.getElementById('timedOutInputArea');
        if (!timedOutInputArea) return;
        const feedbackDiv = timedOutInputArea.querySelector('.feedback-message');
        if(defaultCaseTime === null) {
            if(feedbackDiv) feedbackDiv.textContent = "Error: Configuration issue.";
            return;
        }
        if (validateTimedOutInputs(defaultCaseTime, originalTimedoutGeostudioCasesTotal)) {
            const adjustmentsToSave = {};
            const manualInputs = timedOutInputArea.querySelectorAll(`input[type="number"][id^="case-input-"]`);
            manualInputs.forEach(input => {
                const caseTime = parseInt(input.dataset.caseTime, 10);
                if (!isNaN(caseTime) && caseTime !== defaultCaseTime) {
                    adjustmentsToSave[String(caseTime)] = input.value || '0';
                }
            });
            await setAdjustmentValuesForDate(dateToSave, adjustmentsToSave);
            if (lastFetchedValues) {
                try {
                    await performCalculation(lastFetchedValues.totalAuditbookTimeStr, lastFetchedValues.geostudioTimeStr, lastFetchedValues.geostudioCasesStr, dateToSave);
                    const freshFeedbackDiv = document.getElementById('productivityPanel')?.querySelector('#timedOutInputArea .feedback-message');
                    if (freshFeedbackDiv) {
                        freshFeedbackDiv.textContent = 'Adjustments updated!';
                        freshFeedbackDiv.style.color = '#28a745';
                        setTimeout(() => {
                            if (freshFeedbackDiv.textContent === 'Adjustments updated!') {
                                freshFeedbackDiv.textContent = '';
                                freshFeedbackDiv.style.color = '#dc3545';
                            }
                        }, 2500);
                    }
                } catch (error) {
                    const freshFeedbackDiv = document.getElementById('productivityPanel')?.querySelector('#timedOutInputArea .feedback-message');
                    if (freshFeedbackDiv) freshFeedbackDiv.textContent = 'Error recalculating.';
                    lastCalculatedMetrics = { utilizedTime: 0, nonTimedoutCases: 0, effectiveGeostudioTime: 0, totalGeostudioCases: 0, originalTimedoutGeostudioCasesTotal: 0 };
                    updateRequiredProductivityDisplay();
                }
            } else {
                if (feedbackDiv) feedbackDiv.textContent = "Error: No base data loaded.";
                lastCalculatedMetrics = { utilizedTime: 0, nonTimedoutCases: 0, effectiveGeostudioTime: 0, totalGeostudioCases: 0, originalTimedoutGeostudioCasesTotal: 0 };
                updateRequiredProductivityDisplay();
            }
        } else {
            updateRequiredProductivityDisplay();
        }
    }

    async function initialize() {
        currentReportDate = getTodayDateString();
        await setupUIControls();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
