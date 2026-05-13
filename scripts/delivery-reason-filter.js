(function () {
    'use strict';

    let panel = null;
    let reasonStates = {};
    let defectStates = {}; // Track states for defects separately
    let reasonBlocksMap = {};
    let defectBlocksMap = {}; // Map for defect blocks
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

    // Generic extractor for Reason or Defect
    function extractTextByLabel(block, labelText) {
        const allDivs = block.querySelectorAll('div.css-z8rseh');
        for (const div of allDivs) {
            const paragraphs = div.querySelectorAll('p');
            for (let i = 0; i < paragraphs.length; i++) {
                const text = paragraphs[i].textContent.trim();
                // Matches "Reason |" or "Defect |" or just "Reason"
                if (text.startsWith(labelText)) {
                    if (paragraphs[i + 1]) {
                        return paragraphs[i + 1].textContent.trim();
                    }
                }
            }
        }
        return null;
    }

    function getLocationButton(block) {
        return block.querySelector('button.css-xxe6ha') ||
               block.querySelector('button[type="button"] svg[data-testid="LocationOffOutlinedIcon"]')?.closest('button') ||
               block.querySelector('button[type="button"]');
    }

    function buildMaps() {
        reasonBlocksMap = {};
        defectBlocksMap = {};
        const blocks = getDeliveryBlocks();

        blocks.forEach(block => {
            const defect = extractTextByLabel(block, 'Defect');
            const reason = extractTextByLabel(block, 'Reason');

            if (defect) {
                // If defect exists, prioritize it and ignore reason for this block
                if (!defectBlocksMap[defect]) defectBlocksMap[defect] = [];
                defectBlocksMap[defect].push(block);
            } else if (reason) {
                // Only if no defect, add to reason map
                if (!reasonBlocksMap[reason]) reasonBlocksMap[reason] = [];
                reasonBlocksMap[reason].push(block);
            }
        });
    }

    function clickLocationButtons(blocks) {
        blocks.forEach(block => {
            const btn = getLocationButton(block);
            if (btn) btn.click();
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

    /* ── UI Components ────────────────────────────────────── */

    function createPanel() {
        if (panel) panel.remove();
        wasDragged = false;

        panel = document.createElement('div');
        panel.id = 'del-filter-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            zIndex: '999999',
            background: 'rgba(26, 26, 46, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            fontFamily: 'Segoe UI, Arial, sans-serif',
            minWidth: '280px',
            maxWidth: '400px',
            color: '#fff',
            maxHeight: '80vh',
            overflowY: 'auto'
        });

        // Header
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '8px'
        });

        const title = document.createElement('span');
        title.textContent = '📦 Delivery Manager';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄';
        refreshBtn.style.cssText = 'background:none; border:none; cursor:pointer; font-size:16px; margin-right:8px;';
        refreshBtn.onclick = () => buildUI();

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'background:none; border:none; cursor:pointer; font-size:16px; color:#fff;';
        closeBtn.onclick = () => { panel.style.display = 'none'; showRestoreTab(); };

        header.append(title, refreshBtn, closeBtn);
        panel.appendChild(header);

        // Sections
        const reasonSection = createSection('📍 Reasons', 'reason-container');
        const defectSection = createSection('⚠️ Defects', 'defect-container');
        defectSection.style.marginTop = '20px';
        defectSection.style.borderTop = '1px dashed rgba(255,255,255,0.2)';
        defectSection.style.paddingTop = '10px';

        panel.appendChild(reasonSection);
        panel.appendChild(defectSection);

        document.body.appendChild(panel);
        positionNextToAccordion(panel);
        makeDraggable(panel, header);
    }

    function createSection(titleText, containerId) {
        const sec = document.createElement('div');
        const title = document.createElement('div');
        title.textContent = titleText;
        title.style.cssText = 'font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; color: rgba(255,255,255,0.6);';
        
        const container = document.createElement('div');
        container.id = containerId;
        
        sec.append(title, container);
        return sec;
    }

    function populateButtons() {
        const rContainer = document.getElementById('reason-container');
        const dContainer = document.getElementById('defect-container');

        // Fill Reasons
        Object.keys(reasonBlocksMap).forEach(reason => {
            if (!(reason in reasonStates)) reasonStates[reason] = true;
            rContainer.appendChild(createFilterButton(reason, reasonBlocksMap, reasonStates));
        });

        // Fill Defects
        Object.keys(defectBlocksMap).forEach(defect => {
            if (!(defect in defectStates)) defectStates[defect] = true;
            dContainer.appendChild(createFilterButton(defect, defectBlocksMap, defectStates));
        });
        
        if (Object.keys(defectBlocksMap).length === 0) {
            dContainer.innerHTML = '<div style="font-size:10px; color:rgba(255,255,255,0.3)">No defects detected</div>';
        }
    }

    function createFilterButton(label, map, stateRef) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; margin-bottom:6px; gap:8px;';

        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = 'flex:1; padding:6px 10px; border:1px solid; border-radius:6px; cursor:pointer; font-size:11px; font-weight:bold; text-align:left; word-break:break-all; transition:0.2s;';
        
        const updateStyle = () => {
            const active = stateRef[label];
            btn.style.background = active ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
            btn.style.borderColor = active ? '#4CAF50' : '#F44336';
            btn.style.color = active ? '#fff' : '#ffcdd2';
        };

        btn.onclick = () => {
            clickLocationButtons(map[label]);
            stateRef[label] = !stateRef[label];
            updateStyle();
        };

        const count = document.createElement('span');
        count.textContent = `[${map[label].length}]`;
        count.style.cssText = 'font-size:10px; color:rgba(255,255,255,0.5); font-family:monospace;';

        updateStyle();
        row.append(btn, count);
        return row;
    }

    /* ── Drag & Utility Logic ────────────────────────────── */

    function showRestoreTab() {
        let tab = document.getElementById('del-filter-restore');
        if (tab) tab.remove();
        tab = document.createElement('button');
        tab.id = 'del-filter-restore';
        tab.textContent = '📍 Filters';
        Object.assign(tab.style, {
            position: 'fixed', zIndex: '999999', background: 'rgba(26, 26, 46, 0.8)',
            color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px',
            padding: '8px 14px', cursor: 'pointer', fontSize: '12px'
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
        };
        document.onmousemove = (e) => {
            if (!isDragging) return;
            wasDragged = true;
            el.style.left = (e.clientX - offsetX) + 'px';
            el.style.top = (e.clientY - offsetY) + 'px';
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
