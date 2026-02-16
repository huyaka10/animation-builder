import { getAnimationFrame } from './engine.js';
import { createRenderer } from './renderer.js';
import { createInitialState, parseCellKey, toggleCell } from './state.js';

const state = createInitialState();

const ui = {
  svg: document.querySelector('#stage'),
  fpsSlider: document.querySelector('#fpsSlider'),
  fpsValue: document.querySelector('#fpsValue'),
  styleSelect: document.querySelector('#styleSelect'),
  patternSelect: document.querySelector('#patternSelect'),
  previewToggle: document.querySelector('#previewToggle'),
  exportBtn: document.querySelector('#exportBtn'),
  exportOutput: document.querySelector('#exportOutput')
};

const renderer = createRenderer(ui.svg, state, (row, col) => {
  toggleCell(state, row, col);
});

ui.fpsSlider.addEventListener('input', (event) => {
  state.fps = Number(event.target.value);
  ui.fpsValue.textContent = String(state.fps);
});

ui.styleSelect.addEventListener('change', (event) => {
  state.animationStyle = event.target.value;
});

ui.patternSelect.addEventListener('change', (event) => {
  state.pattern = event.target.value;
});

ui.previewToggle.addEventListener('click', () => {
  state.previewRunning = !state.previewRunning;
  ui.previewToggle.textContent = state.previewRunning ? 'Pause Preview' : 'Start Preview';
});

ui.exportBtn.addEventListener('click', () => {
  const payload = {
    gridSize: state.gridSize,
    activeCells: [...state.activeCells].map((key) => parseCellKey(key)),
    speed: state.fps,
    animationStyle: state.animationStyle,
    selectedPattern: state.pattern
  };

  ui.exportOutput.textContent = JSON.stringify(payload, null, 2);
});

let last = performance.now();
function loop(now) {
  const delta = now - last;
  last = now;
  state.timeMs += delta;
  renderer.render(getAnimationFrame(state));
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
