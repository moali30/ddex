/**
 * Scheduler page — Step 6: Interactive Drag & Drop Exam Schedule Builder
 * Fixed bugs:
 *  1. CSS selector spaces in validateGrid
 *  2. Invalid color rgba(2ef...) in renderGrid
 *  3. Course metadata lost after drag-drop (now stored in data-* attrs)
 *  4. DnD converted to event-delegation — survives re-renders
 *  5. btn-outline style added in CSS
 *  6. modal-body gets overflow scroll
 *  7. Day conflict summary shown in row header
 *  8. Clear All button in sidebar
 *  9. Toast for invalid drops
 */
import { optimizeSchedule } from '../core/scheduler.js';

// ─── Master course lookup: subCode → full course object (built once on init) ───
let _courseLookup = {}; // key: `${subCode}::${regIndex}`

export function renderSchedulerPage(container, appState, onComplete) {
    // Initialize scheduler state if it doesn't exist
    if (!appState.scheduler) {
        appState.scheduler = {
            activeTab: 0, // Stores regIndex or 'master'
            tabs: {}, // Keyed by regIndex -> { grid: {}, unassigned: [] }
            days: 14,
            holidays: [],
            periods: {}
        };

        appState.levels.forEach((lvl, i) => {
            appState.scheduler.periods[i] = (appState.periodsDefs && appState.periodsDefs[0]) ? appState.periodsDefs[0].name : '09:00 - 12:00';
        });

        // Ensure schedulesDefs exists (fallback if missed)
        if (!appState.schedulesDefs) {
            appState.schedulesDefs = appState.regulations.map((reg, idx) => ({
                id: idx,
                name: `جدول ${reg.name}`,
                regIndex: idx,
                regName: reg.name
            }));
        }

        appState.schedulesDefs.forEach((sched) => {
            const regIndex = sched.regIndex;
            const reg = appState.regulations[regIndex];
            if (!reg) return;

            const unassignedSet = new Set();
            for (const subCode of reg.courses.keys()) {
                const courseName = reg.courseNames[subCode] || subCode;
                const sheetIndex = reg.sheetIndices[0];
                const sheetName = appState.parsedSheets && appState.parsedSheets[sheetIndex]
                    ? appState.parsedSheets[sheetIndex].sheetName : '';
                const breakdown = reg.sheetBreakdown && reg.sheetBreakdown[subCode] ? reg.sheetBreakdown[subCode] : {};

                unassignedSet.add(JSON.stringify({
                    subCode,
                    courseName,
                    regIndex,
                    regName: reg.name,
                    students: reg.courses.get(subCode).size,
                    sheetName,
                    sheetBreakdown: breakdown,
                    cloneId: 0,
                    isShared: false,
                    scheduleId: sched.id // Track which schedule this belongs to
                }));
            }

            appState.scheduler.tabs[sched.id] = {
                grid: {},
                unassigned: Array.from(unassignedSet).map(s => JSON.parse(s))
            };
        });
    }

    // Build / refresh the master lookup map so updateSchedulerState can restore full metadata
    _courseLookup = {};
    // Seed from original regulations
    appState.regulations.forEach((reg, regIndex) => {
        for (const subCode of reg.courses.keys()) {
            const key = `${subCode}::${regIndex}`;
            const breakdown = reg.sheetBreakdown && reg.sheetBreakdown[subCode] ? reg.sheetBreakdown[subCode] : {};
            _courseLookup[key] = {
                subCode,
                courseName: reg.courseNames[subCode] || subCode,
                regIndex,
                regName: reg.name,
                students: reg.courses.get(subCode).size,
                sheetBreakdown: breakdown,
                cloneId: 0,
                isShared: false,
                sheetName: (() => {
                    const si = reg.sheetIndices[0];
                    return appState.parsedSheets && appState.parsedSheets[si]
                        ? appState.parsedSheets[si].sheetName : '';
                })()
            };
        }
    });

    // Generate Tabs HTML
    const tabsHtml = appState.schedulesDefs.map(sched => `
        <button class="scheduler-tab ${appState.scheduler.activeTab === sched.id ? 'active' : ''}" data-tab="${sched.id}">
            ${sched.name}
        </button>
    `).join('') + `
        <button class="scheduler-tab master-tab ${appState.scheduler.activeTab === 'master' ? 'active' : ''}" data-tab="master">
            🌐 Master Schedule
        </button>
    `;

    container.innerHTML = `
    <div class="page-enter scheduler-layout">
        
        <div class="scheduler-header">
            <div>
                <h1 class="section-title" style="margin-bottom: 4px;">Smart Scheduler</h1>
                <p class="section-subtitle" style="margin-bottom: 0;">Drag and drop courses to build a conflict-free schedule</p>
            </div>
            
            <div class="scheduler-controls">
                <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-bottom:0;">
                     <label for="exam-days" style="white-space:nowrap;">Exam Days:</label>
                     <input type="number" id="exam-days" class="form-input" value="${appState.scheduler.days}" min="1" max="60" style="width: 80px;" />
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-bottom:0;">
                     <label for="start-date" style="white-space:nowrap;">Start:</label>
                     <input type="date" id="start-date" class="form-input" value="${appState.scheduler.startDate || ''}" style="width: 150px;" />
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-bottom:0;">
                     <label for="end-date" style="white-space:nowrap;">End:</label>
                     <input type="date" id="end-date" class="form-input" value="${appState.scheduler.endDate || ''}" style="width: 150px;" />
                </div>
                <button class="btn btn-outline" id="btn-auto-schedule">
                    <span style="font-size: 1.2rem;">✨</span> Auto Optimize
                </button>
                <button class="btn btn-secondary" id="btn-clear-all">
                    ↩ Clear All
                </button>
                <button class="btn btn-outline" id="btn-toggle-sidebar" title="Toggle Sidebar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                </button>
                <button class="btn btn-primary" id="btn-next-print">
                    Print Schedule →
                </button>
            </div>
        </div>

        <div class="scheduler-tabs-container">
            <div class="scheduler-tabs" id="scheduler-tabs">
                ${tabsHtml}
            </div>
        </div>

        <div class="scheduler-main">
            <!-- Sidebar with unassigned courses -->
            <div class="scheduler-sidebar">
                <div class="sidebar-header">
                    <h3 style="font-weight: 600;">Unassigned Courses</h3>
                    <div class="badge badge-primary" id="unassigned-count">0</div>
                </div>
                
                <div style="padding: var(--space-sm) var(--space-md);">
                    <input type="text" id="course-search" class="form-input" placeholder="🔍 Search courses..." style="width: 100%;" />
                </div>
                
                <div class="draggable-pool" id="unassigned-pool" data-day="unassigned" data-reg="all">
                    <!-- Cards populated by JS -->
                </div>
            </div>

            <!-- The Grid -->
            <div class="scheduler-grid-container">
                <div class="scheduler-tip-bar">
                    <div>💡 <strong>Tip:</strong> Drag courses into the grid. Red borders = conflicts. Long-press a card for deep dive.</div>
                    <div id="global-conflict-counter" class="conflict-counter">0 Conflicts</div>
                </div>
                
                <div class="scheduler-grid">
                    <!-- Grid Header (Levels) -->
                    <div class="grid-header-row">
                        <div class="grid-corner">Day / Level</div>
                        ${appState.levels.map((lvl, idx) => {
        const periods = appState.periodsDefs || [{ name: '09:00 - 12:00' }];
        const currentPeriod = appState.scheduler.periods[idx] || periods[0]?.name || '';
        const periodOptions = periods.map(p =>
            `<option value="${p.name}" ${currentPeriod === p.name ? 'selected' : ''}>${p.name}</option>`
        ).join('');
        return `
                            <div class="grid-col-header" title="${lvl.name}">
                                <div style="font-weight:700; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; font-size:0.85rem;">${lvl.name}</div>
                                <select class="form-select period-select" data-level="${idx}" style="padding:4px 8px; font-size:0.72rem; text-align:center; border-radius:var(--radius-sm); background:var(--bg-glass); color:var(--text-secondary); border:1px solid var(--border-light); cursor:pointer; appearance:auto; min-width:110px;">
                                    ${periodOptions}
                                </select>
                            </div>
                        `;
    }).join('')}
                    </div>
                    
                    <!-- Grid Body (Days) -->
                    <div class="grid-body" id="grid-body">
                        <!-- Rendered in JS -->
                    </div>
                </div>
            </div>
        </div>
        
    </div>
    
    <!-- Toast notification -->
    <div id="scheduler-toast" class="scheduler-toast hidden"></div>

    <!-- Conflict Details Modal -->
    <div id="conflict-modal" class="modal-overlay hidden">
        <div class="modal">
            <div class="modal-header">
                <h3>Conflict Details</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body" id="conflict-details-content">
                <!-- Conflict details -->
            </div>
        </div>
    </div>
    `;

    // Render Grid & Sidebar
    renderGrid(appState);
    renderUnassigned(appState);

    // Setup Tab Switching
    document.querySelectorAll('.scheduler-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.closest('.scheduler-tab');
            const tabVal = tab.dataset.tab;
            appState.scheduler.activeTab = tabVal === 'master' ? 'master' : parseInt(tabVal);

            // Update UI active class
            document.querySelectorAll('.scheduler-tab').forEach(b => b.classList.remove('active'));
            tab.classList.add('active');

            // If master, lock the sidebar
            const sidebar = document.querySelector('.scheduler-sidebar');
            if (appState.scheduler.activeTab === 'master') {
                sidebar.style.opacity = '0.5';
                sidebar.style.pointerEvents = 'none';
            } else {
                sidebar.style.opacity = '1';
                sidebar.style.pointerEvents = 'auto';
            }

            // Re-render display
            renderGrid(appState);
            renderUnassigned(appState);
            validateGrid(appState);
        });
    });

    // Check bounds on load
    const sidebar = document.querySelector('.scheduler-sidebar');
    if (appState.scheduler.activeTab === 'master') {
        sidebar.style.opacity = '0.5';
        sidebar.style.pointerEvents = 'none';
    }

    // Setup event delegation for DnD (survives re-renders)
    setupDragAndDropDelegated(appState);

    // Setup card interactions (long-press deep dive + info icon)
    setupCardInteractions(appState);

    // ── Controls ──────────────────────────────────────────────────────────────
    document.getElementById('exam-days').addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        if (val > 0) {
            appState.scheduler.days = val;
            renderGrid(appState);
            validateGrid(appState);
        }
    });

    document.getElementById('start-date').addEventListener('change', (e) => {
        appState.scheduler.startDate = e.target.value;
        renderGrid(appState);
    });

    document.getElementById('end-date').addEventListener('change', (e) => {
        appState.scheduler.endDate = e.target.value;
        renderGrid(appState);
    });

    // Period select handlers (delegated)
    document.querySelector('.scheduler-grid').addEventListener('change', (e) => {
        if (e.target.classList.contains('period-select')) {
            const lvlIdx = parseInt(e.target.dataset.level);
            appState.scheduler.periods[lvlIdx] = e.target.value;
        }
    });

    document.getElementById('course-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('#unassigned-pool .course-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    });

    // Period input changes (delegated on the sticky header)
    document.querySelector('.grid-header-row').addEventListener('change', (e) => {
        if (e.target.classList.contains('period-input')) {
            const levelIdx = parseInt(e.target.dataset.level);
            appState.scheduler.periods[levelIdx] = e.target.value;
        }
    });

    // Holiday toggles (delegated on grid body)
    document.getElementById('grid-body').addEventListener('change', (e) => {
        if (e.target.classList.contains('holiday-toggle')) {
            const day = parseInt(e.target.dataset.day);
            if (e.target.checked) {
                if (!appState.scheduler.holidays.includes(day)) appState.scheduler.holidays.push(day);
            } else {
                appState.scheduler.holidays = appState.scheduler.holidays.filter(d => d !== day);
            }
            renderGrid(appState);
            validateGrid(appState);
        }
    });

    // Auto Optimize
    document.getElementById('btn-auto-schedule').addEventListener('click', () => {
        const btn = document.getElementById('btn-auto-schedule');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px;"></span> Optimizing...';
        btn.disabled = true;

        setTimeout(() => {
            // Build a full unassigned list from current state (grid + sidebar)
            const allCourses = gatherAllCourses(appState);

            const { grid, unassigned } = optimizeSchedule(
                allCourses,
                appState.levels,
                appState.matrices,
                appState.scheduler.days,
                appState.scheduler.holidays
            );

            // Clear current tab grids
            for (const regKey in appState.scheduler.tabs) {
                appState.scheduler.tabs[regKey].grid = {};
                appState.scheduler.tabs[regKey].unassigned = [];
            }

            // Distribute grid back into tabs
            for (const d in grid) {
                for (const l in grid[d]) {
                    const courses = grid[d][l] || [];
                    courses.forEach(c => {
                        const r = c.regIndex;
                        const tab = appState.scheduler.tabs[r];
                        if (!tab.grid[d]) tab.grid[d] = {};
                        if (!tab.grid[d][l]) tab.grid[d][l] = [];
                        tab.grid[d][l].push(c);
                    });
                }
            }

            // Distribute unassigned back into tabs
            unassigned.forEach(c => {
                const r = c.regIndex;
                appState.scheduler.tabs[r].unassigned.push(c);
            });

            renderGrid(appState);
            renderUnassigned(appState);
            validateGrid(appState);

            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }, 50);
    });

    // Clear All
    document.getElementById('btn-clear-all').addEventListener('click', () => {
        const activeTab = appState.scheduler.activeTab;
        if (activeTab === 'master') {
            // Clear absolutely everything
            const all = gatherAllCourses(appState);
            for (const regKey in appState.scheduler.tabs) {
                appState.scheduler.tabs[regKey].grid = {};
                appState.scheduler.tabs[regKey].unassigned = [];
            }
            all.forEach(c => {
                appState.scheduler.tabs[c.regIndex].unassigned.push(c);
            });
        } else {
            // Clear just the active tab
            const tabState = appState.scheduler.tabs[activeTab];
            const allInTab = [];
            tabState.unassigned.forEach(c => allInTab.push(c));
            for (const d in tabState.grid) {
                for (const l in tabState.grid[d]) {
                    (tabState.grid[d][l] || []).forEach(c => allInTab.push(c));
                }
            }
            tabState.grid = {};
            tabState.unassigned = allInTab;
        }
        renderGrid(appState);
        renderUnassigned(appState);
        validateGrid(appState);
    });

    // Next
    document.getElementById('btn-next-print').addEventListener('click', () => onComplete());

    // Toggle Sidebar
    document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar-nav');
        sidebar.classList.toggle('hidden');
    });

    // Close Modal
    document.querySelectorAll('.close-modal').forEach(el => {
        el.addEventListener('click', () => {
            document.getElementById('conflict-modal').classList.add('hidden');
        });
    });
    document.getElementById('conflict-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.add('hidden');
        }
    });

    // Initial validation
    validateGrid(appState);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Collect every course currently in the grid + sidebar (full metadata) */
