const { program } = require('commander');
const chalk = require('chalk');

program
  .name('pw-trace')
  .description('CLI tool to analyze Playwright trace.zip files')
  .version('0.1.0');

program
  .command('summary <trace>')
  .description('Show high-level summary of a trace')
  .action(async (tracePath) => {
    console.log(chalk.green(`Analyzing trace: ${tracePath}`));
    // TODO: unzip + parse + output stats
  });

program.parse(process.argv);
