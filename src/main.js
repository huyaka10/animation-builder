const canvas = document.querySelector('#glitch-canvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const CELL = 72;
const ROD_HEIGHT = 8;
const ROD_GAP = 11;

const agentBlueprints = [
  {
    key: 'reviewer',
    label: 'reviewer',
    role: 'плотная проверка',
    anchor: { x: WIDTH * 0.36, y: HEIGHT * 0.38 },
    drift: { x: 8, y: 5, speed: 0.0012 },
    colors: ['#fff8ae', '#ffe957', '#17150a'],
    glow: 'rgba(255, 237, 90, 0.36)',
    nodes: [
      [-1, -1, 0.92], [0, -1, 1], [1, -1, 0.88],
      [-1, 0, 0.95], [0, 0, 1], [1, 0, 0.94],
      [-1, 1, 0.86], [0, 1, 0.96], [1, 1, 0.82],
      [0, -2, 0.72], [2, 0, 0.66],
    ],
  },
  {
    key: 'frontend',
    label: 'frontend',
    role: 'светящийся интерфейс',
    anchor: { x: WIDTH * 0.58, y: HEIGHT * 0.36 },
    drift: { x: 11, y: 7, speed: 0.0015 },
    colors: ['#fff7d2', '#ffd829', '#25200b'],
    glow: 'rgba(255, 222, 58, 0.3)',
    nodes: [
      [-2, 0, 0.7], [-1, 0, 0.84], [0, 0, 1], [1, 0, 0.92],
      [0, -1, 0.78], [1, -1, 0.68], [2, -1, 0.56],
      [-1, 1, 0.74], [0, 1, 0.9], [1, 1, 0.62],
      [0, 2, 0.52],
    ],
  },
  {
    key: 'backend',
    label: 'backend',
    role: 'синий вычислительный слой',
    anchor: { x: WIDTH * 0.59, y: HEIGHT * 0.63 },
    drift: { x: 7, y: 10, speed: 0.001 },
    colors: ['#d6fbff', '#17bff1', '#051b2e'],
    glow: 'rgba(23, 191, 241, 0.32)',
    nodes: [
      [-1, -2, 0.56], [0, -2, 0.68],
      [-1, -1, 0.78], [0, -1, 0.98], [1, -1, 0.72],
      [-2, 0, 0.52], [-1, 0, 0.86], [0, 0, 1], [1, 0, 0.82],
      [0, 1, 0.9], [1, 1, 0.64],
      [0, 2, 0.58],
    ],
  },
  {
    key: 'planner',
    label: 'planner',
    role: 'карта связей',
    anchor: { x: WIDTH * 0.39, y: HEIGHT * 0.65 },
    drift: { x: 10, y: 8, speed: 0.00135 },
    colors: ['#f6fff4', '#7ce8b6', '#071d17'],
    glow: 'rgba(124, 232, 182, 0.28)',
    nodes: [
      [0, -2, 0.5], [-1, -1, 0.7], [0, -1, 0.84], [1, -1, 0.6],
      [-2, 0, 0.46], [-1, 0, 0.8], [0, 0, 1], [1, 0, 0.76], [2, 0, 0.48],
      [-1, 1, 0.64], [0, 1, 0.86], [1, 1, 0.58],
      [0, 2, 0.54],
    ],
  },
];

function hashNoise(x, y, t) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + t * 0.0027) * 43758.5453;
  return value - Math.floor(value);
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

function mixColor(hexA, hexB, amount) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return `rgb(${Math.round(lerp(a.r, b.r, amount))}, ${Math.round(lerp(a.g, b.g, amount))}, ${Math.round(lerp(a.b, b.b, amount))})`;
}

function agentPosition(agent, time) {
  const wobble = Math.sin(time * agent.drift.speed + agent.anchor.x * 0.01);
  const counter = Math.cos(time * agent.drift.speed * 0.73 + agent.anchor.y * 0.01);
  return {
    x: agent.anchor.x + wobble * agent.drift.x,
    y: agent.anchor.y + counter * agent.drift.y,
  };
}

