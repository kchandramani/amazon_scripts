(function () {
    'use strict';

    let panel = null;
    let reasonStates = {};
    let reasonBlocksMap = {};
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

    function extractReason(block) {
        const allDivs = block.querySelectorAll('div.css-z8rseh');
        for (const div of allDivs) {
            const paragraphs = div.querySelectorAll('p');
            for (let i = 0; i < paragraphs.length; i++) {
                if (paragraphs[i].textContent.trim().startsWith('Reason')) {
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

    function buildReasonMap() {
        reasonBlocksMap = {};
        const blocks = getDeliveryBlocks();
        blocks.forEach(block => {
            const reason = extractReason(block);
            if (reason) {
                if (!reasonBlocksMap[reason]) {
                    reasonBlocksMap[reason] = [];
                }
                reasonBlocksMap[reason].push(block);
            }
        });
        return reasonBlocksMap;
    }

    function clickLocationButtons(blocks) {
        blocks.forEach(block => {
            const btn = getLocationButton(block);
            if (btn) {
                btn.click();
            }
        });
    }

    /* ── Position panel next to accordion ──────────── */

    function positionNextToAccordion(el) {
        if (!el || wasDragged) return;
        const acc = findAccordion();
        if (!acc) return;
        const rect = acc.getBoundingClientRect();
        //el.style.top = rect.top + 'px';
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
            cursor: 'default',
            userSelect: 'none'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
        });

        const title = document.createElement('span');
        title.textContent = '📍 Delivery Reason Filter';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';
        title.style.color = '#111';

        const headerRight = document.createElement('div');

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄';
        refreshBtn.title = 'Refresh / Rescan deliveries';
        Object.assign(refreshBtn.style, {
            background: 'transparent',
            border: 'none',
            color: '#333',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '6px'
        });
        refreshBtn.addEventListener('click', () => buildUI());

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.title = 'Minimize';
        Object.assign(closeBtn.style, {
            background: 'transparent',
            border: 'none',
            color: '#333',
            cursor: 'pointer',
            fontSize: '16px'
        });
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
            showRestoreTab();
        });

        headerRight.appendChild(refreshBtn);
        headerRight.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(headerRight);
        panel.appendChild(header);

        const container = document.createElement('div');
        container.id = 'del-filter-buttons';
        panel.appendChild(container);

        const bulkRow = document.createElement('div');
        Object.assign(bulkRow.style, {
            display: 'flex',
            gap: '6px',
            marginTop: '10px'
        });

        const showAllBtn = makeBulkBtn('Show All', 'rgba(76, 175, 80, 0.85)');
        showAllBtn.addEventListener('click', () => {
            Object.keys(reasonBlocksMap).forEach(reason => {
                if (!reasonStates[reason]) {
                    toggleReason(reason);
                }
            });
            refreshButtonStyles();
        });

        const hideAllBtn = makeBulkBtn('Hide All', 'rgba(244, 67, 54, 0.85)');
        hideAllBtn.addEventListener('click', () => {
            Object.keys(reasonBlocksMap).forEach(reason => {
                if (reasonStates[reason]) {
                    toggleReason(reason);
                }
            });
            refreshButtonStyles();
        });

        bulkRow.appendChild(showAllBtn);
        bulkRow.appendChild(hideAllBtn);
        panel.appendChild(bulkRow);

        document.body.appendChild(panel);
        positionNextToAccordion(panel);
        makeDraggable(panel, header);
    }

    function makeBulkBtn(label, bg) {
        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, {
            flex: '1',
            padding: '6px 8px',
            border: 'none',
            borderRadius: '5px',
            background: bg,
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
        });
        return btn;
    }

    function populateButtons() {
        const container = document.getElementById('del-filter-buttons');
        if (!container) return;
        container.innerHTML = '';

        Object.keys(reasonBlocksMap).forEach(reason => {
            if (!(reason in reasonStates)) {
                reasonStates[reason] = true;
            }

            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '6px',
                gap: '8px'
            });

            const btn = document.createElement('button');
            btn.dataset.reason = reason;
            btn.className = 'del-reason-btn';
            btn.textContent = reason;
            Object.assign(btn.style, {
                flex: '1',
                padding: '8px 12px',
                border: '2px solid',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'left',
                wordBreak: 'break-all',
                transition: 'all 0.2s ease'
            });
            applyBtnStyle(btn, reasonStates[reason]);

            btn.addEventListener('click', () => {
                toggleReason(reason);
                refreshButtonStyles();
            });

            const count = document.createElement('span');
            count.textContent = `(${reasonBlocksMap[reason].length})`;
            Object.assign(count.style, {
                fontSize: '11px',
                color: '#555',
                whiteSpace: 'nowrap'
            });

            row.appendChild(btn);
            row.appendChild(count);
            container.appendChild(row);
        });
    }

    function toggleReason(reason) {
        const blocks = reasonBlocksMap[reason];
        if (!blocks || blocks.length === 0) return;
        clickLocationButtons(blocks);
        reasonStates[reason] = !reasonStates[reason];
    }

    function applyBtnStyle(btn, isVisible) {
        if (isVisible) {
            btn.style.background = 'rgba(14, 107, 14, 0.8)';
            btn.style.borderColor = 'rgba(76, 175, 80, 0.9)';
            btn.style.color = '#ffffff';
        } else {
            btn.style.background = 'rgba(107, 14, 14, 0.8)';
            btn.style.borderColor = 'rgba(244, 67, 54, 0.9)';
            btn.style.color = '#ffcccc';
        }
    }

    function refreshButtonStyles() {
        document.querySelectorAll('.del-reason-btn').forEach(btn => {
            const reason = btn.dataset.reason;
            applyBtnStyle(btn, reasonStates[reason]);
        });
    }

    /* ── Restore tab when minimized ──────────────── */

    function showRestoreTab() {
        let tab = document.getElementById('del-filter-restore');
        if (tab) tab.remove();
        wasDragged = false;

        tab = document.createElement('button');
        tab.id = 'del-filter-restore';
        tab.textContent = '📍 Filters';
        Object.assign(tab.style, {
            position: 'fixed',
            zIndex: '999999',
            background: 'rgba(26, 26, 46, 0.15)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            color: '#222',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        });
        positionNextToAccordion(tab);
        tab.addEventListener('click', () => {
            tab.remove();
            if (panel) {
                panel.style.display = 'block';
            } else {
                buildUI();
            }
        });
        document.body.appendChild(tab);
    }

    /* ── Draggable ───────────────────────────────── */

    function makeDraggable(el, handle) {
        let offsetX = 0, offsetY = 0, isDragging = false;
        handle.style.cursor = 'grab';

        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - el.getBoundingClientRect().left;
            offsetY = e.clientY - el.getBoundingClientRect().top;
            handle.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            wasDragged = true;
            el.style.left = (e.clientX - offsetX) + 'px';
            el.style.top = (e.clientY - offsetY) + 'px';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            handle.style.cursor = 'grab';
        });
    }

    /* ── Build UI ────────────────────────────────── */

    function buildUI() {
        buildReasonMap();

        const reasons = Object.keys(reasonBlocksMap);
        if (reasons.length === 0) {
            console.log('[DeliveryFilter] No deliveries found yet.');
            return;
        }

        console.log(`[DeliveryFilter] Found ${reasons.length} reason(s):`, reasons);
        createPanel();
        populateButtons();
    }

    /* ── Cleanup on collapse ─────────────────────── */

    function cleanup() {
        if (buildTimer) {
            clearTimeout(buildTimer);
            buildTimer = null;
        }
        if (panel) {
            panel.remove();
            panel = null;
        }
        const tab = document.getElementById('del-filter-restore');
        if (tab) tab.remove();

        reasonStates = {};
        reasonBlocksMap = {};
        wasDragged = false;
        console.log('[DeliveryFilter] Deliveries gone — cleaned up');
    }

    /* ── Poll for delivery blocks every 300ms ────── */

    function checkDeliveries() {
        const blocks = getDeliveryBlocks();
        const hasDeliveries = blocks.length > 0;

        // Keep panel aligned to accordion (unless user dragged it)
        if (panel && panel.style.display !== 'none') {
            positionNextToAccordion(panel);
        }
        const tab = document.getElementById('del-filter-restore');
        if (tab) {
            positionNextToAccordion(tab);
        }

        if (hasDeliveries && !wasShowingDeliveries) {
            wasShowingDeliveries = true;
            console.log('[DeliveryFilter] Deliveries appeared — scheduling build...');

            if (buildTimer) {
                clearTimeout(buildTimer);
                buildTimer = null;
            }
            buildTimer = setTimeout(() => {
                buildTimer = null;
                if (getDeliveryBlocks().length > 0) {
                    buildUI();
                }
            }, 600);

        } else if (!hasDeliveries && wasShowingDeliveries) {
            wasShowingDeliveries = false;
            cleanup();
        }
    }

    // ── Start polling ──
    setInterval(checkDeliveries, 300);
    console.log('[DeliveryFilter] Polling started — watching for delivery blocks');

})();
