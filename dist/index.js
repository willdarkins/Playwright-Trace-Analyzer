#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prompts_1 = require("@clack/prompts");
const picocolors_1 = __importDefault(require("picocolors"));
const analyzer_1 = require("./analyzer");

function findZipFiles(dir) {
    let results = [];
    for (const name of fs_1.default.readdirSync(dir)) {
        const full = path_1.default.join(dir, name);
        const stat = fs_1.default.statSync(full);
        if (stat.isDirectory()) {
            results = results.concat(findZipFiles(full));
        }
        else if (name.toLowerCase().endsWith('.zip')) {
            results.push(full);
        }
    }
    return results;
}
async function main() {
    (0, prompts_1.intro)(picocolors_1.default.bold('▶ Playwright Trace Analyzer'));

    const traceDir = path_1.default.resolve(__dirname, '../trace');
    if (!fs_1.default.existsSync(traceDir) || !fs_1.default.statSync(traceDir).isDirectory()) {
        console.error(picocolors_1.default.red(`Directory not found: ${traceDir}`));
        process.exit(1);
    }
    const zipPaths = findZipFiles(traceDir);
    if (zipPaths.length === 0) {
        console.error(picocolors_1.default.red(`No .zip trace files found under ${traceDir}.\n` +
            `Run a Playwright test with tracing enabled or drop .zip files there.`));
        process.exit(1);
    }

    const files = zipPaths.map(fullPath => ({
        label: path_1.default.relative(traceDir, fullPath),
        value: fullPath,
    }));

    const tracePath = await (0, prompts_1.select)({ message: 'Select a trace file:', options: files });
    if (typeof tracePath !== 'string') {
        (0, prompts_1.outro)(picocolors_1.default.yellow('Operation cancelled.'));
        process.exit(0);
    }

    const analysisType = await (0, prompts_1.select)({
        message: 'What would you like to do?',
        options: [
            { value: 'summary', label: '📝 Summary' },
            { value: 'types', label: '🔍 List types' },
            { value: 'network', label: '🌐 Network responses' },
            { value: 'resources', label: '📦 List resources' },
        ],
    });

    let urlFilter;
    if (analysisType === 'network') {
        const filterResult = await (0, prompts_1.text)({
            message: 'Filter URLs (substring, leave blank for all):',
            placeholder: 'e.g. example.com',
        });
        urlFilter = typeof filterResult === 'string' ? filterResult : undefined;
    }

    const proceed = await (0, prompts_1.confirm)({ message: `Run ${String(analysisType)} on ${path_1.default.basename(String(tracePath))}?` });
    if (!proceed) {
        (0, prompts_1.outro)(picocolors_1.default.yellow('Operation cancelled.'));
        process.exit(0);
    }

    const s = (0, prompts_1.spinner)();
    s.start(`Running ${String(analysisType)}…`);
    switch (analysisType) {
        case 'summary': {
            const records = await (0, analyzer_1.loadTraceRecords)(tracePath);
            s.stop('Computing summary…');
            const { totalEvents, types, durationMs, realStart, realEnd } = (0, analyzer_1.summarizeRecords)(records);
            console.log(picocolors_1.default.green(`\nTrace summary for ${tracePath}:`));
            console.log(`  • Total events: ${totalEvents}`);
            console.log(`  • Duration:     ${durationMs.toFixed(2)} ms`);
            console.log(`  • Started at:   ${realStart.toLocaleString()}`);
            console.log(`  • Ended at:     ${realEnd.toLocaleString()}`);
            console.log(`  • Event types:`);
            for (const [type, count] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
                console.log(`      - ${type.padEnd(15)} ${count}`);
            }
            break;
        }
        case 'types': {
            const records = await (0, analyzer_1.loadTraceRecords)(tracePath);
            s.stop('Gathering types…');
            const unique = (0, analyzer_1.listTypes)(records);
            console.log(picocolors_1.default.blue(`\nTypes in ${tracePath}:`));
            unique.forEach(t => console.log(`  • ${t}`));
            break;
        }
        case 'network': {
            if (typeof tracePath !== 'string') {
                s.stop();
                console.error(picocolors_1.default.red('Invalid trace file path.'));
                break;
            }
            const records = await (0, analyzer_1.loadTraceRecords)(tracePath);
            s.stop('Extracting network events…');
            const events = (0, analyzer_1.getNetworkEvents)(records, urlFilter?.trim() || undefined);
            console.log(picocolors_1.default.yellow(`\nNetwork responses (${events.length}):`));
            events.forEach(e => {
                console.log(`  • ${e.url} [${e.status ?? 'N/A'}] @ ${e.timestamp} ms`);
            });
            break;
        }
        case 'resources': {
            if (typeof tracePath !== 'string') {
                s.stop();
                console.error(picocolors_1.default.red('Invalid trace file path.'));
                break;
            }
            const resources = await (0, analyzer_1.listResources)(tracePath);
            s.stop('Listing resources…');
            console.log(picocolors_1.default.magenta(`\nResources in ${tracePath}:`));
            resources.forEach(r => console.log(`  • ${r}`));
            break;
        }
        case 'network': {
            const events = await (0, analyzer_1.loadNetworkRecords)(tracePath);
            s.stop(`Loaded ${events.length} network events…`);
            const filtered = urlFilter?.trim()
                ? events.filter(e => e.url.includes(urlFilter))
                : events;
            console.log(picocolors_1.default.yellow(`\nNetwork responses (${filtered.length}):`));
            filtered.forEach(e => {
                console.log(`  • ${e.url} [${e.status ?? 'N/A'}] @ ${e.timestamp} ms`);
            });
            break;
        }
        default:
            s.stop();
            console.error(picocolors_1.default.red(`Analysis '${String(analysisType)}' not implemented.`));
    }
    (0, prompts_1.outro)(picocolors_1.default.green('✔ Done!'));
    const again = await (0, prompts_1.confirm)({ message: 'Analyze another trace?' });
    if (again)
        return main();
    process.exit(0);
}
main().catch(err => {
    if ((0, prompts_1.isCancel)(err))
        (0, prompts_1.cancel)('Aborted by user.');
    else
        console.error(picocolors_1.default.red('✖ Unexpected error:'), err);
    process.exit(1);
});
