import fs from 'fs';
import JSZip from 'jszip';

export interface TraceRecord {
  wallTime?: number;
  monotonicTime?: number;
  timestamp?: number;
  type?: string;
  url?: string;
  status?: number;
  [key: string]: any;
}

export interface TraceSummary {
  totalEvents: number;
  types: Record<string, number>;
  durationMs: number;
  realStart: Date;
  realEnd: Date;
}

export interface NetworkRecord {
  url: string;
  status: number;
  timestamp: number;
}

export async function loadTraceRecords(traceZipPath: string): Promise<TraceRecord[]> {
  const buffer = await fs.promises.readFile(traceZipPath);
  const zip = await JSZip.loadAsync(buffer);

  const traceEntry = Object.keys(zip.files).find(name => name.endsWith('trace.trace'));
  if (!traceEntry) {
    throw new Error(`No "trace.trace" file found in ${traceZipPath}`);
  }

  const ndjson = await zip.files[traceEntry].async('string');
  return ndjson
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line) as TraceRecord);
}

export function summarizeRecords(records: TraceRecord[]): TraceSummary {
  const meta = records.find(
    r => typeof r.wallTime === 'number' && typeof r.monotonicTime === 'number'
  );
  if (!meta) {
    throw new Error('Metadata record not found');
  }
  const baseWall = meta.wallTime!;
  const baseMono = meta.monotonicTime! * 1000;
  const epochStart = baseWall - baseMono;

  const events = records.filter(r => typeof r.timestamp === 'number');
  const times = events.map(r => r.timestamp!);
  const minTs = Math.min(...times);
  const maxTs = Math.max(...times);

  const countByType = events.reduce<Record<string, number>>((acc, r) => {
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

export function listTypes(records: TraceRecord[]): string[] {
  const types = new Set<string>();
  records.forEach(r => {
    if (r.type) types.add(r.type);
  });
  return Array.from(types).sort();
}

export function getNetworkEvents(
  records: TraceRecord[],
  filter?: string
): Array<{ url: string; status?: number; timestamp: number }> {
  let events = records.filter(r => r.type === 'network' && r.url && r.timestamp !== undefined)
    .map(r => ({ url: r.url!, status: r.status, timestamp: r.timestamp! }));
  if (filter) {
    events = events.filter(e => e.url.includes(filter));
  }
  return events;
}

export async function loadNetworkRecords(traceZipPath: string): Promise<NetworkRecord[]> {
  const buffer = await fs.promises.readFile(traceZipPath);
  const zip    = await JSZip.loadAsync(buffer);

  const entry = Object.keys(zip.files).find(name => name.endsWith('.network'));
  if (!entry) {
    throw new Error(`No ".network" file found in ${traceZipPath}`);
  }

  const ndjson = await zip.files[entry].async('string');
  return ndjson
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line) as NetworkRecord);
}

export async function listResources(traceZipPath: string): Promise<string[]> {
  const buffer = await fs.promises.readFile(traceZipPath);
  const zip = await JSZip.loadAsync(buffer);
  return Object.keys(zip.files)
    .filter(name => !name.endsWith('trace.trace') && !name.endsWith('trace.network'))
    .sort();
}