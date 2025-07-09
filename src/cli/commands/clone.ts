import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getDockerManager } from '../../core/docker.js';
import { getTemplate } from '../../core/templates.js';
import { CLIOptions } from '../../core/types.js';
import { spawn } from 'child_process';

interface CloneOptions extends CLIOptions {
  from: string;
  to?: string;
  toMultiple?: string;
  confirm?: boolean;
  force?: boolean;
  dryRun?: boolean;
}

// Engines totalmente compatíveis com implementação nativa específica
const FULLY_COMPATIBLE_ENGINES = new Set([
  'postgresql',  // pg_dump + psql (nativo)
  'mariadb',     // mysqldump + mysql (nativo)
  'redis',       // BGSAVE + RDB copy (nativo)
  'sqlite',      // File copy (confiável)
  'duckdb'       // File copy (confiável)
]);

function validateCloneCompatibility(sourceEngine: string): { compatible: boolean; reason?: string } {
  if (!FULLY_COMPATIBLE_ENGINES.has(sourceEngine)) {
    return {
      compatible: false,
      reason: `Engine '${sourceEngine}' uses generic backup which may be unreliable`
    };
  }
  
  return { compatible: true };
}

function showManualCloneGuidance(engine: string): void {
  console.log(chalk.yellow('\n💡 Manual Clone Guidance:'));
  
  switch (engine) {
    case 'cassandra':
      console.log(chalk.gray('  • Use: nodetool snapshot + sstableloader'));
      console.log(chalk.gray('  • Or: cqlsh COPY commands'));
      break;
    case 'influxdb2':
      console.log(chalk.gray('  • Use: influx backup + influx restore'));
      break;
    case 'influxdb3':
      console.log(chalk.gray('  • Use: influx3 export + influx3 import'));
      break;
    case 'qdrant':
      console.log(chalk.gray('  • Use: Qdrant snapshots API'));
      console.log(chalk.gray('  • Or: /collections/{collection}/snapshots'));
      break;
    case 'meilisearch':
      console.log(chalk.gray('  • Use: dumps API endpoint'));
      console.log(chalk.gray('  • POST /dumps + GET /dumps/{dumpUid}'));
      break;
    case 'milvus':
      console.log(chalk.gray('  • Use: Milvus backup tool'));
      console.log(chalk.gray('  • Or: collection export/import'));
      break;
    case 'arangodb':
      console.log(chalk.gray('  • Use: arangodump + arangorestore'));
      break;
    case 'timescaledb':
      console.log(chalk.gray('  • Use: pg_dump (TimescaleDB extensions)'));
      console.log(chalk.gray('  • Include: --extension timescaledb'));
      break;
    default:
      console.log(chalk.gray(`  • Check ${engine} documentation for native backup/restore tools`));
      console.log(chalk.gray('  • Use engine-specific export/import commands'));
      console.log(chalk.gray('  • Consider data migration tools or scripts'));
  }
  
  console.log(chalk.yellow('\n📚 Alternative Options:'));
  console.log(chalk.gray('  • Use database-specific migration tools'));
  console.log(chalk.gray('  • Write custom data transfer scripts'));
  console.log(chalk.gray('  • Use hayai studio to access admin dashboards'));
  console.log(chalk.cyan('  • Run: hayai studio --help'));
}

async function executeClone(sourceInstance: any, targetName: string): Promise<void> {
  const dockerManager = getDockerManager();
  
  // Get source template
  const sourceTemplate = getTemplate(sourceInstance.engine);
  if (!sourceTemplate) {
    throw new Error(`Template not found for engine: ${sourceInstance.engine}`);
  }

  console.log(chalk.cyan(`🔄 Cloning ${sourceInstance.name} → ${targetName}...`));
  
  // Create target database with same configuration
  await dockerManager.createDatabase(
    targetName,
    sourceTemplate,
    {
      port: undefined, // Let it auto-allocate
      adminDashboard: false,
      customEnv: { ...sourceInstance.environment }
    }
  );

  // Start target database
  await dockerManager.startDatabase(targetName);
  
  // Wait for database to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Clone data based on database type
  await cloneData(sourceInstance, targetName);
  
  console.log(chalk.green(`✅ Successfully cloned ${sourceInstance.name} → ${targetName}`));
}

async function cloneData(source: any, targetName: string): Promise<void> {
  const sourceContainer = `${source.name}-db`;
  const targetContainer = `${targetName}-db`;
  
  switch (source.engine) {
    case 'postgresql':
      await clonePostgreSQL(sourceContainer, targetContainer);
      break;
    case 'mariadb':
      await cloneMariaDB(sourceContainer, targetContainer);
      break;
    case 'redis':
      await cloneRedis(sourceContainer, targetContainer);
      break;
    case 'sqlite':
    case 'duckdb':
      await cloneFileDB(sourceContainer, targetContainer);
      break;
    default:
      // Esta situação nunca deveria acontecer devido à validação de compatibilidade
      throw new Error(`Unsupported engine for cloning: ${source.engine}`);
  }
}

