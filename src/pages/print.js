/**
 * Print page — Step 7: Finalize and Export Schedule
 * Professional Print System — A4 Landscape, fit-to-page
 */

let printConfig = {
    title: "جدول امتحانات الفصل الدراسي",
    mode: "per-schedule", // 'per-schedule' or 'combined'
    logoRight: null,
    logoLeft: null,
    sigCount: 4,
    signatures: [
        { title: "لجنة الجداول", name: "" },
        { title: "رئيس الكنترول", name: "" },
        { title: "وكيل الكلية لشئون التعليم والطلاب", name: "" },
        { title: "عميد الكلية", name: "" },
        { title: "رئيس الجامعة", name: "" }
    ]
};

export function renderPrintPage(container, appState, onComplete) {
    container.innerHTML = `
    <div class="page-enter print-layout">
        <style>
            @media print {
                body, html { margin: 0; padding: 0; background: #fff !important; }
                body::before { display: none !important; }
                #app > .sidebar-nav,
                #app > .main-wrapper > .top-header,
                .print-layout > .section-header,
                .print-layout > .glass-card { display: none !important; }
                .page-container { padding: 0 !important; overflow: visible !important; }
                .main-wrapper { overflow: visible !important; }
                .dashboard-layout { overflow: visible !important; height: auto !important; }
                .print-preview-container {
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    page-break-after: always;
                    break-after: page;
                }
                .print-preview-container:last-child {
                    page-break-after: avoid;
                    break-after: avoid;
                }
                @page {
                    size: A4 landscape;
                    margin: 8mm 10mm;
                }
                .print-table { font-size: 9pt !important; }
                .print-table th, .print-table td { padding: 5px 4px !important; }
                .print-header { margin-bottom: 12px !important; padding-bottom: 8px !important; }
                .print-signatures { margin-top: 20px !important; }
            }
            .print-preview-container {
                background: #fff;
                color: #000;
                padding: 20px 25px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                font-family: 'Cairo', 'Inter', sans-serif;
            }
            .print-page-break {
                page-break-after: always;
                break-after: page;
            }
            .print-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 3px double #222;
                padding-bottom: 10px;
            }
            .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                font-family: inherit;
                table-layout: fixed;
            }
            .print-table th, .print-table td {
                border: 1.5px solid #333;
                padding: 6px 5px;
                text-align: center;
                vertical-align: top;
                font-size: 0.85rem;
                word-wrap: break-word;
                overflow-wrap: break-word;
            }
            .print-table th {
                background: #e8e8e8 !important;
                font-weight: bold;
                font-size: 0.9rem;
            }
            .day-cell {
                background: #f5f5f5 !important;
                font-weight: bold;
                width: 100px;
            }
            .sig-block {
                text-align: center;
                page-break-inside: avoid;
            }
            .print-course {
                border: 1px solid #bbb;
                padding: 4px 5px;
                margin-bottom: 4px;
                border-radius: 3px;
                background: #fafafa;
            }
            .print-course:last-child {
                margin-bottom: 0;
            }
        </style>
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h1 class="section-title">Print & Export</h1>
                <p class="section-subtitle">Professional Layout: Customize logos, titles, and export to PDF.</p>
            </div>
            <div style="display: flex; gap: var(--space-md);">
                <button class="btn btn-outline" id="btn-back">← Back to Editor</button>
                <button class="btn btn-secondary" id="btn-print-direct">
                    🖨️ Print Direct
                </button>
                <button class="btn btn-primary" id="btn-export-pdf" style="font-size: 1.1rem;">
                    📄 Export PDF
                </button>
            </div>
        </div>

        <div class="glass-card" style="margin-bottom: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">Document Settings</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-lg);">
                <div>
                    <label class="form-label">Table Title</label>
                    <input type="text" class="form-input" id="table-title-input" value="${printConfig.title}" dir="rtl" />
                </div>
                <div>
                    <label class="form-label">Print Mode</label>
                    <div style="display: flex; gap: var(--space-md); margin-top: 8px;">
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            <input type="radio" name="print-mode" value="per-schedule" ${printConfig.mode === 'per-schedule' ? 'checked' : ''}> Per-Schedule
                        </label>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            <input type="radio" name="print-mode" value="combined" ${printConfig.mode === 'combined' ? 'checked' : ''}> Combined
                        </label>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; color: var(--accent-primary); font-weight: 600;">
                            <input type="radio" name="print-mode" value="student-counts" ${printConfig.mode === 'student-counts' ? 'checked' : ''}> Student Counts
                        </label>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-lg);">
                <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
                    <label class="form-label">Number of Signatures</label>
                    <select class="form-select" id="sig-count-select" style="margin-top: 8px;">
                        ${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${printConfig.sigCount === n ? 'selected' : ''}>${n} Signatures</option>`).join('')}
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-lg);">
                <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
                    <label class="form-label">Right Logo (e.g., University)</label>
                    <input type="file" id="logo-right-input" accept="image/*" class="form-input" style="font-size: 0.8rem; padding: 4px;" />
                    <div style="margin-top: 8px; min-height: 40px;">
                        <img id="logo-right-preview" style="max-height: 40px; display: ${printConfig.logoRight ? 'block' : 'none'};" src="${printConfig.logoRight || ''}" />
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
                    <label class="form-label">Left Logo (e.g., College)</label>
                    <input type="file" id="logo-left-input" accept="image/*" class="form-input" style="font-size: 0.8rem; padding: 4px;" />
                    <div style="margin-top: 8px; min-height: 40px;">
                        <img id="logo-left-preview" style="max-height: 40px; display: ${printConfig.logoLeft ? 'block' : 'none'};" src="${printConfig.logoLeft || ''}" />
                    </div>
                </div>
            </div>

            <h4 style="margin-bottom: var(--space-sm); color:var(--text-secondary);">Signatures Setup</h4>
            <div class="form-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-md);">
                ${printConfig.signatures.map((sig, i) => `
                <div class="sig-input-block" data-idx="${i}" style="background:rgba(255,255,255,0.02); padding:10px; border-radius:8px; border:1px solid var(--border-subtle); display: ${i < printConfig.sigCount ? 'block' : 'none'};">
                    <label class="form-label" style="font-size:0.75rem;">Signatory ${i + 1} Title</label>
                    <input type="text" class="form-input sig-title-input" data-id="${i}" value="${sig.title}" style="margin-bottom:8px; padding:4px;" />
                    
                    <label class="form-label" style="font-size:0.75rem;">Signatory ${i + 1} Name</label>
                    <input type="text" class="form-input sig-name-input" data-id="${i}" value="${sig.name}" placeholder="أ.د / ..." style="padding:4px;" />
                </div>
                `).join('')}
            </div>
        </div>

        <!-- The dynamic printable area -->
        <div id="printable-area-wrapper"></div>
    </div>
    `;

    // Event Listeners
    document.getElementById('table-title-input').addEventListener('input', (e) => {
        printConfig.title = e.target.value;
        updatePreview(appState);
    });

    document.getElementById('sig-count-select').addEventListener('change', (e) => {
        printConfig.sigCount = parseInt(e.target.value);
        document.querySelectorAll('.sig-input-block').forEach((block, idx) => {
            block.style.display = idx < printConfig.sigCount ? 'block' : 'none';
        });
        updatePreview(appState);
    });

    document.querySelectorAll('input[name="print-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            printConfig.mode = e.target.value;
            updatePreview(appState);
        });
    });

    const handleLogoUpload = (inputId, previewId, stateKey) => {
        const input = document.getElementById(inputId);
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    printConfig[stateKey] = event.target.result;
                    document.getElementById(previewId).src = printConfig[stateKey];
                    document.getElementById(previewId).style.display = 'block';
                    updatePreview(appState);
                };
                reader.readAsDataURL(file);
            }
        });
    };
    handleLogoUpload('logo-right-input', 'logo-right-preview', 'logoRight');
    handleLogoUpload('logo-left-input', 'logo-left-preview', 'logoLeft');

    document.querySelectorAll('.sig-title-input').forEach(input => {
        input.addEventListener('input', (e) => {
            printConfig.signatures[e.target.dataset.id].title = e.target.value;
            updatePreview(appState);
        });
    });

    document.querySelectorAll('.sig-name-input').forEach(input => {
        input.addEventListener('input', (e) => {
            printConfig.signatures[e.target.dataset.id].name = e.target.value;
            updatePreview(appState);
        });
    });

    document.getElementById('btn-back').addEventListener('click', () => {
        onComplete('back');
    });

    document.getElementById('btn-export-pdf').addEventListener('click', () => {
        exportToPDF();
    });

    document.getElementById('btn-print-direct').addEventListener('click', () => {
        window.print();
    });

    // Initial render
    updatePreview(appState);
}

function updatePreview(appState) {
    const wrapper = document.getElementById('printable-area-wrapper');
    wrapper.innerHTML = '';

    if (!appState.scheduler || !appState.scheduler.tabs) {
        wrapper.innerHTML = '<div class="alert alert-warning">No schedule generated yet.</div>';
        return;
    }

    if (printConfig.mode === 'per-schedule') {
        const schedDefs = appState.schedulesDefs || [];
        schedDefs.forEach((sched) => {
            const gridData = appState.scheduler.tabs[sched.id]?.grid || {};
            const pageDiv = document.createElement('div');
            pageDiv.className = 'print-preview-container print-page-break';
            pageDiv.dir = 'rtl';
            pageDiv.innerHTML = generatePageHTML(appState, gridData, sched.name);
            wrapper.appendChild(pageDiv);
        });
    } else {
        const mergedGrid = {};
        const schedDefs = appState.schedulesDefs || [];
        schedDefs.forEach(sched => {
            const gridData = appState.scheduler.tabs[sched.id]?.grid || {};
            for (const d in gridData) {
                if (!mergedGrid[d]) mergedGrid[d] = {};
                for (const l in gridData[d]) {
                    if (!mergedGrid[d][l]) mergedGrid[d][l] = [];
                    mergedGrid[d][l].push(...(gridData[d][l] || []));
                }
            }
        });

        const pageDiv = document.createElement('div');
        pageDiv.className = 'print-preview-container';
        pageDiv.dir = 'rtl';
        const st = printConfig.mode === 'student-counts' ? 'تقرير أعداد الطلاب والتوزيع' : 'الجدول المجمع';
        pageDiv.innerHTML = generatePageHTML(appState, mergedGrid, st, printConfig.mode === 'student-counts');
        wrapper.appendChild(pageDiv);
    }
}

function generatePageHTML(appState, gridData, subtitle = '', isStudentCountMode = false) {
    const days = appState.scheduler.days;
    const levels = appState.levels || [];
    const periodsMap = appState.scheduler.periods || {};

    const logoR = printConfig.logoRight || '';
    const logoL = printConfig.logoLeft || '';

    const logoRightHtml = logoR
        ? `<img src="${logoR}" alt="Right Logo" style="max-height: 55px; max-width: 140px; object-fit: contain;" />`
        : '';
    const logoLeftHtml = logoL
        ? `<img src="${logoL}" alt="Left Logo" style="max-height: 55px; max-width: 140px; object-fit: contain;" />`
        : '';

    const dateInfo = appState.scheduler.startDate
        ? `<div style="font-size: 0.85rem; color: #555; margin-top: 4px;">بداية الامتحانات: ${appState.scheduler.startDate}</div>`
        : '';

    // Calculate column width percentage
    const colCount = levels.length + 1; // +1 for day column
    const dayColWidth = Math.max(10, Math.min(15, 100 / colCount));
    const levelColWidth = (100 - dayColWidth) / levels.length;

    let html = `
        <div class="print-header">
            <div style="text-align: right; width: 20%;">${logoRightHtml}</div>
            <div style="text-align: center; width: 60%;">
                <h2 style="margin: 0; font-size: 1.3rem; font-weight: 800;">${printConfig.title}</h2>
                <h3 style="margin: 4px 0 0; font-size: 1.05rem; color: #333; font-weight: 600;">${subtitle}</h3>
                ${dateInfo}
            </div>
            <div style="text-align: left; width: 20%;">${logoLeftHtml}</div>
        </div>

        <table class="print-table">
            <thead>
                <tr>
                    <th style="width: ${dayColWidth}%; background: #ddd !important;">اليوم<br>📅 والتاريخ</th>
                    ${levels.map((lvl, idx) => `
                        <th style="width: ${levelColWidth}%; padding: 8px 4px;">
                            <div style="font-weight: bold; font-size: 1em; margin-bottom: 4px;">${lvl.name}</div>
                            <div style="font-size: 0.8em; display: inline-block; background: #fff; border: 1px solid #ccc; padding: 2px 6px; border-radius: 10px; color: #444;">🕒 ${periodsMap[idx] || '09:00 - 12:00'}</div>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    for (let d = 0; d < days; d++) {
        if (appState.scheduler.holidays?.includes(d)) continue;

        const allCoursesOnDay = [];
        for (let l = 0; l < levels.length; l++) {
            if (gridData[d] && gridData[d][l]) {
                allCoursesOnDay.push(...gridData[d][l]);
            }
        }

        if (allCoursesOnDay.length === 0) continue;

        // Date label
        let dayLabel = `<div style="font-size: 1em; margin-bottom: 3px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">اليوم ${d + 1}</div>`;
        if (appState.scheduler.startDate) {
            const base = new Date(appState.scheduler.startDate);
            base.setDate(base.getDate() + d);
            const arabicDayName = base.toLocaleDateString('ar-EG', { weekday: 'long' });
            const dateStr = base.toLocaleDateString('en-GB');

            dayLabel += `<div style="font-size: 0.9em; font-weight: bold; color: #222; margin-bottom: 2px;">${arabicDayName}</div>`;
            dayLabel += `<div style="font-size: 0.8em; color: #555; background: #fff; border-radius: 3px; display: inline-block; padding: 1px 5px; border: 1px solid #eee;">${dateStr}</div>`;
        }

        // Continuation mapping for shared courses
        const levelMax = levels.length;
        const printContinuations = Array.from({ length: levelMax }, () => []);
        for (let l = 0; l < levelMax; l++) {
            const courseList = gridData[d]?.[l] || [];
            courseList.forEach((c) => {
                if (c.isShared && l + 1 < levelMax) {
                    printContinuations[l + 1].push({ ...c, isPrintContinuation: true });
                }
            });
        }

        // Period student totals
        const periodTotals = {};
        for (let l = 0; l < levels.length; l++) {
            const periodName = periodsMap[l] || 'Unknown';
            if (!periodTotals[periodName]) periodTotals[periodName] = 0;
            (gridData[d]?.[l] || []).forEach(c => { periodTotals[periodName] += c.students || 0; });
        }

        const periodSummaries = Object.entries(periodTotals)
            .filter(([, count]) => count > 0)
            .map(([pName, count]) => `<div style="font-size:0.7rem; color:#444; margin-top:2px;">👥 <strong>${count}</strong> : ${pName}</div>`)
            .join('');

        html += `<tr>`;
        html += `<td class="day-cell">
                    <strong>${dayLabel}</strong>
                    <div style="margin-top: 5px; padding-top: 5px; border-top: 1px dotted #ccc;">${periodSummaries}</div>
                 </td>`;

        for (let l = 0; l < levels.length; l++) {
            let htmlContent = '';

            if (isStudentCountMode) {
                let cellTotal = 0;
                (gridData[d]?.[l] || []).forEach(c => { cellTotal += c.students || 0; });

                if (cellTotal > 0) {
                    htmlContent = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 0;">
                            <div style="font-size: 2rem; font-weight: 800; color: #2e7d32;">${cellTotal}</div>
                            <div style="font-size: 0.8em; color: #666; font-weight: bold;">طالب</div>
                        </div>`;
                } else {
                    htmlContent = `<div style="color: #bbb; text-align: center; font-size: 0.8em;">—</div>`;
                }
            } else {
                const realCourses = gridData[d]?.[l] || [];
                const continuations = printContinuations[l] || [];
                const combinedCourses = [...continuations, ...realCourses];

                if (combinedCourses.length > 0) {
                    htmlContent += combinedCourses.map(c => {
                        let conflictHtml = '';
                        const conflicts = getCourseConflictsOnDay(c.subCode, allCoursesOnDay, appState.matrices || []);
                        if (conflicts.length > 0) {
                            const totalAffected = conflicts.reduce((sum, cf) => sum + cf.count, 0);
                            conflictHtml = `<div style="color: #d32f2f; font-weight: bold; font-size: 0.7em; margin-top: 3px; padding: 1px 3px; border: 1px solid #d32f2f; background: #fff5f5; border-radius: 2px;">⚠ تعارض (${totalAffected} طالب)</div>`;
                        }
                        return `
                        <div class="print-course">
                            <div style="font-weight: bold; font-size: 0.85em; line-height: 1.2;">${c.courseName}</div>
                            <div style="font-size: 0.7em; color: #666; font-family: monospace; margin-top: 1px;">${c.subCode}</div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
                                ${c.isPrintContinuation ? '' : `<span style="font-size: 0.75em; font-weight: bold; color: #2e7d32;">👥 ${c.students || 0}</span>`}
                                ${c.isShared ? '<span style="font-size: 0.65em; background: #e3f2fd; color: #1565c0; padding: 1px 3px; border-radius: 2px;">مشترك</span>' : ''}
                            </div>
                            ${conflictHtml}
                        </div>`;
                    }).join('');
                } else {
                    htmlContent = `<div style="color: #bbb; text-align: center; font-size: 0.8em;">—</div>`;
                }
            }
            html += `<td style="vertical-align: top;">${htmlContent}</td>`;
        }
        html += `</tr>`;
    }

    html += `
            </tbody>
        </table>
        
        <div class="print-signatures" style="display: flex; justify-content: space-around; margin-top: 25px; padding: 0 20px;">
            ${printConfig.signatures.slice(0, printConfig.sigCount).map((sig) => `
                <div class="sig-block" style="text-align: center; flex: 1; padding: 0 8px;">
                    <div style="font-weight: bold; margin-bottom: 35px; font-size: 0.95em; border-bottom: 2px solid transparent;">${sig.title || 'التوقيع'}</div>
                    <div style="border-bottom: 1px solid #000; width: 85%; margin: 0 auto;"></div>
                    <div style="margin-top: 6px; font-weight: bold; font-size: 0.9em; min-height: 1.2em;">${sig.name}</div>
                </div>
            `).join('')}
        </div>
    `;

    return html;
}

function getCourseConflictsOnDay(c1Code, allCoursesOnDay, matrices) {
    const conflicts = [];
    const seen = new Set();
    for (const c2 of allCoursesOnDay) {
        if (c1Code === c2.subCode) continue;
        if (seen.has(c2.subCode)) continue;

        for (const m of matrices) {
            const idx1 = m.courseList.indexOf(c1Code);
            const idx2 = m.courseList.indexOf(c2.subCode);
            if (idx1 >= 0 && idx2 >= 0) {
                const shared = m.matrix[Math.min(idx1, idx2)][Math.max(idx1, idx2)];
                if (shared && shared.length > 0) {
                    conflicts.push({ subCode: c2.subCode, name: m.courseNames[c2.subCode] || c2.subCode, count: shared.length });
                    seen.add(c2.subCode);
                    break;
                }
            }
        }
    }
    return conflicts;
}

function exportToPDF() {
    if (typeof html2pdf === 'undefined') {
        alert('PDF Export library (html2pdf) not loaded.');
        return;
    }

    const element = document.getElementById('printable-area-wrapper');
    const opt = {
        margin: [5, 8, 5, 8],
        filename: 'exam_schedule.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'], before: '.print-page-break' }
    };

    html2pdf().set(opt).from(element).save();
}
