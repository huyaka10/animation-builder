import { cloneFrame } from './frameStore.js';

export function getPreviewFrame(state) {
  const frames = state.animation.frames;
  const count = frames.length;
  const fps = state.animation.fps;
  const step = (state.previewTimeMs / 1000) * fps;

  const fromIndex = Math.floor(step) % count;
  const toIndex = (fromIndex + 1) % count;
  const t = step - Math.floor(step);

  state.playbackFrameIndex = fromIndex;

  if (!state.previewRunning || state.animation.animationStyle === 'binary') {
    return cloneFrame(frames[fromIndex]);
  }

  return interpolateFrames(frames[fromIndex], frames[toIndex], t);
}

function interpolateFrames(a, b, t) {
  const out = [];
  for (let row = 0; row < a.length; row += 1) {
    const rowOut = [];
    for (let col = 0; col < a[row].length; col += 1) {
      rowOut.push(Number((a[row][col] * (1 - t) + b[row][col] * t).toFixed(3)));
    }
    out.push(rowOut);
  }
  return out;
}
