import { WarningCollector } from '../types/lottie.js';

export class ConsoleWarningCollector implements WarningCollector {
  warn(message: string): void {
    console.warn(`[lottie2svg] Warning: ${message}`);
  }
}
