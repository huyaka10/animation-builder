import { LottieTrimItem } from '../types/lottie.js';
import { buildCssNumberAnimation } from '../generators/css-animator.js';
import { buildSmilNumberAnimation } from '../generators/smil-animator.js';
import { isKeyframed, staticValue } from '../utils/keyframes.js';

export interface TrimBuildResult {
  dasharray: number;
  dashoffset: number;
  smilAnimation?: string;
  cssAnimation?: { keyframes: string; classRule: string };
}

export function buildTrimPresentation(trim: LottieTrimItem, pathLength: number, fr: number, mode: 'smil' | 'css', animationName: string): TrimBuildResult {
  const start = staticValue(trim.s);
  const end = staticValue(trim.e);
  const offset = staticValue(trim.o);
  const span = Math.max(0, end - start);
  const visible = (span / 100) * pathLength;
  const baseOffset = pathLength * (1 - end / 100) - (offset / 360) * pathLength;

  const result: TrimBuildResult = {
    dasharray: Math.max(0.0001, visible),
    dashoffset: baseOffset,
  };

  const isAnimated = isKeyframed(trim.s) || isKeyframed(trim.e) || isKeyframed(trim.o);
  if (!isAnimated) {
    return result;
  }

  if (mode === 'smil') {
    result.smilAnimation = buildSmilNumberAnimation('stroke-dashoffset', trim.e, fr);
  } else {
    const cssAnim = buildCssNumberAnimation(animationName, 'stroke-dashoffset', trim.e, fr);
    if (cssAnim) {
      result.cssAnimation = cssAnim;
    }
  }

  return result;
}
