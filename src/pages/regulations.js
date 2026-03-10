/**
 * Regulations page — Step 3: Define regulations and assign sheets
 */
import { buildRegulations } from '../regulation.js';

export function renderRegulationsPage(container, appState, onComplete) {
  const sheets = appState.parsedSheets;

  container.innerHTML = `
    <div class="page-enter">
      <div class="section-header">
        <h1 class="section-title">Define Regulations (اللوائح)</h1>
        <p class="section-subtitle">
          How many regulations do you have? Assign sheets to each regulation.
          Courses with the same code across sheets in the same regulation will be merged.
        </p>
      </div>

      <div class="reg-setup">
        <label for="reg-count">Number of Regulations (عدد اللوائح):</label>
        <input type="number" id="reg-count" min="1" max="10"
               value="${appState.regulationCount || 2}" />
        <button class="btn btn-primary" id="btn-generate-regs">Generate</button>
      </div>

      <div id="regulations-container"></div>

      <div id="merge-actions" class="hidden" style="display:none; margin-top: var(--space-xl);">
        <div style="display: flex; justify-content: flex-end; gap: var(--space-md);">
          <button class="btn btn-success btn-lg" id="btn-build-regulations">
            ✓ Build Regulations & Continue
          </button>
        </div>
      </div>
    </div>
  `;

  const regCountInput = document.getElementById('reg-count');
  const generateBtn = document.getElementById('btn-generate-regs');
  const regsContainer = document.getElementById('regulations-container');
  const mergeActions = document.getElementById('merge-actions');

  generateBtn.addEventListener('click', () => {
    const count = parseInt(regCountInput.value) || 2;
    appState.regulationCount = count;
    renderRegulationCards(regsContainer, count, sheets);
    mergeActions.classList.remove('hidden');
    mergeActions.style.display = '';
  });

  // If we already have regulation count, generate cards on load
  if (appState.regulationCount) {
    renderRegulationCards(regsContainer, appState.regulationCount, sheets);
    mergeActions.classList.remove('hidden');
    mergeActions.style.display = '';
  }

  document.getElementById('btn-build-regulations').addEventListener('click', () => {
    // Collect regulation definitions
    const count = appState.regulationCount || parseInt(regCountInput.value);
    const regulations = [];

    for (let r = 0; r < count; r++) {
      const checkboxes = document.querySelectorAll(`input[data-reg="${r}"]`);
      const sheetIndices = [];

      checkboxes.forEach(cb => {
        if (cb.checked) {
          sheetIndices.push(parseInt(cb.dataset.sheetIndex));
        }
      });

      const nameInput = document.querySelector(`#reg-name-${r}`);
      const name = nameInput ? nameInput.value.trim() : `Regulation ${r + 1}`;

      regulations.push({ name, sheetIndices });
    }

    // Validate: check all regulations have at least one sheet
    const emptyRegs = regulations.filter(r => r.sheetIndices.length === 0);
    if (emptyRegs.length > 0) {
      alert(`Please assign at least one sheet to each regulation.\n\nEmpty: ${emptyRegs.map(r => r.name).join(', ')}`);
      return;
    }

    // Build regulations (merge courses)
    const builtRegs = buildRegulations(sheets, regulations);
    appState.regulations = builtRegs;
    appState.regulationDefs = regulations;

    onComplete();
  });
}

function renderRegulationCards(container, count, sheets) {
  let html = '';

  for (let r = 0; r < count; r++) {
    html += `
      <div class="reg-card">
        <div class="reg-card-header">
          <div class="reg-card-title">
            <span class="reg-number">${r + 1}</span>
            <input type="text" id="reg-name-${r}" class="form-input"
                   value="Regulation ${r + 1}"
                   placeholder="Regulation name"
                   style="max-width: 300px; font-weight: 600;" />
          </div>
        </div>

        <div class="form-label">Select sheets for this regulation:</div>
        <div class="sheet-checkboxes">
          ${sheets.map((s, i) => `
            <div class="sheet-checkbox" id="sheet-cb-${r}-${i}">
              <input type="checkbox" id="cb-${r}-${i}"
                     data-reg="${r}" data-sheet-index="${i}" />
              <label for="cb-${r}-${i}">
                <strong>${s.sheetName}</strong>
                <span style="color: var(--text-muted); margin-left: 8px;">
                  (${s.students.size} students, ${Object.keys(s.courseNames).length} courses)
                </span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Add interactive checkbox styling
  container.querySelectorAll('.sheet-checkbox input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const wrapper = cb.closest('.sheet-checkbox');
      if (cb.checked) {
        wrapper.classList.add('checked');
      } else {
        wrapper.classList.remove('checked');
      }
    });
  });
}
