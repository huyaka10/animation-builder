import { parseCellKey } from './state.js';

export function getPatternCells(mode, activeCells, gridSize, direction = null) {
  const cells = [...activeCells].map((key) => {
    const { row, col } = parseCellKey(key);
    return { key, row, col };
  });

  if (mode === 'spinner') {
    const center = (gridSize - 1) / 2;
    return cells
      .map((cell) => ({
        ...cell,
        angle: Math.atan2(cell.row - center, cell.col - center)
      }))
      .sort((a, b) => a.angle - b.angle);
  }

  if (mode === 'linear' || mode === 'blink') {
    return cells.sort((a, b) => a.row - b.row || a.col - b.col);
  }

  if (mode === 'directional') {
    return cells
      .map((cell) => ({
        ...cell,
        layer: getDirectionalLayer(cell.row, cell.col, gridSize, direction)
      }))
      .sort((a, b) => a.layer - b.layer || a.row - b.row || a.col - b.col);
  }

  return [];
}

function getDirectionalLayer(row, col, gridSize, direction) {
  if (direction === 'right') {
    return col;
  }
  if (direction === 'left') {
    return gridSize - 1 - col;
  }
  if (direction === 'down') {
    return row;
  }
  return gridSize - 1 - row;
}
