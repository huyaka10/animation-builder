import { LottieAnimProp, LottieKeyframe } from '../types/lottie.js';
import { asBezierPair, keyframes } from '../utils/keyframes.js';

function timing(frame: LottieKeyframe<unknown>): string {
  if (frame.h === 1) {
    return 'linear';
  }
  const [ox] = asBezierPair(frame.o?.x, 0.667);
  const [oy] = asBezierPair(frame.o?.y, 0.667);
  const [ix] = asBezierPair(frame.i?.x, 0.333);
  const [iy] = asBezierPair(frame.i?.y, 0.333);
  return `cubic-bezier(${ox}, ${oy}, ${ix}, ${iy})`;
}

export function buildCssNumberAnimation(name: string, cssProperty: string, prop: LottieAnimProp<number>, fr: number): { keyframes: string; classRule: string } | null {
  const frames = keyframes(prop);
  if (!frames.length) {
    return null;
  }

  const start = frames[0].t;
  const end = frames[frames.length - 1].t;
  const durationSec = Math.max(0.001, (end - start) / fr);
  const body = frames
    .map((frame) => {
      const percent = (((frame.t - start) / (end - start || 1)) * 100).toFixed(2);
      return `${percent}% { ${cssProperty}: ${frame.s}; animation-timing-function: ${timing(frame)}; }`;
    })
    .join(' ');

  return {
    keyframes: `@keyframes ${name} { ${body} }`,
    classRule: `animation: ${name} ${durationSec}s infinite both;`,
  };
}