function gatherAllCourses(appState) {
    const all = [];
    const seen = new Set();

    const addCourse = (c) => {
        const key = `${c.subCode}::${c.regIndex}`;

        if (!seen.has(key)) {
            seen.add(key);
            const baseObj = _courseLookup[`${c.subCode}::${c.regIndex}`] || c;
            // Retain the current isShared state instead of always restoring default
            all.push({ ...baseObj, isShared: c.isShared || false });
        }
    };

    // From all tabs
    for (const regIdx in appState.scheduler.tabs) {
        const tab = appState.scheduler.tabs[regIdx];
        tab.unassigned.forEach(addCourse);
        for (const day in tab.grid) {
            for (const lvl in tab.grid[day]) {
                (tab.grid[day][lvl] || []).forEach(addCourse);
            }
        }
    }

    return all;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderGrid(appState) {
    const gridBody = document.getElementById('grid-body');
    if (!gridBody) return;
    gridBody.innerHTML = ''; // Clear existing content
    const days = appState.scheduler.days;
    const levels = appState.levels;

    let activeGrid = {};
    if (appState.scheduler.activeTab === 'master') {
        // Merge all grids visually
        for (const regKey in appState.scheduler.tabs) {
            const g = appState.scheduler.tabs[regKey].grid;
            for (const d in g) {
                if (!activeGrid[d]) activeGrid[d] = {};
                for (const l in g[d]) {
                    if (!activeGrid[d][l]) activeGrid[d][l] = [];
                    activeGrid[d][l].push(...(g[d][l] || []));
                }
            }
        }
    } else {
        activeGrid = appState.scheduler.tabs[appState.scheduler.activeTab]?.grid || {};
    }

    // Pre-compute day conflict counts from current state (for row header badges)
    const dayConflictMap = computeDayConflictCounts(appState);

    for (let d = 0; d < days; d++) {
        const isHoliday = appState.scheduler.holidays.includes(d);
        const rowStyle = isHoliday
            ? 'background: rgba(239, 68, 68, 0.05); opacity: 0.75;'
            : '';

        const dayConflicts = dayConflictMap[d] || 0;
        const conflictBadge = (!isHoliday && dayConflicts > 0)
            ? `<div class="day-conflict-badge">⚠ ${dayConflicts}</div>`
            : '';

        // Compute the date label for this day
        let dayLabel = `Day ${d + 1}`;
        if (appState.scheduler.startDate) {
            const base = new Date(appState.scheduler.startDate);
            base.setDate(base.getDate() + d);
            const formatted = base.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
            dayLabel = `Day ${d + 1} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">${formatted}</span>`;
        }

        const levelsRow = document.createElement('div');
        levelsRow.className = `grid-row${isHoliday ? ' holiday-row' : ''}`;
        levelsRow.style = rowStyle;
        levelsRow.innerHTML = `<div class="grid-row-header">
            <span>${dayLabel}</span>
            ${conflictBadge}
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 400; margin-top:4px;">
                <label style="cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
                    <input type="checkbox" class="holiday-toggle" data-day="${d}" ${isHoliday ? 'checked' : ''}> Holiday
                </label>
            </div>
        </div>`;

        // Calculate students per PERIOD (group levels by their assigned period)
        if (!isHoliday) {
            const periodStudents = {}; // periodName -> total students
            const dayGrid = activeGrid[d] || {};
            for (let l = 0; l < levels.length; l++) {
                const periodName = appState.scheduler.periods[l] || 'Unknown';
                if (!periodStudents[periodName]) periodStudents[periodName] = 0;
                (dayGrid[l] || []).forEach(c => {
                    periodStudents[periodName] += c.students || 0;
                });
            }

            const periodEntries = Object.entries(periodStudents).filter(([, count]) => count > 0);
            if (periodEntries.length > 0) {
                const periodBadgesEl = document.createElement('div');
                periodBadgesEl.style.cssText = 'display:flex; flex-direction:column; gap:2px; margin-top:4px;';
                periodEntries.forEach(([periodName, count]) => {
                    const badge = document.createElement('div');
                    badge.style.cssText = 'font-size:0.65rem; color:var(--accent-cyan); font-weight:600; background:var(--bg-glass); padding:2px 6px; border-radius:var(--radius-sm); text-align:center;';
                    badge.innerHTML = `👥 <span style="color:var(--text-secondary);">${periodName}:</span> ${count}`;
                    periodBadgesEl.appendChild(badge);
                });
                levelsRow.querySelector('.grid-row-header').appendChild(periodBadgesEl);
            }
        }

        // Pre-calculate continuation cards for shared courses
        const levelMax = appState.levels.length;
        const continuations = Array.from({ length: levelMax }, () => []);

        // Pass 1: find shared cards and create continuation entries for adjacent columns
        appState.levels.forEach((lvl, l) => {
            const courseList = activeGrid[d]?.[l] || [];
            courseList.forEach((c) => {
                if (c.isShared && l + 1 < levelMax) {
                    // Add a visible continuation card to the next column
                    continuations[l + 1].push({ isContinuation: true, parentCourse: c });
                }
            });
        });

        // Pass 2: Render cells
        appState.levels.forEach((lvl, l) => {
            const cell = document.createElement('div');
            const dropClass = isHoliday ? 'holiday-cell' : 'droppable';
            cell.className = `grid-cell ${dropClass}`;
            cell.dataset.day = d;
            cell.dataset.level = l;

            const realCourses = activeGrid[d]?.[l] || [];
            const cellContinuations = continuations[l] || [];

            // Render continuation cards first (shared courses from the previous column)
            cellContinuations.forEach(cont => {
                // We create a card that looks identical but acts as a visual clone
                const contCard = createCourseCard(cont.parentCourse);
                // Mark as continuation (ignore in drag-drop and counting logic)
                contCard.classList.add('continuation-card');
                contCard.classList.remove('draggable');
                contCard.draggable = false;
                // Add a small visual hint it's a span, but otherwise identical
                contCard.style.opacity = '0.9';
                contCard.style.borderStyle = 'dashed';
                cell.appendChild(contCard);
            });

            // Render actual courses in this column
            realCourses.forEach(item => {
                const card = createCourseCard(item);
                cell.appendChild(card);
            });

            if (isHoliday && (!realCourses || realCourses.length === 0)) {
                const holidayLabel = document.createElement('div');
                holidayLabel.className = 'holiday-label';
                holidayLabel.textContent = '🏖 Holiday';
                cell.appendChild(holidayLabel);
            }

            // Student count badge per cell (per level per day)
            if (!isHoliday && realCourses.length > 0) {
                let cellStudents = 0;
                realCourses.forEach(c => { cellStudents += c.students || 0; });
                if (cellStudents > 0) {
                    const badge = document.createElement('div');
                    badge.style.cssText = 'text-align:center; font-size:0.65rem; color:var(--accent-cyan); font-weight:600; padding:3px 0; border-top:1px dashed var(--border-subtle); margin-top:4px; background:var(--bg-glass); border-radius:0 0 var(--radius-sm) var(--radius-sm);';
                    badge.textContent = `👥 ${cellStudents}`;
                    cell.appendChild(badge);
                }
            }

            levelsRow.appendChild(cell);
        });

        gridBody.appendChild(levelsRow);
    }
}

function renderUnassigned(appState) {
    const pool = document.getElementById('unassigned-pool');
    if (!pool) return;
    pool.innerHTML = '';

    let unassignedList = [];
    if (appState.scheduler.activeTab === 'master') {
        for (const regKey in appState.scheduler.tabs) {
            unassignedList.push(...appState.scheduler.tabs[regKey].unassigned);
        }
        pool.dataset.reg = 'all';
    } else {
        unassignedList = appState.scheduler.tabs[appState.scheduler.activeTab]?.unassigned || [];
        pool.dataset.reg = appState.scheduler.activeTab;
    }

    document.getElementById('unassigned-count').innerText = unassignedList.length;

    unassignedList.forEach(course => {
        const lookup = _courseLookup[`${course.subCode}::${course.regIndex}`];
        // Merge isShared from the actual course state (lookup defaults isShared to false)
        const full = lookup ? { ...lookup, isShared: course.isShared } : course;
        pool.appendChild(createCourseCard(full));
    });
}

function createCourseCard(course) {
    const el = document.createElement('div');
    el.className = 'course-card draggable';
    el.draggable = true;

    // Store all metadata in data attributes to survive DOM serialization
    el.dataset.code = course.subCode;
    el.dataset.reg = course.regIndex;
    el.dataset.name = course.courseName || course.subCode;
    el.dataset.students = course.students || 0;
    el.dataset.sheet = course.sheetName || '';
    el.dataset.regName = course.regName || '';
    el.dataset.breakdown = JSON.stringify(course.sheetBreakdown || {});
    el.dataset.shared = course.isShared ? 'true' : 'false';

    if (course.isShared) {
        el.classList.add('is-shared');
    }

    const breakdownEntries = Object.entries(course.sheetBreakdown || {});
    let sheetInfoHtml = '';

    if (breakdownEntries.length > 0) {
        sheetInfoHtml = breakdownEntries.map(([sName, count]) => {
            const short = sName.length > 15 ? sName.substring(0, 15) + '…' : sName;
            return `<div class="course-meta" style="color: var(--accent-primary); font-size:0.65rem; margin-top:2px;">
                <span title="${count} من ${sName}">📄 ${count} من ${short}</span>
            </div>`;
        }).join('');
    } else {
        const shortSheet = course.sheetName
            ? (course.sheetName.length > 10 ? course.sheetName.substring(0, 10) + '…' : course.sheetName)
            : 'Data';
        sheetInfoHtml = `
            <div class="course-meta" style="color: var(--accent-primary); font-size:0.68rem; margin-top:2px;">
                <span title="Sheet: ${course.sheetName || 'Unknown'}">📄 ${shortSheet}</span>
            </div>`;
    }

    const shareIconSVG = course.isShared
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;

    el.innerHTML = `
        <div class="conflict-badge" style="display:none;"></div>
        <div class="card-header">
            <div class="course-name" title="${course.courseName}">${course.courseName || course.subCode}</div>
            <div class="card-info-icon" title="View conflict details">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
        </div>
        
        <div class="course-meta">
            <span class="meta-code" title="Course Code">${course.subCode}</span>
            <span class="meta-students badge badge-green" title="Total Students">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                ${course.students || 0}
            </span>
        </div>
        
        <div class="course-sheets">
            ${sheetInfoHtml}
        </div>
        
        <div class="card-bottom-bar">
            <div class="share-toggle-btn ${course.isShared ? 'active' : ''}" title="Toggle shared across levels">
                <span class="share-toggle-indicator">${shareIconSVG}</span>
                <span class="share-toggle-text">Shared</span>
            </div>
        </div>
    `;
    return el;
}

// ─── Drag & Drop (event-delegated — survives re-renders) ──────────────────────

function setupDragAndDropDelegated(appState) {
    let draggedCard = null;
    let dragSourceZone = null;

    const layout = document.querySelector('.scheduler-layout');

    layout.addEventListener('dragstart', (e) => {
        // Prevent drag initialization if clicking inside the bottom bar or header (actions area)
        if (e.target.closest('.card-bottom-bar') || e.target.closest('.card-header')) {
            e.preventDefault();
            return;
        }

        const card = e.target.closest('.course-card.draggable');
        if (!card || card.classList.contains('shadow-placeholder')) return; // Prevent dragging placeholders
        draggedCard = card;
        dragSourceZone = card.parentElement;
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
    });

    // dragend
    layout.addEventListener('dragend', (e) => {
        const card = e.target.closest('.course-card');
        if (card) card.classList.remove('dragging');
        draggedCard = null;
        dragSourceZone = null;
        updateSchedulerState(appState);
    });

    // dragover — only allow on droppable zones
    layout.addEventListener('dragover', (e) => {
        const zone = e.target.closest('.droppable, .draggable-pool');
        if (zone && !e.target.closest('.shadow-placeholder')) { // Prevent dropping on placeholders
            e.preventDefault();
            zone.classList.add('drag-over');
        }
    });

    // dragleave
    layout.addEventListener('dragleave', (e) => {
        const zone = e.target.closest('.droppable, .draggable-pool');
        if (zone && !zone.contains(e.relatedTarget)) {
            zone.classList.remove('drag-over');
        }
    });

    // drop
    layout.addEventListener('drop', (e) => {
        e.preventDefault();
        const zone = e.target.closest('.droppable, .draggable-pool');
        if (!zone || e.target.closest('.shadow-placeholder')) return; // Prevent dropping on placeholders

        zone.classList.remove('drag-over');

        if (!draggedCard) return;

        const targetLevelIdx = zone.dataset.level;
        const cardReg = parseInt(draggedCard.dataset.reg);

        // Validate: grid cells — levels are now global, so no regulation restriction needed
        // Any course can be placed in any level column

        zone.appendChild(draggedCard);
        updateSchedulerState(appState);
        renderGrid(appState);
        renderUnassigned(appState);
        validateGrid(appState);
    });
}

// ─── State sync (DOM → appState) ──────────────────────────────────────────────

function updateSchedulerState(appState) {
    const activeTab = appState.scheduler.activeTab;
    if (activeTab === 'master') return; // Cannot edit master tab directly

    const tabState = appState.scheduler.tabs[activeTab];
    if (!tabState) return;

    tabState.grid = {};
    tabState.unassigned = [];

    // Sidebar
    document.querySelectorAll('#unassigned-pool .course-card:not(.shadow-placeholder):not(.continuation-card)').forEach(card => {
        const key = `${card.dataset.code}::${card.dataset.reg}`;
        const base = _courseLookup[key] || {
            subCode: card.dataset.code,
            regIndex: parseInt(card.dataset.reg),
            courseName: card.dataset.name,
            students: parseInt(card.dataset.students) || 0,
            sheetName: card.dataset.sheet,
            regName: card.dataset.regName,
            sheetBreakdown: JSON.parse(card.dataset.breakdown || '{}')
        };
        tabState.unassigned.push({
            ...base,
            isShared: card.dataset.shared === 'true'
        });
    });

    document.getElementById('unassigned-count').innerText = tabState.unassigned.length;

    // Grid
    const days = appState.scheduler.days;
    for (let d = 0; d < days; d++) {
        if (appState.scheduler.holidays.includes(d)) continue;
        tabState.grid[d] = {};
        appState.levels.forEach((lvl, l) => {
            tabState.grid[d][l] = [];
        });

        const dCells = document.querySelectorAll(`.grid-cell[data-day="${d}"]`);

        dCells.forEach(cell => {
            const l = parseInt(cell.dataset.level);

            cell.querySelectorAll('.course-card:not(.shadow-placeholder):not(.continuation-card)').forEach(card => {
                const key = `${card.dataset.code}::${card.dataset.reg}`;
                const base = _courseLookup[key] || {
                    subCode: card.dataset.code,
                    regIndex: parseInt(card.dataset.reg),
                    courseName: card.dataset.name,
                    students: parseInt(card.dataset.students) || 0,
                    sheetName: card.dataset.sheet,
                    regName: card.dataset.regName,
                    sheetBreakdown: JSON.parse(card.dataset.breakdown || '{}')
                };
                tabState.grid[d][l].push({
                    ...base,
                    isShared: card.dataset.shared === 'true'
                });
            });
        });
    }

    validateGrid(appState);
}

// ─── Conflict Validation ───────────────────────────────────────────────────────

function getSharedStudentsCount(code1, code2, matrices) {
    if (!matrices) return 0;
    let maxShared = 0;
    for (const m of matrices) {
        const idx1 = m.courseList.indexOf(code1);
        const idx2 = m.courseList.indexOf(code2);
        if (idx1 >= 0 && idx2 >= 0) {
            const shared = m.matrix[Math.min(idx1, idx2)][Math.max(idx1, idx2)];
            if (shared && shared.length > 0) {
                maxShared = Math.max(maxShared, shared.length);
            }
        }
    }
    return maxShared;
}

/** Returns a map of dayIndex → total conflicting-student-pairs count */
function computeDayConflictCounts(appState) {
    const result = {};
    if (!appState.matrices) return result;

    const days = appState.scheduler.days;
    for (let d = 0; d < days; d++) {
        if (appState.scheduler.holidays.includes(d)) continue;
        let dayTotal = 0;
        const dayCourses = [];

        // Collect from all tabs to ensure global/cross-tab conflict detection
        for (const tabKey in appState.scheduler.tabs) {
            const tabGrid = appState.scheduler.tabs[tabKey].grid[d] || {};
            for (const lvl in tabGrid) {
                (tabGrid[lvl] || []).forEach(c => dayCourses.push(c.subCode));
            }
        }

        for (let i = 0; i < dayCourses.length; i++) {
            for (let j = i + 1; j < dayCourses.length; j++) {
                dayTotal += getSharedStudentsCount(dayCourses[i], dayCourses[j], appState.matrices);
            }
        }
        if (dayTotal > 0) result[d] = dayTotal;
    }
    return result;
}

function validateGrid(appState) {
    // Reset
    document.querySelectorAll('.course-card').forEach(c => {
        c.classList.remove('conflict');
        const badge = c.querySelector('.conflict-badge');
        if (badge) { badge.style.display = 'none'; badge.textContent = ''; }
        c._conflictCount = 0;
    });

    let totalConflicts = 0;
    if (!appState.matrices) return;

    const days = appState.scheduler.days;

    for (let d = 0; d < days; d++) {
        if (appState.scheduler.holidays.includes(d)) continue;

        // Collect all courses assigned to this day across ALL tabs for global validation
        const allDayCodes = [];
        for (const tabKey in appState.scheduler.tabs) {
            const tabGrid = appState.scheduler.tabs[tabKey].grid[d] || {};
            for (const lvl in tabGrid) {
                (tabGrid[lvl] || []).forEach(c => allDayCodes.push(c.subCode));
            }
        }

        // The DOM only contains the currently visible tab's courses (or master)
        const visibleCards = [];
        document.querySelectorAll(`.grid-cell[data-day="${d}"] .course-card:not(.shadow-placeholder)`).forEach(card => {
            visibleCards.push({ code: card.dataset.code, el: card });
        });

        // For each visible card, check if it conflicts with ANY course scheduled on this day globally
        for (let i = 0; i < visibleCards.length; i++) {
            const vCard = visibleCards[i];
            const countedAgainst = new Set();

            for (let j = 0; j < allDayCodes.length; j++) {
                const otherCode = allDayCodes[j];
                // Don't conflict with itself
                if (vCard.code === otherCode) continue;
                if (countedAgainst.has(otherCode)) continue;
                countedAgainst.add(otherCode);

                const sharedCount = getSharedStudentsCount(vCard.code, otherCode, appState.matrices);
                if (sharedCount > 0) {
                    vCard.el.classList.add('conflict');
                    vCard.el._conflictCount = (vCard.el._conflictCount || 0) + sharedCount;
                }
            }
        }

        // Update conflict badges
        visibleCards.forEach(c => {
            if (c.el._conflictCount > 0) {
                const badge = c.el.querySelector('.conflict-badge');
                if (badge) {
                    badge.textContent = `⚠ ${c.el._conflictCount}`;
                    badge.style.display = 'block';
                }
            }
        });
    }

    // Now calculate true global total conflicts (not just what's visible)
    for (let d = 0; d < days; d++) {
        const allDayCodes = [];
        for (const tabKey in appState.scheduler.tabs) {
            const tabGrid = appState.scheduler.tabs[tabKey].grid[d] || {};
            for (const lvl in tabGrid) {
                (tabGrid[lvl] || []).forEach(c => {
                    allDayCodes.push(c.subCode);
                });
            }
        }

        // Deduplicate codes so we don't multiply conflicts identically
        const uniqueDayCodes = [...new Set(allDayCodes)];
        for (let i = 0; i < uniqueDayCodes.length; i++) {
            for (let j = i + 1; j < uniqueDayCodes.length; j++) {
                totalConflicts += getSharedStudentsCount(uniqueDayCodes[i], uniqueDayCodes[j], appState.matrices);
            }
        }
    }

    // Update row headers with conflict indicators (re-render only row headers)
    updateRowHeaderConflicts(appState, totalConflicts);

    const counter = document.getElementById('global-conflict-counter');
    if (totalConflicts === 0) {
        counter.textContent = '✓ Conflict-Free!';
        counter.className = 'conflict-counter safe';
    } else {
        counter.textContent = `⚠ ${totalConflicts} Conflicts`;
        counter.className = 'conflict-counter danger';
    }
}

function updateRowHeaderConflicts(appState, totalConflicts) {
    const dayConflictMap = computeDayConflictCounts(appState);
    document.querySelectorAll('.grid-row-header').forEach(header => {
        // Remove existing badge
        const old = header.querySelector('.day-conflict-badge');
        if (old) old.remove();

        // Determine the day index from the holiday-toggle inside this row
        const toggle = header.querySelector('.holiday-toggle');
        if (!toggle) return;
        const d = parseInt(toggle.dataset.day);
        const count = dayConflictMap[d];
        if (count) {
            const badge = document.createElement('div');
            badge.className = 'day-conflict-badge';
            badge.textContent = `⚠ ${count}`;
            header.insertBefore(badge, header.querySelector('div'));
        }
    });
}

// ─── Card Interactions (Deep Dive & Info) ─────────────────────────────────────

function setupCardInteractions(appState) {
    let pressTimer;
    let deepDiveActive = false;

    const clearDeepDive = () => {
        deepDiveActive = false;
        document.querySelectorAll('.course-card').forEach(c => c.classList.remove('dimmed', 'highlight-conflict'));
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('highlight-safe'));
    };

    const enableDeepDive = (cardEl) => {
        deepDiveActive = true;
        const code = cardEl.dataset.code;
        const matrices = appState.matrices;
        if (!matrices || matrices.length === 0) return;

        document.querySelectorAll('.course-card').forEach(c => c.classList.add('dimmed'));
        cardEl.classList.remove('dimmed');

        const conflictingCodes = new Set();
        for (const m of matrices) {
            const idx = m.courseList.indexOf(code);
            if (idx >= 0) {
                for (let j = 0; j < m.courseList.length; j++) {
                    if (idx === j) continue;
                    const shared = m.matrix[Math.min(idx, j)][Math.max(idx, j)];
                    if (shared && shared.length > 0) conflictingCodes.add(m.courseList[j]);
                }
            }
        }

        document.querySelectorAll('.course-card').forEach(c => {
            if (conflictingCodes.has(c.dataset.code)) {
                c.classList.remove('dimmed');
                c.classList.add('highlight-conflict');
            }
        });

        const days = appState.scheduler.days;
        for (let d = 0; d < days; d++) {
            if (appState.scheduler.holidays.includes(d)) continue;
            let daySafe = true;
            document.querySelectorAll(`.grid-cell[data-day="${d}"] .course-card`).forEach(c => {
                if (conflictingCodes.has(c.dataset.code)) daySafe = false;
            });
            if (daySafe) {
                document.querySelectorAll(`.grid-cell[data-day="${d}"]`).forEach(cell => cell.classList.add('highlight-safe'));
            }
        }
    };

    const layout = document.querySelector('.scheduler-layout');

    layout.addEventListener('pointerdown', (e) => {
        const card = e.target.closest('.course-card');
        if (card && !e.target.closest('.card-bottom-bar') && !e.target.closest('.card-header') && !card.classList.contains('shadow-placeholder')) {
            // Only trigger deep dive if they aren't clicking the actions areas
            deepDiveActive = false;
            pressTimer = setTimeout(() => enableDeepDive(card), 600);
        }
    });

    layout.addEventListener('pointerup', () => {
        clearTimeout(pressTimer);
        if (deepDiveActive) clearDeepDive();
    });

    layout.addEventListener('pointermove', (e) => {
        // Cancel press if moved too much during hold
        if (e.pressure > 0) clearTimeout(pressTimer);
    });

    // Actions Click (info icon + share toggle)
    layout.addEventListener('click', (e) => {
        const infoIcon = e.target.closest('.card-info-icon');
        const shareBtn = e.target.closest('.share-toggle-btn');

        console.log('[DEBUG] Click on layout:', e.target.tagName, e.target.className, 'shareBtn:', !!shareBtn, 'infoIcon:', !!infoIcon);

        if (infoIcon) {
            e.stopPropagation();
            e.preventDefault();
            const card = infoIcon.closest('.course-card');
            showConflictDetails(card.dataset.code, appState);
        } else if (shareBtn) {
            console.log('[DEBUG] Share btn clicked! Calling toggleCardShared...');
            e.stopPropagation();
            e.preventDefault();
            const card = shareBtn.closest('.course-card');
            if (card && !card.classList.contains('shadow-placeholder')) {
                toggleCardShared(card, appState);
            }
        }
    });
}

