/**
 * Dashboard page — Step 5: Dashboard with all useful info for exam schedule building
 * Shows a separate section per regulation with its own courses and conflict stats.
 */
export function renderInfoPage(container, appState, onComplete) {
  const regulations = appState.regulations;
  const matrices = appState.matrices || [];

  // Summary stats
  const totalStudents = new Set();
  for (const reg of regulations) {
    for (const students of reg.courses.values()) {
      for (const s of students) totalStudents.add(s);
    }
  }

  // Total unique courses across all regs
  const allCourseCodes = new Set();
  for (const reg of regulations) {
    for (const code of reg.courses.keys()) allCourseCodes.add(code);
  }

  // Build per-regulation sections
  const regSectionsHtml = matrices.map((m, mIdx) => {
    const n = m.courseList.length;
    let conflictPairs = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (m.matrix[i][j] && m.matrix[i][j].length > 0) conflictPairs++;
      }
    }

    // Get student counts from the regulation
    const reg = regulations[m.regIndex];
    const courseInfoList = m.courseList.map((subCode, i) => {
      let conflictCount = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const shared = m.matrix[Math.min(i, j)][Math.max(i, j)];
        if (shared && shared.length > 0) conflictCount++;
      }
      const studentCount = reg && reg.courses.has(subCode) ? reg.courses.get(subCode).size : 0;
      return {
        subCode,
        courseName: m.courseNames[subCode] || subCode,
        studentCount,
        conflictCount
      };
    });
    courseInfoList.sort((a, b) => b.studentCount - a.studentCount);

    const regStudentTotal = reg ? (() => {
      const s = new Set();
      for (const students of reg.courses.values()) {
        for (const st of students) s.add(st);
      }
      return s.size;
    })() : 0;

    return `
      <div class="glass-card" style="margin-top: var(--space-lg);">
        <h2 style="font-size: 1.2rem; font-weight: 700; margin-bottom: var(--space-md); color: var(--text-primary);">
          📋 ${m.regName}
        </h2>
        <div class="stats-grid" style="margin-bottom: var(--space-md);">
          <div class="stat-card">
            <div class="stat-value">${regStudentTotal}</div>
            <div class="stat-label">Students</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${n}</div>
            <div class="stat-label">Courses</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--accent-red);">${conflictPairs}</div>
            <div class="stat-label">Conflict Pairs</div>
          </div>
        </div>
        <div class="table-wrapper" style="max-height: 400px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Course</th>
                <th>Students</th>
                <th>Conflicts</th>
              </tr>
            </thead>
            <tbody>
              ${courseInfoList.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td class="cell-header" style="min-width: 220px;">
                    <div style="font-weight: 700;">${c.courseName}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 400;">${c.subCode}</div>
                  </td>
                  <td><span class="badge badge-green">${c.studentCount}</span></td>
                  <td>
                    <span class="badge ${c.conflictCount > 5 ? 'badge-red' : c.conflictCount > 0 ? 'badge-amber' : 'badge-green'}">
                      ${c.conflictCount}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="page-enter">
      <div class="section-header">
        <h1 class="section-title">Information Dashboard</h1>
        <p class="section-subtitle">Comprehensive overview — separated by regulation</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalStudents.size}</div>
          <div class="stat-label">Total Unique Students</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${allCourseCodes.size}</div>
          <div class="stat-label">Total Unique Courses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${regulations.length}</div>
          <div class="stat-label">Regulations</div>
        </div>
      </div>

      ${regSectionsHtml}
      
      <div style="display: flex; justify-content: flex-end; margin-top: var(--space-xl);">
        <button class="btn btn-primary btn-lg" id="btn-next-scheduler">
          Continue to Smart Scheduler →
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-next-scheduler').addEventListener('click', () => {
    onComplete();
  });
}
