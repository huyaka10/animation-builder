const canvas = document.querySelector('#glitch-canvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const BLOCK = 24;

const palette = {
  cyan: '#17c6ef',
  blue: '#0a68bf',
  navy: '#061228',
  dark: '#03070a',
  green: '#0f5c45',
  yellow: '#f4e65c',
  cream: '#fff3ac',
  white: '#f7fbec',
  shadow: '#111821',
};

const sprite = [
  '....................',
  '..........YYYY......',
  '........YYYYGG......',
  '......GGYYYYGG......',
  '......GGBBBB........',
  '.....GGYYYYYYGG.....',
  '....GGYYYYYYWWGG....',
  '....YYBBWWWWYYGG....',
  '...YYYYBWWWBYYYGG...',
  '..WWYYYYBBYYYYGG....',
  '..WWWWWWBBYYYYG.....',
  '..WWWWWWYYBBB.......',
  '....WWYYYYBG........',
  '.....YYYYBB.........',
  '......GGGG..........',
  '....................',
];

const spriteColors = {
  Y: palette.yellow,
  W: palette.white,
  B: palette.shadow,
  G: palette.green,
};

function hashNoise(x, y, t) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + t * 0.0027) * 43758.5453;
  return value - Math.floor(value);
}

function fillBackground(time) {
  const gradient = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.48, 80, WIDTH * 0.5, HEIGHT * 0.48, WIDTH * 0.75);
  gradient.addColorStop(0, '#38e6ff');
  gradient.addColorStop(0.38, '#109fe4');
  gradient.addColorStop(0.72, '#053767');
  gradient.addColorStop(1, '#010408');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y += BLOCK) {
    for (let x = 0; x < WIDTH; x += BLOCK) {
      const n = hashNoise(x, y, time);
      if (n > 0.72) {
        ctx.fillStyle = n > 0.88 ? 'rgba(0,0,0,0.62)' : 'rgba(9,93,169,0.38)';
        const width = BLOCK * (2 + Math.floor(n * 8));
        ctx.fillRect(x - BLOCK, y, width, BLOCK);
      }
    }
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, HEIGHT * 0.57, WIDTH * 0.22, HEIGHT * 0.12);
  ctx.fillRect(WIDTH * 0.68, HEIGHT * 0.36, WIDTH * 0.28, HEIGHT * 0.2);
  ctx.fillRect(WIDTH * 0.78, HEIGHT * 0.03, WIDTH * 0.2, HEIGHT * 0.22);
}

function drawSprite(time) {
  const pixel = 42;
  const startX = WIDTH * 0.5 - (sprite[0].length * pixel) / 2;
  const startY = HEIGHT * 0.48 - (sprite.length * pixel) / 2;
  const jitterX = Math.round(Math.sin(time * 0.026) * 9 + (hashNoise(1, 2, time) - 0.5) * 20);
  const jitterY = Math.round(Math.sin(time * 0.017) * 5);

  sprite.forEach((row, rowIndex) => {
    const rowShift = Math.round((hashNoise(rowIndex, 9, time) - 0.5) * 32);
    [...row].forEach((cell, columnIndex) => {
      if (cell === '.') return;

      const x = startX + columnIndex * pixel + jitterX + rowShift;
      const y = startY + rowIndex * pixel + jitterY;
      ctx.fillStyle = spriteColors[cell];
      ctx.fillRect(x, y, pixel + 5, pixel + 5);

      if (hashNoise(columnIndex, rowIndex, time) > 0.68) {
        ctx.fillStyle = 'rgba(255, 255, 210, 0.45)';
        ctx.fillRect(x - pixel * 0.6, y + pixel * 0.16, pixel * 1.7, pixel * 0.28);
      }
    });
  });
}

function drawHorizontalTears(time) {
  for (let i = 0; i < 32; i += 1) {
    const y = (i * 37 + time * (0.06 + (i % 3) * 0.04)) % HEIGHT;
    const tearHeight = 6 + (i % 4) * 5;
    const offset = Math.sin(time * 0.01 + i) * 40 + (hashNoise(i, y, time) - 0.5) * 110;
    ctx.globalAlpha = 0.24 + (i % 5) * 0.035;
    ctx.drawImage(canvas, 0, y, WIDTH, tearHeight, offset, y, WIDTH, tearHeight);
  }
  ctx.globalAlpha = 1;
}

function drawChromaticEcho(time) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.16;
  ctx.filter = 'blur(1px)';
  ctx.drawImage(canvas, 8 + Math.sin(time * 0.015) * 4, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.18;
  ctx.drawImage(canvas, -10 + Math.cos(time * 0.012) * 5, 0);
  ctx.restore();
}

function drawNoise(time) {
  const image = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const data = image.data;
  for (let i = 0; i < data.length; i += 16) {
    const grain = (Math.random() - 0.5) * 38;
    data[i] += grain;
    data[i + 1] += grain * 1.25;
    data[i + 2] += grain * 1.45;
  }
  ctx.putImageData(image, 0, 0);

  ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.abs(Math.sin(time * 0.004)) * 0.025})`;
  for (let y = 0; y < HEIGHT; y += 18) {
    ctx.fillRect(0, y, WIDTH, 1);
  }
}

function render(time = 0) {
  fillBackground(time);
  drawSprite(time);
  drawHorizontalTears(time);
  drawChromaticEcho(time);
  drawNoise(time);
  requestAnimationFrame(render);
}

render();
