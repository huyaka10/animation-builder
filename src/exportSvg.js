import { parseCellKey, sanitizeDelayMatrix } from './state.js';

const CELL_SIZE = 90;
const GAP = 8;
const CORNER = 9;
const PADDING = 20;
const DEFAULT_CELL_FILL = '#5ca7ff';

export function exportStandaloneSvg(state) {
  const fillColor = state.color || DEFAULT_CELL_FILL;
  const gridSize = state.gridSize;
  const totalSize = gridSize * CELL_SIZE + (gridSize - 1) * GAP;
  const viewSize = totalSize + PADDING * 2;

  const activeCells = [...state.activeCells].map(parseCellKey);
  const delays = sanitizeDelayMatrix(state.cellDelays, gridSize);

  const rects = [];
  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const x = PADDING + col * (CELL_SIZE + GAP);
      const y = PADDING + row * (CELL_SIZE + GAP);
      const key = `${row}:${col}`;
      rects.push(
        `<rect data-key="${key}" x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CORNER}" fill="${fillColor}" fill-opacity="0" />`
      );
    }
  }

  const payload = {
    gridSize,
    mode: state.pattern,
    speed: state.fps,
    animationStyle: state.animationStyle,
    direction: state.pattern === 'directional' ? state.direction ?? 'right' : null,
    activeCells,
    cellDelays: delays,
    fill: fillColor
  };

  const scriptData = JSON.stringify(payload).replace(/</g, '\\u003c');

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  ${rects.join('\n  ')}
  <script><![CDATA[
    (function () {
      const config = ${scriptData};
      const root = document.documentElement;
      const cells = Array.from(root.querySelectorAll('rect')).map((el) => {
        const [row, col] = (el.getAttribute('data-key') || '0:0').split(':').map(Number);
        return { el, key: row + ':' + col, row, col };
      });

      const activeSet = new Set((config.activeCells || []).map((cell) => cell.row + ':' + cell.col));
      const activeCells = cells.filter((cell) => activeSet.has(cell.key));
      const delayMatrix = config.cellDelays || [];
      const mode = config.mode;
      const style = config.animationStyle;
      const speed = Number(config.speed) || 1;
      const direction = config.direction;
      const gridSize = Number(config.gridSize) || 5;
      const fill = config.fill || '${DEFAULT_CELL_FILL}';

      for (const cell of cells) {
        cell.el.setAttribute('fill', fill);
      }

      const ordered = orderCells(activeCells, mode, gridSize, direction);
      let last = performance.now();
      let timeMs = 0;

      function loop(now) {
        const delta = now - last;
        last = now;
        timeMs += delta;
        const step = (timeMs / 1000) * speed;

        const frame = buildFrame(ordered, mode, style, step, speed, delayMatrix);
        for (const cell of cells) {
          const opacity = frame[cell.key] ?? 0;
          cell.el.setAttribute('fill-opacity', String(opacity));
        }

        requestAnimationFrame(loop);
      }

      requestAnimationFrame(loop);

      function buildFrame(cellsOrdered, modeName, styleName, step, fps, delays) {
        if (cellsOrdered.length === 0) {
          return {};
        }

        const frame = {};
        if (modeName === 'blink') {
          for (const cell of cellsOrdered) {
            const delayedStep = step - delayToStep(cellDelay(delays, cell.row, cell.col), fps);
            frame[cell.key] = styleName === 'binary' ? (Math.floor(delayedStep) % 2 === 0 ? 1 : 0) : pulse(delayedStep);
          }
          return frame;
        }

        if (modeName === 'directional') {
          const layerCount = Math.max.apply(null, cellsOrdered.map((cell) => cell.layer)) + 1;
          for (const cell of cellsOrdered) {
            const delayedStep = step - delayToStep(cellDelay(delays, cell.row, cell.col), fps);
            if (styleName === 'binary') {
              const activeLayer = mod(Math.floor(delayedStep), layerCount);
              frame[cell.key] = cell.layer === activeLayer ? 1 : 0;
            } else {
              const waveCenter = mod(delayedStep, layerCount);
              const distance = cyclicDistance(cell.layer, waveCenter, layerCount);
              frame[cell.key] = Number(Math.max(0, 1 - distance / Math.max(layerCount / 2, 1)).toFixed(3));
            }
          }
          return frame;
        }

        const len = cellsOrdered.length;
        for (let i = 0; i < len; i += 1) {
          const cell = cellsOrdered[i];
          const delayedStep = step - delayToStep(cellDelay(delays, cell.row, cell.col), fps);
          if (styleName === 'binary') {
            frame[cell.key] = mod(Math.floor(delayedStep), len) === i ? 1 : 0;
          } else {
            const center = mod(delayedStep, len);
            const distance = cyclicDistance(i, center, len);
            frame[cell.key] = Number(Math.max(0, 1 - distance / Math.max(len / 2, 1)).toFixed(3));
          }
        }
        return frame;
      }

      function orderCells(activeOnly, modeName, size, dir) {
        if (modeName === 'spinner') {
          const center = (size - 1) / 2;
          return activeOnly
            .map((cell) => ({
              row: cell.row,
              col: cell.col,
              key: cell.key,
              angle: Math.atan2(cell.row - center, cell.col - center)
            }))
            .sort((a, b) => a.angle - b.angle);
        }

        if (modeName === 'linear' || modeName === 'blink') {
          return activeOnly.slice().sort((a, b) => a.row - b.row || a.col - b.col);
        }

        if (modeName === 'directional') {
          return activeOnly
            .map((cell) => ({
              row: cell.row,
              col: cell.col,
              key: cell.key,
              layer: directionalLayer(cell.row, cell.col, size, dir)
            }))
            .sort((a, b) => a.layer - b.layer || a.row - b.row || a.col - b.col);
        }

        return [];
      }

      function directionalLayer(row, col, size, dir) {
        if (dir === 'right') return col;
        if (dir === 'left') return size - 1 - col;
        if (dir === 'down') return row;
        return size - 1 - row;
      }

      function cellDelay(delays, row, col) {
        const value = Number(delays[row] && delays[row][col]);
        return Number.isFinite(value) && value >= 0 ? value : 0;
      }

      function delayToStep(delayMs, fps) {
        return (delayMs / 1000) * fps;
      }

      function pulse(step) {
        const phase = mod(step, 1);
        const value = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
        return Number(value.toFixed(3));
      }

      function cyclicDistance(index, center, len) {
        const raw = Math.abs(index - center);
        return Math.min(raw, len - raw);
      }

      function mod(value, len) {
        return ((value % len) + len) % len;
      }
    })();
  ]]></script>
</svg>`;

  downloadText(svgContent, 'animation.svg', 'image/svg+xml');
}

function downloadText(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
