import { parseCellKey } from './state.js';

export function getPatternCells(pattern, activeCells, gridSize) {
  if (pattern !== 'spinner') {
    return [];
  }

  const center = (gridSize - 1) / 2;

  return [...activeCells]
    .map((key) => {
      const { row, col } = parseCellKey(key);
      const angle = Math.atan2(row - center, col - center);
      return { key, row, col, angle };
    })
    .sort((a, b) => a.angle - b.angle);
}
