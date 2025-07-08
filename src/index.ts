#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { intro, select, confirm, text, spinner, outro, isCancel, cancel } from '@clack/prompts';
import color from 'picocolors';
import { loadTraceRecords, summarizeRecords, listTypes, getNetworkEvents, listResources, loadNetworkRecords } from './analyzer';

function findZipFiles(dir: string): string[] {
  let results: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findZipFiles(full));
    } else if (name.toLowerCase().endsWith('.zip')) {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  intro(color.bold('▶ Playwright Trace Analyzer'));

  const traceDir = path.resolve(__dirname, '../trace');
  if (!fs.existsSync(traceDir) || !fs.statSync(traceDir).isDirectory()) {
    console.error(color.red(`Directory not found: ${traceDir}`));
    process.exit(1);
  }

  const zipPaths = findZipFiles(traceDir);
  if (zipPaths.length === 0) {
    console.error(color.red(
      `No .zip trace files found under ${traceDir}.\n` +
      `Run a Playwright test with tracing enabled or drop .zip files there.`
    ));
    process.exit(1);
  }

  const files = zipPaths.map(fullPath => ({
    label: path.relative(traceDir, fullPath),
    value: fullPath,
  }));

  const tracePath = await select({ message: 'Select a trace file:', options: files });
  if (typeof tracePath !== 'string') {
    outro(color.yellow('Operation cancelled.'));
    process.exit(0);
  }

  const analysisType = await select({
    message: 'What would you like to do?',
    options: [
      { value: 'summary',   label: '📝 Summary' },
      { value: 'types',     label: '🔍 List types' },
      { value: 'network',   label: '🌐 Network responses' },
      { value: 'resources', label: '📦 List resources' },
    ],
  });

  let urlFilter: string | undefined;
  if (analysisType === 'network') {
    const filterResult = await text({
      message: 'Filter URLs (substring, leave blank for all):',
      placeholder: 'e.g. example.com',
    });
    urlFilter = typeof filterResult === 'string' ? filterResult : undefined;
  }

  const proceed = await confirm({ message: `Run ${String(analysisType)} on ${path.basename(String(tracePath))}?` });
  if (!proceed) {
    outro(color.yellow('Operation cancelled.'));
    process.exit(0);
  }

  const s = spinner();
  s.start(`Running ${String(analysisType)}…`);

  switch (analysisType) {
    case 'summary': {
      const records = await loadTraceRecords(tracePath);
      s.stop('Computing summary…');
      const { totalEvents, types, durationMs, realStart, realEnd } = summarizeRecords(records);
      console.log(color.green(`\nTrace summary for ${tracePath}:`));
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
      const records = await loadTraceRecords(tracePath);
      s.stop('Gathering types…');
      const unique = listTypes(records);
      console.log(color.blue(`\nTypes in ${tracePath}:`));
      unique.forEach(t => console.log(`  • ${t}`));
      break;
    }

    case 'network': {
      if (typeof tracePath !== 'string') {
        s.stop();
        console.error(color.red('Invalid trace file path.'));
        break;
      }
      const records = await loadTraceRecords(tracePath);
      s.stop('Extracting network events…');
      const events = getNetworkEvents(records, urlFilter?.trim() || undefined);
      console.log(color.yellow(`\nNetwork responses (${events.length}):`));
      events.forEach(e => {
        console.log(`  • ${e.url} [${e.status ?? 'N/A'}] @ ${e.timestamp} ms`);
      });
      break;
    }

    case 'resources': {
      if (typeof tracePath !== 'string') {
        s.stop();
        console.error(color.red('Invalid trace file path.'));
        break;
      }
      const resources = await listResources(tracePath);
      s.stop('Listing resources…');
      console.log(color.magenta(`\nResources in ${tracePath}:`));
      resources.forEach(r => console.log(`  • ${r}`));
      break;
    }

    case 'network': {
  const events = await loadNetworkRecords(tracePath);
  s.stop(`Loaded ${events.length} network events…`);

  const filtered = urlFilter?.trim()
    ? events.filter(e => e.url.includes(urlFilter!))
    : events;

  console.log(color.yellow(`\nNetwork responses (${filtered.length}):`));
  filtered.forEach(e => {
    console.log(`  • ${e.url} [${e.status ?? 'N/A'}] @ ${e.timestamp} ms`);
  });
  break;
}

    default:
      s.stop();
      console.error(color.red(`Analysis '${String(analysisType)}' not implemented.`));
  }

  outro(color.green('✔ Done!'));
  const again = await confirm({ message: 'Analyze another trace?' });
  if (again) return main();
  process.exit(0);
}

main().catch(err => {
  if (isCancel(err)) cancel('Aborted by user.');
  else console.error(color.red('✖ Unexpected error:'), err);
  process.exit(1);
});