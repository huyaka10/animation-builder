import { cloneAnimation, normalizeAnimationPayload, normalizePresets } from './frameStore.js';

export const PROJECT_STORAGE_KEY = 'animationBuilderProject';

export function saveProject(project) {
  const payload = {
    animation: cloneAnimation(project.animation),
    presets: project.presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      frames: preset.animation.frames,
      fps: preset.animation.fps,
      animationStyle: preset.animation.animationStyle,
      color: preset.animation.color,
      glow: Number(preset.animation.glow ?? 0),
      rows: preset.animation.frames[0]?.length ?? 0,
      cols: preset.animation.frames[0]?.[0]?.length ?? 0
    })),
    selectedPresetId: project.selectedPresetId
  };

  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(payload));
}

export function loadProject() {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const animation = normalizeAnimationPayload(parsed?.animation);
    const presets = normalizePresets(parsed?.presets);
    const selectedPresetId =
      typeof parsed?.selectedPresetId === 'string' && presets.some((preset) => preset.id === parsed.selectedPresetId)
        ? parsed.selectedPresetId
        : null;

    if (!animation) {
      return { presets, selectedPresetId };
    }

    return { animation, presets, selectedPresetId };
  } catch {
    return null;
  }
}
