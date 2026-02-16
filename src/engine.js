import { getPatternCells } from './patterns.js';
import { getCellDelayMs } from './state.js';

export function getAnimationFrame(state) {
  const ordered = getPatternCells(state.pattern, state.activeCells, state.gridSize, state.direction);
  if (!state.previewRunning || ordered.length === 0) {
    return Object.fromEntries(ordered.map((cell) => [cell.key, 1]));
  }

  const step = (state.timeMs / 1000) * state.fps;
  const frame = {};

  if (state.pattern === 'blink') {
    for (const cell of ordered) {
      const delayedStep = step - delayToStep(getCellDelayMs(state, cell.row, cell.col), state.fps);
      frame[cell.key] = state.animationStyle === 'binary' ? (Math.floor(delayedStep) % 2 === 0 ? 1 : 0) : pulse(delayedStep);
    }
    return frame;
  }

  if (state.pattern === 'directional') {
    const layerCount = Math.max(...ordered.map((cell) => cell.layer)) + 1;
    for (const cell of ordered) {
      const delayedStep = step - delayToStep(getCellDelayMs(state, cell.row, cell.col), state.fps);
      if (state.animationStyle === 'binary') {
        const activeLayer = ((Math.floor(delayedStep) % layerCount) + layerCount) % layerCount;
        frame[cell.key] = cell.layer === activeLayer ? 1 : 0;
      } else {
        const waveCenter = mod(delayedStep, layerCount);
        const distance = cyclicDistance(cell.layer, waveCenter, layerCount);
        frame[cell.key] = Number(Math.max(0, 1 - distance / Math.max(layerCount / 2, 1)).toFixed(3));
      }
    }
    return frame;
  }

  const len = ordered.length;
  for (let i = 0; i < len; i += 1) {
    const cell = ordered[i];
    const delayedStep = step - delayToStep(getCellDelayMs(state, cell.row, cell.col), state.fps);

    if (state.animationStyle === 'binary') {
      const activeIndex = ((Math.floor(delayedStep) % len) + len) % len;
      frame[cell.key] = activeIndex === i ? 1 : 0;
    } else {
      const center = mod(delayedStep, len);
      const distance = cyclicDistance(i, center, len);
      frame[cell.key] = Number(Math.max(0, 1 - distance / Math.max(len / 2, 1)).toFixed(3));
    }
  }

  return frame;
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
