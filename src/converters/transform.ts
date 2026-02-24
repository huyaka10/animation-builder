import { LottieTransform } from '../types/lottie.js';
import { buildCssNumberAnimation } from '../generators/css-animator.js';
import { buildSmilNumberAnimation } from '../generators/smil-animator.js';
import { isKeyframed, staticValue } from '../utils/keyframes.js';

export interface TransformResult {
  transform: string;
  opacity: number;
  origin: string;
  opacitySmil?: string;
  opacityCss?: { keyframes: string; classRule: string };
}

export function buildTransform(ks: LottieTransform | undefined, fr: number, mode: 'smil' | 'css', animationName: string): TransformResult {
  if (!ks) {
    return { transform: '', opacity: 1, origin: '0 0' };
  }

  const p = staticValue(ks.p) as [number, number];
  const s = staticValue(ks.s) as [number, number];
  const a = staticValue(ks.a) as [number, number];
  const rotation = ks.r ? staticValue(ks.r) : ks.rz ? staticValue(ks.rz) : 0;
  const opacity = staticValue(ks.o) / 100;

  const transform = `translate(${p[0]} ${p[1]}) rotate(${rotation}) scale(${s[0] / 100} ${s[1] / 100}) translate(${-a[0]} ${-a[1]})`;

  const result: TransformResult = {
    transform,
    opacity,
    origin: `${a[0]} ${a[1]}`,
  };

  if (isKeyframed(ks.o)) {
    if (mode === 'smil') {
      result.opacitySmil = buildSmilNumberAnimation('opacity', ks.o, fr);
    } else {
      const cssAnim = buildCssNumberAnimation(animationName, 'opacity', ks.o, fr);
      if (cssAnim) result.opacityCss = cssAnim;
    }
  }

  return result;
}
