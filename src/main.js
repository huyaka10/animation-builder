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
if (persisted?.animation) {
  state.animation = persisted.animation;
}
if (persisted?.presets) {
  state.presets = persisted.presets;
}
state.selectedPresetId = persisted?.selectedPresetId ?? null;
resetPlayback(state);

let draggedFrameIndex = null;
let editingPresetId = null;
let presetsExpanded = false;

const ui = {
  stage: document.querySelector('#stage'),
  activePresetLabel: document.querySelector('#activePresetLabel'),
  timelineList: document.querySelector('#timelineList'),
  addFrameBtn: document.querySelector('#addFrameBtn'),
  duplicateFrameBtn: document.querySelector('#duplicateFrameBtn'),
  deleteFrameBtn: document.querySelector('#deleteFrameBtn'),
  frameInfo: document.querySelector('#frameInfo'),
  fpsSlider: document.querySelector('#fpsSlider'),
  fpsValue: document.querySelector('#fpsValue'),
  styleSelect: document.querySelector('#styleSelect'),
  colorInput: document.querySelector('#colorInput'),
  glowSlider: document.querySelector('#glowSlider'),
  glowValue: document.querySelector('#glowValue'),
  previewToggle: document.querySelector('#previewToggle'),
  newAnimationBtn: document.querySelector('#newAnimationBtn'),
  capturePatternBtn: document.querySelector('#capturePatternBtn'),
  savePresetChangesBtn: document.querySelector('#savePresetChangesBtn'),
  presetToggleBtn: document.querySelector('#presetToggleBtn'),
  presetListWrap: document.querySelector('#presetListWrap'),
  presetList: document.querySelector('#presetList'),
  exportJsonBtn: document.querySelector('#exportJsonBtn'),
  importJsonBtn: document.querySelector('#importJsonBtn'),
  importJsonInput: document.querySelector('#importJsonInput'),
  exportSvgBtn: document.querySelector('#exportSvgBtn'),
  toastContainer: document.querySelector('#toastContainer'),
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
      showToast('Cannot delete the only frame.', 'error');
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

  ui.glowSlider.addEventListener('input', (event) => {
    state.animation.glow = Number(event.target.value);
    ui.glowValue.textContent = String(state.animation.glow);
    persist();
    refreshUi();
  });

  ui.previewToggle.addEventListener('click', () => {
    state.previewRunning = !state.previewRunning;
    ui.previewToggle.textContent = state.previewRunning ? 'Pause Preview' : 'Start Preview';
  });

  ui.newAnimationBtn.addEventListener('click', () => {
    if (!state.selectedPresetId) {
      return;
    }

    const selectedPreset = getSelectedPreset();
    const hasUnsaved = selectedPreset && !animationsEqual(state.animation, selectedPreset.animation);
    if (hasUnsaved && !window.confirm('You have unsaved changes. Continue?')) {
      return;
    }

    state.selectedPresetId = null;
    editingPresetId = null;
    persist();
    refreshUi();
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

  ui.presetToggleBtn.addEventListener('click', () => {
    if (state.presets.length === 0) {
      return;
    }
    presetsExpanded = !presetsExpanded;
    refreshPresetVisibility();
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
    exportAnimationJson(state);
    showToast('Animation JSON exported.');
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
      showToast('Animation imported successfully.');
    } catch (error) {
      showToast(error.message, 'error');
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
  refreshPresetVisibility();

  ui.frameInfo.textContent = `Frame ${state.activeFrameIndex + 1} / ${state.animation.frames.length}`;
  ui.fpsSlider.value = String(state.animation.fps);
  ui.fpsValue.textContent = String(state.animation.fps);
  ui.styleSelect.value = state.animation.animationStyle;
  ui.colorInput.value = state.animation.color;
  ui.glowSlider.value = String(state.animation.glow ?? 0);
  ui.glowValue.textContent = String(state.animation.glow ?? 0);
  ui.savePresetChangesBtn.disabled = !state.selectedPresetId;
  ui.previewToggle.textContent = state.previewRunning ? 'Pause Preview' : 'Start Preview';
  ui.activePresetLabel.textContent = getModeLabel();
}

function refreshPresetVisibility() {
  const count = state.presets.length;

  if (count === 0) {
    presetsExpanded = false;
    ui.presetToggleBtn.disabled = true;
    ui.presetToggleBtn.textContent = 'Show Presets (0)';
    ui.presetListWrap.classList.add('hidden');
    return;
  }

  ui.presetToggleBtn.disabled = false;
  ui.presetToggleBtn.textContent = `${presetsExpanded ? 'Hide' : 'Show'} Presets (${count})`;
  ui.presetListWrap.classList.toggle('hidden', !presetsExpanded);
}

function getModeLabel() {
  const preset = getSelectedPreset();
  if (!preset) {
    return 'Draft';
  }
  if (isPresetModified(preset)) {
    return `Preset: ${preset.name} *`;
  }
  return `Preset: ${preset.name}`;
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


function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const text = document.createElement('span');
  text.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close notification');

  let removed = false;
  const remove = () => {
    if (removed) {
      return;
    }
    removed = true;
    toast.remove();
  };

  closeBtn.addEventListener('click', remove);

  toast.append(text, closeBtn);
  ui.toastContainer.appendChild(toast);

  setTimeout(remove, 3200);
}

function persist() {
  saveProject({
    animation: state.animation,
    presets: state.presets,
    selectedPresetId: state.selectedPresetId
  });
}
