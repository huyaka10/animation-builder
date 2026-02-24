import { LottieTrimItem } from '../types/lottie.js';
import { keyframes, staticValue } from '../utils/keyframes.js';

export interface TrimPresentation {
  initialStart: number;
  initialEnd: number;
  initialOffset: number;
  startKeyframes: string;
  endKeyframes: string;
  offsetKeyframes: string;
}

export function buildTrimPresentation(trim: LottieTrimItem): TrimPresentation {
  return {
    initialStart: staticValue(trim.s),
    initialEnd: staticValue(trim.e),
    initialOffset: staticValue(trim.o),
    startKeyframes: JSON.stringify(keyframes(trim.s)),
    endKeyframes: JSON.stringify(keyframes(trim.e)),
    offsetKeyframes: JSON.stringify(keyframes(trim.o)),
  };
}
