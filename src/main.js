import { addFrameAfterActive, createInitialState, deleteActiveFrame, duplicateActiveFrame, resetPlayback, toggleCellInActiveFrame } from './frameStore.js';
import { advancePreview } from './engine.js';
import { exportAnimationJson, importAnimationJson } from './exportModule.js';
import { loadProject, saveProject } from './projectStore.js';
import { createRenderer } from './renderer.js';
import { renderTimeline } from './timelineUI.js';
const state=createInitialState(); const persisted=loadProject(); if(persisted){state.animation=persisted.animation;} resetPlayback(state);
const ui={stage:document.querySelector('#stage'),timelineList:document.querySelector('#timelineList'),addFrameBtn:document.querySelector('#addFrameBtn'),duplicateFrameBtn:document.querySelector('#duplicateFrameBtn'),deleteFrameBtn:document.querySelector('#deleteFrameBtn'),frameInfo:document.querySelector('#frameInfo'),fpsSlider:document.querySelector('#fpsSlider'),fpsValue:document.querySelector('#fpsValue'),styleSelect:document.querySelector('#styleSelect'),colorInput:document.querySelector('#colorInput'),previewToggle:document.querySelector('#previewToggle'),exportJsonBtn:document.querySelector('#exportJsonBtn'),importJsonBtn:document.querySelector('#importJsonBtn'),importJsonInput:document.querySelector('#importJsonInput'),exportOutput:document.querySelector('#exportOutput')};
const renderer=createRenderer(ui.stage,state,(r,c)=>{toggleCellInActiveFrame(state,r,c);persist();refreshUi()});
ui.addFrameBtn.onclick=()=>{addFrameAfterActive(state);persist();refreshUi()}; ui.duplicateFrameBtn.onclick=()=>{duplicateActiveFrame(state);persist();refreshUi()}; ui.deleteFrameBtn.onclick=()=>{if(deleteActiveFrame(state)){persist();refreshUi()}};
ui.timelineList.onclick=(e)=>{const li=e.target.closest('li'); if(!li)return; state.activeFrameIndex=Number(li.dataset.index); resetPlayback(state); refreshUi();};
ui.fpsSlider.oninput=(e)=>{state.animation.fps=Number(e.target.value);refreshUi();persist()}; ui.styleSelect.onchange=(e)=>{state.animation.animationStyle=e.target.value;persist()}; ui.colorInput.oninput=(e)=>{state.animation.color=e.target.value;persist()}; ui.previewToggle.onclick=()=>{state.previewRunning=!state.previewRunning;};
ui.exportJsonBtn.onclick=()=>exportAnimationJson(state,ui.exportOutput); ui.importJsonBtn.onclick=()=>ui.importJsonInput.click(); ui.importJsonInput.onchange=async(e)=>{const f=e.target.files?.[0]; if(!f)return; await importAnimationJson(f,state); refreshUi();};
function refreshUi(){renderTimeline(state,ui); ui.frameInfo.textContent=`Frame ${state.activeFrameIndex+1} / ${state.animation.frames.length}`; ui.fpsValue.textContent=String(state.animation.fps); ui.fpsSlider.value=String(state.animation.fps); ui.styleSelect.value=state.animation.animationStyle; ui.colorInput.value=state.animation.color;}
function persist(){saveProject({animation:state.animation,presets:[],selectedPresetId:null});}
let last=performance.now(); const loop=(now)=>{const frame=advancePreview(state,now-last); last=now; renderer.render(frame); requestAnimationFrame(loop)}; requestAnimationFrame(loop); refreshUi();
