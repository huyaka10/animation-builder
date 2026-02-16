export const GRID_SIZE = 5;
export const DEFAULT_COLOR = '#5ca7ff';

export function createInitialState() {
  return {
    gridSize: GRID_SIZE,
    activeCells: new Set(),
    fps: 12,
    animationStyle: 'binary',
    pattern: 'spinner',
    direction: null,
    color: DEFAULT_COLOR,
    previewRunning: true,
    timeMs: 0,
    patternStore: [],
    selectedPatternId: null
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

export function toBooleanGrid(activeCells, gridSize) {
  const matrix = [];
  for (let row = 0; row < gridSize; row += 1) {
    const rowData = [];
    for (let col = 0; col < gridSize; col += 1) {
      rowData.push(activeCells.has(cellKey(row, col)));
    }
    matrix.push(rowData);
  }
  return matrix;
}

export function fromBooleanGrid(grid, gridSize) {
  const active = new Set();
  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      if (grid[row]?.[col] === true) {
        active.add(cellKey(row, col));
      }
    }
  }
  return active;
}
