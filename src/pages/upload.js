/**
 * Upload page — Step 1: File upload with drag & drop
 */
import { parseExcelFile } from '../parser.js';

export function renderUploadPage(container, appState, onComplete) {
    container.innerHTML = `
    <div class="page-enter">
      <div class="section-header text-center">
        <h1 class="section-title">Upload Student Registration Data</h1>
        <p class="section-subtitle">Upload your Excel file (.xlsx) containing student registration sheets</p>
      </div>

      <div class="glass-card" style="max-width: 700px; margin: 0 auto;">
        <div class="upload-zone" id="upload-zone">
          <div class="upload-icon">📁</div>
          <div class="upload-title">Drop your Excel file here</div>
          <div class="upload-subtitle">or click to browse • Supports .xlsx files</div>
          <input type="file" id="file-input" accept=".xlsx,.xls" style="display:none" />
        </div>

        <div id="upload-result" class="hidden"></div>
      </div>
    </div>
  `;

    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const resultDiv = document.getElementById('upload-result');

    // Click to upload
    zone.addEventListener('click', () => fileInput.click());

    // Drag & drop
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) handleFile(file);
    });

    function handleFile(file) {
        zone.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="mt-1" style="color: var(--text-secondary);">Parsing ${file.name}...</div>
    `;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const buffer = e.target.result;
                const sheets = parseExcelFile(buffer);

                appState.parsedSheets = sheets;
                appState.fileName = file.name;

                // Show success
                zone.classList.add('hidden');
                resultDiv.classList.remove('hidden');
                resultDiv.innerHTML = `
          <div class="file-success">
            <div class="file-success-icon">✅</div>
            <div>
              <strong style="font-size: 1.2rem;">File parsed successfully!</strong>
            </div>
            <div class="file-info">
              <strong>${file.name}</strong> •
              <span class="sheet-count">📄 ${sheets.length} sheets found</span>
            </div>
            <div style="margin-top: var(--space-md);">
              ${sheets.map((s, i) => `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span class="badge badge-primary">${i + 1}</span>
                  <span style="color: var(--text-secondary); font-size: 0.9rem;">${s.sheetName}</span>
                  <span class="badge badge-green">${s.students.size} students</span>
                  <span class="badge badge-amber">${Object.keys(s.courseNames).length} courses</span>
                </div>
              `).join('')}
            </div>
            <button class="btn btn-primary btn-lg mt-2" id="btn-next-preview">
              Continue to Preview →
            </button>
          </div>
        `;

                document.getElementById('btn-next-preview').addEventListener('click', () => {
                    onComplete();
                });
            } catch (err) {
                zone.classList.remove('hidden');
                zone.innerHTML = `
          <div class="upload-icon">❌</div>
          <div class="upload-title" style="color: var(--accent-red);">Parsing Error</div>
          <div class="upload-subtitle">${err.message}</div>
        `;
                console.error('Parse error:', err);
            }
        };

        reader.readAsArrayBuffer(file);
    }
}
