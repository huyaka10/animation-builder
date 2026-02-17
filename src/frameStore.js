export const GRID_SIZE = 3;
export const DEFAULT_COLOR = '#5ca7ff';
export const createEmptyFrame = (n = GRID_SIZE) => Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
export const cloneFrame = (f) => f.map((r) => r.slice());
export function createInitialState() {
  return { gridSize: GRID_SIZE, animation: { frames: [createEmptyFrame()], fps: 12, animationStyle: 'Binary', color: DEFAULT_COLOR }, activeFrameIndex: 0, previewRunning: true, playbackCurrentIndex: 0, playbackPrevIndex: 0, playbackBlend: 0, playbackAccumulatorMs: 0, presets: [], selectedPresetId: null };
}
export function resetPlayback(state){state.playbackCurrentIndex=state.activeFrameIndex;state.playbackPrevIndex=state.activeFrameIndex;state.playbackBlend=0;state.playbackAccumulatorMs=0}
export function toggleCellInActiveFrame(state,row,col){const f=state.animation.frames[state.activeFrameIndex];f[row][col]=f[row][col]?0:1}
export function addFrameAfterActive(state){const i=state.activeFrameIndex+1;state.animation.frames.splice(i,0,createEmptyFrame(state.gridSize));state.activeFrameIndex=i;resetPlayback(state)}
export function duplicateActiveFrame(state){const i=state.activeFrameIndex+1;state.animation.frames.splice(i,0,cloneFrame(state.animation.frames[state.activeFrameIndex]));state.activeFrameIndex=i;resetPlayback(state)}
export function deleteActiveFrame(state){if(state.animation.frames.length<=1)return false;state.animation.frames.splice(state.activeFrameIndex,1);state.activeFrameIndex=Math.min(state.activeFrameIndex,state.animation.frames.length-1);resetPlayback(state);return true}
export function moveFrame(state,from,to){if(from===to)return;const m=state.animation.frames.splice(from,1)[0];state.animation.frames.splice(to,0,m);state.activeFrameIndex=to;resetPlayback(state)}
export function cloneAnimation(a){return {frames:a.frames.map(cloneFrame),fps:a.fps,animationStyle:a.animationStyle,color:a.color}}
export function animationsEqual(a,b){return JSON.stringify(a)===JSON.stringify(b)}
export function createPresetFromAnimation(animation,count){return {id:`preset-${Date.now()}`,name:`Pattern ${count+1}`,animation:cloneAnimation(animation)}}
export function normalizeAnimationPayload(payload){if(!payload||!Array.isArray(payload.frames))return null;return {frames:payload.frames,fps:Number(payload.fps)||12,animationStyle:payload.animationStyle==='Fade'?'Fade':'Binary',color:payload.color||DEFAULT_COLOR}}
export function normalizePresets(raw){return Array.isArray(raw)?raw:[]}
