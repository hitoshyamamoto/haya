import { Command } from 'commander';
import chalk from 'chalk';
import { getDockerManager } from '../../core/docker.js';
import { getTemplate } from '../../core/templates.js';

export const studioCommand = new Command('studio')
  .description('Open admin dashboards for database instances')
  .argument('[name]', 'Database instance name (optional, opens all if not specified)')
  .option('-p, --port <port>', 'Custom port for dashboard', parseInt)
  .action(async (name?: string, options?) => {
    try {
      const dockerManager = getDockerManager();
      await dockerManager.initialize();

      let instances = name ? [dockerManager.getInstance(name)] : dockerManager.getAllInstances();
      const validInstances = instances.filter(instance => instance !== undefined);

      if (validInstances.length === 0) {
        console.error(chalk.red(`❌ ${name ? `Database instance '${name}' not found` : 'No database instances found'}`));
        process.exit(1);
      }

      console.log(chalk.cyan('\n🎛️  Admin Dashboards:\n'));

      const dashboardUrls: string[] = [];

      for (const instance of validInstances) {
        const template = getTemplate(instance.engine);
        
        if (template?.admin_dashboard?.enabled) {
          const dashboardPort = options.port || template.admin_dashboard.port;
          const dashboardUrl = `http://localhost:${dashboardPort}`;
          
          console.log(`${chalk.bold(instance.name)} (${template.name})`);
          console.log(`  Dashboard: ${chalk.cyan(dashboardUrl)}`);
          console.log(`  Status: ${chalk[instance.status === 'running' ? 'green' : 'red'](instance.status)}`);
          
          if (instance.status === 'running') {
            dashboardUrls.push(dashboardUrl);
          } else {
            console.log(`  ${chalk.yellow('⚠ Database must be running to access dashboard')}`);
          }
        } else {
          console.log(`${chalk.bold(instance.name)} (${template?.name || instance.engine})`);
          console.log(`  ${chalk.gray('No admin dashboard available for this engine')}`);
        }
        console.log('');
      }

      if (dashboardUrls.length > 0) {
        console.log(chalk.green('✅ Available Dashboards:'));
        dashboardUrls.forEach(url => {
          console.log(`  🌐 ${chalk.cyan(url)}`);
        });

        console.log(chalk.yellow('\n💡 Tips:'));
        console.log('  • Open the URLs above in your browser');
        console.log('  • Use the connection details from `hayai list` to connect');
        console.log('  • Default credentials are usually admin/password');
      } else {
        console.log(chalk.yellow('⚠ No dashboards available'));
        console.log(chalk.gray('Make sure your databases are running: `hayai start`'));
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Failed to open studios:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }); 