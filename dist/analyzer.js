"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTraceRecords = loadTraceRecords;
exports.summarizeRecords = summarizeRecords;
exports.listTypes = listTypes;
exports.getNetworkEvents = getNetworkEvents;
exports.loadNetworkRecords = loadNetworkRecords;
exports.listResources = listResources;

const fs_1 = __importDefault(require("fs"));
const jszip_1 = __importDefault(require("jszip"));

async function loadTraceRecords(traceZipPath) {
    const buffer = await fs_1.default.promises.readFile(traceZipPath);
    const zip = await jszip_1.default.loadAsync(buffer);
    const traceEntry = Object.keys(zip.files).find(name => name.endsWith('trace.trace'));
    if (!traceEntry) {
        throw new Error(`No "trace.trace" file found in ${traceZipPath}`);
    }
    const ndjson = await zip.files[traceEntry].async('string');
    return ndjson
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line));
}

function summarizeRecords(records) {
    const meta = records.find(r => typeof r.wallTime === 'number' && typeof r.monotonicTime === 'number');
    if (!meta) {
        throw new Error('Metadata record not found');
    }
    const baseWall = meta.wallTime;
    const baseMono = meta.monotonicTime * 1000;
    const epochStart = baseWall - baseMono;
    const events = records.filter(r => typeof r.timestamp === 'number');
    const times = events.map(r => r.timestamp);
    const minTs = Math.min(...times);
    const maxTs = Math.max(...times);
    const countByType = events.reduce((acc, r) => {
        const t = r.type || 'unknown';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});
    return {
        totalEvents: events.length,
        types: countByType,
        durationMs: maxTs - minTs,
        realStart: new Date(epochStart + minTs),
        realEnd: new Date(epochStart + maxTs),
    };
}

function listTypes(records) {
    const types = new Set();
    records.forEach(r => {
        if (r.type)
            types.add(r.type);
    });
    return Array.from(types).sort();
}

function getNetworkEvents(records, filter) {
    let events = records.filter(r => r.type === 'network' && r.url && r.timestamp !== undefined)
        .map(r => ({ url: r.url, status: r.status, timestamp: r.timestamp }));
    if (filter) {
        events = events.filter(e => e.url.includes(filter));
    }
    return events;
}
async function loadNetworkRecords(traceZipPath) {
    const buffer = await fs_1.default.promises.readFile(traceZipPath);
    const zip = await jszip_1.default.loadAsync(buffer);

    const entry = Object.keys(zip.files).find(name => name.endsWith('.network'));
    if (!entry) {
        throw new Error(`No ".network" file found in ${traceZipPath}`);
    }
    const ndjson = await zip.files[entry].async('string');
    return ndjson
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line));
}

async function listResources(traceZipPath) {
    const buffer = await fs_1.default.promises.readFile(traceZipPath);
    const zip = await jszip_1.default.loadAsync(buffer);
    return Object.keys(zip.files)
        .filter(name => !name.endsWith('trace.trace') && !name.endsWith('trace.network'))
        .sort();
}
