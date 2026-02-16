import { createZeroDelayMatrix, DEFAULT_COLOR, fromBooleanGrid, GRID_SIZE, sanitizeDelayMatrix, toBooleanGrid } from './state.js';

export const PROJECT_STORAGE_KEY = 'animationBuilderProject';
const MODES = new Set(['spinner', 'blink', 'linear', 'directional']);
const DIRECTIONS = new Set(['right', 'left', 'up', 'down']);

export function createPatternFromState(state) {
  const direction = state.pattern === 'directional' ? state.direction ?? 'right' : null;
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `pattern-${Date.now()}`,
    name: `Pattern ${state.patternStore.length + 1}`,
    gridSize: state.gridSize,
    activeCells: toBooleanGrid(state.activeCells, state.gridSize),
    cellDelays: sanitizeDelayMatrix(state.cellDelays, state.gridSize),
    mode: state.pattern,
    direction,
    speed: state.fps,
    animationStyle: state.animationStyle,
    color: state.color
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
    return normalizeProject(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function isValidProject(payload) {
  return Array.isArray(payload) && payload.every((pattern) => normalizePattern(pattern) !== null);
}

export function normalizeProject(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.map(normalizePattern).filter(Boolean);
}

export function applyPatternToState(state, pattern) {
  state.gridSize = pattern.gridSize;
  state.activeCells = fromBooleanGrid(pattern.activeCells, pattern.gridSize);
  state.cellDelays = sanitizeDelayMatrix(pattern.cellDelays, pattern.gridSize);
  state.pattern = pattern.mode;
  state.direction = pattern.direction;
  state.fps = pattern.speed;
  state.animationStyle = pattern.animationStyle;
  state.color = pattern.color;
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

function normalizePattern(pattern) {
  if (!pattern || typeof pattern !== 'object') {
    return null;
  }

  if (typeof pattern.id !== 'string' || typeof pattern.name !== 'string') {
    return null;
  }

  if (pattern.gridSize !== GRID_SIZE) {
    return null;
  }

  if (typeof pattern.speed !== 'number' || !Number.isFinite(pattern.speed)) {
    return null;
  }

  if (pattern.animationStyle !== 'binary' && pattern.animationStyle !== 'fade') {
    return null;
  }

  if (!Array.isArray(pattern.activeCells) || pattern.activeCells.length !== pattern.gridSize) {
    return null;
  }

  const validGrid = pattern.activeCells.every(
    (row) =>
      Array.isArray(row) &&
      row.length === pattern.gridSize &&
      row.every((cell) => typeof cell === 'boolean')
  );

  if (!validGrid) {
    return null;
  }

  const mode = MODES.has(pattern.mode) ? pattern.mode : 'spinner';
  let direction = pattern.direction ?? null;

  if (mode !== 'directional') {
    direction = null;
  } else if (!DIRECTIONS.has(direction)) {
    direction = 'right';
  }

  const color = isHexColor(pattern.color) ? pattern.color : DEFAULT_COLOR;
  const cellDelays = pattern.cellDelays
    ? sanitizeDelayMatrix(pattern.cellDelays, pattern.gridSize)
    : createZeroDelayMatrix(pattern.gridSize);

  return {
    id: pattern.id,
    name: pattern.name,
    gridSize: pattern.gridSize,
    activeCells: pattern.activeCells,
    cellDelays,
    mode,
    direction,
    speed: pattern.speed,
    animationStyle: pattern.animationStyle,
    color
  };
}

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}
