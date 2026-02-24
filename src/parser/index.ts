import { LottieDocument } from '../types/lottie.js';

export function parseLottieFromJson(jsonContent: string): LottieDocument {
  const parsed = JSON.parse(jsonContent) as unknown;
  return parseLottieObject(parsed);
}

export function parseLottieObject(input: unknown): LottieDocument {
  if (!input || typeof input !== 'object') {
    throw new Error('Lottie input must be an object.');
  }

  const doc = input as Partial<LottieDocument>;
  if (!Array.isArray(doc.layers) || typeof doc.fr !== 'number' || typeof doc.w !== 'number' || typeof doc.h !== 'number') {
    throw new Error('Invalid Lottie object: expected layers[], fr, w, h.');
  }

  return doc as LottieDocument;
}
