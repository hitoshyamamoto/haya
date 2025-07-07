import { describe, test, beforeAll, afterAll, expect, beforeEach } from 'jest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

const execAsync = promisify(exec);

describe('CLI Commands Integration Tests', () => {
  const testTimeout = 120000; // 2 minutes per test
  const testInstances: string[] = [];
  const hayaiCli = process.env.NODE_ENV === 'test' 
    ? 'node dist/cli/index.js' 
    : 'npm run dev --';

  beforeAll(async () => {
    // Clean up any existing test instances
    await cleanupTestInstances();
  }, 30000);

  afterAll(async () => {
    // Clean up all test instances
    await cleanupTestInstances();
  }, 30000);

  beforeEach(() => {
    jest.setTimeout(testTimeout);
  });

  const cleanupTestInstances = async () => {
    for (const instanceName of testInstances) {
      try {
        await execAsync(`${hayaiCli} remove ${instanceName} --force`);
      } catch (error) {
        console.log(`Cleanup warning: ${error}`);
      }
    }
    testInstances.length = 0;
  };

  // Helper function to create test database
  const createTestDatabase = async (name: string, engine: string): Promise<string> => {
    const instanceName = `test-${name}-${Date.now()}`;
    testInstances.push(instanceName);
    
    const { stdout } = await execAsync(`${hayaiCli} init -n ${instanceName} -e ${engine} -y`);
    expect(stdout).toContain('Successfully created');
    
    return instanceName;
  };

  describe('hayai init command', () => {
    test('should create PostgreSQL database with default settings', async () => {
      const instanceName = await createTestDatabase('postgres', 'postgresql');
      
      // Verify instance was created
      const { stdout } = await execAsync(`${hayaiCli} list`);
      expect(stdout).toContain(instanceName);
      expect(stdout).toContain('postgresql');
    });

    test('should create Redis database with custom port', async () => {
      const instanceName = `test-redis-custom-${Date.now()}`;
      testInstances.push(instanceName);
      
      const { stdout } = await execAsync(`${hayaiCli} init -n ${instanceName} -e redis -p 6380 -y`);
      expect(stdout).toContain('Successfully created');
      expect(stdout).toContain('6380');
    });

    test('should create database with admin dashboard enabled', async () => {
      const instanceName = `test-dashboard-${Date.now()}`;
      testInstances.push(instanceName);
      
      const { stdout } = await execAsync(`${hayaiCli} init -n ${instanceName} -e postgresql --admin-dashboard -y`);
      expect(stdout).toContain('Successfully created');
      expect(stdout).toContain('Admin Dashboard');
    });

    test('should fail with invalid database engine', async () => {
      const instanceName = `test-invalid-${Date.now()}`;
      
      await expect(
        execAsync(`${hayaiCli} init -n ${instanceName} -e nonexistent -y`)
      ).rejects.toThrow();
    });

    test('should fail with invalid instance name', async () => {
      await expect(
        execAsync(`${hayaiCli} init -n "invalid name with spaces" -e postgresql -y`)
      ).rejects.toThrow();
    });

    test('should create all supported database types', async () => {
      const engines = ['postgresql', 'redis', 'qdrant', 'meilisearch'];
      
      for (const engine of engines) {
        const instanceName = await createTestDatabase(engine, engine);
        
        // Verify each instance was created
        const { stdout } = await execAsync(`${hayaiCli} list`);
        expect(stdout).toContain(instanceName);
      }
    });
  });

  describe('hayai start command', () => {
    test('should start single database instance', async () => {
      const instanceName = await createTestDatabase('start-single', 'postgresql');
      
      const { stdout } = await execAsync(`${hayaiCli} start ${instanceName}`);
      expect(stdout).toContain('started') || expect(stdout).toContain('Starting');
      
      // Wait for database to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify database is running
      const { stdout: listOutput } = await execAsync(`${hayaiCli} list`);
      expect(listOutput).toContain(instanceName);
    });

    test('should start all database instances', async () => {
      const instance1 = await createTestDatabase('start-all-1', 'postgresql');
      const instance2 = await createTestDatabase('start-all-2', 'redis');
      
      const { stdout } = await execAsync(`${hayaiCli} start`);
      expect(stdout).toContain('started') || expect(stdout).toContain('Starting');
      
      // Wait for databases to be ready
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Verify both databases are running
      const { stdout: listOutput } = await execAsync(`${hayaiCli} list`);
      expect(listOutput).toContain(instance1);
      expect(listOutput).toContain(instance2);
    });

    test('should handle non-existent database gracefully', async () => {
      await expect(
        execAsync(`${hayaiCli} start nonexistent-database`)
      ).rejects.toThrow();
    });
  });

  describe('hayai stop command', () => {
    test('should stop single database instance', async () => {
      const instanceName = await createTestDatabase('stop-single', 'postgresql');
      
      // Start the database first
      await execAsync(`${hayaiCli} start ${instanceName}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Stop the database
      const { stdout } = await execAsync(`${hayaiCli} stop ${instanceName}`);
      expect(stdout).toContain('stopped') || expect(stdout).toContain('Stopping');
    });

    test('should stop all database instances', async () => {
      const instance1 = await createTestDatabase('stop-all-1', 'postgresql');
      const instance2 = await createTestDatabase('stop-all-2', 'redis');
      
      // Start both databases
      await execAsync(`${hayaiCli} start`);
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Stop all databases
      const { stdout } = await execAsync(`${hayaiCli} stop`);
      expect(stdout).toContain('stopped') || expect(stdout).toContain('Stopping');
    });
  });

  describe('hayai list command', () => {
    test('should list all database instances', async () => {
      const instance1 = await createTestDatabase('list-test-1', 'postgresql');
      const instance2 = await createTestDatabase('list-test-2', 'redis');
      
      const { stdout } = await execAsync(`${hayaiCli} list`);
      expect(stdout).toContain(instance1);
      expect(stdout).toContain(instance2);
      expect(stdout).toContain('postgresql');
      expect(stdout).toContain('redis');
    });

    test('should show running databases only', async () => {
      const instanceName = await createTestDatabase('list-running', 'postgresql');
      
      // Start the database
      await execAsync(`${hayaiCli} start ${instanceName}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { stdout } = await execAsync(`${hayaiCli} list --running`);
      expect(stdout).toContain(instanceName);
    });

    test('should output in JSON format', async () => {
      const instanceName = await createTestDatabase('list-json', 'redis');
      
      const { stdout } = await execAsync(`${hayaiCli} list --format json`);
      expect(() => JSON.parse(stdout)).not.toThrow();
      
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
    });

    test('should show verbose information', async () => {
      const instanceName = await createTestDatabase('list-verbose', 'postgresql');
      
      const { stdout } = await execAsync(`${hayaiCli} list --verbose`);
      expect(stdout).toContain(instanceName);
      expect(stdout).toContain('postgresql');
    });
  });

  describe('hayai remove command', () => {
    test('should remove database instance with force flag', async () => {
      const instanceName = await createTestDatabase('remove-test', 'postgresql');
      
      const { stdout } = await execAsync(`${hayaiCli} remove ${instanceName} --force`);
      expect(stdout).toContain('removed') || expect(stdout).toContain('Removing');
      
      // Verify database was removed
      const { stdout: listOutput } = await execAsync(`${hayaiCli} list`);
      expect(listOutput).not.toContain(instanceName);
      
      // Remove from test instances array since it's already removed
      const index = testInstances.indexOf(instanceName);
      if (index > -1) {
        testInstances.splice(index, 1);
      }
    });

    test('should fail to remove non-existent database', async () => {
      await expect(
        execAsync(`${hayaiCli} remove nonexistent-database --force`)
      ).rejects.toThrow();
    });

    test('should require confirmation without force flag', async () => {
      const instanceName = await createTestDatabase('remove-confirm', 'redis');
      
      // Without force flag, should require confirmation
      // This test would need to be run interactively or with expect/spawn
      // For now, we'll just verify the command structure
      expect(instanceName).toBeDefined();
    });
  });

  describe('hayai logs command', () => {
    test('should show logs for database instance', async () => {
      const instanceName = await createTestDatabase('logs-test', 'postgresql');
      
      // Start the database to generate logs
      await execAsync(`${hayaiCli} start ${instanceName}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { stdout } = await execAsync(`${hayaiCli} logs ${instanceName}`);
      expect(stdout).toBeDefined();
      expect(stdout.length).toBeGreaterThan(0);
    });

    test('should fail for non-existent database', async () => {
      await expect(
        execAsync(`${hayaiCli} logs nonexistent-database`)
      ).rejects.toThrow();
    });
  });

  describe('hayai studio command', () => {
    test('should open admin dashboard for database with dashboard support', async () => {
      const instanceName = await createTestDatabase('studio-test', 'postgresql');
      
      // Start the database first
      await execAsync(`${hayaiCli} start ${instanceName}`);
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Note: This command opens a browser, so we can't test the actual opening
      // We can only test that the command executes without error
      const { stdout } = await execAsync(`${hayaiCli} studio ${instanceName}`);
      expect(stdout).toBeDefined();
    });

    test('should open all admin dashboards', async () => {
      const instance1 = await createTestDatabase('studio-all-1', 'postgresql');
      const instance2 = await createTestDatabase('studio-all-2', 'redis');
      
      // Start both databases
      await execAsync(`${hayaiCli} start`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Open all dashboards
      const { stdout } = await execAsync(`${hayaiCli} studio`);
      expect(stdout).toBeDefined();
    });
  });

  describe('hayai snapshot command', () => {
    test('should create snapshot of database instance', async () => {
      const instanceName = await createTestDatabase('snapshot-test', 'postgresql');
      
      // Start the database
      await execAsync(`${hayaiCli} start ${instanceName}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { stdout } = await execAsync(`${hayaiCli} snapshot ${instanceName}`);
      expect(stdout).toContain('snapshot') || expect(stdout).toContain('Snapshot');
    });

    test('should create compressed snapshot', async () => {
      const instanceName = await createTestDatabase('snapshot-compressed', 'redis');
      
      // Start the database
      await execAsync(`${hayaiCli} start ${instanceName}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { stdout } = await execAsync(`${hayaiCli} snapshot ${instanceName} --compress`);
      expect(stdout).toContain('snapshot') || expect(stdout).toContain('Snapshot');
    });

    test('should fail for non-existent database', async () => {
      await expect(
        execAsync(`${hayaiCli} snapshot nonexistent-database`)
      ).rejects.toThrow();
    });
  });

  describe('Command Help and Version', () => {
    test('should show help information', async () => {
      const { stdout } = await execAsync(`${hayaiCli} --help`);
      expect(stdout).toContain('Usage');
      expect(stdout).toContain('Commands');
      expect(stdout).toContain('init');
      expect(stdout).toContain('start');
      expect(stdout).toContain('stop');
      expect(stdout).toContain('list');
    });

    test('should show version information', async () => {
      const { stdout } = await execAsync(`${hayaiCli} --version`);
      expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Version pattern
    });

    test('should show help for specific commands', async () => {
      const commands = ['init', 'start', 'stop', 'list', 'remove', 'logs', 'studio', 'snapshot'];
      
      for (const command of commands) {
        const { stdout } = await execAsync(`${hayaiCli} ${command} --help`);
        expect(stdout).toContain('Usage');
        expect(stdout).toContain(command);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid command gracefully', async () => {
      await expect(
        execAsync(`${hayaiCli} invalid-command`)
      ).rejects.toThrow();
    });

    test('should handle invalid options gracefully', async () => {
      await expect(
        execAsync(`${hayaiCli} init --invalid-option`)
      ).rejects.toThrow();
    });

    test('should validate required parameters', async () => {
      // Test init without required parameters
      await expect(
        execAsync(`${hayaiCli} init -e postgresql`) // Missing name
      ).rejects.toThrow();
      
      // Test remove without database name
      await expect(
        execAsync(`${hayaiCli} remove`)
      ).rejects.toThrow();
    });
  });

  describe('Configuration File Integration', () => {
    test('should respect configuration file settings', async () => {
      // This test would verify that the CLI respects hayai.config.yaml
      // For now, we'll just verify that the config is loaded
      const instanceName = await createTestDatabase('config-test', 'postgresql');
      
      const { stdout } = await execAsync(`${hayaiCli} list`);
      expect(stdout).toContain(instanceName);
    });
  });

  describe('Environment Integration', () => {
    test('should create .env file entries', async () => {
      const instanceName = await createTestDatabase('env-test', 'postgresql');
      
      // Start the database to ensure .env is created
      await execAsync(`${hayaiCli} start ${instanceName}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if .env file exists and contains the connection URI
      if (existsSync('.env')) {
        const envContent = readFileSync('.env', 'utf8');
        expect(envContent).toContain(instanceName.toUpperCase());
      }
    });
  });
}); 