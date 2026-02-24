import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { convertLottieToSvg } from '../src/index.js';

const sample = readFileSync('examples/trim-sample.json', 'utf8');
const svg = convertLottieToSvg(sample, { mode: 'smil', pretty: false });

assert.ok(svg.includes('<svg'));
assert.ok(svg.includes('stroke-dasharray'));
assert.ok(svg.includes('<animate attributeName="stroke-dashoffset"'));
console.log('smoke test passed');
