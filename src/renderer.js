const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL_SIZE = 90;
const GAP = 8;
const CORNER = 9;

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
      rect.setAttribute('fill', state.animation.color);
      rect.setAttribute('fill-opacity', '0');
      rect.setAttribute('stroke', '#0f1724');
      rect.setAttribute('stroke-width', '1');
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', () => onCellClick(row, col));
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
          rect.setAttribute('fill', state.animation.color);
          rect.setAttribute('fill-opacity', String(opacity));
        }
      }
    }
  };
}
