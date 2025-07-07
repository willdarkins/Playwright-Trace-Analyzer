#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const analyzer_1 = require("./analyzer");
const fs_1 = __importDefault(require("fs"));
const jszip_1 = __importDefault(require("jszip"));
const picocolors_1 = __importDefault(require("picocolors"));
async function summary() {
    const tracePath = process.argv[2];
    if (!tracePath) {
        console.error('Usage: pw-trace-analyzer <trace.zip>');
        process.exit(1);
    }
    const buffer = await fs_1.default.promises.readFile(tracePath);
    const zip = await jszip_1.default.loadAsync(buffer);
    const entries = Object.keys(zip.files);
    console.log(`Found ${entries.length} entries in ${tracePath}`);
    const records = await (0, analyzer_1.loadTraceRecords)(tracePath);
    const { totalEvents, types, durationMs, realStart, realEnd, } = (0, analyzer_1.summarizeRecords)(records);
    console.log(picocolors_1.default.green(`\nTrace summary for ${tracePath}:`));
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
