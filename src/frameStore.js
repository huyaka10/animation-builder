export const GRID_SIZE = 3;
export const DEFAULT_COLOR = '#5ca7ff';

export function createEmptyFrame(gridSize = GRID_SIZE) {
  return Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => 0));
}

export function cloneFrame(frame) {
  return frame.map((row) => row.slice());
}

export function createInitialState() {
  return {
    gridSize: GRID_SIZE,
    animation: {
      frames: [createEmptyFrame(GRID_SIZE)],
      fps: 12,
      animationStyle: 'binary',
      color: DEFAULT_COLOR
    },
    activeFrameIndex: 0,
    previewRunning: true,
    previewTimeMs: 0,
    playbackFrameIndex: 0
  };
}

export function toggleCellInActiveFrame(state, row, col) {
  const frame = state.animation.frames[state.activeFrameIndex];
  frame[row][col] = frame[row][col] ? 0 : 1;
}

export function addFrameAfterActive(state) {
  const index = state.activeFrameIndex + 1;
  state.animation.frames.splice(index, 0, createEmptyFrame(state.gridSize));
  state.activeFrameIndex = index;
}

export function duplicateActiveFrame(state) {
  const source = state.animation.frames[state.activeFrameIndex];
  const index = state.activeFrameIndex + 1;
  state.animation.frames.splice(index, 0, cloneFrame(source));
  state.activeFrameIndex = index;
}

export function deleteActiveFrame(state) {
  if (state.animation.frames.length <= 1) {
    return false;
  }

  state.animation.frames.splice(state.activeFrameIndex, 1);
  state.activeFrameIndex = Math.min(state.activeFrameIndex, state.animation.frames.length - 1);
  return true;
}

export function moveFrame(state, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return;
  }
  const frames = state.animation.frames;
  if (fromIndex >= frames.length || toIndex >= frames.length) {
    return;
  }

  const [moved] = frames.splice(fromIndex, 1);
  frames.splice(toIndex, 0, moved);

  if (state.activeFrameIndex === fromIndex) {
    state.activeFrameIndex = toIndex;
  } else if (fromIndex < state.activeFrameIndex && toIndex >= state.activeFrameIndex) {
    state.activeFrameIndex -= 1;
  } else if (fromIndex > state.activeFrameIndex && toIndex <= state.activeFrameIndex) {
    state.activeFrameIndex += 1;
  }
}

export function normalizeAnimationPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const fps = Number(payload.fps);
  if (!Number.isFinite(fps) || fps <= 0) {
    return null;
  }

  if (payload.animationStyle !== 'binary' && payload.animationStyle !== 'fade') {
    return null;
  }

  if (typeof payload.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(payload.color)) {
    return null;
  }

  if (!Array.isArray(payload.frames) || payload.frames.length === 0) {
    return null;
  }

  const normalizedFrames = payload.frames.map((frame) => normalizeFrame(frame, GRID_SIZE));
  if (normalizedFrames.some((frame) => frame === null)) {
    return null;
  }

  return {
    frames: normalizedFrames,
    fps,
    animationStyle: payload.animationStyle,
    color: payload.color
  };
}

function normalizeFrame(frame, gridSize) {
  if (!Array.isArray(frame) || frame.length !== gridSize) {
    return null;
  }

  const normalized = [];
  for (let row = 0; row < gridSize; row += 1) {
    if (!Array.isArray(frame[row]) || frame[row].length !== gridSize) {
      return null;
    }
    normalized.push(
      frame[row].map((cell) => (cell === true || cell === 1 ? 1 : 0))
    );
  }

  return normalized;
}
