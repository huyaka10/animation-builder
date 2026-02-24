const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL_SIZE = 90;
const GAP = 8;
const CORNER = 9;
const INACTIVE_CELL_COLOR = '#333843';
const HOVER_CELL_COLOR = '#5E6677';

export function createRenderer(svg, state, onCellClick) {
  const cells = [];
  const totalSize = state.gridSize * CELL_SIZE + (state.gridSize - 1) * GAP;
  const offset = (520 - totalSize) / 2;

  for (let row = 0; row < state.gridSize; row += 1) {
    const rowCells = [];
    for (let col = 0; col < state.gridSize; col += 1) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(offset + col * (CELL_SIZE + GAP)));
      rect.setAttribute('y', String(offset + row * (CELL_SIZE + GAP)));
      rect.setAttribute('width', String(CELL_SIZE));
      rect.setAttribute('height', String(CELL_SIZE));
      rect.setAttribute('rx', String(CORNER));
      rect.setAttribute('fill', INACTIVE_CELL_COLOR);
      rect.setAttribute('fill-opacity', '1');
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', () => onCellClick(row, col));
      rect.addEventListener('mouseenter', () => {
        if (!state.previewRunning && Number(rect.dataset.active || '0') === 0) {
          rect.setAttribute('fill', HOVER_CELL_COLOR);
        }
      });
      rect.addEventListener('mouseleave', () => {
        if (Number(rect.dataset.active || '0') === 0) {
          rect.setAttribute('fill', INACTIVE_CELL_COLOR);
        }
      });
      svg.appendChild(rect);
      rowCells.push(rect);
    }
    cells.push(rowCells);
  }

  return {
    render(displayFrame) {
      for (let row = 0; row < state.gridSize; row += 1) {
        for (let col = 0; col < state.gridSize; col += 1) {
          const rect = cells[row][col];
          const opacity = Number(displayFrame[row][col] ?? 0);
          const glow = Number(state.animation.glow ?? 0);
          if (opacity <= 0) {
            rect.dataset.active = '0';
            rect.setAttribute('fill', INACTIVE_CELL_COLOR);
            rect.setAttribute('fill-opacity', state.previewRunning ? '0' : '1');
            rect.style.filter = 'none';
          } else {
            rect.dataset.active = '1';
            rect.setAttribute('fill', state.animation.color);
            rect.setAttribute('fill-opacity', String(opacity));
            rect.style.filter = glow > 0 ? `drop-shadow(0 0 ${glow}px ${state.animation.color})` : 'none';
          }
        }
      }
    }
  };
}
