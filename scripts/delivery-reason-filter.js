(function () {
    'use strict';

    let panel = null;
    let reasonStates = {};
    let defectStates = {}; 
    let reasonBlocksMap = {};
    let defectBlocksMap = {};
    let wasShowingDeliveries = false;
    let buildTimer = null;
    let wasDragged = false;

    function getDeliveryBlocks() {
        return document.querySelectorAll('div.css-i8ykvz');
    }

    function findAccordion() {
        const allDivs = document.getElementsByTagName('div');
        for (let i = 0; i < allDivs.length; i++) {
            const cn = allDivs[i].className;
            if (typeof cn === 'string' && cn.indexOf('MuiAccordion-root') !== -1) {
                return allDivs[i];
            }
        }
        return null;
    }

    function extractTextByLabel(block, labelText) {
        const allDivs = block.querySelectorAll('div.css-z8rseh');
        for (const div of allDivs) {
            const paragraphs = div.querySelectorAll('p');
            for (let i = 0; i < paragraphs.length; i++) {
                const text = paragraphs[i].textContent.trim();
                if (text.startsWith(labelText)) {
                    if (paragraphs[i + 1]) {
                        return paragraphs[i + 1].textContent.trim();
                    }
                }
            }
        }
        return null;
    }

    /**
     * UPDATED SELECTOR: 
     * Specifically looks for the button containing the Location Icon.
     * This prevents clicking the "CameraAltIcon" (Photo button).
     */
    function getLocationButton(block) {
        return block.querySelector('button svg[data-testid="LocationOnIcon"]')?.closest('button') ||
               block.querySelector('button svg[data-testid="LocationOffOutlinedIcon"]')?.closest('button') ||
               block.querySelector('button.css-xxe6ha'); // Fallback
    }

    function buildMaps() {
        reasonBlocksMap = {};
        defectBlocksMap = {};
        const blocks = getDeliveryBlocks();

        blocks.forEach(block => {
            const defect = extractTextByLabel(block, 'Defect');
            const reason = extractTextByLabel(block, 'Reason');

            if (defect) {
                if (!defectBlocksMap[defect]) defectBlocksMap[defect] = [];
                defectBlocksMap[defect].push(block);
            } else if (reason) {
                if (!reasonBlocksMap[reason]) reasonBlocksMap[reason] = [];
                reasonBlocksMap[reason].push(block);
            }
        });
    }

    // OLD FILTER METHOD: Clicking the site's own buttons
    function clickLocationButtons(blocks) {
        blocks.forEach(block => {
            const btn = getLocationButton(block);
            if (btn) {
                btn.click();
            }
        });
    }

    function positionNextToAccordion(el) {
        if (!el || wasDragged) return;
        const acc = findAccordion();
        if (!acc) return;
        const rect = acc.getBoundingClientRect();
        el.style.top = (rect.top + 15) + 'px';
        el.style.left = (rect.right + 10) + 'px';
        el.style.right = 'auto';
    }

    /* ── UI ────────────────────────────────────────── */

    function createPanel() {
        if (panel) panel.remove();
        wasDragged = false;

        panel = document.createElement('div');
        panel.id = 'del-filter-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            zIndex: '999999',
            background: 'rgba(26, 26, 46, 0.15)', 
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            fontFamily: 'Arial, sans-serif',
            minWidth: '260px',
            maxWidth: '380px',
            color: '#222', 
            userSelect: 'none',
            maxHeight: '80vh',
            overflowY: 'auto'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'
        });

        const title = document.createElement('span');
        title.textContent = '📍 Delivery Filter';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';
        title.style.color = '#111';

        const headerRight = document.createElement('div');

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄';
        Object.assign(refreshBtn.style, {
            background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', fontSize: '16px', marginRight: '6px'
        });
        refreshBtn.onclick = () => buildUI();

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        Object.assign(closeBtn.style, {
            background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', fontSize: '16px'
        });
        closeBtn.onclick = () => { panel.style.display = 'none'; showRestoreTab(); };

        headerRight.append(refreshBtn, closeBtn);
        header.append(title, headerRight);
        panel.appendChild(header);

        const reasonContainer = document.createElement('div');
        reasonContainer.id = 'reason-container';
        
        const defectHeader = document.createElement('div');
        defectHeader.textContent = '⚠️ DEFECTS';
        Object.assign(defectHeader.style, {
            fontSize: '11px', fontWeight: 'bold', marginTop: '15px', marginBottom: '8px', 
            borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px', color: '#444'
        });

        const defectContainer = document.createElement('div');
        defectContainer.id = 'defect-container';

        panel.append(reasonContainer, defectHeader, defectContainer);

        document.body.appendChild(panel);
        positionNextToAccordion(panel);
        makeDraggable(panel, header);
    }

    function populateButtons() {
        const rBox = document.getElementById('reason-container');
        const dBox = document.getElementById('defect-container');

        Object.keys(reasonBlocksMap).forEach(reason => {
            if (!(reason in reasonStates)) reasonStates[reason] = true;
            rBox.appendChild(createBtnRow(reason, reasonBlocksMap, reasonStates, 'reason'));
        });

        Object.keys(defectBlocksMap).forEach(defect => {
            if (!(defect in defectStates)) defectStates[defect] = true;
            dBox.appendChild(createBtnRow(defect, defectBlocksMap, defectStates, 'defect'));
        });
    }

    function createBtnRow(label, map, stateRef, type) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; margin-bottom:6px; gap:8px;';

        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, {
            flex: '1', padding: '8px 12px', border: '2px solid', borderRadius: '6px',
            cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', textAlign: 'left',
            wordBreak: 'break-all', transition: 'all 0.2s ease'
        });

        const updateStyle = () => {
            const isActive = stateRef[label];
            if (isActive) {
                if (type === 'reason') {
                    btn.style.background = 'rgba(14, 107, 14, 0.8)'; // Green
                    btn.style.borderColor = 'rgba(76, 175, 80, 0.9)';
                    btn.style.color = '#ffffff';
                } else {
                    btn.style.background = 'rgba(107, 14, 14, 0.8)'; // Red
                    btn.style.borderColor = 'rgba(244, 67, 54, 0.9)';
                    btn.style.color = '#ffffff';
                }
            } else {
                btn.style.background = 'rgba(80, 80, 80, 0.7)'; // Gray
                btn.style.borderColor = 'rgba(120, 120, 120, 0.8)';
                btn.style.color = '#cccccc';
            }
        };

        btn.onclick = () => {
            clickLocationButtons(map[label]); // USES OLD CLICK METHOD
            stateRef[label] = !stateRef[label];
            updateStyle();
        };

        const count = document.createElement('span');
        count.textContent = `(${map[label].length})`;
        count.style.cssText = 'fontSize: 11px; color: #555; whiteSpace: nowrap;';

        updateStyle();
        row.append(btn, count);
        return row;
    }

    /* ── Restore & Draggable ─────────── */

    function showRestoreTab() {
        let tab = document.getElementById('del-filter-restore');
        if (tab) tab.remove();
        tab = document.createElement('button');
        tab.id = 'del-filter-restore';
        tab.textContent = '📍 Filters';
        Object.assign(tab.style, {
            position: 'fixed', zIndex: '999999', background: 'rgba(26, 26, 46, 0.15)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: '#222',
            border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px',
            padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
        });
        positionNextToAccordion(tab);
        tab.onclick = () => { tab.remove(); panel.style.display = 'block'; };
        document.body.appendChild(tab);
    }

    function makeDraggable(el, handle) {
        let offsetX = 0, offsetY = 0, isDragging = false;
        handle.style.cursor = 'grab';
        handle.onmousedown = (e) => {
            isDragging = true;
            offsetX = e.clientX - el.getBoundingClientRect().left;
            offsetY = e.clientY - el.getBoundingClientRect().top;
            handle.style.cursor = 'grabbing';
            e.preventDefault();
        };
        document.onmousemove = (e) => {
            if (!isDragging) return;
            wasDragged = true;
            el.style.left = (e.clientX - offsetX) + 'px';
            el.style.top = (e.clientY - offsetY) + 'px';
            el.style.right = 'auto';
        };
        document.onmouseup = () => { isDragging = false; handle.style.cursor = 'grab'; };
    }

    function buildUI() {
        buildMaps();
        if (Object.keys(reasonBlocksMap).length === 0 && Object.keys(defectBlocksMap).length === 0) return;
        createPanel();
        populateButtons();
    }

    function cleanup() {
        if (buildTimer) clearTimeout(buildTimer);
        if (panel) panel.remove();
        const tab = document.getElementById('del-filter-restore');
        if (tab) tab.remove();
        panel = null;
        reasonStates = {}; defectStates = {};
        reasonBlocksMap = {}; defectBlocksMap = {};
    }

    function checkDeliveries() {
        const blocks = getDeliveryBlocks();
        const hasDeliveries = blocks.length > 0;
        if (panel && panel.style.display !== 'none') positionNextToAccordion(panel);
        const tab = document.getElementById('del-filter-restore');
        if (tab) positionNextToAccordion(tab);

        if (hasDeliveries && !wasShowingDeliveries) {
            wasShowingDeliveries = true;
            buildTimer = setTimeout(() => { if (getDeliveryBlocks().length > 0) buildUI(); }, 600);
        } else if (!hasDeliveries && wasShowingDeliveries) {
            wasShowingDeliveries = false;
            cleanup();
        }
    }

    setInterval(checkDeliveries, 300);
})();
