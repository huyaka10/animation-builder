import { buildSvg } from './generators/svg-builder.js';
import { parseLottieFromJson } from './parser/index.js';
import { WarningCollector } from './types/lottie.js';
import { ConsoleWarningCollector } from './utils/warnings.js';

export function convertLottieToSvg(lottieJson: string, warnings: WarningCollector = new ConsoleWarningCollector()): string {
  const parsed = parseLottieFromJson(lottieJson);
  return buildSvg(parsed, { warnings });
}
