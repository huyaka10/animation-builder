import { getPatternCells } from './patterns.js';

export function getAnimationFrame(state) {
  const ordered = getPatternCells(state.pattern, state.activeCells, state.gridSize);
  if (!state.previewRunning || ordered.length === 0) {
    return Object.fromEntries(ordered.map((cell) => [cell.key, 1]));
  }

  const step = (state.timeMs / 1000) * state.fps;
  const frame = {};

  if (state.animationStyle === 'binary') {
    const index = Math.floor(step) % ordered.length;
    for (let i = 0; i < ordered.length; i += 1) {
      frame[ordered[i].key] = i === index ? 1 : 0;
    }
    return frame;
  }

  const center = step % ordered.length;
  for (let i = 0; i < ordered.length; i += 1) {
    const distance = cyclicDistance(i, center, ordered.length);
    const fade = Math.max(0, 1 - distance / Math.max(ordered.length / 2, 1));
    frame[ordered[i].key] = Number(fade.toFixed(3));
  }

  return frame;
}

function cyclicDistance(index, center, len) {
  const raw = Math.abs(index - center);
  return Math.min(raw, len - raw);
}
