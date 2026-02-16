import { normalizeAnimationPayload } from './frameStore.js';

export const PROJECT_STORAGE_KEY = 'animationBuilderProject';

export function saveProject(animation) {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({ animation }));
}

export function loadProject() {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return normalizeAnimationPayload(parsed?.animation ?? parsed);
  } catch {
    return null;
  }
}