async function clonePostgreSQL(sourceContainer: string, targetContainer: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dumpProcess = spawn('docker', [
      'exec', sourceContainer,
      'pg_dump', '-U', 'postgres', '--clean', '--create'
    ], { stdio: ['inherit', 'pipe', 'pipe'] });
    
    const restoreProcess = spawn('docker', [
      'exec', '-i', targetContainer,
      'psql', '-U', 'postgres'
    ], { stdio: ['pipe', 'inherit', 'pipe'] });
    
    dumpProcess.stdout.pipe(restoreProcess.stdin);
    
    restoreProcess.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error('PostgreSQL clone failed'));
    });
    
    dumpProcess.on('error', reject);
    restoreProcess.on('error', reject);
  });
}

async function cloneMariaDB(sourceContainer: string, targetContainer: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dumpProcess = spawn('docker', [
      'exec', sourceContainer,
      'mysqldump', '-u', 'root', '--all-databases'
    ], { stdio: ['inherit', 'pipe', 'pipe'] });
    
    const restoreProcess = spawn('docker', [
      'exec', '-i', targetContainer,
      'mysql', '-u', 'root'
    ], { stdio: ['pipe', 'inherit', 'pipe'] });
    
    dumpProcess.stdout.pipe(restoreProcess.stdin);
    
    restoreProcess.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error('MariaDB clone failed'));
    });
    
    dumpProcess.on('error', reject);
    restoreProcess.on('error', reject);
  });
}

async function cloneRedis(sourceContainer: string, targetContainer: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create RDB backup
    const bgsaveProcess = spawn('docker', [
      'exec', sourceContainer, 'redis-cli', 'BGSAVE'
    ]);
    
    bgsaveProcess.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error('Redis backup failed'));
        return;
      }
      
      // Wait for backup to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Copy RDB file
      const copyProcess = spawn('docker', [
        'cp', `${sourceContainer}:/data/dump.rdb`, '/tmp/redis-clone.rdb'
      ]);
      
      copyProcess.on('close', (copyCode) => {
        if (copyCode !== 0) {
          reject(new Error('Failed to copy Redis data'));
          return;
        }
        
        // Restore to target
        const restoreProcess = spawn('docker', [
          'cp', '/tmp/redis-clone.rdb', `${targetContainer}:/data/dump.rdb`
        ]);
        
        restoreProcess.on('close', async (restoreCode) => {
          if (restoreCode === 0) {
            // Restart target to load data
            const dockerManager = getDockerManager();
            try {
              await dockerManager.stopDatabase(targetContainer.replace('-db', ''));
              await dockerManager.startDatabase(targetContainer.replace('-db', ''));
              resolve();
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error('Failed to restore Redis data'));
          }
        });
        
        restoreProcess.on('error', reject);
      });
      
      copyProcess.on('error', reject);
    });
    
    bgsaveProcess.on('error', reject);
  });
}

async function cloneFileDB(sourceContainer: string, targetContainer: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Copy database file
    const copyProcess = spawn('docker', [
      'cp', `${sourceContainer}:/data/database.db`, '/tmp/hayai-clone.db'
    ]);
    
    copyProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to copy database file'));
        return;
      }
      
      // Restore to target
      const restoreProcess = spawn('docker', [
        'cp', '/tmp/hayai-clone.db', `${targetContainer}:/data/database.db`
      ]);
      
      restoreProcess.on('close', (restoreCode) => {
        restoreCode === 0 ? resolve() : reject(new Error('Failed to restore database file'));
      });
      
      restoreProcess.on('error', reject);
    });
    
    copyProcess.on('error', reject);
  });
}

