#!/usr/bin/env node
const { program } = require('commander');
const chalk       = require('chalk');
const fs          = require('fs');
const JSZip       = require('jszip');

program
  .name('pw-trace')
  .description('CLI tool to analyze Playwright trace.zip files')
  .version('0.1.0');

program
  .command('summary <tracePath>')
  .description('Show a high-level summary of a Playwright trace.zip')
  .action(async (tracePath) => {
    try {
      const buffer = await fs.promises.readFile(tracePath);
      console.log(chalk.green(`Loaded ${tracePath} (${buffer.length} bytes)`));

      const zip = await JSZip.loadAsync(buffer);
      const traceKey = Object.keys(zip.files).find(k => k.endsWith('trace.trace'));
      if (!traceKey) {
        console.error(chalk.red('❌  No trace.trace file found in ZIP'));
        process.exit(1);
      }

      const text    = await zip.files[traceKey].async('string');
      const lines   = text.split('\n').filter(l => l.trim());
      const records = lines.map(l => JSON.parse(l));

      // Extract the first record (context-options) for wallTime & monotonicTime
      const metadata       = records[0];
      const baseWallTime   = metadata.wallTime;            // epoch ms
      const baseMonoTimeMs = metadata.monotonicTime * 1000; // seconds→ms
      const traceStartEpoch = baseWallTime - baseMonoTimeMs;

      // All real events have a .timestamp in ms
      const events = records.filter(r => typeof r.timestamp === 'number');
      const eventsCount = events.length;

      // Compute relative start/end
      const relStart  = Math.min(...events.map(r => r.timestamp));
      const relEnd    = Math.max(...events.map(r => r.timestamp));
      const durationMs = relEnd - relStart;

      // Convert to real dates
      const realStart = new Date(traceStartEpoch + relStart);
      const realEnd   = new Date(traceStartEpoch + relEnd);

      console.log(chalk.blue('\nTrace summary:'));
      console.log(`  • Duration: ${durationMs.toFixed(2)} ms`);
      console.log(`  • Events:   ${eventsCount}`);
      console.log(`  • Start:    ${realStart.toLocaleString()}`);
      console.log(`  • End:      ${realEnd.toLocaleString()}\n`);
    } catch (e) {
      console.error(chalk.red('Error reading trace:'), e.message);
      process.exit(1);
    }
  });

program
  .command('filter <tracePath>')
  .description('Filter trace events by type')
  .option('-u, --url <substring>', 'only include network events whose URL contains this')
  .option('-t, --type <type>', 'only include events of this type (e.g. request, response)')
    .action(async (tracePath, options) => {
    try {
      const buffer = await fs.promises.readFile(tracePath);
      console.log(chalk.green(`Loaded ${tracePath} (${buffer.length} bytes)`));

      const zip = await JSZip.loadAsync(buffer);
      const traceKey = Object.keys(zip.files).find(k => k.endsWith('trace.trace'));
      if (!traceKey) {
        console.error(chalk.red('❌  No trace.trace file found in ZIP'));
        process.exit(1);
      }

      // 3) Parse NDJSON into `records`
          const text = await zip.files[traceKey].async('string');
    const lines   = text.split('\n').filter(l => l.trim());
    const records = lines.map(l => JSON.parse(l));

        // 4) Identify the trace’s relative start time from context-options
    const meta = records[0];
    const baseWall    = meta.wallTime;
    const baseMonoMs  = meta.monotonicTime * 1000;
    const traceStart  = baseWall - baseMonoMs;

        // 5) Filter only actual events (those with timestamps)
    const events = records.filter(r => typeof r.timestamp === 'number');

      // 6) Apply user filters  
    const filtered = records.filter(r => {
  if (typeof r.timestamp !== 'number') return false;
  if (options.url && !r.url?.includes(options.url)) return false;
  if (options.type && r.type !== options.type) return false;
  return true;
});

    // 7) Print matches
    if (!filtered.length) {
      console.log(chalk.yellow('No events matched your criteria.'));
      return;
    }
    console.log(chalk.blue(`\nMatched ${filtered.length} events:\n`));
    filtered.forEach(r => {
      const relMs = (r.timestamp).toFixed(0).padStart(5);
      const absTime = new Date(traceStart + r.timestamp).toLocaleTimeString();
      console.log(
        ` ${relMs} ms  ${absTime}  ${r.type.padEnd(15)}${r.url || ''}`
      );
    });

    }catch (e) {
      console.error(chalk.red('Error reading trace:'), e.message);
      process.exit(1);
    }
  }); 

  program
  .command('types <tracePath>')
  .description('List all unique record.type values in the trace')
  .action(async (tracePath) => {
    const buffer = await fs.promises.readFile(tracePath);
    const zip    = await JSZip.loadAsync(buffer);
    const key    = Object.keys(zip.files).find(k => k.endsWith('trace.trace'));
    const text   = await zip.files[key].async('string');
    const records= text.split('\n').filter(l=>l.trim()).map(l=>JSON.parse(l));
    const types  = new Set(records.filter(r=>r.type).map(r=>r.type));
console.log(chalk.blue('\nTypes in trace:'));
[...types]
  .sort()
  .forEach(type => {
    console.log(`  • ${type}`);
  });
  });
  
program.parse(process.argv);
