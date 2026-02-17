import { normalizeAnimationPayload, normalizePresets } from './frameStore.js';
export const PROJECT_STORAGE_KEY='animationBuilderProject';
export const saveProject=(p)=>localStorage.setItem(PROJECT_STORAGE_KEY,JSON.stringify(p));
export function loadProject(){try{const raw=localStorage.getItem(PROJECT_STORAGE_KEY);if(!raw)return null;const parsed=JSON.parse(raw);const animation=normalizeAnimationPayload(parsed?.animation??parsed);if(!animation)return null;return {animation,presets:normalizePresets(parsed?.presets),selectedPresetId:parsed?.selectedPresetId??null};}catch{return null;}}
