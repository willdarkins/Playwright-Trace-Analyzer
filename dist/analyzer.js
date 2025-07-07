"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTraceRecords = loadTraceRecords;
exports.summarizeRecords = summarizeRecords;
// src/analyzer.ts
const fs_1 = __importDefault(require("fs"));
const jszip_1 = __importDefault(require("jszip"));
async function loadTraceRecords(traceZipPath) {
    const buffer = await fs_1.default.promises.readFile(traceZipPath);
    const zip = await jszip_1.default.loadAsync(buffer);
    // Match any file ending in "trace.trace"
    const traceEntry = Object.keys(zip.files).find(name => name.endsWith('trace.trace'));
    if (!traceEntry) {
        throw new Error(`No ".trace" file found in ${traceZipPath}`);
    }
    const ndjson = await zip.files[traceEntry].async('string');
    return ndjson
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line));
}
function summarizeRecords(records) {
    const meta = records.find(r => typeof r.wallTime === 'number' && typeof r.monotonicTime === 'number');
    if (!meta)
        throw new Error('Missing trace metadata');
    const baseWall = meta.wallTime;
    const baseMono = meta.monotonicTime * 1000;
    const startEpoch = baseWall - baseMono;
    const events = records.filter(r => typeof r.timestamp === 'number');
    const times = events.map(r => r.timestamp);
    const minTs = Math.min(...times);
    const maxTs = Math.max(...times);
    const realStart = new Date(startEpoch + minTs);
    const realEnd = new Date(startEpoch + maxTs);
    const countByType = events.reduce((acc, r) => {
        const t = r.type || 'unknown';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});
    return {
        totalEvents: events.length,
        types: countByType,
        durationMs: maxTs - minTs,
        realStart,
        realEnd,
    };
}
