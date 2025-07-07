import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { getDockerManager } from '../../core/docker.js';
import { getTemplate } from '../../core/templates.js';
import { SnapshotOptions } from '../../core/types.js';

async function createSnapshotDirectory(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function executeSnapshot(
  instance: any, 
  snapshotPath: string, 
  format: string,
  compress: boolean
): Promise<void> {
  const template = getTemplate(instance.engine);
  if (!template) {
    throw new Error(`Template not found for engine: ${instance.engine}`);
  }

  // Database-specific backup commands
  switch (instance.engine) {
    case 'postgresql':
      return executePostgreSQLSnapshot(instance, snapshotPath, format);
    
    case 'mariadb':
      return executeMySQLSnapshot(instance, snapshotPath, format);
    
    case 'redis':
      return executeRedisSnapshot(instance, snapshotPath, format);
    
    case 'sqlite':
    case 'duckdb':
      return executeSQLiteSnapshot(instance, snapshotPath, format);
    
    case 'influxdb2':
    case 'influxdb3':
      return executeInfluxDBSnapshot(instance, snapshotPath, format);
    
    default:
      return executeGenericSnapshot(instance, snapshotPath, format);
  }
}

async function executePostgreSQLSnapshot(instance: any, snapshotPath: string, format: string): Promise<void> {
  const containerName = `haya-${instance.name}-db-1`;
  
  return new Promise((resolve, reject) => {
    const args = [
      'exec', containerName,
      'pg_dump',
      '-h', 'localhost',
      '-U', 'admin',
      '-d', 'database',
      '--no-password',
      '-f', '/tmp/backup.sql'
    ];

    const childProcess = spawn('docker', args, {
      env: { ...process.env, PGPASSWORD: 'password' }
    });

    childProcess.on('close', (code: number) => {
      if (code === 0) {
        // Copy from container to host
        const copyArgs = ['cp', `${containerName}:/tmp/backup.sql`, snapshotPath];
        const copyProcess = spawn('docker', copyArgs);
        
        copyProcess.on('close', (copyCode: number) => {
          if (copyCode === 0) {
            resolve();
          } else {
            reject(new Error(`Failed to copy backup from container`));
          }
        });
      } else {
        reject(new Error(`pg_dump failed with code ${code}`));
      }
    });
  });
}

async function executeMySQLSnapshot(instance: any, snapshotPath: string, format: string): Promise<void> {
  const containerName = `haya-${instance.name}-db-1`;
  
  return new Promise((resolve, reject) => {
    const args = [
      'exec', containerName,
      'mysqldump',
      '-u', 'admin',
      '-p' + 'password',
      'database'
    ];

    const childProcess = spawn('docker', args);
    
    // Redirect output to file
    const fileStream = require('fs').createWriteStream(snapshotPath);
    childProcess.stdout.pipe(fileStream);

    childProcess.on('close', (code: number) => {
      fileStream.end();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`mysqldump failed with code ${code}`));
      }
    });
  });
}

async function executeRedisSnapshot(instance: any, snapshotPath: string, format: string): Promise<void> {
  const containerName = `haya-${instance.name}-db-1`;
  
  return new Promise((resolve, reject) => {
    // Create RDB backup
    const saveArgs = ['exec', containerName, 'redis-cli', 'BGSAVE'];
    const saveProcess = spawn('docker', saveArgs);

    saveProcess.on('close', (code: number) => {
      if (code === 0) {
        // Wait a bit for background save to complete
        setTimeout(() => {
          // Copy RDB file
          const copyArgs = ['cp', `${containerName}:/data/dump.rdb`, snapshotPath];
          const copyProcess = spawn('docker', copyArgs);
          
          copyProcess.on('close', (copyCode: number) => {
            if (copyCode === 0) {
              resolve();
            } else {
              reject(new Error(`Failed to copy Redis RDB file`));
            }
          });
        }, 1000);
      } else {
        reject(new Error(`Redis BGSAVE failed with code ${code}`));
      }
    });
  });
}

