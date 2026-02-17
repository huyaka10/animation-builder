import { normalizeAnimationPayload } from './frameStore.js';
export function exportAnimationJson(state, outputEl){const payload={...state.animation};outputEl.textContent=JSON.stringify(payload,null,2)}
export async function importAnimationJson(file,state){const parsed=JSON.parse(await file.text());const n=normalizeAnimationPayload(parsed?.animation??parsed);if(!n)throw new Error('Invalid animation JSON format');state.animation=n;state.activeFrameIndex=0;}
export function exportStandaloneSvg(){/* noop */}
