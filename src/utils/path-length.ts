import { LottiePathData } from '../types/lottie.js';

function cubicPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return mt ** 3 * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t ** 3 * p3;
}

function cubicLength(p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], steps = 20): number {
  let total = 0;
  let prev = p0;
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const point: [number, number] = [
      cubicPoint(t, p0[0], p1[0], p2[0], p3[0]),
      cubicPoint(t, p0[1], p1[1], p2[1], p3[1]),
    ];
    const dx = point[0] - prev[0];
    const dy = point[1] - prev[1];
    total += Math.hypot(dx, dy);
    prev = point;
  }
  return total;
}

export function estimatePathLength(path: LottiePathData): number {
  if (path.v.length < 2) {
    return 0;
  }

  let length = 0;
  for (let i = 1; i < path.v.length; i += 1) {
    const prev = path.v[i - 1];
    const curr = path.v[i];
    length += cubicLength(prev, [prev[0] + path.o[i - 1][0], prev[1] + path.o[i - 1][1]], [curr[0] + path.i[i][0], curr[1] + path.i[i][1]], curr);
  }

  if (path.c) {
    const last = path.v[path.v.length - 1];
    const first = path.v[0];
    length += cubicLength(last, [last[0] + path.o[path.v.length - 1][0], last[1] + path.o[path.v.length - 1][1]], [first[0] + path.i[0][0], first[1] + path.i[0][1]], first);
  }

  return length;
}
