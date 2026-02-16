import { getAnimationFrame } from './engine.js';
import { exportStandaloneSvg } from './exportSvg.js';
import { getPatternCells } from './patterns.js';
import {
  applyPatternToState,
  createPatternFromState,
  downloadProject,
  isValidProject,
  loadProject,
  normalizeProject,
  saveProject
} from './projectStore.js';
import { createRenderer } from './renderer.js';
import {
  createInitialState,
  createZeroDelayMatrix,
  fromBooleanGrid,
  parseCellKey,
  sanitizeDelayMatrix,
  toBooleanGrid,
  toggleCell
} from './state.js';

const state = createInitialState();
const miniPreviews = [];
let draggedPatternId = null;

const ui = {
  svg: document.querySelector('#stage'),
  fpsSlider: document.querySelector('#fpsSlider'),
  fpsValue: document.querySelector('#fpsValue'),
  styleSelect: document.querySelector('#styleSelect'),
  colorInput: document.querySelector('#colorInput'),
  delayStepInput: document.querySelector('#delayStepInput'),
  applyDelayBtn: document.querySelector('#applyDelayBtn'),
  patternSelect: document.querySelector('#patternSelect'),
  directionGroup: document.querySelector('#directionGroup'),
  directionButtons: document.querySelectorAll('[data-direction]'),
  previewToggle: document.querySelector('#previewToggle'),
  captureBtn: document.querySelector('#captureBtn'),
  savePatternBtn: document.querySelector('#savePatternBtn'),
  duplicateBtn: document.querySelector('#duplicateBtn'),
  deletePatternBtn: document.querySelector('#deletePatternBtn'),
  exportBtn: document.querySelector('#exportBtn'),
  exportSvgBtn: document.querySelector('#exportSvgBtn'),
  exportOutput: document.querySelector('#exportOutput'),
  patternList: document.querySelector('#patternList'),
  exportProjectBtn: document.querySelector('#exportProjectBtn'),
  importProjectBtn: document.querySelector('#importProjectBtn'),
  importProjectInput: document.querySelector('#importProjectInput')
};

const renderer = createRenderer(ui.svg, state, (row, col) => {
  toggleCell(state, row, col);
  autoUpdateSelectedPattern();
});

state.patternStore = loadProject();
syncControlsFromState();
renderPatternList();
syncPreviewButton();

ui.fpsSlider.addEventListener('input', (event) => {
  state.fps = Number(event.target.value);
  ui.fpsValue.textContent = String(state.fps);
  autoUpdateSelectedPattern();
});

ui.styleSelect.addEventListener('change', (event) => {
  state.animationStyle = event.target.value;
  autoUpdateSelectedPattern();
});

ui.colorInput.addEventListener('input', (event) => {
  state.color = event.target.value;
  autoUpdateSelectedPattern();
});

ui.applyDelayBtn.addEventListener('click', () => {
  const stepMs = Number(ui.delayStepInput.value);
  if (!Number.isFinite(stepMs) || stepMs < 0) {
    ui.exportOutput.textContent = 'Delay Step must be a non-negative number.';
    return;
  }

  distributeDelays(stepMs);
  state.previewRunning = true;
  syncPreviewButton();
  autoUpdateSelectedPattern();
});

ui.patternSelect.addEventListener('change', (event) => {
  state.pattern = event.target.value;
  if (state.pattern !== 'directional') {
    state.direction = null;
  } else if (!state.direction) {
    state.direction = 'right';
  }

  state.previewRunning = true;
  syncControlsFromState();
  syncPreviewButton();
  autoUpdateSelectedPattern();
});

ui.directionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.direction = button.dataset.direction;
    state.previewRunning = true;
    syncDirectionButtons();
    syncPreviewButton();
    autoUpdateSelectedPattern();
  });
});

ui.previewToggle.addEventListener('click', () => {
  state.previewRunning = !state.previewRunning;
  syncPreviewButton();
});

ui.captureBtn.addEventListener('click', () => {
  const newPattern = createPatternFromState(state);
  newPattern.name = getUniqueName(newPattern.name);
  state.patternStore.push(newPattern);
  state.selectedPatternId = newPattern.id;
  persistAndRender();
});

ui.savePatternBtn.addEventListener('click', () => {
  const pattern = findSelectedPattern();
  if (!pattern) {
    ui.exportOutput.textContent = 'Select a pattern first to save changes.';
    return;
  }

  overwritePattern(pattern.id, captureCurrentPatternState(pattern));
  ui.exportOutput.textContent = 'Pattern updated.';
});

