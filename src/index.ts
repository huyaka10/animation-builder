import { buildSvg } from './generators/svg-builder.js';
import { parseLottieObject } from './parser/index.js';
import { ConverterOptions, LottieDocument, WarningCollector } from './types/lottie.js';
import { ConsoleWarningCollector } from './utils/warnings.js';

export function convertParsedLottieToSvg(input: LottieDocument, options: ConverterOptions, warnings: WarningCollector = new ConsoleWarningCollector()): string {
  const parsed = parseLottieObject(input);
  return buildSvg(parsed, {
    mode: options.mode,
    pretty: options.pretty,
    optimize: options.optimize,
    warnings,
  });
}
