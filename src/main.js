const canvas = document.querySelector('#glitch-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const BLOCK = 24;
const ROD_STEP = 12;
const ROD_HEIGHT = 5;

const colorSets = {
  blue: ['#061225', '#0758b5', '#12c8ef', '#8bf3ff'],
  yellow: ['#1b1709', '#8b7715', '#f3de3f', '#fff7b4'],
  white: ['#2a2b28', '#cddad7', '#fffceb', '#ffffff'],
  green: ['#02170f', '#0a4d35', '#188765', '#8cf4bb'],
  black: ['#000000', '#020506', '#071217', '#111b1f'],
};

const patches = [
  { x: 0.27, y: 0.23, w: 0.12, h: 0.42, type: 'blue', intensity: 0.7 },
  { x: 0.32, y: 0.18, w: 0.09, h: 0.28, type: 'green', intensity: 0.58 },
  { x: 0.41, y: 0.18, w: 0.2, h: 0.13, type: 'yellow', intensity: 0.8 },
  { x: 0.47, y: 0.15, w: 0.12, h: 0.22, type: 'green', intensity: 0.56 },
  { x: 0.31, y: 0.32, w: 0.42, h: 0.14, type: 'yellow', intensity: 0.9 },
  { x: 0.27, y: 0.41, w: 0.38, h: 0.16, type: 'yellow', intensity: 0.82 },
  { x: 0.36, y: 0.43, w: 0.17, h: 0.08, type: 'blue', intensity: 0.65 },
  { x: 0.54, y: 0.42, w: 0.06, h: 0.13, type: 'white', intensity: 0.94 },
  { x: 0.62, y: 0.41, w: 0.07, h: 0.16, type: 'green', intensity: 0.52 },
  { x: 0.23, y: 0.55, w: 0.36, h: 0.21, type: 'white', intensity: 0.95 },
  { x: 0.26, y: 0.52, w: 0.18, h: 0.12, type: 'yellow', intensity: 0.84 },
  { x: 0.48, y: 0.54, w: 0.15, h: 0.16, type: 'yellow', intensity: 0.76 },
  { x: 0.58, y: 0.57, w: 0.08, h: 0.17, type: 'green', intensity: 0.52 },
  { x: 0.38, y: 0.73, w: 0.09, h: 0.12, type: 'yellow', intensity: 0.78 },
  { x: 0.49, y: 0.7, w: 0.06, h: 0.18, type: 'blue', intensity: 0.6 },
  { x: 0.29, y: 0.76, w: 0.06, h: 0.12, type: 'green', intensity: 0.55 },
  { x: 0.07, y: 0.31, w: 0.1, h: 0.1, type: 'black', intensity: 0.75 },
  { x: 0.02, y: 0.56, w: 0.18, h: 0.13, type: 'black', intensity: 0.88 },
  { x: 0.76, y: 0.03, w: 0.22, h: 0.26, type: 'black', intensity: 0.85 },
  { x: 0.71, y: 0.38, w: 0.24, h: 0.2, type: 'black', intensity: 0.72 },
  { x: 0.78, y: 0.58, w: 0.2, h: 0.2, type: 'black', intensity: 0.66 },
  { x: 0.04, y: 0.88, w: 0.16, h: 0.1, type: 'black', intensity: 0.72 },
];

function hashNoise(x, y, t = 0) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + t * 0.0021) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function mixRgb(a, b, amount) {
  return {
    r: Math.round(lerp(a.r, b.r, amount)),
    g: Math.round(lerp(a.g, b.g, amount)),
    b: Math.round(lerp(a.b, b.b, amount)),
  };
}

function rgbString({ r, g, b }, alpha = 1) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function paletteColor(type, intensity, swap) {
  const source = colorSets[type] ?? colorSets.blue;
  const targetType = type === 'blue' ? 'yellow' : type === 'yellow' ? 'blue' : type;
  const target = colorSets[targetType] ?? source;
  const scaled = clamp(intensity) * (source.length - 1);
  const index = Math.min(source.length - 2, Math.floor(scaled));
  const amount = scaled - index;
  const a = mixRgb(hexToRgb(source[index]), hexToRgb(source[index + 1]), amount);
  const b = mixRgb(hexToRgb(target[index]), hexToRgb(target[index + 1]), amount);
  return mixRgb(a, b, swap);
}

