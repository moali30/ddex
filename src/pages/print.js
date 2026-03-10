/**
 * Print page — Step 7: Finalize and Export Schedule
 * Professional Print System Overhaul
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
            .print-preview-container {
                background: #fff;
                color: #000;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .print-page-break {
                page-break-after: always;
            }
            .print-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #222;
                padding-bottom: 15px;
            }
            .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-family: inherit;
            }
            .print-table th, .print-table td {
                border: 1px solid #444;
                padding: 10px;
                text-align: center;
                vertical-align: top;
            }
            .print-table th {
                background: #f0f0f0;
                font-weight: bold;
            }
            .day-cell {
                background: #f9f9f9;
                width: 120px;
            }
            .sig-block {
                text-align: center;
                width: 18%;
                page-break-inside: avoid;
            }
        </style>
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h1 class="section-title">Print & Export</h1>
                <p class="section-subtitle">Professional Layout: Customize logos, titles, and export to PDF.</p>
            </div>
            <div style="display: flex; gap: var(--space-md);">
                <button class="btn btn-outline" id="btn-back">← Back to Editor</button>
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
                            <input type="radio" name="print-mode" value="per-schedule" ${printConfig.mode === 'per-schedule' ? 'checked' : ''}> Per-Schedule (Schedules separate)
                        </label>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            <input type="radio" name="print-mode" value="combined" ${printConfig.mode === 'combined' ? 'checked' : ''}> Combined (All in one)
                        </label>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; color: var(--accent-primary); font-weight: 600;">
                            <input type="radio" name="print-mode" value="student-counts" ${printConfig.mode === 'student-counts' ? 'checked' : ''}> Student Counts Report
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

    // Event Listeners for controls
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

    // Initial render
    updatePreview(appState);
}

function updatePreview(appState) {
    const wrapper = document.getElementById('printable-area-wrapper');
    wrapper.innerHTML = '';

    if (!appState.scheduler || !appState.scheduler.tabs) {
        wrapper.innerHTML = '<div class="alert alert-warning">No schedule generated yet. Please go back to the Smart Scheduler to build your schedule.</div>';
        return;
    }

    if (printConfig.mode === 'per-schedule') {
        const schedDefs = appState.schedulesDefs || [];
        schedDefs.forEach((sched, index) => {
            const gridData = appState.scheduler.tabs[sched.id]?.grid || {};
            // Generate single schedule view
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
    const defaultLogo = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyTDQgNVYxMEM0IDEA2IDEyIDIyIDEyIDIyQzEyIDIyIDIwIDE2IDIwIDEwVjVMMTIgMloiPjwvcGF0aD48L3N2Zz4=";

    const logoR = printConfig.logoRight ? printConfig.logoRight : defaultLogo;
    const logoL = printConfig.logoLeft ? printConfig.logoLeft : defaultLogo;

    let html = `
        <div class="print-header">
            <div style="text-align: right; width: 25%;">
                <img src="${logoR}" alt="Right Logo" style="max-height: 60px; max-width: 150px; object-fit: contain;" />
            </div>
            <div style="text-align: center; width: 50%;">
                <h2 style="margin: 0; font-size: 1.5rem; text-decoration: underline;">${printConfig.title}</h2>
                <h3 style="margin: 5px 0 0; font-size: 1.2rem; color: #444;">${subtitle}</h3>
                <p style="margin: 5px 0 0; font-size: 0.9rem;">${appState.scheduler.startDate ? 'بداية الإمتحانات: ' + appState.scheduler.startDate : ''}</p>
            </div>
            <div style="text-align: left; width: 25%;">
                <img src="${logoL}" alt="Left Logo" style="max-height: 60px; max-width: 150px; object-fit: contain;" />
            </div>
        </div>

        <table class="print-table">
            <thead>
                <tr>
                    <th style="width: 140px; background: #e9ecef;">اليوم <br> 📅 والتاريخ</th>
                    ${levels.map((lvl, idx) => `
                        <th style="padding: 12px 8px;">
                            <div style="font-weight: bold; font-size: 1.15em; margin-bottom: 6px;">${lvl.name}</div>
                            <div style="font-size: 0.9em; display: inline-block; background: #fff; border: 1px solid #ccc; padding: 3px 8px; border-radius: 12px; color: #444;">🕒 ${periodsMap[idx] || '09:00 - 12:00'}</div>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    for (let d = 0; d < days; d++) {
        if (appState.scheduler.holidays?.includes(d)) continue; // skip explicit holidays if we want, or render them? Let's skip for cleaner print.

        // Get all courses on this day across this entire gridData
        const allCoursesOnDay = [];
        for (let l = 0; l < levels.length; l++) {
            if (gridData[d] && gridData[d][l]) {
                allCoursesOnDay.push(...gridData[d][l]);
            }
        }

        if (allCoursesOnDay.length === 0) continue; // Skip empty days in print

        // Compute Date label with clearer Arabized layout
        let dayLabel = `<div style="font-size: 1.1em; margin-bottom: 4px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">اليوم ${d + 1}</div>`;
        if (appState.scheduler.startDate) {
            const base = new Date(appState.scheduler.startDate);
            base.setDate(base.getDate() + d);

            // Format: "الأحد", "الإثنين", etc.
            const arabicDayName = base.toLocaleDateString('ar-EG', { weekday: 'long' });
            const dateStr = base.toLocaleDateString('en-GB'); // DD/MM/YYYY

            dayLabel += `<div style="font-size: 1em; font-weight: bold; color: #222; margin-bottom: 2px;">${arabicDayName}</div>`;
            dayLabel += `<div style="font-size: 0.85em; font-weight: normal; color: #555; background: #fff; border-radius: 4px; display: inline-block; padding: 2px 6px; border: 1px solid #eee;">${dateStr}</div>`;
        }

        // Pre-calculate spanning/continuation mapping for shared courses
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

        // Compute period student totals for this day (exclude continuations so we don't double count)
        const periodTotals = {};
        for (let l = 0; l < levels.length; l++) {
            const periodName = periodsMap[l] || 'Unknown';
            if (!periodTotals[periodName]) periodTotals[periodName] = 0;
            const cellCourses = gridData[d]?.[l] || [];
            cellCourses.forEach(c => {
                periodTotals[periodName] += c.students || 0;
            });
        }

        const periodSummaries = Object.entries(periodTotals)
            .filter(([, count]) => count > 0)
            .map(([pName, count]) => `<div style="font-size:0.75rem; color:#444; margin-top:2px;">👥 <strong>${count}</strong> : ${pName}</div>`)
            .join('');

        html += `<tr>`;
        html += `<td class="day-cell">
                    <strong>${dayLabel}</strong>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dotted #ccc;">
                        ${periodSummaries}
                    </div>
                 </td>`;

        for (let l = 0; l < levels.length; l++) {
            let htmlContent = '';

            if (isStudentCountMode) {
                // Student Count Mode Render (JUST NUMBERS & PERIODS)
                const currentPeriod = periodsMap[l] || 'Unknown';
                const totalStudentsInLevel = periodTotals[currentPeriod] || 0;

                let cellTotal = 0;
                const realCourses = gridData[d]?.[l] || [];
                realCourses.forEach(c => { cellTotal += c.students || 0; });

                // Add continuations count if we want the actual bodies sitting there, but typically continuations shouldn't double count if they are just the SAME students as the course before
                // Here cellTotal accurately reflects the distinct students assigned to start in this cell.

                if (cellTotal > 0) {
                    htmlContent = `
                        <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0;">
                            <div style="font-size: 2.5rem; font-weight: 800; color: #2e7d32;">${cellTotal}</div>
                            <div style="font-size: 0.9em; color: #666; font-weight: bold; margin-top: 5px;">طالب</div>
                        </div>
                    `;
                } else {
                    htmlContent = `<div style="color: #bbb; text-align: center; font-size: 0.8em; padding: 20px 0;">—</div>`;
                }

            } else {
                // Normal Schedule Render
                const realCourses = gridData[d]?.[l] || [];
                const continuations = printContinuations[l] || [];
                // Merge them dynamically so continuations appear identical in the column
                const combinedCourses = [...continuations, ...realCourses];

                if (combinedCourses.length > 0) {
                    htmlContent += combinedCourses.map(c => {
                        // Check conflicts on this day
                        let conflictHtml = '';
                        // Only check conflicts against the real origin courses, ignore checking against continuations here to avoid duplicate badges
                        const conflicts = getCourseConflictsOnDay(c.subCode, allCoursesOnDay, appState.matrices || []);
                        if (conflicts.length > 0) {
                            const totalAffected = conflicts.reduce((sum, cf) => sum + cf.count, 0);
                            const tooltip = conflicts.map(cf => `${cf.name}: ${cf.count} طلاب`).join(' | ');
                            conflictHtml = `<div style="color: #d32f2f; font-weight: bold; font-size: 0.75em; margin-top: 4px; padding: 2px; border: 1px solid #d32f2f; background: #fff5f5; border-radius: 3px;" title="${tooltip}">
                                ⚠ تعارض (${totalAffected} طالب)
                            </div>`;
                        }

                        return `
                        <div class="print-course" style="border: 1px solid #aaa; padding: 6px; margin-bottom: 6px; border-radius: 4px; background: #fafafa; position: relative;">
                            <div style="font-weight: bold; font-size: 0.95em; line-height: 1.2;">${c.courseName}</div>
                            <div style="font-size: 0.75em; color: #666; font-family: monospace; margin-top: 2px;">${c.subCode}</div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                                ${c.isPrintContinuation ? '' : `<span style="font-size: 0.8em; font-weight: bold; color: #2e7d32;">👥 ${c.students || 0}</span>`}
                                ${c.isShared ? '<span style="font-size: 0.7em; background: #e3f2fd; color: #1565c0; padding: 2px 4px; border-radius: 3px;">مشترك</span>' : ''}
                            </div>
                            ${conflictHtml}
                        </div>
                        `;
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
        
        <div class="print-signatures" style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px;">
            ${printConfig.signatures.slice(0, printConfig.sigCount).map((sig, i) => `
                <div class="sig-block" style="text-align: center; flex: 1; padding: 0 10px;">
                    <div class="sig-title" style="font-weight: bold; margin-bottom: 40px; font-size: 1.1em;">${sig.title || 'التوقيع'}</div>
                    <div class="sig-space" style="border-bottom: 1px solid #000; width: 80%; margin: 0 auto;"></div>
                    <div class="sig-name" style="margin-top: 10px; font-weight: bold; min-height: 1.2em;">${sig.name}</div>
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
        alert('PDF Export library (html2pdf) not loaded. Please ensure it is included in your project.');
        return;
    }

    const element = document.getElementById('printable-area-wrapper');
    const opt = {
        margin: 10,
        filename: 'exam_schedule_professional.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };

    // Replace the default display of wrapper to block for printing, then put it back
    // html2pdf handles it well usually, but just in case we need multiple pages
    html2pdf().set(opt).from(element).save();
}