async function executeSQLiteSnapshot(instance: any, snapshotPath: string, format: string): Promise<void> {
  const containerName = `haya-${instance.name}-db-1`;
  
  return new Promise((resolve, reject) => {
    // For SQLite, just copy the database file
    const copyArgs = ['cp', `${containerName}:/data/${instance.name}.db`, snapshotPath];
    const copyProcess = spawn('docker', copyArgs);
    
    copyProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to copy SQLite database file`));
      }
    });
  });
}

async function executeInfluxDBSnapshot(instance: any, snapshotPath: string, format: string): Promise<void> {
  const containerName = `haya-${instance.name}-db-1`;
  
  return new Promise((resolve, reject) => {
    // InfluxDB backup (simplified - real implementation would use influx CLI)
    const args = [
      'exec', containerName,
      'tar', '-czf', '/tmp/influx_backup.tar.gz', 
      '/var/lib/influxdb2'
    ];

    const childProcess = spawn('docker', args);

    childProcess.on('close', (code: number) => {
      if (code === 0) {
        // Copy backup from container
        const copyArgs = ['cp', `${containerName}:/tmp/influx_backup.tar.gz`, snapshotPath];
        const copyProcess = spawn('docker', copyArgs);
        
        copyProcess.on('close', (copyCode: number) => {
          if (copyCode === 0) {
            resolve();
          } else {
            reject(new Error(`Failed to copy InfluxDB backup`));
          }
        });
      } else {
        reject(new Error(`InfluxDB backup failed with code ${code}`));
      }
    });
  });
}

async function executeGenericSnapshot(instance: any, snapshotPath: string, format: string): Promise<void> {
  const containerName = `haya-${instance.name}-db-1`;
  
  return new Promise((resolve, reject) => {
    // Generic backup - copy entire data directory
    const args = [
      'exec', containerName,
      'tar', '-czf', '/tmp/generic_backup.tar.gz', '/data'
    ];

    const childProcess = spawn('docker', args);

    childProcess.on('close', (code: number) => {
      if (code === 0) {
        // Copy backup from container
        const copyArgs = ['cp', `${containerName}:/tmp/generic_backup.tar.gz`, snapshotPath];
        const copyProcess = spawn('docker', copyArgs);
        
        copyProcess.on('close', (copyCode: number) => {
          if (copyCode === 0) {
            resolve();
          } else {
            reject(new Error(`Failed to copy generic backup`));
          }
        });
      } else {
        reject(new Error(`Generic backup failed with code ${code}`));
      }
    });
  });
}

export const snapshotCommand = new Command('snapshot')
  .description('Create a snapshot of a database instance')
  .argument('<name>', 'Database instance name')
  .option('-o, --output <path>', 'Output directory for snapshot')
  .option('-c, --compress', 'Compress the snapshot')
  .option('--format <format>', 'Snapshot format (sql, rdb, tar)', 'sql')
  .action(async (name: string, options: SnapshotOptions) => {
    try {
      const dockerManager = getDockerManager();
      await dockerManager.initialize();

      const instance = dockerManager.getInstance(name);
      if (!instance) {
        console.error(chalk.red(`❌ Database instance '${name}' not found`));
        process.exit(1);
      }

      // Check if database is running
      if (instance.status !== 'running') {
        console.error(chalk.red(`❌ Database '${name}' must be running to create snapshot`));
        console.log(chalk.yellow(`💡 Start it with: ${chalk.cyan(`hayai start ${name}`)}`));
        process.exit(1);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const snapshotName = `${name}-snapshot-${timestamp}`;
      const outputDir = options.output || path.join(process.cwd(), 'snapshots');
      
      // Determine file extension based on database type and format
      let extension = 'sql';
      if (instance.engine === 'redis') extension = 'rdb';
      if (instance.engine === 'sqlite' || instance.engine === 'duckdb') extension = 'db';
      if (options.format === 'tar') extension = 'tar.gz';
      
      const snapshotPath = path.join(outputDir, `${snapshotName}.${extension}`);

      console.log(chalk.cyan(`📸 Creating snapshot of '${name}'...`));
      console.log(chalk.gray(`Database: ${instance.engine}`));
      console.log(chalk.gray(`Output: ${snapshotPath}`));

      // Create snapshots directory
      await createSnapshotDirectory(outputDir);

      const spinner = ora(`Creating ${instance.engine} snapshot...`).start();

      try {
        await executeSnapshot(instance, snapshotPath, options.format || 'sql', options.compress || false);
        spinner.succeed(`Snapshot created successfully`);
      } catch (error) {
        spinner.fail(`Snapshot creation failed`);
        throw error;
      }

      // Get file size
      const stats = await fs.stat(snapshotPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(chalk.green('\n✅ Snapshot created!'));
      console.log(chalk.bold('Snapshot Details:'));
      console.log(`  Name: ${chalk.cyan(snapshotName)}`);
      console.log(`  Database: ${chalk.cyan(instance.name)} (${instance.engine})`);
      console.log(`  Format: ${chalk.cyan(extension)}`);
      console.log(`  Size: ${chalk.cyan(fileSizeMB + ' MB')}`);
      console.log(`  Path: ${chalk.cyan(snapshotPath)}`);

      console.log(chalk.yellow('\n💡 Next Steps:'));
      console.log(`  • View snapshots: ${chalk.cyan('hayai snapshot list')}`);
      console.log(`  • Restore snapshot: ${chalk.cyan(`hayai restore ${snapshotPath}`)}`);
      console.log(`  • Share snapshot: Copy the file to another machine`);

    } catch (error) {
      console.error(chalk.red('\n❌ Failed to create snapshot:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add subcommand for listing snapshots
snapshotCommand
  .command('list')
  .description('List all available snapshots')
  .option('-d, --directory <path>', 'Directory to search for snapshots', 'snapshots')
  .action(async (options) => {
    try {
      const snapshotsDir = path.resolve(options.directory);
      
      try {
        await fs.access(snapshotsDir);
      } catch {
        console.log(chalk.yellow(`📁 No snapshots directory found at: ${snapshotsDir}`));
        console.log(chalk.gray(`💡 Create snapshots with: ${chalk.cyan('hayai snapshot <database-name>')}`));
        return;
      }

      const files = await fs.readdir(snapshotsDir);
      const snapshotFiles = files.filter(file => 
        file.includes('-snapshot-') && 
        (file.endsWith('.sql') || file.endsWith('.rdb') || file.endsWith('.db') || file.endsWith('.tar.gz'))
      );

      if (snapshotFiles.length === 0) {
        console.log(chalk.yellow('📁 No snapshots found'));
        console.log(chalk.gray(`💡 Create snapshots with: ${chalk.cyan('hayai snapshot <database-name>')}`));
        return;
      }

      console.log(chalk.cyan('\n📸 Available Snapshots:\n'));

      const snapshots = await Promise.all(
        snapshotFiles.map(async (file) => {
          const filePath = path.join(snapshotsDir, file);
          const stats = await fs.stat(filePath);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          // Parse snapshot info from filename
          const parts = file.split('-snapshot-');
          const dbName = parts[0];
          const timestamp = parts[1]?.split('.')[0];
          const extension = path.extname(file);
          
          return {
            file,
            dbName,
            timestamp: timestamp ? new Date(timestamp.replace(/-/g, ':')).toLocaleString() : 'Unknown',
            size: sizeMB,
            extension: extension.replace('.', ''),
            path: filePath
          };
        })
      );

      // Sort by most recent first
      snapshots.sort((a, b) => b.file.localeCompare(a.file));

      snapshots.forEach((snapshot, index) => {
        console.log(`${index + 1}. ${chalk.bold(snapshot.dbName)}`);
        console.log(`   Format: ${chalk.cyan(snapshot.extension)}`);
        console.log(`   Created: ${chalk.gray(snapshot.timestamp)}`);
        console.log(`   Size: ${chalk.yellow(snapshot.size + ' MB')}`);
        console.log(`   Path: ${chalk.gray(snapshot.path)}`);
        console.log('');
      });

      console.log(chalk.yellow('💡 Commands:'));
      console.log(`  • Restore: ${chalk.cyan('hayai restore <snapshot-path>')}`);
      console.log(`  • Clean old: ${chalk.cyan('hayai snapshot clean')}`);

    } catch (error) {
      console.error(chalk.red('❌ Failed to list snapshots:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add subcommand for cleaning old snapshots
snapshotCommand
  .command('clean')
  .description('Remove old snapshots (keeps last 5 per database)')
  .option('-d, --directory <path>', 'Directory to clean', 'snapshots')
  .option('--keep <number>', 'Number of snapshots to keep per database', parseInt, 5)
  .option('--dry-run', 'Show what would be deleted without actually deleting')
  .action(async (options) => {
    try {
      const snapshotsDir = path.resolve(options.directory);
      
      try {
        await fs.access(snapshotsDir);
      } catch {
        console.log(chalk.yellow(`📁 No snapshots directory found at: ${snapshotsDir}`));
        return;
      }

      const files = await fs.readdir(snapshotsDir);
      const snapshotFiles = files.filter(file => 
        file.includes('-snapshot-') && 
        (file.endsWith('.sql') || file.endsWith('.rdb') || file.endsWith('.db') || file.endsWith('.tar.gz'))
      );

      if (snapshotFiles.length === 0) {
        console.log(chalk.yellow('📁 No snapshots found to clean'));
        return;
      }

      // Group by database name
      const snapshotsByDb: { [key: string]: string[] } = {};
      snapshotFiles.forEach(file => {
        const dbName = file.split('-snapshot-')[0];
        if (!snapshotsByDb[dbName]) {
          snapshotsByDb[dbName] = [];
        }
        snapshotsByDb[dbName].push(file);
      });

      const toDelete: string[] = [];
      
      Object.entries(snapshotsByDb).forEach(([dbName, snapshots]) => {
        // Sort by newest first
        snapshots.sort((a, b) => b.localeCompare(a));
        
        // Mark old ones for deletion
        if (snapshots.length > options.keep) {
          const oldSnapshots = snapshots.slice(options.keep);
          toDelete.push(...oldSnapshots);
        }
      });

      if (toDelete.length === 0) {
        console.log(chalk.green('✅ No old snapshots to clean'));
        return;
      }

      console.log(chalk.cyan(`🧹 Found ${toDelete.length} old snapshots to clean:`));
      console.log('');

      toDelete.forEach(file => {
        const dbName = file.split('-snapshot-')[0];
        console.log(`  ${chalk.red('×')} ${dbName}: ${chalk.gray(file)}`);
      });

      if (options.dryRun) {
        console.log(chalk.yellow('\n🔍 Dry run mode - no files were deleted'));
        console.log(chalk.gray(`💡 Run without --dry-run to actually delete these files`));
        return;
      }

      console.log('');
      const deletedCount = toDelete.length;
      
      for (const file of toDelete) {
        await fs.unlink(path.join(snapshotsDir, file));
      }

      console.log(chalk.green(`✅ Cleaned ${deletedCount} old snapshots`));
      console.log(chalk.gray(`💡 Kept the most recent ${options.keep} snapshots per database`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to clean snapshots:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }); 