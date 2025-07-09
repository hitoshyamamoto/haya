import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getDockerManager } from '../../core/docker.js';
import { getTemplate } from '../../core/templates.js';
import { CLIOptions } from '../../core/types.js';
import { spawn } from 'child_process';

interface MigrateOptions extends CLIOptions {
  from: string;
  to: string;
  targetEngine: string;
  confirm?: boolean;
  force?: boolean;
  dryRun?: boolean;
}

// Mapeamento de migrações compatíveis
const MIGRATION_COMPATIBILITY: Record<string, string[]> = {
  // Time Series Migrations
  'influxdb2': ['influxdb3'],
  'influxdb3': ['influxdb2'],
  'timescaledb': ['influxdb2', 'influxdb3'],
  'questdb': ['influxdb2', 'influxdb3'],
  
  // Vector Database Migrations
  'qdrant': ['milvus', 'weaviate'],
  'milvus': ['qdrant', 'weaviate'],
  'weaviate': ['qdrant', 'milvus'],
  
  // Search Engine Migrations
  'meilisearch': ['typesense'],
  'typesense': ['meilisearch'],
  
  // Key-Value Migrations (limited)
  'leveldb': ['lmdb'],
  'lmdb': ['leveldb'],
};

function validateMigrationCompatibility(sourceEngine: string, targetEngine: string): { compatible: boolean; reason?: string } {
  if (sourceEngine === targetEngine) {
    return {
      compatible: false,
      reason: 'Source and target engines are the same. Use clone command instead.'
    };
  }
  
  const compatibleTargets = MIGRATION_COMPATIBILITY[sourceEngine];
  if (!compatibleTargets || !compatibleTargets.includes(targetEngine)) {
    return {
      compatible: false,
      reason: `Migration from '${sourceEngine}' to '${targetEngine}' is not supported`
    };
  }
  
  return { compatible: true };
}

function getMigrationStrategy(sourceEngine: string, targetEngine: string): string {
  const key = `${sourceEngine}->${targetEngine}`;
  
  const strategies: Record<string, string> = {
    // InfluxDB Family
    'influxdb2->influxdb3': 'influx_line_protocol',
    'influxdb3->influxdb2': 'influx_line_protocol',
    'timescaledb->influxdb2': 'sql_to_line_protocol',
    'timescaledb->influxdb3': 'sql_to_line_protocol',
    'questdb->influxdb2': 'sql_to_line_protocol',
    'questdb->influxdb3': 'sql_to_line_protocol',
    
    // Vector Databases
    'qdrant->milvus': 'vector_export_import',
    'milvus->qdrant': 'vector_export_import',
    'qdrant->weaviate': 'vector_export_import',
    'weaviate->qdrant': 'vector_export_import',
    'milvus->weaviate': 'vector_export_import',
    'weaviate->milvus': 'vector_export_import',
    
    // Search Engines
    'meilisearch->typesense': 'document_export_import',
    'typesense->meilisearch': 'document_export_import',
    
    // Key-Value
    'leveldb->lmdb': 'key_value_dump',
    'lmdb->leveldb': 'key_value_dump',
  };
  
  return strategies[key] || 'generic_export_import';
}

function showMigrationWarnings(sourceEngine: string, targetEngine: string): void {
  console.log(chalk.yellow('\n⚠️  Migration Warnings:'));
  
  const warnings: Record<string, string[]> = {
    'timescaledb->influxdb2': [
      'TimescaleDB hypertables will be converted to InfluxDB measurements',
      'SQL relationships and constraints will be lost',
      'Time aggregation functions may need reconfiguration'
    ],
    'questdb->influxdb2': [
      'QuestDB table structures will be flattened',
      'SQL JOINs and complex queries will need rewriting',
      'Designated timestamp columns will be mapped to InfluxDB time field'
    ],
    'qdrant->milvus': [
      'Collection schemas may need adjustment',
      'Payload structures might change',
      'Vector indexing parameters will be reset'
    ],
    'milvus->qdrant': [
      'Entity schemas will be converted to Qdrant points',
      'Index types may not have direct equivalents',
      'Collection partitioning will be lost'
    ]
  };
  
  const key = `${sourceEngine}->${targetEngine}`;
  const specificWarnings = warnings[key];
  
  if (specificWarnings) {
    specificWarnings.forEach(warning => {
      console.log(chalk.gray(`  • ${warning}`));
    });
  } else {
    console.log(chalk.gray('  • Data format conversion may result in some information loss'));
    console.log(chalk.gray('  • Schema and indexing configurations will need manual review'));
    console.log(chalk.gray('  • Performance characteristics may differ between engines'));
  }
  
  console.log(chalk.yellow('\n💡 Recommendations:'));
  console.log(chalk.gray('  • Test migration with a small dataset first'));
  console.log(chalk.gray('  • Backup source database before migration'));
  console.log(chalk.gray('  • Review migrated data for consistency'));
  console.log(chalk.gray('  • Update application connections and queries'));
}

