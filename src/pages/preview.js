/**
 * Preview page — Step 2: Show transformed data per sheet
 * Displays each sheet's data in course-centric format (course columns with student IDs)
 */
import { transformToCourseView, courseViewToArray } from '../transformer.js';

export function renderPreviewPage(container, appState, onComplete) {
  const sheets = appState.parsedSheets;

  // Transform all sheets
  const transformedSheets = sheets.map((sheet) => ({
    sheetName: sheet.sheetName,
    courseNames: sheet.courseNames,
    courseView: courseViewToArray(transformToCourseView(sheet.students)),
  }));

  appState.transformedSheets = transformedSheets;
  let activeTabIndex = 0;

  function renderFullPage() {
    container.innerHTML = `
        <div class="page-enter">
          <div class="section-header">
            <h1 class="section-title">Data Preview</h1>
            <p class="section-subtitle">Transformed view: courses as columns, student IDs as rows</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${sheets.length}</div>
              <div class="stat-label">Sheets</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${getTotalStudents(sheets)}</div>
              <div class="stat-label">Total Students</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="total-courses-stat">${getTotalCourses(appState.transformedSheets)}</div>
              <div class="stat-label">Total Courses</div>
            </div>
          </div>

          <div class="tabs-container">
            <div class="tabs-header" id="sheet-tabs">
              ${appState.transformedSheets.map((s, i) => `
                <div class="tab-btn ${i === activeTabIndex ? 'active' : ''}" data-tab="${i}" style="display: flex; align-items: center; gap: 8px;">
                  <span>${s.sheetName}</span>
                  <button class="edit-sheet-btn" data-idx="${i}" style="background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.9rem;" title="Rename Sheet">✏️</button>
                </div>
              `).join('')}
            </div>

            <div id="tab-content"></div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: var(--space-xl);">
            <button class="btn btn-primary btn-lg" id="btn-next-regulations">
              Continue to Regulations →
            </button>
          </div>
        </div>
      `;

    // Tab switching
    const tabs = container.querySelectorAll('.tab-btn');
    const tabContent = document.getElementById('tab-content');

    function showTab(index) {
      activeTabIndex = index;
      tabs.forEach(t => t.classList.remove('active'));
      tabs[index].classList.add('active');
      renderSheetTable(tabContent, appState.transformedSheets[index]);
      document.getElementById('total-courses-stat').textContent = getTotalCourses(appState.transformedSheets);
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        // Ignore clicks on the edit button (handled strictly by delegation below)
        if (!e.target.closest('.edit-sheet-btn')) {
          showTab(parseInt(tab.dataset.tab));
        }
      });
    });

    // Sheet Rename Event Listener
    document.getElementById('sheet-tabs').addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-sheet-btn');
      if (editBtn) {
        e.stopPropagation();
        const idx = parseInt(editBtn.dataset.idx);
        const currentName = appState.parsedSheets[idx].sheetName;

        const newName = window.prompt("Enter new name for the sheet:", currentName);

        if (newName !== null && newName.trim() !== '') {
          const trimmedName = newName.trim();
          appState.parsedSheets[idx].sheetName = trimmedName;
          appState.transformedSheets[idx].sheetName = trimmedName;

          // Keep the active tab active
          activeTabIndex = idx;
          renderFullPage();
        }
      }
    });

    // Initialize first tab
    showTab(activeTabIndex);

    document.getElementById('btn-next-regulations').addEventListener('click', () => {
      onComplete();
    });

    // Event listener for delete column
    tabContent.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-col-btn');
      if (btn) {
        const subCode = btn.dataset.subcode;
        if (confirm(`Are you sure you want to delete column '${subCode}'? It will be excluded from all further steps.`)) {
          deleteColumn(subCode);
        }
      }
    });
  }

  function deleteColumn(subCode) {
    const sheet = appState.parsedSheets[activeTabIndex];

    // Remove from all students in this sheet
    for (const [studentCode, courses] of sheet.students) {
      const index = courses.indexOf(subCode);
      if (index !== -1) {
        courses.splice(index, 1);
      }
    }

    // Remove from courseNames
    if (sheet.courseNames[subCode]) {
      delete sheet.courseNames[subCode];
    }

    // Re-transform this specific sheet
    appState.transformedSheets[activeTabIndex].courseView = courseViewToArray(transformToCourseView(sheet.students));

    // Re-render the UI
    renderFullPage();
  }

  renderFullPage();
}

function renderSheetTable(container, sheetData) {
  const courses = sheetData.courseView;

  if (courses.length === 0) {
    container.innerHTML = '<div class="alert alert-warning">⚠️ No courses found in this sheet.</div>';
    return;
  }

  // Find the max number of students in any course (for row count)
  const maxStudents = Math.max(...courses.map(c => c.students.length));

  let tableHTML = `
    <div class="glass-card" style="padding: var(--space-md);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <div>
          <span class="badge badge-primary" style="font-size: 0.85rem; padding: 4px 12px;">
            ${courses.length} courses
          </span>
        </div>
      </div>
      <div class="table-wrapper" style="max-height: 500px; overflow-y: auto;">
        <table class="data-table">
          <thead>
            <tr>
              ${courses.map(c => {
    const courseName = sheetData.courseNames[c.subCode] || c.subCode;
    return `
                <th title="Code: ${c.subCode}" style="position: relative; padding-right: 32px; min-width: 120px;">
                  <div style="white-space: normal; line-height: 1.2;">${courseName}</div>
                  <button class="delete-col-btn" data-subcode="${c.subCode}" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #ff6b6b; font-size: 1.1rem; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Delete Course">
                    &times;
                  </button>
                  <div style="font-weight: 400; font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">
                    Code: ${c.subCode} | Students: ${c.students.length}
                  </div>
                </th>
              `;
  }).join('')}
            </tr>
          </thead>
          <tbody>
  `;

  for (let row = 0; row < maxStudents; row++) {
    tableHTML += '<tr>';
    for (const course of courses) {
      const studentId = row < course.students.length ? course.students[row] : '';
      tableHTML += `<td>${studentId}</td>`;
    }
    tableHTML += '</tr>';
  }

  tableHTML += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = tableHTML;
}

function getTotalStudents(sheets) {
  const allStudents = new Set();
  for (const sheet of sheets) {
    for (const code of sheet.students.keys()) {
      allStudents.add(code);
    }
  }
  return allStudents.size;
}

function getTotalCourses(transformedSheets) {
  const allCourses = new Set();
  for (const sheet of transformedSheets) {
    for (const c of sheet.courseView) {
      allCourses.add(c.subCode);
    }
  }
  return allCourses.size;
}
