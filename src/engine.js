import { cloneFrame } from './frameStore.js';

export function advancePreview(state, deltaMs) {
  const frames = state.animation.frames;
  const frameCount = frames.length;
  if (frameCount === 0) {
    return createBlankFrame(state.gridSize);
  }

  const frameDuration = 1000 / state.animation.fps;

  if (state.previewRunning) {
    state.playbackAccumulatorMs += deltaMs;

    while (state.playbackAccumulatorMs >= frameDuration) {
      state.playbackAccumulatorMs -= frameDuration;
      state.playbackPrevIndex = state.playbackCurrentIndex;
      state.playbackCurrentIndex = (state.playbackCurrentIndex + 1) % frameCount;
      state.activeFrameIndex = state.playbackCurrentIndex;
    }

    state.playbackBlend = frameDuration > 0 ? state.playbackAccumulatorMs / frameDuration : 0;
  }

  if (state.animation.animationStyle === 'Binary') {
    return cloneFrame(frames[state.playbackCurrentIndex]);
  }

  return interpolateFrames(
    frames[state.playbackPrevIndex],
    frames[state.playbackCurrentIndex],
    state.playbackBlend
  );
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

function createBlankFrame(gridSize) {
  return Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => 0));
}