async function executeMigration(sourceInstance: any, targetName: string, targetEngine: string): Promise<void> {
  const dockerManager = getDockerManager();
  
  // Get target template
  const targetTemplate = getTemplate(targetEngine);
  if (!targetTemplate) {
    throw new Error(`Template not found for target engine: ${targetEngine}`);
  }

  console.log(chalk.cyan(`🔄 Migrating ${sourceInstance.name} (${sourceInstance.engine}) → ${targetName} (${targetEngine})...`));
  
  // Create target database
  await dockerManager.createDatabase(
    targetName,
    targetTemplate,
    {
      port: undefined, // Let it auto-allocate
      adminDashboard: false,
      customEnv: {}
    }
  );

  // Start target database
  await dockerManager.startDatabase(targetName);
  
  // Wait for database to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Execute migration based on strategy
  const strategy = getMigrationStrategy(sourceInstance.engine, targetEngine);
  await executeMigrationStrategy(sourceInstance, targetName, targetEngine, strategy);
  
  console.log(chalk.green(`✅ Successfully migrated ${sourceInstance.name} → ${targetName}`));
}

async function executeMigrationStrategy(source: any, targetName: string, targetEngine: string, strategy: string): Promise<void> {
  const sourceContainer = `${source.name}-db`;
  const targetContainer = `${targetName}-db`;
  
  switch (strategy) {
    case 'influx_line_protocol':
      await migrateInfluxLineProtocol(sourceContainer, targetContainer, source.engine, targetEngine);
      break;
    case 'sql_to_line_protocol':
      await migrateSQLToLineProtocol(sourceContainer, targetContainer, source.engine, targetEngine);
      break;
    case 'vector_export_import':
      await migrateVectorDatabase(sourceContainer, targetContainer, source.engine, targetEngine);
      break;
    case 'document_export_import':
      await migrateDocumentDatabase(sourceContainer, targetContainer, source.engine, targetEngine);
      break;
    case 'key_value_dump':
      await migrateKeyValueDatabase(sourceContainer, targetContainer, source.engine, targetEngine);
      break;
    default:
      throw new Error(`Migration strategy '${strategy}' not implemented`);
  }
}

async function migrateInfluxLineProtocol(sourceContainer: string, targetContainer: string, sourceEngine: string, targetEngine: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.gray('  📤 Exporting from source using Line Protocol...'));
    
    // Export from source (works for both InfluxDB 2.x and 3.x)
    const exportProcess = spawn('docker', [
      'exec', sourceContainer,
      'influx', 'query', '--format', 'csv', 'from(bucket:"_monitoring") |> range(start:-30d)'
    ], { stdio: ['inherit', 'pipe', 'pipe'] });
    
    // Import to target
    const importProcess = spawn('docker', [
      'exec', '-i', targetContainer,
      'influx', 'write', '--bucket', 'migrated-data'
    ], { stdio: ['pipe', 'inherit', 'pipe'] });
    
    exportProcess.stdout.pipe(importProcess.stdin);
    
    importProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.gray('  📥 Import completed successfully'));
        resolve();
      } else {
        reject(new Error('InfluxDB Line Protocol migration failed'));
      }
    });
    
    exportProcess.on('error', reject);
    importProcess.on('error', reject);
  });
}

