#!/usr/bin/env node
import fs from 'fs';
import JSZip from 'jszip';

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
}

summary().catch(err => {
  console.error('✖ Error:', err);
  process.exit(1);
});
