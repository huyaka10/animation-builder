import { convertLottieToSvg } from './index.js';

const fileInput = document.querySelector<HTMLInputElement>('#fileInput');
const convertBtn = document.querySelector<HTMLButtonElement>('#convertBtn');
const downloadBtn = document.querySelector<HTMLButtonElement>('#downloadBtn');
const preview = document.querySelector<HTMLDivElement>('#preview');
const status = document.querySelector<HTMLParagraphElement>('#status');

let currentSvg = '';

if (!fileInput || !convertBtn || !downloadBtn || !preview || !status) {
  throw new Error('Required UI elements are missing.');
}

convertBtn.addEventListener('click', () => {
  const file = fileInput.files?.[0];
  if (!file) {
    status.textContent = 'Выберите .json файл.';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = String(reader.result ?? '');
      currentSvg = convertLottieToSvg(json);
      preview.innerHTML = currentSvg;
      status.textContent = 'SVG успешно сгенерирован.';
    } catch (error) {
      status.textContent = `Ошибка конвертации: ${(error as Error).message}`;
    }
  };
  reader.onerror = () => {
    status.textContent = 'Ошибка чтения файла.';
  };
  reader.readAsText(file);
});

downloadBtn.addEventListener('click', () => {
  if (!currentSvg) {
    status.textContent = 'Сначала выполните Convert.';
    return;
  }

  const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'converted.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});