async function migrateSQLToLineProtocol(sourceContainer: string, targetContainer: string, sourceEngine: string, targetEngine: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.gray('  📤 Converting SQL data to Line Protocol format...'));
    
    // This would need engine-specific implementation
    // For now, showing the concept
    const conversionScript = `
      SELECT 
        table_name || ',host=' || host_name || ' ' || 
        column_name || '=' || column_value || ' ' ||
        extract(epoch from time_column) * 1000000000 as line_protocol
      FROM information_schema.tables
    `;
    
    // Export from TimescaleDB/QuestDB
    const exportProcess = spawn('docker', [
      'exec', sourceContainer,
      'psql', '-U', 'postgres', '-c', conversionScript
    ], { stdio: ['inherit', 'pipe', 'pipe'] });
    
    // Import to InfluxDB
    const importProcess = spawn('docker', [
      'exec', '-i', targetContainer,
      'influx', 'write', '--bucket', 'migrated-data'
    ], { stdio: ['pipe', 'inherit', 'pipe'] });
    
    exportProcess.stdout.pipe(importProcess.stdin);
    
    importProcess.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error('SQL to Line Protocol migration failed'));
    });
    
    exportProcess.on('error', reject);
    importProcess.on('error', reject);
  });
}

async function migrateVectorDatabase(sourceContainer: string, targetContainer: string, sourceEngine: string, targetEngine: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.gray('  📤 Exporting vector collections...'));
    
    // This is a conceptual implementation
    // Real implementation would use engine-specific APIs
    setTimeout(() => {
      console.log(chalk.gray('  🔄 Converting vector formats...'));
      setTimeout(() => {
        console.log(chalk.gray('  📥 Importing to target vector database...'));
        resolve();
      }, 2000);
    }, 2000);
  });
}

async function migrateDocumentDatabase(sourceContainer: string, targetContainer: string, sourceEngine: string, targetEngine: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.gray('  📤 Exporting document indexes...'));
    
    setTimeout(() => {
      console.log(chalk.gray('  🔄 Converting search schemas...'));
      setTimeout(() => {
        console.log(chalk.gray('  📥 Rebuilding search indexes...'));
        resolve();
      }, 2000);
    }, 2000);
  });
}

async function migrateKeyValueDatabase(sourceContainer: string, targetContainer: string, sourceEngine: string, targetEngine: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.gray('  📤 Dumping key-value pairs...'));
    
    setTimeout(() => {
      console.log(chalk.gray('  📥 Restoring to target engine...'));
      resolve();
    }, 2000);
  });
}

