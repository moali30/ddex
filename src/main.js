/**
 * Main application entry point — SPA with step-based navigation
 */
import './style.css';
import { renderUploadPage } from './pages/upload.js';
import { renderPreviewPage } from './pages/preview.js';
import { renderRegulationsPage } from './pages/regulations.js';
import { renderMatrixPage } from './pages/matrix.js';
import { renderLevelsPage } from './pages/levels.js';
import { renderInfoPage } from './pages/info.js';
import { renderSchedulerPage } from './pages/scheduler.js';
import { renderPrintPage } from './pages/print.js';
import { renderConflictSearchPage } from './pages/conflict_search.js';

// Application state
const appState = {
    currentStep: 'upload',
    parsedSheets: null,
    transformedSheets: null,
    fileName: null,
    regulationCount: null,
    regulationDefs: null,
    regulations: null,
    levels: null,
    matrices: null,
};

// Step order
const STEPS = ['upload', 'preview', 'regulations', 'levels', 'matrix', 'info', 'conflict_search', 'scheduler', 'print'];

// Initialize the app
function init() {
    setupNavigation();
    navigateTo('upload');
}

// Setup navigation clicks
function setupNavigation() {
    document.querySelectorAll('.nav-step').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = btn.dataset.step;
            if (!btn.disabled || btn.classList.contains('completed')) {
                navigateTo(step);
            }
        });
    });
}

// Navigate to a step
function navigateTo(step) {
    appState.currentStep = step;
    updateNavState(step);

    // Update Page Title
    const stepTitles = {
        'upload': 'Upload Data',
        'preview': 'Preview Data',
        'regulations': 'Regulations Settings',
        'levels': 'Study Levels',
        'matrix': 'Global Conflict Matrix',
        'info': 'Dashboard',
        'conflict_search': 'بحث التعارضات',
        'scheduler': 'Smart Scheduler',
        'print': 'Print & Export'
    };
    document.getElementById('current-page-title').innerText = stepTitles[step] || 'Exam Schedule';

    const container = document.getElementById('page-container');
    container.innerHTML = ''; // Clear

    switch (step) {
        case 'upload':
            renderUploadPage(container, appState, () => navigateTo('preview'));
            break;
        case 'preview':
            renderPreviewPage(container, appState, () => navigateTo('regulations'));
            break;
        case 'regulations':
            renderRegulationsPage(container, appState, () => navigateTo('levels'));
            break;
        case 'levels':
            renderLevelsPage(container, appState, () => navigateTo('matrix'));
            break;
        case 'matrix':
            renderMatrixPage(container, appState, () => navigateTo('info'));
            break;
        case 'info':
            renderInfoPage(container, appState, () => navigateTo('conflict_search'));
            break;
        case 'conflict_search':
            renderConflictSearchPage(container, appState, () => navigateTo('scheduler'));
            break;
        case 'scheduler':
            renderSchedulerPage(container, appState, () => navigateTo('print'));
            break;
        case 'print':
            renderPrintPage(container, appState, (action) => {
                if (action === 'back') navigateTo('scheduler');
            });
            break;
    }
}

// Update navigation button states
function updateNavState(currentStep) {
    const currentIndex = STEPS.indexOf(currentStep);

    document.querySelectorAll('.nav-step').forEach(btn => {
        const stepIndex = STEPS.indexOf(btn.dataset.step);

        btn.classList.remove('active', 'completed');
        btn.disabled = true;

        if (stepIndex < currentIndex) {
            btn.classList.add('completed');
            btn.disabled = false;
        } else if (stepIndex === currentIndex) {
            btn.classList.add('active');
            btn.disabled = false;
        } else {
            // Future steps: keep disabled unless data exists for them
            if (canNavigateTo(btn.dataset.step)) {
                btn.disabled = false;
            }
        }
    });
}

// Check if we can navigate to a step (has required data)
function canNavigateTo(step) {
    switch (step) {
        case 'upload': return true;
        case 'preview': return appState.parsedSheets !== null;
        case 'regulations': return appState.transformedSheets !== null;
        case 'levels': return appState.regulations !== null;
        case 'matrix': return appState.levels !== null;
        case 'info': return appState.matrices !== null;
        case 'conflict_search': return appState.matrices !== null; // Needs conflicts to search
        case 'scheduler': return appState.matrices !== null; // Scheduler needs conflict matrix
        case 'print': return appState.scheduler && appState.scheduler.tabs;
        default: return false;
    }
}

// Boot the app
init();
