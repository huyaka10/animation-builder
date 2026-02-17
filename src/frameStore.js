export const GRID_SIZE = 3;
export const DEFAULT_COLOR = '#5ca7ff';

export function createEmptyFrame(gridSize = GRID_SIZE) {
  return Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => 0));
}

export function cloneFrame(frame) {
  return frame.map((row) => row.slice());
}

export function cloneAnimation(animation) {
  return {
    frames: animation.frames.map((frame) => cloneFrame(frame)),
    fps: animation.fps,
    animationStyle: animation.animationStyle,
    color: animation.color
  };
}

export function animationsEqual(a, b) {
  if (!a || !b) {
    return false;
  }
  if (a.fps !== b.fps || a.animationStyle !== b.animationStyle || a.color !== b.color) {
    return false;
  }
  if (a.frames.length !== b.frames.length) {
    return false;
  }

  for (let frameIndex = 0; frameIndex < a.frames.length; frameIndex += 1) {
    const frameA = a.frames[frameIndex];
    const frameB = b.frames[frameIndex];
    if (frameA.length !== frameB.length) {
      return false;
    }

    for (let row = 0; row < frameA.length; row += 1) {
      if (frameA[row].length !== frameB[row].length) {
        return false;
      }
      for (let col = 0; col < frameA[row].length; col += 1) {
        if (frameA[row][col] !== frameB[row][col]) {
          return false;
        }
      }
    }
  }

  return true;
}


function createAnalyzingPreset() {
  return {
    id: 'default-analyzing',
    name: 'Analyzing',
    animation: {
      frames: [
        [
          [0, 0, 0],
          [1, 0, 0],
          [0, 0, 0]
        ],
        [
          [1, 0, 0],
          [0, 1, 0],
          [1, 0, 0]
        ],
        [
          [0, 1, 0],
          [1, 0, 1],
          [0, 1, 0]
        ],
        [
          [0, 0, 1],
          [0, 1, 0],
          [0, 0, 1]
        ],
        [
          [0, 0, 0],
          [0, 0, 1],
          [0, 0, 0]
        ]
      ],
      fps: 4,
      animationStyle: 'Fade',
      color: '#FF8433'
    }
  };
}


function createThinkingPreset() {
  return {
    id: 'default-thinking',
    name: 'Thinking',
    animation: {
      frames: [
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1]
        ],
        [
          [0, 1, 0],
          [1, 0, 1],
          [0, 0, 0]
        ],
        [
          [0, 0, 1],
          [0, 1, 0],
          [1, 0, 0]
        ],
        [
          [0, 0, 0],
          [1, 0, 1],
          [0, 1, 0]
        ]
      ],
      fps: 4,
      animationStyle: 'Fade',
      color: '#6771FC'
    }
  };
}


function createCreatingPreset() {
  return {
    id: 'default-creating',
    name: 'Creating',
    animation: {
      frames: [
        [
          [1, 0, 0],
          [0, 0, 0],
          [0, 0, 0]
        ],
        [
          [0, 1, 0],
          [1, 0, 0],
          [0, 0, 0]
        ],
        [
          [0, 0, 1],
          [0, 1, 0],
          [1, 0, 0]
        ],
        [
          [0, 0, 0],
          [0, 0, 1],
          [0, 1, 0]
        ],
        [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 1]
        ]
      ],
      fps: 4,
      animationStyle: 'Fade',
      color: '#D66386'
    }
  };
}


function createPostingPreset() {
  return {
    id: 'default-posting',
    name: 'Posting',
    animation: {
      frames: [
        [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0]
        ],
        [
          [0, 1, 0],
          [1, 1, 1],
          [0, 1, 0]
        ],
        [
          [1, 1, 1],
          [1, 1, 1],
          [1, 1, 1]
        ],
        [
          [0, 1, 0],
          [1, 1, 1],
          [0, 1, 0]
        ],
        [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0]
        ],
        [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0]
        ]
      ],
      fps: 4,
      animationStyle: 'Fade',
      color: '#33FFA7'
    }
  };
}

export function createInitialState() {
  return {
    gridSize: GRID_SIZE,
    animation: {
      frames: [createEmptyFrame(GRID_SIZE)],
      fps: 12,
      animationStyle: 'Binary',
      color: DEFAULT_COLOR
    },
    activeFrameIndex: 0,
    previewRunning: false,
    playbackCurrentIndex: 0,
    playbackPrevIndex: 0,
    playbackBlend: 0,
    playbackAccumulatorMs: 0,
    presets: [createAnalyzingPreset(), createThinkingPreset(), createCreatingPreset(), createPostingPreset()],
    selectedPresetId: null
  };
}

export function resetPlayback(state) {
  state.playbackCurrentIndex = state.activeFrameIndex;
  state.playbackPrevIndex = state.activeFrameIndex;
  state.playbackBlend = 0;
  state.playbackAccumulatorMs = 0;
}

export function toggleCellInActiveFrame(state, row, col) {
  const frame = state.animation.frames[state.activeFrameIndex];
  frame[row][col] = frame[row][col] ? 0 : 1;
}

export function addFrameAfterActive(state) {
  const index = state.activeFrameIndex + 1;
  state.animation.frames.splice(index, 0, createEmptyFrame(state.gridSize));
  state.activeFrameIndex = index;
  resetPlayback(state);
}

export function duplicateActiveFrame(state) {
  const source = state.animation.frames[state.activeFrameIndex];
  const index = state.activeFrameIndex + 1;
  state.animation.frames.splice(index, 0, cloneFrame(source));
  state.activeFrameIndex = index;
  resetPlayback(state);
}

export function deleteActiveFrame(state) {
  if (state.animation.frames.length <= 1) {
    return false;
  }

  state.animation.frames.splice(state.activeFrameIndex, 1);
  state.activeFrameIndex = Math.min(state.activeFrameIndex, state.animation.frames.length - 1);
  resetPlayback(state);
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
  resetPlayback(state);
}

export function normalizeAnimationPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const fps = Number(payload.fps);
  if (!Number.isFinite(fps) || fps <= 0) {
    return null;
  }

  if (payload.animationStyle !== 'Binary' && payload.animationStyle !== 'Fade') {
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

export function createPresetFromAnimation(animation, existingCount) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `preset-${Date.now()}`,
    name: `Pattern ${existingCount + 1}`,
    animation: cloneAnimation(animation)
  };
}

export function normalizePresets(rawPresets) {
  if (!Array.isArray(rawPresets)) {
    return [];
  }

  return rawPresets
    .map((preset) => {
      if (!preset || typeof preset !== 'object' || typeof preset.id !== 'string' || typeof preset.name !== 'string') {
        return null;
      }

      const source = preset.animation ?? preset;
      const animation = normalizeAnimationPayload(source);
      if (!animation) {
        return null;
      }

      return { id: preset.id, name: preset.name, animation };
    })
    .filter(Boolean);
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
    normalized.push(frame[row].map((cell) => (cell === true || cell === 1 ? 1 : 0)));
  }

  return normalized;
}
