import { LottieTransform } from '../types/lottie.js';
import { staticValue } from '../utils/keyframes.js';

export interface TransformResult {
  transform: string;
  opacity: number;
  origin: string;
}

export function buildTransform(ks: LottieTransform | undefined, _fr: number): TransformResult {
  if (!ks) return { transform: '', opacity: 1, origin: '0 0' };

  const p = staticValue(ks.p) as [number, number];
  const s = staticValue(ks.s) as [number, number];
  const a = staticValue(ks.a) as [number, number];
  const rotation = ks.r ? staticValue(ks.r) : ks.rz ? staticValue(ks.rz) : 0;
  const opacity = staticValue(ks.o) / 100;

  return {
    transform: `translate(${p[0]} ${p[1]}) rotate(${rotation}) scale(${s[0] / 100} ${s[1] / 100}) translate(${-a[0]} ${-a[1]})`,
    opacity,
    origin: `${a[0]} ${a[1]}`,
  };
}