function fillBackground(time) {
  const gradient = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.5, 90, WIDTH * 0.5, HEIGHT * 0.5, WIDTH * 0.78);
  gradient.addColorStop(0, '#41e9ff');
  gradient.addColorStop(0.34, '#119fe8');
  gradient.addColorStop(0.68, '#063d73');
  gradient.addColorStop(1, '#010407');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y += 24) {
    const blockShift = Math.sin(time * 0.0015 + y * 0.025) * 44;
    for (let x = 0; x < WIDTH; x += 48) {
      const n = hashNoise(x, y, time);
      if (n > 0.66) {
        const isBlack = n > 0.87;
        ctx.fillStyle = isBlack ? 'rgba(0, 0, 0, 0.58)' : 'rgba(3, 92, 174, 0.32)';
        ctx.fillRect(x + blockShift - 48, y, 48 * (1 + Math.floor(n * 7)), 22);
      }
    }
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.76)';
  ctx.fillRect(0, HEIGHT * 0.57, WIDTH * 0.18, HEIGHT * 0.13);
  ctx.fillRect(WIDTH * 0.7, HEIGHT * 0.35, WIDTH * 0.26, HEIGHT * 0.22);
  ctx.fillRect(WIDTH * 0.78, HEIGHT * 0.04, WIDTH * 0.2, HEIGHT * 0.22);
  ctx.fillRect(WIDTH * 0.04, HEIGHT * 0.91, WIDTH * 0.18, HEIGHT * 0.08);
}

