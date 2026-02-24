import { LottieAnimProp, LottieKeyframe } from '../types/lottie.js';

function isKeyframeObject(value: unknown): value is LottieKeyframe<unknown> {
  return Boolean(value && typeof value === 'object' && 't' in (value as Record<string, unknown>) && 's' in (value as Record<string, unknown>));
}

export function isKeyframed<T>(prop: LottieAnimProp<T>): boolean {
  return Array.isArray(prop.k) && prop.k.length > 0 && isKeyframeObject(prop.k[0]);
}

export function staticValue<T>(prop: LottieAnimProp<T>): T {
  if (isKeyframed(prop)) {
    const frames = prop.k as LottieKeyframe<T>[];
    return frames[0].s;
  }
  return prop.k as T;
}

export function keyframes<T>(prop: LottieAnimProp<T>): LottieKeyframe<T>[] {
  if (!isKeyframed(prop)) {
    return [];
  }
  return prop.k as LottieKeyframe<T>[];
}

export function frameToSeconds(frame: number, fr: number): number {
  return frame / fr;
}

export function asBezierPair(value: number | number[] | undefined, fallback: number): [number, number] {
  if (Array.isArray(value)) {
    return [value[0] ?? fallback, value[1] ?? fallback];
  }
  return [value ?? fallback, value ?? fallback];
}
