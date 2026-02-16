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
      const key = cellKey(row, col);
      const x = offset + col * (CELL_SIZE + GAP);
      const y = offset + row * (CELL_SIZE + GAP);

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(CELL_SIZE));
      rect.setAttribute('height', String(CELL_SIZE));
      rect.setAttribute('rx', String(CORNER));
      rect.setAttribute('fill', '#25272d');
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', () => onCellClick(row, col));
      svg.appendChild(rect);

      const badgeBg = document.createElementNS(SVG_NS, 'rect');
      badgeBg.setAttribute('x', String(x + CELL_SIZE - 34));
      badgeBg.setAttribute('y', String(y + 6));
      badgeBg.setAttribute('width', '28');
      badgeBg.setAttribute('height', '16');
      badgeBg.setAttribute('rx', '6');
      badgeBg.setAttribute('fill', '#111827');
      badgeBg.setAttribute('stroke', '#445373');
      badgeBg.setAttribute('visibility', 'hidden');
      badgeBg.style.pointerEvents = 'none';
      svg.appendChild(badgeBg);

      const badgeText = document.createElementNS(SVG_NS, 'text');
      badgeText.setAttribute('x', String(x + CELL_SIZE - 20));
      badgeText.setAttribute('y', String(y + 18));
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('font-size', '10');
      badgeText.setAttribute('fill', '#d8e7ff');
      badgeText.setAttribute('visibility', 'hidden');
      badgeText.style.pointerEvents = 'none';
      svg.appendChild(badgeText);

      cells.set(key, { rect, badgeBg, badgeText, row, col });
    }
  }

  return {
    render(opacities) {
      for (const [key, cell] of cells.entries()) {
        const isActive = state.activeCells.has(key);
        const opacity = opacities[key] ?? (isActive ? 1 : 0);
        const isSelected =
          state.selectedCell && state.selectedCell.row === cell.row && state.selectedCell.col === cell.col;

        cell.rect.setAttribute('fill', isActive ? state.color : '#25272d');
        cell.rect.setAttribute('fill-opacity', String(isActive ? opacity : 1));
        cell.rect.setAttribute('stroke', isSelected ? '#d7e7ff' : '#0f1724');
        cell.rect.setAttribute('stroke-width', isSelected ? '3' : '1');

        const delay = Number(state.cellDelays[cell.row]?.[cell.col] ?? 0);
        const hasDelay = delay > 0;
        cell.badgeBg.setAttribute('visibility', hasDelay ? 'visible' : 'hidden');
        cell.badgeText.setAttribute('visibility', hasDelay ? 'visible' : 'hidden');
        cell.badgeText.textContent = String(Math.round(delay));
      }
    }
  };
}