ui.duplicateBtn.addEventListener('click', () => {
  const pattern = findSelectedPattern();
  if (!pattern) {
    ui.exportOutput.textContent = 'Select a pattern to duplicate.';
    return;
  }

  const duplicate = {
    ...pattern,
    cellDelays: sanitizeDelayMatrix(pattern.cellDelays, pattern.gridSize),
    id: crypto.randomUUID ? crypto.randomUUID() : `pattern-${Date.now()}`,
    name: getUniqueName(`${pattern.name} Copy`)
  };

  state.patternStore.push(duplicate);
  state.selectedPatternId = duplicate.id;
  persistAndRender();
});

ui.deletePatternBtn.addEventListener('click', () => {
  const pattern = findSelectedPattern();
  if (!pattern) {
    ui.exportOutput.textContent = 'Select a pattern to delete.';
    return;
  }

  const confirmed = window.confirm(`Delete pattern "${pattern.name}"?`);
  if (!confirmed) {
    return;
  }

  const index = state.patternStore.findIndex((item) => item.id === pattern.id);
  state.patternStore.splice(index, 1);

  if (state.selectedPatternId === pattern.id) {
    const fallback = state.patternStore[index] ?? state.patternStore[index - 1] ?? null;
    if (fallback) {
      applyPatternToState(state, fallback);
    } else {
      clearScene();
    }
  }

  persistAndRender();
});

ui.exportBtn.addEventListener('click', () => {
  const payload = {
    gridSize: state.gridSize,
    activeCells: [...state.activeCells].map((key) => parseCellKey(key)),
    cellDelays: state.cellDelays,
    speed: state.fps,
    animationStyle: state.animationStyle,
    selectedPattern: state.pattern,
    direction: state.direction,
    color: state.color
  };

  ui.exportOutput.textContent = JSON.stringify(payload, null, 2);
});

ui.exportProjectBtn.addEventListener('click', () => {
  downloadProject(state.patternStore);
});

ui.exportSvgBtn.addEventListener('click', () => {
  exportStandaloneSvg(state);
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

    state.patternStore = normalizeProject(parsed);
    state.selectedPatternId = null;
    if (state.patternStore[0]) {
      applyPatternToState(state, state.patternStore[0]);
    } else {
      clearScene();
    }
    persistAndRender();
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
  renderMiniPreviews(state.timeMs);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

function renderPatternList() {
  ui.patternList.innerHTML = '';
  miniPreviews.length = 0;

  if (state.patternStore.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'pattern-empty';
    empty.textContent = 'No saved patterns yet.';
    ui.patternList.appendChild(empty);
    syncActionButtons();
    return;
  }

  for (const pattern of state.patternStore) {
    const item = document.createElement('li');
    item.className = 'pattern-row';
    item.draggable = true;
    item.dataset.patternId = pattern.id;

    if (pattern.id === state.selectedPatternId) {
      item.classList.add('active');
    }

    item.addEventListener('dragstart', () => {
      draggedPatternId = pattern.id;
    });

    item.addEventListener('dragend', () => {
      draggedPatternId = null;
    });

    item.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    item.addEventListener('drop', (event) => {
      event.preventDefault();
      if (!draggedPatternId || draggedPatternId === pattern.id) {
        return;
      }
      movePattern(draggedPatternId, pattern.id);
    });

    const previewSvg = createPatternPreviewSvg(pattern);
    const button = document.createElement('button');
    button.className = 'pattern-item';

    const directionLabel = pattern.mode === 'directional' ? ` · ${pattern.direction}` : '';
    button.textContent = `${pattern.name} · ${pattern.mode}${directionLabel} · ${pattern.animationStyle} · ${pattern.speed} FPS`;

    button.addEventListener('click', () => {
      applyPatternToState(state, pattern);
      syncControlsFromState();
      syncPreviewButton();
      renderPatternList();
    });

    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.textContent = '↕';

    item.append(previewSvg, button, handle);
    ui.patternList.appendChild(item);
  }

  syncActionButtons();
}

function createPatternPreviewSvg(pattern) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 70 70');
  svg.classList.add('pattern-preview');

  const grid = pattern.gridSize;
  const cell = 11;
  const gap = 2;
  const offset = (70 - (grid * cell + (grid - 1) * gap)) / 2;
  const activeSet = fromBooleanGrid(pattern.activeCells, pattern.gridSize);
  const rectMap = new Map();

  for (let row = 0; row < grid; row += 1) {
    for (let col = 0; col < grid; col += 1) {
      const key = `${row}:${col}`;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(offset + col * (cell + gap)));
      rect.setAttribute('y', String(offset + row * (cell + gap)));
      rect.setAttribute('width', String(cell));
      rect.setAttribute('height', String(cell));
      rect.setAttribute('rx', '2');
      rect.setAttribute('fill', pattern.color);
      rect.setAttribute('fill-opacity', activeSet.has(key) ? '1' : '0');
      svg.appendChild(rect);
      rectMap.set(key, rect);
    }
  }

  miniPreviews.push({
    pattern,
    activeSet,
    rectMap,
    cellDelays: sanitizeDelayMatrix(pattern.cellDelays, pattern.gridSize)
  });
  return svg;
}

