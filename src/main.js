import {
  addFrameAfterActive,
  cloneAnimation,
  createInitialState,
  createPresetFromAnimation,
  deleteActiveFrame,
  duplicateActiveFrame,
  moveFrame,
  resetPlayback,
  toggleCellInActiveFrame
} from './frameStore.js';
import { advancePreview } from './engine.js';
import { exportAnimationJson, exportStandaloneSvg, importAnimationJson } from './exportModule.js';
import { loadProject, saveProject } from './projectStore.js';
import { createRenderer } from './renderer.js';
import { renderTimeline } from './timelineUI.js';

const state = createInitialState();
const persisted = loadProject();
if (persisted) {
  state.animation = persisted.animation;
  state.presets = persisted.presets;
}
resetPlayback(state);

let draggedFrameIndex = null;

const ui = {
  stage: document.querySelector('#stage'),
  timelineList: document.querySelector('#timelineList'),
  addFrameBtn: document.querySelector('#addFrameBtn'),
  duplicateFrameBtn: document.querySelector('#duplicateFrameBtn'),
  deleteFrameBtn: document.querySelector('#deleteFrameBtn'),
  frameInfo: document.querySelector('#frameInfo'),
  fpsSlider: document.querySelector('#fpsSlider'),
  fpsValue: document.querySelector('#fpsValue'),
  styleSelect: document.querySelector('#styleSelect'),
  colorInput: document.querySelector('#colorInput'),
  previewToggle: document.querySelector('#previewToggle'),
  capturePatternBtn: document.querySelector('#capturePatternBtn'),
  presetList: document.querySelector('#presetList'),
  exportJsonBtn: document.querySelector('#exportJsonBtn'),
  importJsonBtn: document.querySelector('#importJsonBtn'),
  importJsonInput: document.querySelector('#importJsonInput'),
  exportSvgBtn: document.querySelector('#exportSvgBtn'),
  exportOutput: document.querySelector('#exportOutput')
};

const renderer = createRenderer(ui.stage, state, (row, col) => {
  toggleCellInActiveFrame(state, row, col);
  persist();
});

bindControls();
refreshUi();

let last = performance.now();
function loop(now) {
  const delta = now - last;
  last = now;
  const displayFrame = advancePreview(state, delta);
  renderer.render(displayFrame);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function bindControls() {
  ui.addFrameBtn.addEventListener('click', () => {
    addFrameAfterActive(state);
    persist();
    refreshUi();
  });

  ui.duplicateFrameBtn.addEventListener('click', () => {
    duplicateActiveFrame(state);
    persist();
    refreshUi();
  });

  ui.deleteFrameBtn.addEventListener('click', () => {
    const deleted = deleteActiveFrame(state);
    if (!deleted) {
      ui.exportOutput.textContent = 'Cannot delete the only frame.';
      return;
    }
    persist();
    refreshUi();
  });

  ui.timelineList.addEventListener('click', (event) => {
    const item = event.target.closest('.timeline-item');
    if (!item) {
      return;
    }
    state.activeFrameIndex = Number(item.dataset.index);
    resetPlayback(state);
    refreshUi();
  });

  ui.timelineList.addEventListener('dragstart', (event) => {
    const item = event.target.closest('.timeline-item');
    if (!item) {
      return;
    }
    draggedFrameIndex = Number(item.dataset.index);
  });

  ui.timelineList.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  ui.timelineList.addEventListener('drop', (event) => {
    event.preventDefault();
    const item = event.target.closest('.timeline-item');
    if (!item || draggedFrameIndex === null) {
      return;
    }
    const toIndex = Number(item.dataset.index);
    moveFrame(state, draggedFrameIndex, toIndex);
    draggedFrameIndex = null;
    persist();
    refreshUi();
  });

  ui.fpsSlider.addEventListener('input', (event) => {
    state.animation.fps = Number(event.target.value);
    ui.fpsValue.textContent = String(state.animation.fps);
    persist();
  });

  ui.styleSelect.addEventListener('change', (event) => {
    state.animation.animationStyle = event.target.value;
    persist();
  });

  ui.colorInput.addEventListener('input', (event) => {
    state.animation.color = event.target.value;
    persist();
  });

  ui.previewToggle.addEventListener('click', () => {
    state.previewRunning = !state.previewRunning;
    ui.previewToggle.textContent = state.previewRunning ? 'Pause Preview' : 'Start Preview';
  });

  ui.capturePatternBtn.addEventListener('click', () => {
    const preset = createPresetFromAnimation(state.animation, state.presets.length);
    state.presets.push(preset);
    persist();
    refreshPresetList();
  });

  ui.exportJsonBtn.addEventListener('click', () => {
    exportAnimationJson(state, ui.exportOutput);
  });

  ui.importJsonBtn.addEventListener('click', () => {
    ui.importJsonInput.click();
  });

  ui.importJsonInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      await importAnimationJson(file, state);
      resetPlayback(state);
      persist();
      refreshUi();
      ui.exportOutput.textContent = 'Animation imported successfully.';
    } catch (error) {
      ui.exportOutput.textContent = error.message;
    } finally {
      ui.importJsonInput.value = '';
    }
  });

  ui.exportSvgBtn.addEventListener('click', () => {
    exportStandaloneSvg(state);
  });
}

function refreshUi() {
  renderTimeline(state, ui);
  refreshPresetList();
  ui.frameInfo.textContent = `Frame ${state.activeFrameIndex + 1} / ${state.animation.frames.length}`;
  ui.fpsSlider.value = String(state.animation.fps);
  ui.fpsValue.textContent = String(state.animation.fps);
  ui.styleSelect.value = state.animation.animationStyle;
  ui.colorInput.value = state.animation.color;
}

function refreshPresetList() {
  ui.presetList.innerHTML = '';
  if (state.presets.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'timeline-label';
    empty.textContent = 'No presets yet.';
    ui.presetList.appendChild(empty);
    return;
  }

  state.presets.forEach((preset) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'btn preset-item';
    button.textContent = preset.name;
    button.addEventListener('click', () => {
      state.animation = cloneAnimation(preset.animation);
      state.activeFrameIndex = 0;
      resetPlayback(state);
      persist();
      refreshUi();
    });
    item.appendChild(button);
    ui.presetList.appendChild(item);
  });
}

function persist() {
  saveProject({ animation: state.animation, presets: state.presets });
}
