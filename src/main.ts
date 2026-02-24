import { convertLottieToSvg } from './index.js';

const fileInput = document.querySelector<HTMLInputElement>('#fileInput');
const convertBtn = document.querySelector<HTMLButtonElement>('#convertBtn');
const modeInput = document.querySelector<HTMLSelectElement>('#mode');
const statusEl = document.querySelector<HTMLParagraphElement>('#status');
const svgText = document.querySelector<HTMLTextAreaElement>('#svgText');
const svgOutput = document.querySelector<HTMLDivElement>('#svgOutput');

if (!fileInput || !convertBtn || !modeInput || !statusEl || !svgText || !svgOutput) {
  throw new Error('UI initialization failed: missing required elements.');
}

convertBtn.addEventListener('click', async () => {
  const file = fileInput.files?.[0];
  if (!file) {
    statusEl.textContent = 'Choose a Lottie JSON file first.';
    statusEl.className = 'error';
    return;
  }

  try {
    const json = await file.text();
    const svg = convertLottieToSvg(json, {
      mode: modeInput.value === 'css' ? 'css' : 'smil',
      pretty: true,
    });

    statusEl.textContent = 'Converted successfully.';
    statusEl.className = '';
    svgText.value = svg;
    svgOutput.innerHTML = svg;
  } catch (error) {
    statusEl.textContent = `Conversion failed: ${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