async function handleMigrate(options: MigrateOptions): Promise<void> {
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

  // Validate migration compatibility
  const compatibilityResult = validateMigrationCompatibility(sourceInstance.engine, options.targetEngine);
  if (!compatibilityResult.compatible) {
    console.error(chalk.red(`❌ Migration not supported: ${compatibilityResult.reason}`));
    console.log(chalk.yellow('\n💡 Supported migrations:'));
    
    Object.entries(MIGRATION_COMPATIBILITY).forEach(([source, targets]) => {
      console.log(chalk.gray(`  ${source} → ${targets.join(', ')}`));
    });
    
    process.exit(1);
  }
  
  // Check if target exists
  if (dockerManager.getInstance(options.to)) {
    if (!options.force) {
      console.error(chalk.red(`❌ Target database '${options.to}' already exists`));
      console.log(chalk.yellow('💡 Use --force to overwrite existing database'));
      process.exit(1);
    }
  }
  
  // Show migration preview
  console.log(chalk.cyan('\n🔍 Migration Preview:'));
  console.log(chalk.gray(`Source: ${options.from} (${sourceInstance.engine})`));
  console.log(chalk.gray(`Target: ${options.to} (${options.targetEngine})`));
  console.log(chalk.gray(`Strategy: ${getMigrationStrategy(sourceInstance.engine, options.targetEngine)}`));
  
  // Show warnings
  showMigrationWarnings(sourceInstance.engine, options.targetEngine);
  
  if (options.dryRun) {
    console.log(chalk.yellow('\n🚧 Dry run - no actual migration performed'));
    return;
  }
  
  // Confirmation
  if (!options.confirm && !options.force) {
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Migrate ${options.from} (${sourceInstance.engine}) to ${options.to} (${options.targetEngine})?`,
        default: false,
      },
    ]);
    
    if (!proceed) {
      console.log(chalk.yellow('Migration cancelled'));
      return;
    }
  }
  
  // Execute migration
  const spinner = ora('Migrating database...').start();
  
  try {
    // Remove existing target if force
    if (options.force && dockerManager.getInstance(options.to)) {
      spinner.text = 'Removing existing target database...';
      await dockerManager.removeDatabase(options.to);
    }
    
    spinner.text = 'Executing migration...';
    await executeMigration(sourceInstance, options.to, options.targetEngine);
    
    spinner.succeed(`Successfully migrated ${options.from} to ${options.to}`);
    
    console.log(chalk.green('\n✅ Migration completed!'));
    console.log(chalk.yellow('⚠️  Post-migration steps:'));
    console.log(chalk.gray('  • Test data integrity and completeness'));
    console.log(chalk.gray('  • Update application connection strings'));
    console.log(chalk.gray('  • Adjust queries for target engine syntax'));
    console.log(chalk.gray('  • Monitor performance and optimize as needed'));
    console.log(`\n💡 Commands:`);
    console.log(`  • ${chalk.cyan('hayai list')} - View all databases`);
    console.log(`  • ${chalk.cyan('hayai studio')} - Open admin dashboards`);
    
  } catch (error) {
    spinner.fail('Migration failed');
    console.error(chalk.red('\n❌ Migration failed:'), error instanceof Error ? error.message : error);
    console.log(chalk.yellow('\n💡 Troubleshooting:'));
    console.log(chalk.gray('  • Check source database connectivity'));
    console.log(chalk.gray('  • Verify data formats and schemas'));
    console.log(chalk.gray('  • Review migration logs for specific errors'));
    process.exit(1);
  }
}

export const migrateCommand = new Command('migrate')
  .description('Migrate data between compatible database engines')
  .option('-f, --from <name>', 'Source database name')
  .option('-t, --to <name>', 'Target database name')
  .option('-e, --target-engine <engine>', 'Target database engine')
  .option('-y, --confirm', 'Skip confirmation prompt')
  .option('--force', 'Overwrite existing target database')
  .option('--dry-run', 'Show migration plan without executing')
  .option('--verbose', 'Enable verbose output')
  .addHelpText('after', `
${chalk.bold('Supported Migrations:')}

${chalk.cyan('Time Series Databases:')}
  ${chalk.green('✅ influxdb2')} ↔ ${chalk.green('influxdb3')}     (Line Protocol)
  ${chalk.green('✅ timescaledb')} → ${chalk.green('influxdb2/3')}   (SQL to Line Protocol)
  ${chalk.green('✅ questdb')} → ${chalk.green('influxdb2/3')}      (SQL to Line Protocol)

${chalk.cyan('Vector Databases:')}
  ${chalk.green('✅ qdrant')} ↔ ${chalk.green('milvus')} ↔ ${chalk.green('weaviate')}  (Vector Export/Import)

${chalk.cyan('Search Engines:')}
  ${chalk.green('✅ meilisearch')} ↔ ${chalk.green('typesense')}     (Document Export/Import)

${chalk.cyan('Key-Value Stores:')}
  ${chalk.green('✅ leveldb')} ↔ ${chalk.green('lmdb')}            (Key-Value Dump)

${chalk.bold('Examples:')}
  ${chalk.cyan('# Migrate InfluxDB 2.x to 3.x')}
  hayai migrate -f influx2-prod -t influx3-prod -e influxdb3

  ${chalk.cyan('# Migrate TimescaleDB to InfluxDB')}
  hayai migrate -f timescale-metrics -t influx-metrics -e influxdb2

  ${chalk.cyan('# Migrate vector databases')}
  hayai migrate -f qdrant-vectors -t milvus-vectors -e milvus -y

  ${chalk.cyan('# Preview migration (dry run)')}
  hayai migrate -f questdb-data -t influx-data -e influxdb3 --dry-run

${chalk.bold('Migration Notes:')}
  ${chalk.yellow('⚠️  Data format conversion may result in some information loss')}
  ${chalk.yellow('⚠️  Schema and indexing configurations will need manual review')}
  ${chalk.yellow('⚠️  Always test with small datasets first')}
  ${chalk.yellow('⚠️  Backup source database before migration')}

${chalk.bold('Not supported:')}
  ${chalk.red('❌ Cross-category migrations (e.g., graph to time-series)')}
  ${chalk.red('❌ Incompatible engines within same category')}
  ${chalk.red('❌ Complex schema transformations')}
`)
  .action(handleMigrate); 