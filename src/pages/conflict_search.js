/**
 * Conflict Search Page
 * Dedicated interface to search for a course and view its conflict details globally.
 */

export function renderConflictSearchPage(container, appState, onComplete) {
    container.innerHTML = `
    <div class="page-enter">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h1 class="section-title">بحث التعارضات</h1>
                <p class="section-subtitle">اختر مادة لعرض تفاصيل تعارضاتها مع المواد الأخرى للطلاب.</p>
            </div>
        </div>

        <div class="glass-card" style="margin-bottom: var(--space-xl); max-width: 600px;">
            <label class="form-label" style="font-weight: bold; font-size: 1.1rem; margin-bottom: 12px;">ابحث عن مادة:</label>
            <input type="text" id="conflict-course-search" class="form-input" placeholder="اكتب اسم المادة أو كود المادة..." style="font-size: 1.1rem; padding: 12px; margin-bottom: var(--space-md);">
            
            <div id="course-search-results" style="max-height: 200px; overflow-y: auto; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); display: none;">
                <!-- Search results populate here -->
            </div>
            
            <div id="selected-course-info" style="margin-top: var(--space-lg); padding: var(--space-md); border-left: 4px solid var(--accent-primary); background: rgba(99, 102, 241, 0.05); border-radius: 4px; display: none;">
                <h3 id="selected-course-name" style="margin: 0 0 8px 0; color: var(--text-primary);"></h3>
                <div style="font-family: monospace; color: var(--text-secondary); margin-bottom: 8px;">الكود: <span id="selected-course-code"></span></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;">إجمالي الطلاب: <strong id="selected-course-students" style="color: var(--accent-green);"></strong></div>
            </div>
        </div>

        <div id="conflict-report-container" class="glass-card" style="display: none;">
            <h3 style="margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">تقرير التعارضات للمادة المحددة</h3>
            <div id="conflict-report-content">
                <!-- Conflict table populates here -->
            </div>
        </div>
    </div>
    `;

    // Flatten all unique courses across regulations to search through
    const allCourses = new Map(); // Use map by code to prevent duplicates if they exist across regs with same code
    appState.transformedSheets.forEach(sheet => {
        sheet.data.forEach(course => {
            if (!allCourses.has(course.subCode)) {
                allCourses.set(course.subCode, {
                    ...course,
                    regulationNames: [sheet.fileName]
                });
            } else {
                const existing = allCourses.get(course.subCode);
                if (!existing.regulationNames.includes(sheet.fileName)) {
                    existing.regulationNames.push(sheet.fileName);
                }
            }
        });
    });

    const coursesArray = Array.from(allCourses.values());

    const searchInput = document.getElementById('conflict-course-search');
    const resultsContainer = document.getElementById('course-search-results');
    const selectedInfo = document.getElementById('selected-course-info');
    const reportContainer = document.getElementById('conflict-report-container');

    // Search input handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        resultsContainer.innerHTML = '';

        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        const matches = coursesArray.filter(c =>
            c.courseName.toLowerCase().includes(query) ||
            c.subCode.toLowerCase().includes(query)
        ).slice(0, 15); // Limit to 15 results for performance

        if (matches.length > 0) {
            matches.forEach(match => {
                const div = document.createElement('div');
                div.style.padding = '10px 15px';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid var(--border-light)';
                div.style.transition = 'background 0.2s';
                div.innerHTML = `
                    <div style="font-weight: 600;">${match.courseName}</div>
                    <div style="font-size: 0.8em; color: var(--text-muted); font-family: monospace;">${match.subCode} | طلاب: ${match.students}</div>
                `;

                div.addEventListener('mouseenter', () => div.style.background = 'var(--bg-glass-hover)');
                div.addEventListener('mouseleave', () => div.style.background = 'transparent');

                div.addEventListener('click', () => {
                    selectCourse(match);
                    searchInput.value = match.courseName;
                    resultsContainer.style.display = 'none';
                });

                resultsContainer.appendChild(div);
            });
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = `<div style="padding: 15px; color: var(--text-muted); text-align: center;">لا توجد نتائج مطابقة</div>`;
            resultsContainer.style.display = 'block';
        }
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });

    // Handle Course Selection
    function selectCourse(course) {
        // Update Info Box
        document.getElementById('selected-course-name').textContent = course.courseName;
        document.getElementById('selected-course-code').textContent = course.subCode;
        document.getElementById('selected-course-students').textContent = course.students;
        selectedInfo.style.display = 'block';

        // Generate Report
        generateConflictReport(course.subCode);
    }

    // Generate the conflict report table
    function generateConflictReport(targetCode) {
        const matrices = appState.matrices || [];
        const conflictsFound = [];

        // Scan the global matrix for conflicts with this specific code
        matrices.forEach(matrixData => {
            const matrix = matrixData.matrix;
            if (matrix[targetCode]) {
                for (const otherCode in matrix[targetCode]) {
                    const overlapCount = matrix[targetCode][otherCode];
                    if (overlapCount > 0) {
                        // Find details for otherCode
                        const otherCourse = coursesArray.find(c => c.subCode === otherCode);
                        if (otherCourse) {
                            conflictsFound.push({
                                code: otherCode,
                                name: otherCourse.courseName,
                                students: otherCourse.students,
                                overlap: overlapCount,
                                regulations: otherCourse.regulationNames.join(', ')
                            });
                        }
                    }
                }
            }
        });

        // Sort by overlap count descending
        conflictsFound.sort((a, b) => b.overlap - a.overlap);

        const contentDiv = document.getElementById('conflict-report-content');

        if (conflictsFound.length === 0) {
            contentDiv.innerHTML = `
                <div style="padding: 30px; text-align: center; color: var(--accent-green); background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px bordered rgba(16, 185, 129, 0.3);">
                    <div style="font-size: 2rem; margin-bottom: 10px;">✅</div>
                    <div style="font-size: 1.2rem; font-weight: bold;">لا توجد أي تعارضات لهذه المادة.</div>
                    <p style="margin-top: 5px; color: var(--text-secondary);">هذه المادة آمنة تماماً ولا تشترك في الطلاب مع أي مادة أخرى في جميع اللوائح.</p>
                </div>
            `;
        } else {
            const totalConflicts = conflictsFound.reduce((sum, c) => sum + c.overlap, 0);

            let html = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
                    <div>
                        <span style="font-size: 1.2rem; font-weight: bold; color: var(--accent-red);">تم العثور على ${conflictsFound.length} مادة متعارضة</span>
                    </div>
                    <div style="font-size: 1.1rem;">
                        إجمالي حالات التعارض (الطلاب): <strong style="color: var(--accent-red); font-size: 1.3rem;">${totalConflicts}</strong>
                    </div>
                </div>

                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: right; background: var(--bg-card); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <thead>
                            <tr style="background: var(--bg-surface); border-bottom: 2px solid var(--border-light);">
                                <th style="padding: 12px; font-weight: 600; color: var(--text-muted);">كود المادة</th>
                                <th style="padding: 12px; font-weight: 600; color: var(--text-muted);">اسم المادة المتعارضة</th>
                                <th style="padding: 12px; font-weight: 600; color: var(--text-muted); text-align: center;">إجمالي طلابها</th>
                                <th style="padding: 12px; font-weight: 800; color: var(--accent-red); text-align: center; background: rgba(239,68,68,0.05);">عدد المشتركين (درجة التعارض)</th>
                                <th style="padding: 12px; font-weight: 600; color: var(--text-muted);">اللوائح التابعة لها</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            conflictsFound.forEach((c, idx) => {
                const bg = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
                html += `
                    <tr style="border-bottom: 1px solid var(--border-subtle); background: ${bg}; transition: background 0.2s;">
                        <td style="padding: 12px; font-family: monospace; color: var(--text-secondary);">${c.code}</td>
                        <td style="padding: 12px; font-weight: bold; color: var(--text-primary);">${c.name}</td>
                        <td style="padding: 12px; text-align: center; color: var(--text-secondary);">${c.students}</td>
                        <td style="padding: 12px; text-align: center; font-weight: bold; color: var(--accent-red); font-size: 1.1em; background: rgba(239,68,68,0.05);">${c.overlap}</td>
                        <td style="padding: 12px; font-size: 0.85em; color: var(--text-muted);">${c.regulations}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            contentDiv.innerHTML = html;
        }

        reportContainer.style.display = 'block';
    }
}
