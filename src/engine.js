import { cloneFrame, createEmptyFrame } from './frameStore.js';
export function advancePreview(state, deltaMs) {
  const frames = state.animation.frames;
  if (!frames.length) return createEmptyFrame(state.gridSize);
  const frameDuration = 1000 / state.animation.fps;
  if (state.previewRunning) {
    state.playbackAccumulatorMs += deltaMs;
    while (state.playbackAccumulatorMs >= frameDuration) {
      state.playbackAccumulatorMs -= frameDuration;
      state.playbackPrevIndex = state.playbackCurrentIndex;
      state.playbackCurrentIndex = (state.playbackCurrentIndex + 1) % frames.length;
      state.activeFrameIndex = state.playbackCurrentIndex;
    }
    state.playbackBlend = state.playbackAccumulatorMs / frameDuration;
  }
  return state.animation.animationStyle === 'Binary' ? cloneFrame(frames[state.playbackCurrentIndex]) : frames[state.playbackCurrentIndex];
}
