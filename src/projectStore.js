import { fromBooleanGrid, toBooleanGrid } from './state.js';

export const PROJECT_STORAGE_KEY = 'animationBuilderProject';

export function createPatternFromState(state) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `pattern-${Date.now()}`,
    name: `Pattern ${state.patternStore.length + 1}`,
    gridSize: state.gridSize,
    activeCells: toBooleanGrid(state.activeCells, state.gridSize),
    mode: 'spinner',
    speed: state.fps,
    animationStyle: state.animationStyle
  };
}

export function saveProject(patternStore) {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(patternStore));
}

export function loadProject() {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidPattern);
  } catch {
    return [];
  }
}

export function isValidProject(payload) {
  return Array.isArray(payload) && payload.every(isValidPattern);
}

export function applyPatternToState(state, pattern) {
  state.gridSize = pattern.gridSize;
  state.activeCells = fromBooleanGrid(pattern.activeCells, pattern.gridSize);
  state.pattern = 'spinner';
  state.fps = pattern.speed;
  state.animationStyle = pattern.animationStyle;
  state.previewRunning = true;
  state.selectedPatternId = pattern.id;
}

export function downloadProject(patternStore) {
  const blob = new Blob([JSON.stringify(patternStore, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'project.json';
  link.click();
  URL.revokeObjectURL(url);
}

function isValidPattern(pattern) {
  if (!pattern || typeof pattern !== 'object') {
    return false;
  }

  if (typeof pattern.id !== 'string' || typeof pattern.name !== 'string') {
    return false;
  }

  if (pattern.gridSize !== 5 || pattern.mode !== 'spinner') {
    return false;
  }

  if (typeof pattern.speed !== 'number' || !Number.isFinite(pattern.speed)) {
    return false;
  }

  if (pattern.animationStyle !== 'binary' && pattern.animationStyle !== 'fade') {
    return false;
  }

  if (!Array.isArray(pattern.activeCells) || pattern.activeCells.length !== pattern.gridSize) {
    return false;
  }

  return pattern.activeCells.every(
    (row) =>
      Array.isArray(row) &&
      row.length === pattern.gridSize &&
      row.every((cell) => typeof cell === 'boolean')
  );
}
