/**
 * Levels page — Step 4: Define Study Levels and link them to Regulations
 */

export function renderLevelsPage(container, appState, onComplete) {
  container.innerHTML = `
    <div class="page-enter">
      <div class="section-header" style="margin-bottom: var(--space-sm);">
        <h1 class="section-title" style="font-size: 1.8rem;">Study Levels & Schedules</h1>
      </div>
      
      <div class="section-header">
        <h2 class="section-title">1. Define Study Levels (المستويات الدراسية)</h2>
        <p class="section-subtitle">
          Define the study levels that will appear as columns in the scheduler. These levels are global and apply across all regulations (e.g., First Year, Second Year).
        </p>
      </div>

      <div class="reg-setup">
        <label for="level-count">Number of Levels (عدد المستويات):</label>
        <input type="number" id="level-count" min="1" max="20"
               value="${appState.levels ? appState.levels.length : 4}" />
        <button class="btn btn-primary" id="btn-generate-levels">Generate Levels</button>
      </div>

      <div id="levels-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-md);"></div>

      <div class="section-header" style="margin-top: var(--space-xl);">
        <h2 class="section-title">2. Define Schedules (تحديد الجداول)</h2>
        <p class="section-subtitle">
          Define the independent schedules exactly as you want them to appear as tabs. Each schedule will be linked to a specific Regulation's conflict matrix.
        </p>
      </div>

      <div class="reg-setup">
        <label for="schedule-count">Number of Schedules (عدد الجداول):</label>
        <input type="number" id="schedule-count" min="1" max="20"
               value="${appState.schedulesDefs ? appState.schedulesDefs.length : (appState.regulations ? appState.regulations.length : 1)}" />
        <button class="btn btn-primary" id="btn-generate-schedules">Generate Schedules</button>
      </div>

      <div id="schedules-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-md);"></div>

      <div class="section-header" style="margin-top: var(--space-xl);">
        <h2 class="section-title">3. Define Periods (تحديد الفترات)</h2>
        <p class="section-subtitle">
          Define the available exam periods (time slots) per day. These periods will be selectable for each level column in the scheduler.
        </p>
      </div>

      <div class="reg-setup">
        <label for="period-count">Number of Periods (عدد الفترات):</label>
        <input type="number" id="period-count" min="1" max="10"
               value="${appState.periodsDefs ? appState.periodsDefs.length : 2}" />
        <button class="btn btn-primary" id="btn-generate-periods">Generate Periods</button>
      </div>

      <div id="periods-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-md);"></div>

      <div id="levels-actions" class="hidden" style="display:none; margin-top: var(--space-xl);">
        <div style="display: flex; justify-content: flex-end; gap: var(--space-md);">
          <button class="btn btn-success btn-lg" id="btn-save-levels">
            ✓ Save Levels & Continue
          </button>
        </div>
      </div>
    </div>
  `;

  const levelCountInput = document.getElementById('level-count');
  const generateLevelsBtn = document.getElementById('btn-generate-levels');
  const levelsContainer = document.getElementById('levels-container');

  const scheduleCountInput = document.getElementById('schedule-count');
  const generateSchedulesBtn = document.getElementById('btn-generate-schedules');
  const schedulesContainer = document.getElementById('schedules-container');

  const periodsCountInput = document.getElementById('period-count');
  const generatePeriodsBtn = document.getElementById('btn-generate-periods');
  const periodsContainer = document.getElementById('periods-container');

  const actionsContainer = document.getElementById('levels-actions');

  function checkActionsVisibility() {
    if (levelsContainer.innerHTML.trim() !== '' && schedulesContainer.innerHTML.trim() !== '' && periodsContainer.innerHTML.trim() !== '') {
      actionsContainer.classList.remove('hidden');
      actionsContainer.style.display = '';
    }
  }

  // Pre-fill existing data if any
  if (appState.levels) {
    renderLevelCards(levelsContainer, appState.levels.length, appState);
  }
  if (appState.schedulesDefs) {
    renderScheduleCards(schedulesContainer, appState.schedulesDefs.length, appState);
  } else if (appState.regulations) {
    renderScheduleCards(schedulesContainer, appState.regulations.length, appState);
  }
  if (appState.periodsDefs) {
    renderPeriodCards(periodsContainer, appState.periodsDefs.length, appState);
  } else {
    renderPeriodCards(periodsContainer, 2, appState);
  }
  checkActionsVisibility();

  generateLevelsBtn.addEventListener('click', () => {
    const count = parseInt(levelCountInput.value) || 4;
    renderLevelCards(levelsContainer, count, appState);
    checkActionsVisibility();
  });

  generateSchedulesBtn.addEventListener('click', () => {
    const count = parseInt(scheduleCountInput.value) || 1;
    renderScheduleCards(schedulesContainer, count, appState);
    checkActionsVisibility();
  });

  generatePeriodsBtn.addEventListener('click', () => {
    const count = parseInt(periodsCountInput.value) || 2;
    renderPeriodCards(periodsContainer, count, appState);
    checkActionsVisibility();
  });

  document.getElementById('btn-save-levels').addEventListener('click', () => {
    const lCount = parseInt(levelCountInput.value) || 0;
    const newLevels = [];

    for (let i = 0; i < lCount; i++) {
      const nameInput = document.getElementById(`level-name-${i}`);
      const name = nameInput ? nameInput.value.trim() : `Level ${i + 1}`;
      newLevels.push({ name });
    }

    const sCount = parseInt(scheduleCountInput.value) || 0;
    const newSchedules = [];

    for (let i = 0; i < sCount; i++) {
      const nameInput = document.getElementById(`schedule-name-${i}`);
      const regSelect = document.getElementById(`schedule-reg-${i}`);

      const name = nameInput ? nameInput.value.trim() : `Schedule ${i + 1}`;
      const regIndex = regSelect ? parseInt(regSelect.value) : 0;
      const regName = appState.regulations[regIndex]?.name || 'Unknown Regulation';

      newSchedules.push({
        id: i,
        name,
        regIndex,
        regName
      });
    }

    const pCount = parseInt(periodsCountInput.value) || 0;
    const newPeriods = [];
    for (let i = 0; i < pCount; i++) {
      const nameInput = document.getElementById(`period-name-${i}`);
      const name = nameInput ? nameInput.value.trim() : `Period ${i + 1}`;
      newPeriods.push({ name });
    }

    appState.levels = newLevels;
    appState.schedulesDefs = newSchedules;
    appState.periodsDefs = newPeriods;
    onComplete();
  });
}

