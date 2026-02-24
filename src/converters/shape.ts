import { LottiePathData, LottieShapeItem } from '../types/lottie.js';

function format(n: number): string {
  return Number(n.toFixed(3)).toString();
}

export function lottiePathToSvgD(path: LottiePathData): string {
  if (!path.v.length) {
    return '';
  }

  const commands: string[] = [];
  const first = path.v[0];
  commands.push(`M ${format(first[0])} ${format(first[1])}`);

  for (let index = 1; index < path.v.length; index += 1) {
    const prev = path.v[index - 1];
    const current = path.v[index];
    const prevOut = path.o[index - 1];
    const currentIn = path.i[index];

    commands.push(
      `C ${format(prev[0] + prevOut[0])} ${format(prev[1] + prevOut[1])} ${format(current[0] + currentIn[0])} ${format(current[1] + currentIn[1])} ${format(current[0])} ${format(current[1])}`,
    );
  }

  if (path.c && path.v.length > 1) {
    const lastIndex = path.v.length - 1;
    const last = path.v[lastIndex];
    const lastOut = path.o[lastIndex];
    const firstIn = path.i[0];
    commands.push(
      `C ${format(last[0] + lastOut[0])} ${format(last[1] + lastOut[1])} ${format(first[0] + firstIn[0])} ${format(first[1] + firstIn[1])} ${format(first[0])} ${format(first[1])}`,
    );
    commands.push('Z');
  }

  return commands.join(' ');
}

function rectToPath(size: [number, number], position: [number, number], roundness = 0): LottiePathData {
  const [w, h] = size;
  const [cx, cy] = position;
  const rx = Math.min(roundness, w / 2);
  const ry = Math.min(roundness, h / 2);
  const x = cx - w / 2;
  const y = cy - h / 2;

  const v: [number, number][] = [
    [x + rx, y],
    [x + w - rx, y],
    [x + w, y + ry],
    [x + w, y + h - ry],
    [x + w - rx, y + h],
    [x + rx, y + h],
    [x, y + h - ry],
    [x, y + ry],
  ];

  const zero: [number, number] = [0, 0];
  return { v, i: Array(v.length).fill(zero), o: Array(v.length).fill(zero), c: true };
}

function ellipseToPath(size: [number, number], position: [number, number]): LottiePathData {
  const k = 0.552284749831;
  const [w, h] = size;
  const [cx, cy] = position;
  const rx = w / 2;
  const ry = h / 2;
  return {
    v: [
      [cx, cy - ry],
      [cx + rx, cy],
      [cx, cy + ry],
      [cx - rx, cy],
    ],
    i: [
      [-rx * k, 0],
      [0, -ry * k],
      [rx * k, 0],
      [0, ry * k],
    ],
    o: [
      [rx * k, 0],
      [0, ry * k],
      [-rx * k, 0],
      [0, -ry * k],
    ],
    c: true,
  };
}

export function extractPath(shape: LottieShapeItem): LottiePathData | null {
  if (shape.ty === 'sh' && shape.ks?.k) {
    return shape.ks.k;
  }

  if (shape.ty === 'rc' && shape.s && 'k' in shape.s && Array.isArray(shape.s.k) && shape.s.k.length === 2 && shape.p?.k) {
    return rectToPath(shape.s.k as [number, number], shape.p.k, shape.r?.k ?? 0);
  }

  if (shape.ty === 'el' && shape.s && 'k' in shape.s && Array.isArray(shape.s.k) && shape.s.k.length === 2 && shape.p?.k) {
    return ellipseToPath(shape.s.k as [number, number], shape.p.k);
  }

  return null;
}