function drawMolecularLink(x1, y1, x2, y2, color, time, phase = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const pulse = 0.45 + Math.sin(time * 0.006 + phase) * 0.25;

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.22 + pulse * 0.3;
  ctx.fillStyle = color;

  for (let x = 10; x < length - 10; x += 22) {
    const rodWidth = 10 + ((x + phase * 13) % 3) * 5;
    ctx.fillRect(x, -3, rodWidth, 6);
  }

  ctx.globalAlpha = 0.12;
  ctx.fillRect(0, -1, length, 2);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawRodCell(x, y, size, agent, intensity, time, nodeIndex) {
  const flicker = 0.74 + hashNoise(nodeIndex, intensity * 100, time) * 0.34;
  const active = Math.min(1, intensity * flicker);
  const base = mixColor(agent.colors[2], agent.colors[1], active);
  const hot = mixColor(agent.colors[1], agent.colors[0], Math.max(0, active - 0.55) * 1.8);
  const lines = Math.floor(size / ROD_GAP);
  const xJitter = Math.round((hashNoise(x, y, time) - 0.5) * 8);

  ctx.save();
  ctx.shadowColor = agent.glow;
  ctx.shadowBlur = 14 + active * 20;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(x - 2, y - 2, size + 4, size + 4);

  for (let line = 0; line < lines; line += 1) {
    const yy = y + 6 + line * ROD_GAP;
    const stripeNoise = hashNoise(line, nodeIndex, time);
    const localIntensity = Math.min(1, active + (stripeNoise - 0.5) * 0.28);
    const gap = Math.max(3, (1 - localIntensity) * 24);
    const inset = 5 + gap * 0.35;
    const rodWidth = size - inset * 2 - Math.max(0, 1 - localIntensity) * 18;

    ctx.fillStyle = stripeNoise > 0.72 ? hot : base;
    ctx.globalAlpha = 0.56 + localIntensity * 0.44;
    ctx.fillRect(x + inset + xJitter * 0.45, yy, rodWidth, ROD_HEIGHT);

    if (localIntensity < 0.78) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.globalAlpha = (0.8 - localIntensity) * 0.55;
      ctx.fillRect(x + size * 0.58, yy, size * 0.23, ROD_HEIGHT);
    }
  }

  ctx.globalAlpha = 0.18 + active * 0.12;
  ctx.strokeStyle = agent.colors[0];
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawAgent(agent, time, index) {
  const position = agentPosition(agent, time);
  const points = agent.nodes.map(([gx, gy, intensity], nodeIndex) => ({
    x: position.x + gx * CELL + (hashNoise(nodeIndex, index, time) - 0.5) * 14,
    y: position.y + gy * CELL + (hashNoise(index, nodeIndex, time) - 0.5) * 12,
    gx,
    gy,
    intensity,
  }));

  points.forEach((point, pointIndex) => {
    points.slice(pointIndex + 1).forEach((other) => {
      const gridDistance = Math.abs(point.gx - other.gx) + Math.abs(point.gy - other.gy);
      if (gridDistance === 1) {
        drawMolecularLink(
          point.x + CELL * 0.36,
          point.y + CELL * 0.36,
          other.x + CELL * 0.36,
          other.y + CELL * 0.36,
          agent.colors[1],
          time,
          pointIndex + index,
        );
      }
    });
  });

  points.forEach((point, pointIndex) => {
    const pulse = 0.08 * Math.sin(time * 0.005 + pointIndex * 1.7 + index);
    drawRodCell(point.x, point.y, CELL * 0.78, agent, point.intensity + pulse, time, pointIndex + index * 20);
  });

  ctx.save();
  ctx.translate(position.x - CELL * 1.15, position.y + CELL * 2.35);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = agent.colors[0];
  ctx.font = '700 19px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(agent.label, 0, 0);
  ctx.globalAlpha = 0.42;
  ctx.font = '500 13px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(agent.role, 0, 22);
  ctx.restore();
}

function drawInterAgentSignals(time) {
  const centers = agentBlueprints.map((agent) => agentPosition(agent, time));
  const pairs = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];

  pairs.forEach(([a, b], pairIndex) => {
    const start = centers[a];
    const end = centers[b];
    const color = pairIndex % 2 === 0 ? 'rgba(255, 245, 112, 0.72)' : 'rgba(47, 223, 255, 0.66)';
    drawMolecularLink(start.x, start.y, end.x, end.y, color, time, pairIndex * 2.3);

    const progress = (time * 0.00017 + pairIndex * 0.19) % 1;
    const px = lerp(start.x, end.x, progress);
    const py = lerp(start.y, end.y, progress);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillRect(px - 8, py - 4, 28, 8);
    ctx.shadowBlur = 0;
  });
}

function drawHorizontalTears(time) {
  for (let i = 0; i < 36; i += 1) {
    const y = (i * 31 + time * (0.05 + (i % 3) * 0.035)) % HEIGHT;
    const tearHeight = 5 + (i % 4) * 4;
    const offset = Math.sin(time * 0.01 + i) * 36 + (hashNoise(i, y, time) - 0.5) * 120;
    ctx.globalAlpha = 0.2 + (i % 5) * 0.035;
    ctx.drawImage(canvas, 0, y, WIDTH, tearHeight, offset, y, WIDTH, tearHeight);
  }
  ctx.globalAlpha = 1;
}

function drawChromaticEcho(time) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.13;
  ctx.filter = 'blur(1px)';
  ctx.drawImage(canvas, 9 + Math.sin(time * 0.015) * 5, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.19;
  ctx.drawImage(canvas, -11 + Math.cos(time * 0.012) * 5, 0);
  ctx.restore();
}

function drawNoise(time) {
  const image = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const data = image.data;
  for (let i = 0; i < data.length; i += 16) {
    const grain = (Math.random() - 0.5) * 36;
    data[i] += grain;
    data[i + 1] += grain * 1.2;
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
  drawInterAgentSignals(time);
  agentBlueprints.forEach((agent, index) => drawAgent(agent, time, index));
  drawHorizontalTears(time);
  drawChromaticEcho(time);
  drawNoise(time);
  requestAnimationFrame(render);
}

render();
