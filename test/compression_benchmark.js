import { performance } from 'node:perf_hooks';
import fs from 'fs/promises';
import { read as readKTX } from 'ktx-parse';
import { ZSTDDecoder } from 'zstddec';

const RUNS = 1000;
const PATH = new URL('../assets/luts/desat65cube.ktx2', import.meta.url);

const ktx = readKTX(await fs.readFile(PATH));
const { levelData, uncompressedByteLength } = ktx.levels[0];

let mean = 0;
let max = 0;

const decoder = new ZSTDDecoder();
await decoder.init();

const pct = (100 * (uncompressedByteLength - levelData.byteLength)) / uncompressedByteLength;

console.log(`ℹ  Path: ${PATH.href}`);
console.log(`ℹ  KTXwriter: ${ktx.keyValue.KTXwriter}`);
console.log(`ℹ  KTXwriterScParams: ${ktx.keyValue.KTXwriterScParams}`);
console.log(`ℹ  Uncompressed size: ${uncompressedByteLength} bytes`);
console.log(`ℹ  Compressed size: ${levelData.byteLength} bytes (–${pct.toFixed(1)}%)`);

for (let i = 0; i < RUNS; i++) {
	const t0 = performance.now();

	decoder.decode(levelData, uncompressedByteLength); // ⏱

	const t1 = performance.now();
	const t = t1 - t0;

	max = Math.max(t, max);
	mean += t;
}

mean /= RUNS;

console.info(`\n⏱  Completed ${RUNS} decodes. ${mean.toFixed(2)}ms mean, ${max.toFixed(2)}ms max`);
