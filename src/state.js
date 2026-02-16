export const GRID_SIZE = 5;

export function createInitialState() {
  return {
    gridSize: GRID_SIZE,
    activeCells: new Set(),
    fps: 12,
    animationStyle: 'binary',
    pattern: 'spinner',
    previewRunning: true,
    timeMs: 0
  };
}

export function cellKey(row, col) {
  return `${row}:${col}`;
}

export function parseCellKey(key) {
  const [row, col] = key.split(':').map(Number);
  return { row, col };
}

export function toggleCell(state, row, col) {
  const key = cellKey(row, col);
  if (state.activeCells.has(key)) {
    state.activeCells.delete(key);
  } else {
    state.activeCells.add(key);
  }
}
