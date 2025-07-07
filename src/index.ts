#!/usr/bin/env node
import { loadTraceRecords, summarizeRecords } from './analyzer';
import fs from 'fs';
import JSZip from 'jszip';
import color from 'picocolors';

async function summary() {
  const tracePath = process.argv[2];
  if (!tracePath) {
    console.error('Usage: pw-trace-analyzer <trace.zip>');
    process.exit(1);
  }

  const buffer = await fs.promises.readFile(tracePath);
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.keys(zip.files);
  console.log(`Found ${entries.length} entries in ${tracePath}`);

    const records = await loadTraceRecords(tracePath);
const {
  totalEvents,
  types,
  durationMs,
  realStart,
  realEnd,
} = summarizeRecords(records);

console.log(color.green(`\nTrace summary for ${tracePath}:`));
console.log(`  • Total events: ${totalEvents}`);
console.log(`  • Duration:     ${durationMs.toFixed(2)} ms`);
console.log(`  • Started at:   ${realStart.toLocaleString()}`);
console.log(`  • Ended at:     ${realEnd.toLocaleString()}`);
console.log(`  • Event types:`);
for (const [type, count] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
  console.log(`      - ${type.padEnd(15)} ${count}`);
}

}
summary().catch(err => {
  console.error('✖ Error:', err);
  process.exit(1);
});
