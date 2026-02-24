#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseLottieFromJson } from './parser/index.js';
import { convertParsedLottieToSvg } from './index.js';

interface CliArgs {
  input: string;
  output: string;
  mode: 'smil' | 'css';
  pretty: boolean;
  optimize: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  if (argv.length < 2) {
    throw new Error('Usage: lottie2svg input.json output.svg --mode=smil|css [--pretty] [--optimize]');
  }

  const [input, output, ...flags] = argv;
  let mode: 'smil' | 'css' = 'smil';
  let pretty = false;
  let optimize = false;

  for (const flag of flags) {
    if (flag.startsWith('--mode=')) {
      const value = flag.replace('--mode=', '');
      if (value === 'smil' || value === 'css') mode = value;
      else throw new Error(`Unsupported mode: ${value}`);
    } else if (flag === '--pretty') {
      pretty = true;
    } else if (flag === '--optimize') {
      optimize = true;
    }
  }

  return { input, output, mode, pretty, optimize };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(args.input);
  const outputPath = resolve(args.output);

  const json = readFileSync(inputPath, 'utf-8');
  const parsed = parseLottieFromJson(json);
  const svg = convertParsedLottieToSvg(parsed, {
    mode: args.mode,
    pretty: args.pretty,
    optimize: args.optimize,
  });

  writeFileSync(outputPath, svg, 'utf-8');
  console.log(`[lottie2svg] SVG written to ${outputPath}`);
}

main();
