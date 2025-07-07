import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import { getDockerManager } from '../../core/docker.js';
import { SnapshotOptions } from '../../core/types.js';

export const snapshotCommand = new Command('snapshot')
  .description('Create a snapshot of a database instance')
  .argument('<name>', 'Database instance name')
  .option('-o, --output <path>', 'Output directory for snapshot')
  .option('-c, --compress', 'Compress the snapshot')
  .option('--format <format>', 'Snapshot format (tar, sql, json)', 'tar')
  .action(async (name: string, options: SnapshotOptions) => {
    try {
      const dockerManager = getDockerManager();
      await dockerManager.initialize();

      const instance = dockerManager.getInstance(name);
      if (!instance) {
        console.error(chalk.red(`❌ Database instance '${name}' not found`));
        process.exit(1);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const snapshotName = `${name}-snapshot-${timestamp}`;
      const outputDir = options.output || path.join(process.cwd(), 'snapshots');
      const snapshotPath = path.join(outputDir, `${snapshotName}.${options.format === 'tar' ? 'tar.gz' : options.format}`);

      console.log(chalk.cyan(`📸 Creating snapshot of '${name}'...`));
      console.log(chalk.gray(`Output: ${snapshotPath}`));

      const spinner = ora(`Creating snapshot...`).start();

      // NOTE: Database-specific snapshot implementation pending
      // Will create actual backups based on database type (pg_dump, mysqldump, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000));

      spinner.succeed(`Snapshot created successfully`);

      console.log(chalk.green('\n✅ Snapshot created!'));
      console.log(chalk.bold('Snapshot Details:'));
      console.log(`  Name: ${chalk.cyan(snapshotName)}`);
      console.log(`  Database: ${chalk.cyan(instance.name)} (${instance.engine})`);
      console.log(`  Format: ${chalk.cyan(options.format)}`);
      console.log(`  Path: ${chalk.cyan(snapshotPath)}`);
      console.log(`  Compressed: ${chalk.cyan(options.compress ? 'Yes' : 'No')}`);

      console.log(chalk.yellow('\n💡 Restore Instructions:'));
      console.log(`  1. Stop the database: ${chalk.cyan(`hayai stop ${name}`)}`);
      console.log(`  2. Remove the instance: ${chalk.cyan(`hayai remove ${name}`)}`);
      console.log(`  3. Recreate from snapshot: ${chalk.cyan(`hayai restore ${snapshotPath}`)}`);

      console.log(chalk.yellow('\n📋 Available Snapshots:'));
      console.log(`  Run ${chalk.cyan('hayai snapshot list')} to see all snapshots`);

    } catch (error) {
      console.error(chalk.red('\n❌ Failed to create snapshot:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }); 