function renderMiniPreviews(timeMs) {
  for (const preview of miniPreviews) {
    const frame = getAnimationFrame({
      activeCells: preview.activeSet,
      cellDelays: preview.cellDelays,
      previewRunning: true,
      pattern: preview.pattern.mode,
      direction: preview.pattern.direction,
      gridSize: preview.pattern.gridSize,
      fps: Math.min(preview.pattern.speed, 18),
      animationStyle: preview.pattern.animationStyle,
      timeMs
    });

    for (const [key, rect] of preview.rectMap.entries()) {
      rect.setAttribute('fill', preview.pattern.color);
      rect.setAttribute('fill-opacity', String(frame[key] ?? 0));
    }
  }
}

function syncControlsFromState() {
  ui.fpsSlider.value = String(state.fps);
  ui.fpsValue.textContent = String(state.fps);
  ui.styleSelect.value = state.animationStyle;
  ui.patternSelect.value = state.pattern;
  ui.colorInput.value = state.color;
  syncDirectionVisibility();
  syncDirectionButtons();
  syncActionButtons();
}

function syncDirectionVisibility() {
  ui.directionGroup.hidden = state.pattern !== 'directional';
}

function syncDirectionButtons() {
  ui.directionButtons.forEach((button) => {
    const isActive = state.direction === button.dataset.direction;
    button.classList.toggle('active', isActive);
  });
}

function syncPreviewButton() {
  ui.previewToggle.textContent = state.previewRunning ? 'Pause Preview' : 'Start Preview';
}

function syncActionButtons() {
  const hasSelection = Boolean(state.selectedPatternId);
  ui.savePatternBtn.disabled = !hasSelection;
  ui.duplicateBtn.disabled = !hasSelection;
  ui.deletePatternBtn.disabled = !hasSelection;
}

function movePattern(dragId, targetId) {
  const dragIndex = state.patternStore.findIndex((pattern) => pattern.id === dragId);
  const targetIndex = state.patternStore.findIndex((pattern) => pattern.id === targetId);
  if (dragIndex < 0 || targetIndex < 0) {
    return;
  }

  const [moved] = state.patternStore.splice(dragIndex, 1);
  state.patternStore.splice(targetIndex, 0, moved);
  persistAndRender();
}

function autoUpdateSelectedPattern() {
  const pattern = findSelectedPattern();
  if (!pattern) {
    return;
  }

  overwritePattern(pattern.id, captureCurrentPatternState(pattern));
}

function overwritePattern(patternId, patch) {
  const index = state.patternStore.findIndex((pattern) => pattern.id === patternId);
  if (index < 0) {
    return;
  }

  state.patternStore[index] = {
    ...state.patternStore[index],
    ...patch
  };
  saveProject(state.patternStore);
  renderPatternList();
}

function captureCurrentPatternState(pattern) {
  return {
    name: pattern.name,
    activeCells: toBooleanGrid(state.activeCells, state.gridSize),
    cellDelays: sanitizeDelayMatrix(state.cellDelays, state.gridSize),
    mode: state.pattern,
    direction: state.pattern === 'directional' ? state.direction ?? 'right' : null,
    speed: state.fps,
    animationStyle: state.animationStyle,
    color: state.color
  };
}

function findSelectedPattern() {
  return state.patternStore.find((pattern) => pattern.id === state.selectedPatternId) ?? null;
}

function clearScene() {
  state.activeCells = new Set();
  state.cellDelays = createZeroDelayMatrix(state.gridSize);
  state.selectedPatternId = null;
  syncActionButtons();
}

function persistAndRender() {
  saveProject(state.patternStore);
  renderPatternList();
  syncControlsFromState();
}

function getUniqueName(baseName) {
  const used = new Set(state.patternStore.map((pattern) => pattern.name));
  if (!used.has(baseName)) {
    return baseName;
  }

  let i = 2;
  while (used.has(`${baseName} ${i}`)) {
    i += 1;
  }
  return `${baseName} ${i}`;
}

function distributeDelays(stepMs) {
  state.cellDelays = createZeroDelayMatrix(state.gridSize);
  const ordered = getPatternCells(state.pattern, state.activeCells, state.gridSize, state.direction);

  for (let i = 0; i < ordered.length; i += 1) {
    const cell = ordered[i];
    state.cellDelays[cell.row][cell.col] = i * stepMs;
  }
}
