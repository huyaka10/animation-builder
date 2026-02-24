import { LottieAnimProp, LottieKeyframe } from '../types/lottie.js';
import { asBezierPair, frameToSeconds, keyframes } from '../utils/keyframes.js';

function linearOrSpline(frame: LottieKeyframe<unknown>): string {
  if (frame.h === 1) {
    return '0 0 1 1';
  }

  const [ox] = asBezierPair(frame.o?.x, 0.667);
  const [oy] = asBezierPair(frame.o?.y, 0.667);
  const [ix] = asBezierPair(frame.i?.x, 0.333);
  const [iy] = asBezierPair(frame.i?.y, 0.333);

  return `${ox} ${oy} ${ix} ${iy}`;
}

export function buildSmilNumberAnimation(attributeName: string, prop: LottieAnimProp<number>, fr: number): string {
  const frames = keyframes(prop);
  if (!frames.length) {
    return '';
  }

  const beginFrame = frames[0].t;
  const endFrame = frames[frames.length - 1].t;
  const duration = Math.max(0.001, frameToSeconds(endFrame - beginFrame, fr));
  const values = frames.map((f) => f.s).join(';');
  const keyTimes = frames.map((f) => ((f.t - beginFrame) / (endFrame - beginFrame || 1)).toFixed(4)).join(';');
  const splines = frames.slice(0, -1).map((f) => linearOrSpline(f)).join(';');

  return `<animate attributeName="${attributeName}" dur="${duration}s" repeatCount="indefinite" calcMode="spline" values="${values}" keyTimes="${keyTimes}" keySplines="${splines}" fill="freeze" />`;
}