function toggleCardShared(cardEl, appState) {
    const isShared = cardEl.dataset.shared === 'true';

    // Toggle the DOM attribute
    cardEl.dataset.shared = (!isShared).toString();

    // Update state from DOM to capture the new shared status + existing grid locations
    updateSchedulerState(appState);

    // Re-render everything to apply visual spanning
    renderGrid(appState);
    renderUnassigned(appState);
    validateGrid(appState);
}

function showConflictDetails(targetCode, appState) {
    const matrices = appState.matrices || [];

    // Find course name from any matrix
    let targetName = targetCode;
    for (const m of matrices) {
        if (m.courseNames[targetCode]) {
            targetName = m.courseNames[targetCode];
            break;
        }
    }

    let html = `<h4 style="margin-bottom: var(--space-md);">
        <span style="color:var(--accent-primary);">${targetName}</span>
        <span style="font-size:0.8em; color:var(--text-muted); font-weight:normal;"> (${targetCode})</span>
    </h4>`;

    let hasConflicts = false;
    const seen = new Set(); // avoid duplicate rows

    for (const m of matrices) {
        const idx = m.courseList.indexOf(targetCode);
        if (idx < 0) continue;

        if (!hasConflicts) {
            html += `<div class="table-wrapper"><table class="data-table"><thead><tr>
                <th>Conflicting Course</th><th>Shared Students</th><th>Student IDs</th>
            </tr></thead><tbody>`;
        }

        for (let j = 0; j < m.courseList.length; j++) {
            if (idx === j) continue;
            const shared = m.matrix[Math.min(idx, j)][Math.max(idx, j)] || [];
            if (shared.length > 0) {
                const c2Code = m.courseList[j];
                if (seen.has(c2Code)) continue;
                seen.add(c2Code);
                hasConflicts = true;
                const c2Name = m.courseNames[c2Code] || c2Code;
                const preview = shared.slice(0, 30).join(', ') + (shared.length > 30 ? ` … +${shared.length - 30} more` : '');

                html += `<tr>
                    <td class="cell-header">${c2Name}<br><span style="font-size:0.8em;font-weight:normal;color:var(--text-muted);">${c2Code}</span></td>
                    <td><span class="badge badge-red">${shared.length}</span></td>
                    <td style="font-family:monospace; font-size:0.78rem; word-break:break-all;">${preview}</td>
                </tr>`;
            }
        }
    }

    if (hasConflicts) {
        html += `</tbody></table></div>`;
    } else {
        html += `<div class="alert alert-success">✓ No conflicts found for this course.</div>`;
    }

    document.getElementById('conflict-details-content').innerHTML = html;
    document.getElementById('conflict-modal').classList.remove('hidden');
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let _toastTimeout;
function showToast(message) {
    const toast = document.getElementById('scheduler-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3000);
}