function drawRodBlock(x, y, width, height, type, intensity, time, phase = 0) {
  const rows = Math.ceil(height / ROD_STEP);
  const swapWave = (Math.sin(time * 0.0014 + x * 0.008 + y * 0.004 + phase) + 1) * 0.5;
  const swap = (type === 'blue' || type === 'yellow') ? Math.pow(swapWave, 3) * 0.72 : 0;
  const horizontalJitter = Math.round((hashNoise(x, y, time) - 0.5) * 14);

  for (let row = 0; row < rows; row += 1) {
    const yy = y + row * ROD_STEP;
    const noise = hashNoise(row + phase * 10, x + y, time);
    const local = clamp(intensity + (noise - 0.5) * 0.34);
    const inset = lerp(3, 22, 1 - local) + (noise > 0.82 ? 14 : 0);
    const rodWidth = Math.max(4, width - inset * 2 + (noise - 0.5) * 20);
    const alpha = clamp(0.5 + local * 0.5);
    const color = paletteColor(type, local, swap);

    ctx.fillStyle = rgbString(color, alpha);
    ctx.fillRect(x + inset + horizontalJitter, yy, rodWidth, ROD_HEIGHT + (noise > 0.72 ? 2 : 0));

    if (noise > 0.74 && type !== 'black') {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.18 + noise * 0.25})`;
      ctx.fillRect(x + inset + rodWidth * 0.58, yy, rodWidth * 0.36, ROD_HEIGHT + 2);
    }

    if (noise < 0.12 && (type === 'yellow' || type === 'white')) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.fillRect(x + inset + rodWidth * 0.12, yy, rodWidth * 0.42, ROD_HEIGHT + 1);
    }
  }
}

function drawBackground(time) {
  const gradient = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.45, 80, WIDTH * 0.5, HEIGHT * 0.5, WIDTH * 0.78);
  gradient.addColorStop(0, '#32e2ff');
  gradient.addColorStop(0.35, '#109fe4');
  gradient.addColorStop(0.66, '#06396a');
  gradient.addColorStop(1, '#010407');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y += BLOCK) {
    const wave = Math.sin(time * 0.001 + y * 0.018) * 34;
    for (let x = -BLOCK; x < WIDTH; x += BLOCK * 2) {
      const n = hashNoise(x, y, time);
      if (n > 0.5) {
        const width = BLOCK * (1 + Math.floor(n * 8));
        const type = n > 0.84 ? 'black' : 'blue';
        drawRodBlock(x + wave, y, width, BLOCK, type, n > 0.84 ? 0.82 : 0.46 + n * 0.26, time, n * 5);
      }
    }
  }
}

function drawMainShape(time) {
  patches.forEach((patch, index) => {
    const x = patch.x * WIDTH + Math.sin(time * 0.0012 + index) * 7;
    const y = patch.y * HEIGHT + Math.cos(time * 0.001 + index * 1.7) * 5;
    const w = patch.w * WIDTH;
    const h = patch.h * HEIGHT;
    drawRodBlock(x, y, w, h, patch.type, patch.intensity, time, index);
  });
}

function drawSoftBleed(time) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.11;
  ctx.filter = 'blur(10px)';
  patches.forEach((patch, index) => {
    if (patch.type === 'black') return;
    const color = paletteColor(patch.type, patch.intensity, index % 2 ? 0.28 : 0.08);
    ctx.fillStyle = rgbString(color, 1);
    ctx.fillRect(patch.x * WIDTH - 18, patch.y * HEIGHT - 18, patch.w * WIDTH + 36, patch.h * HEIGHT + 36);
  });
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
}

function drawHorizontalTears(time) {
  for (let i = 0; i < 34; i += 1) {
    const y = (i * 34 + time * (0.045 + (i % 4) * 0.02)) % HEIGHT;
    const tearHeight = 4 + (i % 5) * 3;
    const offset = Math.sin(time * 0.012 + i) * 42 + (hashNoise(i, y, time) - 0.5) * 92;
    ctx.globalAlpha = 0.16 + (i % 6) * 0.035;
    ctx.drawImage(canvas, 0, y, WIDTH, tearHeight, offset, y, WIDTH, tearHeight);
  }
  ctx.globalAlpha = 1;
}

function drawChromaticEcho(time) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.11;
  ctx.filter = 'blur(1px)';
  ctx.drawImage(canvas, 8 + Math.sin(time * 0.014) * 4, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.18;
  ctx.drawImage(canvas, -10 + Math.cos(time * 0.011) * 5, 0);
  ctx.restore();
  ctx.filter = 'none';
}

function drawFineNoise(time) {
  const image = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const data = image.data;
  for (let i = 0; i < data.length; i += 16) {
    const grain = (Math.random() - 0.5) * 34;
    data[i] += grain * 0.9;
    data[i + 1] += grain * 1.18;
    data[i + 2] += grain * 1.4;
  }
  ctx.putImageData(image, 0, 0);

  ctx.fillStyle = `rgba(255, 255, 255, ${0.025 + Math.abs(Math.sin(time * 0.004)) * 0.018})`;
  for (let y = 0; y < HEIGHT; y += 18) {
    ctx.fillRect(0, y, WIDTH, 1);
  }
}

function render(time = 0) {
  drawBackground(time);
  drawSoftBleed(time);
  drawMainShape(time);
  drawHorizontalTears(time);
  drawChromaticEcho(time);
  drawFineNoise(time);
  requestAnimationFrame(render);
}

render();
