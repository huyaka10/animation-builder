import { getAnimationFrame } from './engine.js';
import {
  applyPatternToState,
  createPatternFromState,
  downloadProject,
  isValidProject,
  loadProject,
  saveProject
} from './projectStore.js';
import { createRenderer } from './renderer.js';
import { createInitialState, parseCellKey, toggleCell } from './state.js';

const state = createInitialState();

const ui = {
  svg: document.querySelector('#stage'),
  fpsSlider: document.querySelector('#fpsSlider'),
  fpsValue: document.querySelector('#fpsValue'),
  styleSelect: document.querySelector('#styleSelect'),
  patternSelect: document.querySelector('#patternSelect'),
  previewToggle: document.querySelector('#previewToggle'),
  captureBtn: document.querySelector('#captureBtn'),
  exportBtn: document.querySelector('#exportBtn'),
  exportOutput: document.querySelector('#exportOutput'),
  patternList: document.querySelector('#patternList'),
  exportProjectBtn: document.querySelector('#exportProjectBtn'),
  importProjectBtn: document.querySelector('#importProjectBtn'),
  importProjectInput: document.querySelector('#importProjectInput')
};

const renderer = createRenderer(ui.svg, state, (row, col) => {
  toggleCell(state, row, col);
});

state.patternStore = loadProject();
renderPatternList();

ui.fpsSlider.addEventListener('input', (event) => {
  state.fps = Number(event.target.value);
  ui.fpsValue.textContent = String(state.fps);
});

ui.styleSelect.addEventListener('change', (event) => {
  state.animationStyle = event.target.value;
});

ui.patternSelect.addEventListener('change', (event) => {
  state.pattern = event.target.value;
});

ui.previewToggle.addEventListener('click', () => {
  state.previewRunning = !state.previewRunning;
  syncPreviewButton();
});

ui.captureBtn.addEventListener('click', () => {
  const newPattern = createPatternFromState(state);
  state.patternStore.push(newPattern);
  state.selectedPatternId = newPattern.id;
  saveProject(state.patternStore);
  renderPatternList();
});

ui.exportBtn.addEventListener('click', () => {
  const payload = {
    gridSize: state.gridSize,
    activeCells: [...state.activeCells].map((key) => parseCellKey(key)),
    speed: state.fps,
    animationStyle: state.animationStyle,
    selectedPattern: state.pattern
  };

  ui.exportOutput.textContent = JSON.stringify(payload, null, 2);
});

ui.exportProjectBtn.addEventListener('click', () => {
  downloadProject(state.patternStore);
});

ui.importProjectBtn.addEventListener('click', () => {
  ui.importProjectInput.click();
});

ui.importProjectInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!isValidProject(parsed)) {
      ui.exportOutput.textContent = 'Import failed: invalid project structure.';
      return;
    }

    state.patternStore = parsed;
    state.selectedPatternId = null;
    saveProject(state.patternStore);
    renderPatternList();
    ui.exportOutput.textContent = 'Project imported successfully.';
  } catch {
    ui.exportOutput.textContent = 'Import failed: cannot parse JSON file.';
  } finally {
    ui.importProjectInput.value = '';
  }
});

let last = performance.now();
function loop(now) {
  const delta = now - last;
  last = now;
  state.timeMs += delta;
  renderer.render(getAnimationFrame(state));
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

function renderPatternList() {
  ui.patternList.innerHTML = '';

  if (state.patternStore.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'pattern-empty';
    empty.textContent = 'No saved patterns yet.';
    ui.patternList.appendChild(empty);
    return;
  }

  for (const pattern of state.patternStore) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'pattern-item';
    if (pattern.id === state.selectedPatternId) {
      button.classList.add('active');
    }

    button.textContent = `${pattern.name} · ${pattern.animationStyle} · ${pattern.speed} FPS`;
    button.addEventListener('click', () => {
      applyPatternToState(state, pattern);
      syncControlsFromState();
      syncPreviewButton();
      renderPatternList();
    });

    item.appendChild(button);
    ui.patternList.appendChild(item);
  }
}

function syncControlsFromState() {
  ui.fpsSlider.value = String(state.fps);
  ui.fpsValue.textContent = String(state.fps);
  ui.styleSelect.value = state.animationStyle;
  ui.patternSelect.value = state.pattern;
}

function syncPreviewButton() {
  ui.previewToggle.textContent = state.previewRunning ? 'Pause Preview' : 'Start Preview';
}
