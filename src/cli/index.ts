#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { logsCommand } from './commands/logs.js';
import { studioCommand } from './commands/studio.js';
import { snapshotCommand } from './commands/snapshot.js';

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('⚡ Hayai')} ${chalk.gray('v1.0.0')}
${chalk.gray('Instantly create and manage local databases with one command')}
`;

// Configure the main program
program
  .name('hayai')
  .description('Fast, modern CLI tool for managing local databases')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress output except errors')
  .option('--config <path>', 'Path to configuration file')
  .hook('preAction', (thisCommand) => {
    if (!thisCommand.opts().quiet) {
      console.log(banner);
    }
  });

// Add all commands
program.addCommand(initCommand);
program.addCommand(startCommand);
program.addCommand(stopCommand);
program.addCommand(listCommand);
program.addCommand(removeCommand);
program.addCommand(logsCommand);
program.addCommand(studioCommand);
program.addCommand(snapshotCommand);

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('Run `hayai --help` for available commands'));
  process.exit(1);
});

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

// Parse command line arguments
program.parse(process.argv);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  if (program.opts().verbose) {
    console.error(reason);
  }
  process.exit(1);
});

export default program; 