function renderLevelCards(container, count, appState) {
  let html = '';

  for (let i = 0; i < count; i++) {
    const existingName = appState.levels && appState.levels[i] ? appState.levels[i].name : `Level ${i + 1}`;

    html += `
            <div class="reg-card" style="margin-bottom: 0;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="level-name-${i}">Level Name</label>
                    <input type="text" id="level-name-${i}" class="form-input" value="${existingName}" placeholder="e.g. 1st Year Accounting" />
                </div>
            </div>
        `;
  }

  container.innerHTML = html;
}

function renderScheduleCards(container, count, appState) {
  let html = '';

  for (let i = 0; i < count; i++) {
    const defaultName = appState.regulations && appState.regulations[i] ? `جدول ${appState.regulations[i].name}` : `Schedule ${i + 1}`;
    const existingName = appState.schedulesDefs && appState.schedulesDefs[i] ? appState.schedulesDefs[i].name : defaultName;
    const existingReg = appState.schedulesDefs && appState.schedulesDefs[i] ? appState.schedulesDefs[i].regIndex : (appState.regulations && appState.regulations[i] ? i : 0);

    const customRegOptions = (appState.regulations || []).map((reg, idx) =>
      `<option value="${idx}" ${existingReg === idx ? 'selected' : ''}>${reg.name}</option>`
    ).join('');

    html += `
            <div class="reg-card" style="margin-bottom: 0;">
                <div class="form-group">
                    <label class="form-label" for="schedule-name-${i}">Schedule Name</label>
                    <input type="text" id="schedule-name-${i}" class="form-input" value="${existingName}" placeholder="e.g. Arabic Regulation Schedule" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="schedule-reg-${i}">Linked Regulation Matrix</label>
                    <select id="schedule-reg-${i}" class="form-select">
                        ${customRegOptions}
                    </select>
                </div>
            </div>
        `;
  }

  container.innerHTML = html;
}

function renderPeriodCards(container, count, appState) {
  const defaultPeriods = ['09:00 - 12:00', '01:00 - 04:00'];
  let html = '';

  for (let i = 0; i < count; i++) {
    const existingName = appState.periodsDefs && appState.periodsDefs[i]
      ? appState.periodsDefs[i].name
      : (defaultPeriods[i] || `Period ${i + 1}`);

    html += `
            <div class="reg-card" style="margin-bottom: 0;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" for="period-name-${i}">Period ${i + 1}</label>
                    <input type="text" id="period-name-${i}" class="form-input" value="${existingName}" placeholder="e.g. 09:00 - 12:00" />
                </div>
            </div>
        `;
  }

  container.innerHTML = html;
}
