import { getPatternCells } from './patterns.js';

export function getAnimationFrame(state) {
  const ordered = getPatternCells(state.pattern, state.activeCells, state.gridSize, state.direction);
  if (!state.previewRunning || ordered.length === 0) {
    return Object.fromEntries(ordered.map((cell) => [cell.key, 1]));
  }

  const step = (state.timeMs / 1000) * state.fps;

  if (state.pattern === 'blink') {
    return buildBlinkFrame(ordered, step, state.animationStyle);
  }

  if (state.pattern === 'directional') {
    return buildDirectionalFrame(ordered, step, state.animationStyle);
  }

  return buildSequentialFrame(ordered, step, state.animationStyle);
}

function buildBlinkFrame(cells, step, style) {
  const frame = {};
  if (style === 'binary') {
    const opacity = Math.floor(step) % 2 === 0 ? 1 : 0;
    for (const cell of cells) {
      frame[cell.key] = opacity;
    }
    return frame;
  }

  const opacity = pulse(step);
  for (const cell of cells) {
    frame[cell.key] = opacity;
  }
  return frame;
}

function buildSequentialFrame(cells, step, style) {
  const frame = {};

  if (style === 'binary') {
    const index = Math.floor(step) % cells.length;
    for (let i = 0; i < cells.length; i += 1) {
      frame[cells[i].key] = i === index ? 1 : 0;
    }
    return frame;
  }

  const center = step % cells.length;
  for (let i = 0; i < cells.length; i += 1) {
    const distance = cyclicDistance(i, center, cells.length);
    const fade = Math.max(0, 1 - distance / Math.max(cells.length / 2, 1));
    frame[cells[i].key] = Number(fade.toFixed(3));
  }

  return frame;
}

function buildDirectionalFrame(cells, step, style) {
  const frame = {};
  const layerCount = Math.max(...cells.map((cell) => cell.layer)) + 1;

  if (style === 'binary') {
    const activeLayer = Math.floor(step) % layerCount;
    for (const cell of cells) {
      frame[cell.key] = cell.layer === activeLayer ? 1 : 0;
    }
    return frame;
  }

  const waveCenter = step % layerCount;
  for (const cell of cells) {
    const distance = cyclicDistance(cell.layer, waveCenter, layerCount);
    const fade = Math.max(0, 1 - distance / Math.max(layerCount / 2, 1));
    frame[cell.key] = Number(fade.toFixed(3));
  }

  return frame;
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
