import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { parseLottieFromJson } from '../src/parser/index.js';
import { convertParsedLottieToSvg } from '../src/index.js';

const sample = readFileSync('examples/trim-sample.json', 'utf8');
const parsed = parseLottieFromJson(sample);
const svg = convertParsedLottieToSvg(parsed, { mode: 'smil', pretty: false });

assert.ok(svg.includes('<svg'));
assert.ok(svg.includes('stroke-dasharray'));
assert.ok(svg.includes('<animate attributeName="stroke-dashoffset"'));
console.log('smoke test passed');
