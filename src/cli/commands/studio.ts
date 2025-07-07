import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import * as net from 'net';
import { getDockerManager } from '../../core/docker.js';
import { getTemplate } from '../../core/templates.js';

function openInBrowser(url: string): void {
  let command: string;
  let args: string[];

  switch (process.platform) {
    case 'darwin': // macOS
      command = 'open';
      args = [url];
      break;
    case 'win32': // Windows
      command = 'start';
      args = ['', url];
      break;
    default: // Linux and others
      command = 'xdg-open';
      args = [url];
      break;
  }

  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.unref();
}

async function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

export const studioCommand = new Command('studio')
  .description('Open admin dashboards for database instances')
  .argument('[name]', 'Database instance name (optional, opens all if not specified)')
  .option('-p, --port <port>', 'Custom port for dashboard', parseInt)
  .option('--no-open', 'Don\'t automatically open browser')
  .option('--check-ports', 'Check if dashboard ports are accessible')
  .action(async (name?: string, options?) => {
    try {
      const dockerManager = getDockerManager();
      await dockerManager.initialize();

      let instances = name ? [dockerManager.getInstance(name)] : dockerManager.getAllInstances();
      const validInstances = instances.filter(instance => instance !== undefined);

      if (validInstances.length === 0) {
        console.error(chalk.red(`❌ ${name ? `Database instance '${name}' not found` : 'No database instances found'}`));
        console.log(chalk.yellow(`💡 Create databases with: ${chalk.cyan('hayai init')}`));
        process.exit(1);
      }

      console.log(chalk.cyan('\n🎛️  Admin Dashboards:\n'));

      const dashboardUrls: { url: string; name: string; engine: string }[] = [];

      for (const instance of validInstances) {
        const template = getTemplate(instance.engine);
        
        if (template?.admin_dashboard?.enabled) {
          const dashboardPort = options.port || template.admin_dashboard.port;
          const dashboardUrl = `http://localhost:${dashboardPort}`;
          
          console.log(`${chalk.bold(instance.name)} (${template.name})`);
          console.log(`  Dashboard: ${chalk.cyan(dashboardUrl)}`);
          console.log(`  Status: ${chalk[instance.status === 'running' ? 'green' : 'red'](instance.status)}`);
          
          if (instance.status === 'running') {
            // Check if port is accessible if requested
            if (options.checkPorts) {
              const isPortAccessible = !(await checkPortAvailable(dashboardPort));
              if (isPortAccessible) {
                console.log(`  Port: ${chalk.green('✅ Accessible')}`);
                dashboardUrls.push({ 
                  url: dashboardUrl, 
                  name: instance.name, 
                  engine: template.name 
                });
              } else {
                console.log(`  Port: ${chalk.red('❌ Not accessible')}`);
                console.log(`  ${chalk.yellow('⚠ Dashboard may still be starting up...')}`);
              }
            } else {
              dashboardUrls.push({ 
                url: dashboardUrl, 
                name: instance.name, 
                engine: template.name 
              });
            }
          } else {
            console.log(`  ${chalk.yellow('⚠ Database must be running to access dashboard')}`);
            console.log(`  ${chalk.gray(`Start with: ${chalk.cyan(`hayai start ${instance.name}`)}`)}`);
          }
        } else {
          console.log(`${chalk.bold(instance.name)} (${template?.name || instance.engine})`);
          console.log(`  ${chalk.gray('No admin dashboard available for this engine')}`);
        }
        console.log('');
      }

      if (dashboardUrls.length > 0) {
        console.log(chalk.green('✅ Available Dashboards:'));
        dashboardUrls.forEach(dashboard => {
          console.log(`  🌐 ${chalk.cyan(dashboard.url)} ${chalk.gray(`(${dashboard.name} - ${dashboard.engine})`)}`);
        });

        // Auto-open in browser unless disabled
        if (options.open !== false) {
          console.log(chalk.yellow('\n🚀 Opening dashboards in browser...'));
          dashboardUrls.forEach(dashboard => {
            try {
              openInBrowser(dashboard.url);
              console.log(`  Opened: ${chalk.cyan(dashboard.name)} dashboard`);
            } catch (error) {
              console.log(`  ${chalk.red('Failed to open:')} ${dashboard.name} dashboard`);
            }
          });
        }

        console.log(chalk.yellow('\n💡 Tips:'));
        console.log('  • Use connection details from `hayai list` to connect');
        console.log('  • Default credentials are usually admin/password');
        console.log('  • Add `--no-open` to prevent auto-opening browser');
        console.log('  • Add `--check-ports` to verify dashboard accessibility');

        // Show database-specific tips
        const uniqueEngines = [...new Set(dashboardUrls.map(d => d.engine))];
        if (uniqueEngines.includes('PostgreSQL')) {
          console.log(chalk.blue('\n🐘 PostgreSQL Tips:'));
          console.log('  • Use pgAdmin dashboard for advanced management');
          console.log('  • Connect with: Host=localhost, Database=database, User=admin');
        }
        if (uniqueEngines.includes('Redis')) {
          console.log(chalk.red('\n🔴 Redis Tips:'));
          console.log('  • Use Redis Commander for data exploration');
          console.log('  • Connect with: localhost:6379 (no password by default)');
        }

      } else {
        console.log(chalk.yellow('⚠ No dashboards available'));
        console.log(chalk.gray('Possible reasons:'));
        console.log(chalk.gray('  • Databases are not running - try `hayai start`'));
        console.log(chalk.gray('  • Database engines don\'t have admin dashboards'));
        console.log(chalk.gray('  • Dashboard containers are still starting up'));
        
        const stoppedInstances = validInstances.filter(i => i.status !== 'running');
        if (stoppedInstances.length > 0) {
          console.log(chalk.cyan('\n💡 Quick start all databases:'));
          console.log(`  ${chalk.cyan('hayai start')}`);
        }
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Failed to open studios:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }); 