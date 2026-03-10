/**
 * Matrix page — Step 4: Show the Global Conflict Matrix
 */
import { generateRegulationConflictMatrices, countConflicts } from '../core/conflict.js';

export function renderMatrixPage(container, appState, onComplete) {
  const regulations = appState.regulations;

  // Generate matrices for each regulation independently
  const matrices = generateRegulationConflictMatrices(regulations);
  appState.matrices = matrices;

  // Default to the first matrix
  let activeTabIndex = 0;

  const renderCurrentView = () => {
    container.innerHTML = `
      <div class="page-enter scheduler-layout">
        <div class="scheduler-header">
          <div>
            <h1 class="section-title" style="margin-bottom: 4px;">Conflict Matrices</h1>
            <p class="section-subtitle" style="margin-bottom: 0;">
              View the conflict matrix for each regulation. The redder the cell, the higher the conflict.
            </p>
          </div>
          
          <div class="scheduler-controls">
            <button class="btn btn-success" id="btn-export-excel" style="font-size: 1.1rem;">
                📥 Export Excel
            </button>
            <button class="btn btn-primary" id="btn-next-info">
              Continue to Dashboard →
            </button>
          </div>
        </div>

        <div class="scheduler-tabs-container">
            <div class="scheduler-tabs">
                ${matrices.map((m, idx) => `
                    <button class="scheduler-tab ${activeTabIndex === idx ? 'active' : ''}" data-tab="${idx}">
                        ${m.regName}
                    </button>
                `).join('')}
            </div>
        </div>

        <div id="matrix-content" style="padding: 0 var(--space-xl);"></div>
      </div>
    `;

    const content = document.getElementById('matrix-content');
    if (matrices.length > 0) {
      renderMatrixHtml(content, matrices[activeTabIndex]);
    } else {
      content.innerHTML = '<div class="alert alert-warning">⚠️ No regulations found.</div>';
    }

    // Event Listeners
    document.querySelectorAll('.scheduler-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeTabIndex = parseInt(e.target.dataset.tab);
        renderCurrentView();
      });
    });

    document.getElementById('btn-next-info').addEventListener('click', () => {
      onComplete();
    });

    document.getElementById('btn-export-excel').addEventListener('click', () => {
      if (matrices.length > 0) {
        exportMatrixToExcel(matrices[activeTabIndex]);
      }
    });
  };

  renderCurrentView();
}

function renderMatrixHtml(container, data) {
  const { courseList, matrix, courseNames } = data;
  const n = courseList.length;

  if (n === 0) {
    container.innerHTML = '<div class="alert alert-warning">⚠️ No courses found for this regulation.</div>';
    return;
  }

  // Count total conflicts globally
  let totalConflicts = 0;
  let maxShared = 0; // to calculate color intensity
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (matrix[i][j] && matrix[i][j].length > 0) {
        totalConflicts++;
        maxShared = Math.max(maxShared, matrix[i][j].length);
      }
    }
  }
  const totalPairs = (n * (n - 1)) / 2;

  let html = `
    <div class="glass-card" style="padding: var(--space-md); margin-top: var(--space-md);">
      <div class="stats-grid" style="margin-bottom: var(--space-lg);">
        <div class="stat-card">
          <div class="stat-value">${n}</div>
          <div class="stat-label">Unique Courses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: var(--accent-red);">${totalConflicts}</div>
          <div class="stat-label">Conflicting Pairs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalPairs}</div>
          <div class="stat-label">Possible Pairs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalPairs > 0 ? ((totalConflicts / totalPairs) * 100).toFixed(1) : 0}%</div>
          <div class="stat-label">Conflict Rate</div>
        </div>
      </div>

      <div class="table-wrapper" style="max-height: 550px; overflow: auto; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
        <table class="data-table matrix-table" style="font-size: 0.8em; min-width: 100%;">
          <thead>
            <tr>
              <th style="position: sticky; top: 0; left: 0; z-index: 3; background: var(--bg-card); min-width: 200px;">Course</th>
              ${courseList.map(c => {
    const courseName = courseNames[c] || c;
    return `
                              <th title="Code: ${c}" style="position: sticky; top: 0; z-index: 2; background: var(--bg-card); writing-mode: vertical-rl; transform: rotate(180deg); padding: 8px 4px; height: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 1px solid var(--border-subtle);">
                                  ${courseName}
                              </th>
                            `;
  }).join('')}
            </tr>
          </thead>
          <tbody>
  `;

  for (let i = 0; i < n; i++) {
    const courseName = courseNames[courseList[i]] || courseList[i];
    html += `<tr>`;
    html += `<td title="Code: ${courseList[i]}" style="position: sticky; left: 0; z-index: 1; background: var(--bg-card); font-weight: 600; border-right: 1px solid var(--border-subtle);">${courseName} <br><span style="font-size:0.7em; color:var(--text-muted);">${courseList[i]}</span></td>`;

    for (let j = 0; j < n; j++) {
      if (i === j) {
        html += `<td style="background-color: var(--bg-hover); color: var(--text-muted); text-align: center; border: 1px solid var(--border-subtle);">—</td>`;
      } else if (matrix[i][j] && matrix[i][j].length > 0) {
        // Calculate opacity based on maxShared (min 0.2, max 0.8) for visual heat map effect
        const intensity = 0.2 + (0.6 * (matrix[i][j].length / maxShared));
        const bgColor = `rgba(239, 68, 68, ${intensity})`; // red with opacity

        // Truncate tooltip if too many students
        const maxTooltipStudents = 20;
        let tooltip = `Shared students (${matrix[i][j].length}):\n`;
        tooltip += matrix[i][j].slice(0, maxTooltipStudents).join(', ');
        if (matrix[i][j].length > maxTooltipStudents) {
          tooltip += `\n...and ${matrix[i][j].length - maxTooltipStudents} more`;
        }

        html += `<td style="background-color: ${bgColor}; color: #fff; text-align: center; font-weight: bold; cursor: help; border: 1px solid var(--border-subtle);" title="${tooltip}">${matrix[i][j].length}</td>`;
      } else {
        html += `<td style="color: var(--text-muted); text-align: center; opacity: 0.5; border: 1px solid var(--border-subtle);">0</td>`;
      }
    }
    html += `</tr>`;
  }

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function exportMatrixToExcel(data) {
  if (typeof XLSX === 'undefined') {
    alert('Excel Export library (SheetJS) not loaded. Please ensure it is included in your project.');
    return;
  }

  const { courseList, matrix, courseNames, regName } = data;
  const n = courseList.length;

  // Build 2D array for SheetJS
  const aoa = [];

  // Header Row
  const headerRow = ["Course Code", "Course Name"];
  courseList.forEach(c => headerRow.push(courseNames[c] || c));
  aoa.push(headerRow);

  // Data Rows
  for (let i = 0; i < n; i++) {
    const row = [];
    row.push(courseList[i]); // Code
    row.push(courseNames[courseList[i]] || courseList[i]); // Name

    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push("—");
      } else if (matrix[i][j] && matrix[i][j].length > 0) {
        row.push(matrix[i][j].length);
      } else {
        row.push(0);
      }
    }
    aoa.push(row);
  }

  // Create Worksheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Create Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Matrix");

  // Save File
  XLSX.writeFile(wb, `Conflict_Matrix_${regName}.xlsx`);
}
