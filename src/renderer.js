import { cellKey } from './state.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL_SIZE = 90;
const GAP = 8;
const CORNER = 9;

export function createRenderer(svg, state, onCellClick) {
  const cells = new Map();
  const totalSize = state.gridSize * CELL_SIZE + (state.gridSize - 1) * GAP;
  const offset = (520 - totalSize) / 2;

  for (let row = 0; row < state.gridSize; row += 1) {
    for (let col = 0; col < state.gridSize; col += 1) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(offset + col * (CELL_SIZE + GAP)));
      rect.setAttribute('y', String(offset + row * (CELL_SIZE + GAP)));
      rect.setAttribute('width', String(CELL_SIZE));
      rect.setAttribute('height', String(CELL_SIZE));
      rect.setAttribute('rx', String(CORNER));
      rect.setAttribute('fill', '#25272d');
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', () => onCellClick(row, col));
      svg.appendChild(rect);
      cells.set(cellKey(row, col), rect);
    }
  }

  return {
    render(opacities) {
      for (const [key, rect] of cells.entries()) {
        const isActive = state.activeCells.has(key);
        const opacity = opacities[key] ?? (isActive ? 1 : 0);
        rect.setAttribute('fill', isActive ? state.color : '#25272d');
        rect.setAttribute('fill-opacity', String(isActive ? opacity : 1));
      }
    }
  };
}
