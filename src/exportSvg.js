import { parseCellKey } from './state.js';

const CELL_SIZE = 90;
const GAP = 8;
const CORNER = 9;
const PADDING = 20;
const ACTIVE_FILL = '#5ca7ff';
const INACTIVE_FILL = '#25272d';

export function exportStandaloneSvg(state) {
  const gridSize = state.gridSize;
  const totalSize = gridSize * CELL_SIZE + (gridSize - 1) * GAP;
  const viewSize = totalSize + PADDING * 2;

  const activeCells = [...state.activeCells].map(parseCellKey);
  const activeLookup = new Set(activeCells.map((cell) => `${cell.row}:${cell.col}`));

  const rects = [];
  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const x = PADDING + col * (CELL_SIZE + GAP);
      const y = PADDING + row * (CELL_SIZE + GAP);
      const key = `${row}:${col}`;
      const isActive = activeLookup.has(key);
      const fill = isActive ? ACTIVE_FILL : INACTIVE_FILL;
      const opacity = isActive ? '1' : '1';
      rects.push(
        `<rect data-key="${key}" data-active="${isActive}" x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CORNER}" fill="${fill}" fill-opacity="${opacity}" />`
      );
    }
  }

  const payload = {
    gridSize,
    mode: state.pattern,
    speed: state.fps,
    animationStyle: state.animationStyle,
    direction: state.pattern === 'directional' ? state.direction ?? 'right' : null,
    activeCells
  };

  const scriptData = JSON.stringify(payload).replace(/</g, '\\u003c');

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  ${rects.join('\n  ')}
  <script><![CDATA[
    (function () {
      const config = ${scriptData};
      const activeFill = '${ACTIVE_FILL}';
      const inactiveFill = '${INACTIVE_FILL}';
      const root = document.documentElement;
      const cells = Array.from(root.querySelectorAll('rect')).map((el) => {
        const [row, col] = (el.getAttribute('data-key') || '0:0').split(':').map(Number);
        return {
          el,
          key: row + ":" + col,
          row,
          col,
          active: el.getAttribute('data-active') === 'true'
        };
      });

      const activeCells = cells.filter((cell) => cell.active);
      const mode = config.mode;
      const style = config.animationStyle;
      const speed = Number(config.speed) || 1;
      const direction = config.direction;
      const gridSize = Number(config.gridSize) || 5;

      let ordered = orderCells(activeCells, mode, gridSize, direction);
      let last = performance.now();
      let timeMs = 0;

      function loop(now) {
        const delta = now - last;
        last = now;
        timeMs += delta;

        const frame = buildFrame(ordered, mode, style, speed, timeMs);
        for (const cell of cells) {
          if (!cell.active) {
            cell.el.setAttribute('fill', inactiveFill);
            cell.el.setAttribute('fill-opacity', '1');
            continue;
          }

          const opacity = frame[cell.key] ?? 1;
          cell.el.setAttribute('fill', activeFill);
          cell.el.setAttribute('fill-opacity', String(opacity));
        }

        requestAnimationFrame(loop);
      }

      requestAnimationFrame(loop);

      function buildFrame(cellsOrdered, modeName, styleName, fps, elapsedMs) {
        if (cellsOrdered.length === 0) {
          return {};
        }

        const step = (elapsedMs / 1000) * fps;
        if (modeName === 'blink') {
          return buildBlinkFrame(cellsOrdered, step, styleName);
        }

        if (modeName === 'directional') {
          return buildDirectionalFrame(cellsOrdered, step, styleName);
        }

        return buildSequentialFrame(cellsOrdered, step, styleName);
      }

      function buildBlinkFrame(cellsOrdered, step, styleName) {
        const frame = {};
        if (styleName === 'binary') {
          const opacity = Math.floor(step) % 2 === 0 ? 1 : 0;
          for (const cell of cellsOrdered) {
            frame[cell.key] = opacity;
          }
          return frame;
        }

        const opacity = pulse(step);
        for (const cell of cellsOrdered) {
          frame[cell.key] = opacity;
        }
        return frame;
      }

      function buildSequentialFrame(cellsOrdered, step, styleName) {
        const frame = {};
        if (styleName === 'binary') {
          const index = Math.floor(step) % cellsOrdered.length;
          for (let i = 0; i < cellsOrdered.length; i += 1) {
            frame[cellsOrdered[i].key] = i === index ? 1 : 0;
          }
          return frame;
        }

        const center = step % cellsOrdered.length;
        for (let i = 0; i < cellsOrdered.length; i += 1) {
          const distance = cyclicDistance(i, center, cellsOrdered.length);
          const fade = Math.max(0, 1 - distance / Math.max(cellsOrdered.length / 2, 1));
          frame[cellsOrdered[i].key] = Number(fade.toFixed(3));
        }

        return frame;
      }

      function buildDirectionalFrame(cellsOrdered, step, styleName) {
        const frame = {};
        const maxLayer = Math.max.apply(null, cellsOrdered.map((cell) => cell.layer));
        const layerCount = maxLayer + 1;

        if (styleName === 'binary') {
          const activeLayer = Math.floor(step) % layerCount;
          for (const cell of cellsOrdered) {
            frame[cell.key] = cell.layer === activeLayer ? 1 : 0;
          }
          return frame;
        }

        const waveCenter = step % layerCount;
        for (const cell of cellsOrdered) {
          const distance = cyclicDistance(cell.layer, waveCenter, layerCount);
          const fade = Math.max(0, 1 - distance / Math.max(layerCount / 2, 1));
          frame[cell.key] = Number(fade.toFixed(3));
        }

        return frame;
      }

      function orderCells(activeOnly, modeName, size, dir) {
        if (modeName === 'spinner') {
          const center = (size - 1) / 2;
          return activeOnly
            .map((cell) => {
              const angle = Math.atan2(cell.row - center, cell.col - center);
              return Object.assign({}, cell, { angle });
            })
            .sort((a, b) => a.angle - b.angle);
        }

        if (modeName === 'linear' || modeName === 'blink') {
          return activeOnly.slice().sort((a, b) => a.row - b.row || a.col - b.col);
        }

        if (modeName === 'directional') {
          return activeOnly
            .map((cell) => Object.assign({}, cell, { layer: directionalLayer(cell.row, cell.col, size, dir) }))
            .sort((a, b) => a.layer - b.layer || a.row - b.row || a.col - b.col);
        }

        return [];
      }

      function directionalLayer(row, col, size, dir) {
        if (dir === 'right') {
          return col;
        }
        if (dir === 'left') {
          return size - 1 - col;
        }
        if (dir === 'down') {
          return row;
        }
        return size - 1 - row;
      }

      function pulse(step) {
        const phase = step % 1;
        const value = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
        return Number(value.toFixed(3));
      }

      function cyclicDistance(index, center, len) {
        const raw = Math.abs(index - center);
        return Math.min(raw, len - raw);
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
