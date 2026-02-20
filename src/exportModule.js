import { normalizeAnimationPayload } from './frameStore.js';

export function exportAnimationJson(state, outputEl) {
  const payload = {
    frames: state.animation.frames,
    fps: state.animation.fps,
    animationStyle: state.animation.animationStyle,
    color: state.animation.color,
    glow: Number(state.animation.glow ?? 0)
  };
  outputEl.textContent = JSON.stringify(payload, null, 2);
  downloadText(JSON.stringify(payload, null, 2), 'animation.json', 'application/json');
}

export async function importAnimationJson(file, state) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const normalized = normalizeAnimationPayload(parsed?.animation ?? parsed);
  if (!normalized) {
    throw new Error('Invalid animation JSON format');
  }

  state.animation = normalized;
  state.activeFrameIndex = 0;
  state.playbackCurrentIndex = 0;
  state.playbackPrevIndex = 0;
  state.playbackBlend = 0;
  state.playbackAccumulatorMs = 0;
}

export function exportStandaloneSvg(state) {
  const gridSize = state.gridSize;
  const cellSize = 90;
  const gap = 8;
  const corner = 9;
  const padding = 20;
  const totalSize = gridSize * cellSize + (gridSize - 1) * gap;
  const viewSize = totalSize + padding * 2;

  const rects = [];
  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      const x = padding + col * (cellSize + gap);
      const y = padding + row * (cellSize + gap);
      rects.push(
        `<rect data-row="${row}" data-col="${col}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${corner}" fill="${state.animation.color}" fill-opacity="0" />`
      );
    }
  }

  const payload = {
    frames: state.animation.frames,
    fps: state.animation.fps,
    animationStyle: state.animation.animationStyle,
    color: state.animation.color,
    glow: Number(state.animation.glow ?? 0),
    gridSize
  };

  const data = JSON.stringify(payload).replace(/</g, '\\u003c');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  ${rects.join('\n  ')}
  <script><![CDATA[
    (function () {
      const animation = ${data};
      const cells = Array.from(document.documentElement.querySelectorAll('rect'));
      const frames = animation.frames;
      const count = frames.length;
      const fps = animation.fps;
      const style = animation.animationStyle;
      const color = animation.color;
      const glow = Number(animation.glow || 0);
      const frameDuration = 1000 / fps;
      let last = performance.now();
      let accumulator = 0;
      let current = 0;
      let previous = 0;
      let blend = 0;

      for (const cell of cells) {
        cell.setAttribute('fill', color);
      }

      function loop(now) {
        const delta = now - last;
        last = now;
        accumulator += delta;

        while (accumulator >= frameDuration) {
          accumulator -= frameDuration;
          previous = current;
          current = (current + 1) % count;
        }

        blend = frameDuration > 0 ? accumulator / frameDuration : 0;

        for (const cell of cells) {
          const r = Number(cell.getAttribute('data-row'));
          const c = Number(cell.getAttribute('data-col'));
          const a = frames[previous][r][c] ? 1 : 0;
          const b = frames[current][r][c] ? 1 : 0;
          const value = style === 'Binary' ? b : Number((a * (1 - blend) + b * blend).toFixed(3));
          cell.setAttribute('fill-opacity', String(value));
          cell.style.filter = value > 0 && glow > 0 ? 'drop-shadow(0 0 ' + glow + 'px ' + color + ')' : 'none';
        }

        requestAnimationFrame(loop);
      }

      requestAnimationFrame(loop);
    })();
  ]]></script>
</svg>`;

  downloadText(svg, 'animation.svg', 'image/svg+xml');
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