async function handleClone(options: CloneOptions): Promise<void> {
  const dockerManager = getDockerManager();
  await dockerManager.initialize();
  
  // Validate source database
  const sourceInstance = dockerManager.getInstance(options.from);
  if (!sourceInstance) {
    console.error(chalk.red(`❌ Source database '${options.from}' not found`));
    console.log(chalk.yellow('💡 Run `hayai list` to see available databases'));
    process.exit(1);
  }
  
  // Check if source is running
  if (sourceInstance.status !== 'running') {
    console.error(chalk.red(`❌ Source database '${options.from}' must be running`));
    console.log(chalk.yellow(`💡 Start it with: ${chalk.cyan(`hayai start ${options.from}`)}`));
    process.exit(1);
  }

  // Validate compatibility
  const compatibilityResult = validateCloneCompatibility(sourceInstance.engine);
  if (!compatibilityResult.compatible) {
    console.error(chalk.red(`❌ Source engine '${sourceInstance.engine}' is not fully compatible for cloning.`));
    console.error(chalk.red(`Reason: ${compatibilityResult.reason}`));
    showManualCloneGuidance(sourceInstance.engine);
    process.exit(1);
  }
  
  // Determine target databases
  let targetNames: string[] = [];
  
  if (options.to) {
    targetNames = [options.to];
  } else if (options.toMultiple) {
    targetNames = options.toMultiple.split(',').map(name => name.trim());
  } else {
    console.error(chalk.red('❌ Must specify target database(s)'));
    console.log(chalk.yellow('💡 Use --to or --to-multiple'));
    process.exit(1);
  }
  
  // Validate target names
  for (const targetName of targetNames) {
    if (dockerManager.getInstance(targetName)) {
      if (!options.force) {
        console.error(chalk.red(`❌ Target database '${targetName}' already exists`));
        console.log(chalk.yellow('💡 Use --force to overwrite existing databases'));
        process.exit(1);
      }
    }
  }
  
  // Show preview
  console.log(chalk.cyan('\n🔍 Clone Preview:'));
  console.log(chalk.gray(`Source: ${options.from} (${sourceInstance.engine})`));
  console.log(chalk.gray(`Targets: ${targetNames.join(', ')}`));
  
  if (options.dryRun) {
    console.log(chalk.yellow('\n🚧 Dry run - no actual cloning performed'));
    return;
  }
  
  // Confirmation
  if (!options.confirm && !options.force) {
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Clone ${options.from} to ${targetNames.length} database(s)?`,
        default: false,
      },
    ]);
    
    if (!proceed) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }
  }
  
  // Execute clones
  const spinner = ora('Cloning databases...').start();
  
  try {
    for (let i = 0; i < targetNames.length; i++) {
      const targetName = targetNames[i];
      spinner.text = `Cloning ${options.from} → ${targetName} (${i + 1}/${targetNames.length})`;
      
      // Remove existing if force
      if (options.force && dockerManager.getInstance(targetName)) {
        await dockerManager.removeDatabase(targetName);
      }
      
      await executeClone(sourceInstance, targetName);
    }
    
    spinner.succeed(`Successfully cloned ${options.from} to ${targetNames.length} database(s)`);
    
    console.log(chalk.green('\n✅ Clone operation completed!'));
    console.log(chalk.yellow('💡 Commands:'));
    console.log(`  • ${chalk.cyan('hayai list')} - View all databases`);
    console.log(`  • ${chalk.cyan('hayai studio')} - Open admin dashboards`);
    
  } catch (error) {
    spinner.fail('Clone operation failed');
    console.error(chalk.red('\n❌ Clone failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export const cloneCommand = new Command('clone')
  .description('Clone database instances (compatible engines only)')
  .option('-f, --from <name>', 'Source database name')
  .option('-t, --to <name>', 'Target database name (1:1 clone)')
  .option('-tm, --to-multiple <names>', 'Target database names (comma-separated, 1:N clone)')
  .option('-y, --confirm', 'Skip confirmation prompt')
  .option('--force', 'Overwrite existing target databases')
  .option('--dry-run', 'Show what would be cloned without executing')
  .option('--verbose', 'Enable verbose output')
  .addHelpText('after', `
${chalk.bold('Supported Engines (Fully Compatible):')}
  ${chalk.green('✅ postgresql')}   - Native pg_dump + psql
  ${chalk.green('✅ mariadb')}      - Native mysqldump + mysql  
  ${chalk.green('✅ redis')}        - Native BGSAVE + RDB copy
  ${chalk.green('✅ sqlite')}       - Reliable file copy
  ${chalk.green('✅ duckdb')}       - Reliable file copy

${chalk.bold('Unsupported Engines (Manual Clone Required):')}
  ${chalk.red('❌ cassandra, influxdb2, influxdb3, timescaledb, questdb')}
  ${chalk.red('❌ qdrant, weaviate, milvus, arangodb, nebula')}
  ${chalk.red('❌ meilisearch, typesense, victoriametrics, horaedb')}
  ${chalk.red('❌ leveldb, lmdb, tikv')}

${chalk.bold('Examples:')}
  ${chalk.cyan('# Clone PostgreSQL database')}
  hayai clone --from prod-postgres --to staging-postgres
  hayai clone -f prod-postgres -t staging-postgres -y

  ${chalk.cyan('# Clone Redis to multiple instances')}
  hayai clone --from cache-redis --to-multiple "test1,test2,test3"
  hayai clone -f cache-redis -tm "dev,staging,qa" -y

  ${chalk.cyan('# Safe cloning with preview')}
  hayai clone -f prod-mariadb -t staging-mariadb --dry-run

${chalk.bold('Visual Syntax (alternative):')}
  ${chalk.cyan('hayai clone postgres-prod → postgres-staging')}    ${chalk.gray('# Simple clone')}
  ${chalk.cyan('hayai clone redis-cache → redis1,redis2')}         ${chalk.gray('# Multiple targets')}

${chalk.bold('For unsupported engines:')}
  ${chalk.yellow('Use engine-specific tools:')} cassandra (nodetool), influx (backup/restore)
  ${chalk.yellow('Access admin dashboards:')} hayai studio
  ${chalk.yellow('Manual data migration:')} Write custom scripts or use migration tools
`)
  .action(handleClone); 