import { buildSvg } from './generators/svg-builder.js';
import { parseLottieFromJson, parseLottieObject } from './parser/index.js';
import { ConverterOptions, LottieDocument, WarningCollector } from './types/lottie.js';
import { ConsoleWarningCollector } from './utils/warnings.js';

const DEFAULT_OPTIONS: ConverterOptions = {
  mode: 'smil',
  pretty: true,
  optimize: false,
};

export function convertLottieToSvg(
  input: string | unknown,
  options: Partial<ConverterOptions> = {},
  warnings: WarningCollector = new ConsoleWarningCollector(),
): string {
  const parsed: LottieDocument = typeof input === 'string' ? parseLottieFromJson(input) : parseLottieObject(input);

  return buildSvg(parsed, {
    ...DEFAULT_OPTIONS,
    ...options,
    warnings,
  });
}
