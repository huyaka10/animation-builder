import { normalizeAnimationPayload, normalizePresets } from './frameStore.js';

export const PROJECT_STORAGE_KEY = 'animationBuilderProject';

export function saveProject(project) {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
}

export function loadProject() {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const animation = normalizeAnimationPayload(parsed?.animation ?? parsed);
    if (!animation) {
      return null;
    }

    const presets = normalizePresets(parsed?.presets);
    return { animation, presets };
  } catch {
    return null;
  }
}
