import {
  addFrameAfterActive,
  animationsEqual,
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
  state.selectedPresetId = persisted.selectedPresetId;
}
resetPlayback(state);

let draggedFrameIndex = null;
let editingPresetId = null;

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
  savePresetChangesBtn: document.querySelector('#savePresetChangesBtn'),
  presetList: document.querySelector('#presetList'),
  exportJsonBtn: document.querySelector('#exportJsonBtn'),
  importJsonBtn: document.querySelector('#importJsonBtn'),
  importJsonInput: document.querySelector('#importJsonInput'),
  exportSvgBtn: document.querySelector('#exportSvgBtn'),
  exportOutput: document.querySelector('#exportOutput'),
  captureModal: document.querySelector('#captureModal'),
  overwritePresetBtn: document.querySelector('#overwritePresetBtn'),
  createNewPresetBtn: document.querySelector('#createNewPresetBtn'),
  cancelPresetBtn: document.querySelector('#cancelPresetBtn')
};

const renderer = createRenderer(ui.stage, state, (row, col) => {
  toggleCellInActiveFrame(state, row, col);
  persist();
  refreshUi();
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
    refreshUi();
  });

  ui.styleSelect.addEventListener('change', (event) => {
    state.animation.animationStyle = event.target.value;
    persist();
    refreshUi();
  });

  ui.colorInput.addEventListener('input', (event) => {
    state.animation.color = event.target.value;
    persist();
    refreshUi();
  });

  ui.previewToggle.addEventListener('click', () => {
    state.previewRunning = !state.previewRunning;
    ui.previewToggle.textContent = state.previewRunning ? 'Pause Preview' : 'Start Preview';
  });

  ui.capturePatternBtn.addEventListener('click', () => {
    if (!state.selectedPresetId) {
      createNewPresetFromCurrent();
      return;
    }
    ui.captureModal.showModal();
  });

  ui.savePresetChangesBtn.addEventListener('click', () => {
    saveSelectedPresetChanges();
  });

  ui.overwritePresetBtn.addEventListener('click', () => {
    saveSelectedPresetChanges();
    ui.captureModal.close();
  });

  ui.createNewPresetBtn.addEventListener('click', () => {
    createNewPresetFromCurrent();
    ui.captureModal.close();
  });

  ui.cancelPresetBtn.addEventListener('click', () => {
    ui.captureModal.close();
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

function saveSelectedPresetChanges() {
  const preset = getSelectedPreset();
  if (!preset) {
    return;
  }
  preset.animation = cloneAnimation(state.animation);
  persist();
  refreshUi();
}

function createNewPresetFromCurrent() {
  const preset = createPresetFromAnimation(state.animation, state.presets.length);
  state.presets.push(preset);
  state.selectedPresetId = preset.id;
  editingPresetId = null;
  persist();
  refreshUi();
}

function selectPreset(presetId) {
  const preset = state.presets.find((entry) => entry.id === presetId);
  if (!preset) {
    return;
  }

  state.selectedPresetId = preset.id;
  state.animation = cloneAnimation(preset.animation);
  state.activeFrameIndex = 0;
  resetPlayback(state);
  persist();
  refreshUi();
}

function removePreset(presetId) {
  state.presets = state.presets.filter((preset) => preset.id !== presetId);
  if (state.selectedPresetId === presetId) {
    state.selectedPresetId = null;
  }
  if (editingPresetId === presetId) {
    editingPresetId = null;
  }
  persist();
  refreshUi();
}

function refreshUi() {
  renderTimeline(state, ui);
  refreshPresetList();
  ui.frameInfo.textContent = `Frame ${state.activeFrameIndex + 1} / ${state.animation.frames.length}`;
  ui.fpsSlider.value = String(state.animation.fps);
  ui.fpsValue.textContent = String(state.animation.fps);
  ui.styleSelect.value = state.animation.animationStyle;
  ui.colorInput.value = state.animation.color;
  ui.savePresetChangesBtn.disabled = !state.selectedPresetId;
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
    item.className = `preset-card${preset.id === state.selectedPresetId ? ' active' : ''}`;

    const header = document.createElement('div');
    header.className = 'preset-card-head';

    const nameWrap = document.createElement('div');
    nameWrap.className = 'preset-name-wrap';

    if (editingPresetId === preset.id) {
      const input = document.createElement('input');
      input.className = 'preset-rename-input';
      input.value = preset.name;
      input.autofocus = true;

      const commitRename = () => {
        const nextName = input.value.trim();
        if (nextName) {
          preset.name = nextName;
          persist();
        }
        editingPresetId = null;
        refreshUi();
      };

      input.addEventListener('blur', commitRename);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          input.blur();
        }
        if (event.key === 'Escape') {
          editingPresetId = null;
          refreshUi();
        }
      });

      nameWrap.appendChild(input);
      setTimeout(() => input.select(), 0);
    } else {
      const name = document.createElement('button');
      name.className = 'preset-name-button';
      name.type = 'button';
      name.textContent = preset.name;
      name.addEventListener('click', () => selectPreset(preset.id));

      nameWrap.appendChild(name);

      if (isPresetModified(preset)) {
        const marker = document.createElement('span');
        marker.className = 'preset-modified';
        marker.textContent = '*';
        marker.title = 'Modified (unsaved)';
        nameWrap.appendChild(marker);
      }
    }

    const controls = document.createElement('div');
    controls.className = 'preset-controls';

    const renameBtn = document.createElement('button');
    renameBtn.className = 'btn preset-control-btn';
    renameBtn.type = 'button';
    renameBtn.textContent = 'Rename';
    renameBtn.disabled = editingPresetId === preset.id;
    renameBtn.addEventListener('click', () => {
      editingPresetId = preset.id;
      refreshUi();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger preset-control-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => removePreset(preset.id));

    controls.appendChild(renameBtn);
    controls.appendChild(deleteBtn);

    header.appendChild(nameWrap);
    header.appendChild(controls);

    item.appendChild(header);
    item.appendChild(createPresetPreview(preset));

    ui.presetList.appendChild(item);
  });
}

function createPresetPreview(preset) {
  const svgNs = 'http://www.w3.org/2000/svg';
  const preview = document.createElementNS(svgNs, 'svg');
  const size = 12;
  const gap = 3;
  const padding = 2;
  const frame = preset.animation.frames[0];
  const grid = frame.length;
  const width = grid * size + (grid - 1) * gap + padding * 2;

  preview.setAttribute('class', 'preset-preview');
  preview.setAttribute('viewBox', `0 0 ${width} ${width}`);

  for (let row = 0; row < grid; row += 1) {
    for (let col = 0; col < grid; col += 1) {
      const rect = document.createElementNS(svgNs, 'rect');
      rect.setAttribute('x', String(padding + col * (size + gap)));
      rect.setAttribute('y', String(padding + row * (size + gap)));
      rect.setAttribute('width', String(size));
      rect.setAttribute('height', String(size));
      rect.setAttribute('rx', '2');
      rect.setAttribute('fill', preset.animation.color);
      rect.setAttribute('fill-opacity', frame[row][col] ? '1' : '0.12');
      preview.appendChild(rect);
    }
  }

  return preview;
}

function getSelectedPreset() {
  if (!state.selectedPresetId) {
    return null;
  }
  return state.presets.find((preset) => preset.id === state.selectedPresetId) ?? null;
}

function isPresetModified(preset) {
  return preset.id === state.selectedPresetId && !animationsEqual(state.animation, preset.animation);
}

function persist() {
  saveProject({
    animation: state.animation,
    presets: state.presets,
    selectedPresetId: state.selectedPresetId
  });
}
