#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { logsCommand } from './commands/logs.js';
import { studioCommand } from './commands/studio.js';
import { snapshotCommand } from './commands/snapshot.js';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('⚡ Hayai')} ${chalk.gray(`v${version}`)}
${chalk.gray('Instantly create and manage local databases with one command')}
`;

// Enhanced help text with examples
const helpText = `
${banner}

${chalk.bold('USAGE')}
  ${chalk.cyan('hayai')} ${chalk.gray('[command] [options]')}

${chalk.bold('EXAMPLES')}
  ${chalk.gray('# Quick start - create a PostgreSQL database')}
  ${chalk.cyan('hayai init')}
  
  ${chalk.gray('# Create a specific database non-interactively')}
  ${chalk.cyan('hayai init -n myapp -e postgresql -y')}
  
  ${chalk.gray('# Start all databases')}
  ${chalk.cyan('hayai start')}
  
  ${chalk.gray('# Open admin dashboards')}
  ${chalk.cyan('hayai studio')}
  
  ${chalk.gray('# Create Redis cache for development')}
  ${chalk.cyan('hayai init -n cache -e redis --admin-dashboard -y')}

${chalk.bold('SUPPORTED DATABASES')}
  ${chalk.green('SQL:')}           postgresql, mariadb, sqlite, duckdb
  ${chalk.green('Key-Value:')}     redis
  ${chalk.green('Wide Column:')}   cassandra
  ${chalk.green('Time Series:')}   influxdb, timescaledb, questdb, victoriametrics, horaedb
  ${chalk.green('Vector:')}        qdrant, weaviate, milvus
  ${chalk.green('Graph:')}         arangodb
  ${chalk.green('Search:')}        meilisearch, typesense
  ${chalk.green('Embedded:')}      sqlite, duckdb, leveldb

${chalk.bold('LEARN MORE')}
  Documentation:  ${chalk.cyan('https://github.com/hitoshyamamoto/hayai#readme')}
  Report issues:  ${chalk.cyan('https://github.com/hitoshyamamoto/hayai/issues')}

${chalk.bold('OPTIONS')}`;

// Configure the main program
program
  .name('hayai')
  .description('Fast, modern CLI tool for managing local databases')
  .version(version, '-v, --version', 'output the current version')
  .option('--verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress output except errors')
  .option('--config <path>', 'Path to configuration file')
  .configureHelp({
    formatHelp: (cmd, helper) => {
      return helpText + `

${chalk.bold('COMMANDS')}
  ${chalk.cyan('init')}          Initialize a new database instance
  ${chalk.cyan('start')} [name]  Start database instances
  ${chalk.cyan('stop')} [name]   Stop database instances
  ${chalk.cyan('list')}          List all database instances
  ${chalk.cyan('remove')} <name> Remove a database instance
  ${chalk.cyan('logs')} <name>   View logs from a database instance
  ${chalk.cyan('studio')} [name] Open admin dashboards
  ${chalk.cyan('snapshot')} <name> Create a database snapshot

${chalk.gray('Run')} ${chalk.cyan('hayai <command> --help')} ${chalk.gray('for detailed information on a command.')}

${chalk.bold('OPTIONS')}
  ${chalk.cyan('-v, --version')}       Output the current version
  ${chalk.cyan('--verbose')}          Enable verbose logging
  ${chalk.cyan('-q, --quiet')}        Suppress output except errors
  ${chalk.cyan('--config <path>')}    Path to configuration file
  ${chalk.cyan('-h, --help')}         Display help for command
`;
    }
  })
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
  console.error(chalk.red(`❌ Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('💡 Run `hayai --help` for available commands'));
  console.log(chalk.cyan('📚 See https://github.com/hitoshyamamoto/hayai#readme for documentation'));
  process.exit(1);
});

// Custom help for no arguments
if (process.argv.length === 2) {
  console.log(helpText);
  console.log(`
${chalk.bold('COMMANDS')}
  ${chalk.cyan('init')}          Initialize a new database instance
  ${chalk.cyan('start')} [name]  Start database instances
  ${chalk.cyan('stop')} [name]   Stop database instances
  ${chalk.cyan('list')}          List all database instances
  ${chalk.cyan('remove')} <name> Remove a database instance
  ${chalk.cyan('logs')} <name>   View logs from a database instance
  ${chalk.cyan('studio')} [name] Open admin dashboards
  ${chalk.cyan('snapshot')} <name> Create a database snapshot

${chalk.gray('Run')} ${chalk.cyan('hayai <command> --help')} ${chalk.gray('for detailed information on a command.')}
`);
  process.exit(0);
}

// Parse command line arguments
program.parse(process.argv);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  if (program.opts().verbose) {
    console.error(reason);
  }
  process.exit(1);
});

export default program; 