import { describe, test, beforeAll, afterAll, expect, beforeEach } from 'jest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseTemplates } from '../../core/templates.js';
import { createDatabase, removeDatabase, startDatabase, stopDatabase } from '../../core/docker.js';
import { DatabaseTemplate } from '../../core/types.js';

const execAsync = promisify(exec);

describe('Database Integration Tests', () => {
  const testTimeout = 180000; // 3 minutes per test
  const testInstances: string[] = [];

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
        await stopDatabase(instanceName);
        await removeDatabase(instanceName);
      } catch (error) {
        console.log(`Cleanup warning: ${error}`);
      }
    }
    testInstances.length = 0;
  };

  // Helper function to test database connectivity
  const testDatabaseConnection = async (instanceName: string, template: DatabaseTemplate): Promise<boolean> => {
    try {
      const engine = template.engine;
      
      switch (engine.type) {
        case 'sql':
          if (engine.name === 'postgresql') {
            await execAsync(`docker exec ${instanceName} pg_isready -U admin -d database`);
            return true;
          }
          if (engine.name === 'mariadb') {
            await execAsync(`docker exec ${instanceName} mysqladmin ping -u admin -ppassword`);
            return true;
          }
          break;
          
        case 'keyvalue':
          if (engine.name === 'redis') {
            await execAsync(`docker exec ${instanceName} redis-cli ping`);
            return true;
          }
          break;
          
        case 'vector':
          if (engine.name === 'qdrant') {
            await execAsync(`docker exec ${instanceName} wget --spider -q http://localhost:6333/health`);
            return true;
          }
          break;
          
        case 'search':
          if (engine.name === 'meilisearch') {
            await execAsync(`docker exec ${instanceName} curl -s http://localhost:7700/health`);
            return true;
          }
          break;
          
        case 'timeseries':
          if (engine.name === 'influxdb') {
            await execAsync(`docker exec ${instanceName} curl -s http://localhost:8086/health`);
            return true;
          }
          break;
          
        default:
          // For other databases, just check if container is running
          await execAsync(`docker exec ${instanceName} echo "Container is running"`);
          return true;
      }
    } catch (error) {
      console.log(`Connection test failed for ${instanceName}: ${error}`);
      return false;
    }
    return false;
  };

  // Test each database engine
  const databaseEngines = DatabaseTemplates.getAvailableEngines();
  
  describe.each(databaseEngines)('Database Engine: %s', (engineName) => {
    test(`should create, start, and connect to ${engineName} database`, async () => {
      const template = DatabaseTemplates.getTemplate(engineName);
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-${engineName}-${Date.now()}`;
      testInstances.push(instanceName);

      // Step 1: Create database instance
      const instance = await createDatabase(instanceName, template, {
        port: undefined, // Let system assign port
        adminDashboard: false, // Disable for testing
      });

      expect(instance).toBeDefined();
      expect(instance.name).toBe(instanceName);
      expect(instance.engine).toBe(engineName);
      expect(instance.port).toBeGreaterThan(0);
      expect(instance.connection_uri).toBeDefined();

      // Step 2: Start database
      await startDatabase(instanceName);

      // Step 3: Wait for database to be ready
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      // Step 4: Test connection
      const isConnected = await testDatabaseConnection(instanceName, template);
      expect(isConnected).toBe(true);

      // Step 5: Stop database
      await stopDatabase(instanceName);

      // Step 6: Remove database
      await removeDatabase(instanceName);
    });

    test(`should handle ${engineName} database configuration properly`, async () => {
      const template = DatabaseTemplates.getTemplate(engineName);
      expect(template).toBeDefined();
      
      if (!template) return;

      // Test template structure
      expect(template.name).toBeDefined();
      expect(template.engine).toBeDefined();
      expect(template.engine.name).toBe(engineName);
      expect(template.engine.type).toBeDefined();
      expect(template.engine.image).toBeDefined();
      expect(template.engine.ports).toBeDefined();
      expect(template.engine.volumes).toBeDefined();
      expect(template.engine.environment).toBeDefined();

      // Test health check if defined
      if (template.engine.healthcheck) {
        expect(template.engine.healthcheck.test).toBeDefined();
        expect(template.engine.healthcheck.interval).toBeDefined();
        expect(template.engine.healthcheck.timeout).toBeDefined();
        expect(template.engine.healthcheck.retries).toBeDefined();
      }
    });
  });

  // Test database types
  describe('Database Types', () => {
    test('should have all expected database types', () => {
      const types = DatabaseTemplates.getAvailableTypes();
      const expectedTypes = ['sql', 'keyvalue', 'widecolumn', 'timeseries', 'vector', 'graph', 'search', 'embedded'];
      
      expectedTypes.forEach(type => {
        expect(types).toContain(type);
      });
    });

    test('should categorize databases correctly', () => {
      const sqlDatabases = DatabaseTemplates.getEnginesByType('sql');
      expect(sqlDatabases).toContain('postgresql');
      expect(sqlDatabases).toContain('mariadb');
      
      const keyValueDatabases = DatabaseTemplates.getEnginesByType('keyvalue');
      expect(keyValueDatabases).toContain('redis');
      
      const vectorDatabases = DatabaseTemplates.getEnginesByType('vector');
      expect(vectorDatabases).toContain('qdrant');
      expect(vectorDatabases).toContain('weaviate');
      expect(vectorDatabases).toContain('milvus');
    });
  });

  // Test multiple database instances
  describe('Multiple Database Instances', () => {
    test('should create and manage multiple database instances simultaneously', async () => {
      const engines = ['postgresql', 'redis', 'qdrant'];
      const instances: string[] = [];

      try {
        // Create multiple instances
        for (const engine of engines) {
          const template = DatabaseTemplates.getTemplate(engine);
          expect(template).toBeDefined();
          
          if (!template) continue;

          const instanceName = `test-multi-${engine}-${Date.now()}`;
          instances.push(instanceName);
          testInstances.push(instanceName);

          const instance = await createDatabase(instanceName, template, {
            port: undefined,
            adminDashboard: false,
          });

          expect(instance).toBeDefined();
          expect(instance.name).toBe(instanceName);
        }

        // Start all instances
        for (const instanceName of instances) {
          await startDatabase(instanceName);
        }

        // Wait for all to be ready
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Test all connections
        for (let i = 0; i < instances.length; i++) {
          const instanceName = instances[i];
          const engine = engines[i];
          const template = DatabaseTemplates.getTemplate(engine);
          
          if (template) {
            const isConnected = await testDatabaseConnection(instanceName, template);
            expect(isConnected).toBe(true);
          }
        }

        // Stop all instances
        for (const instanceName of instances) {
          await stopDatabase(instanceName);
        }

        // Remove all instances
        for (const instanceName of instances) {
          await removeDatabase(instanceName);
        }

      } catch (error) {
        // Cleanup on error
        for (const instanceName of instances) {
          try {
            await stopDatabase(instanceName);
            await removeDatabase(instanceName);
          } catch (cleanupError) {
            console.log(`Cleanup error: ${cleanupError}`);
          }
        }
        throw error;
      }
    });
  });

  // Test database port allocation
  describe('Port Management', () => {
    test('should allocate unique ports for multiple instances', async () => {
      const template = DatabaseTemplates.getTemplate('postgresql');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instances: string[] = [];
      const ports: number[] = [];

      try {
        // Create multiple instances of the same database
        for (let i = 0; i < 3; i++) {
          const instanceName = `test-port-${i}-${Date.now()}`;
          instances.push(instanceName);
          testInstances.push(instanceName);

          const instance = await createDatabase(instanceName, template, {
            port: undefined,
            adminDashboard: false,
          });

          ports.push(instance.port);
        }

        // Check that all ports are unique
        const uniquePorts = [...new Set(ports)];
        expect(uniquePorts).toHaveLength(ports.length);

        // Cleanup
        for (const instanceName of instances) {
          await removeDatabase(instanceName);
        }

      } catch (error) {
        // Cleanup on error
        for (const instanceName of instances) {
          try {
            await removeDatabase(instanceName);
          } catch (cleanupError) {
            console.log(`Cleanup error: ${cleanupError}`);
          }
        }
        throw error;
      }
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    test('should handle invalid database engine', async () => {
      const template = DatabaseTemplates.getTemplate('nonexistent');
      expect(template).toBeUndefined();
    });

    test('should handle database creation with invalid configuration', async () => {
      const template = DatabaseTemplates.getTemplate('postgresql');
      expect(template).toBeDefined();
      
      if (!template) return;

      // Test with invalid name
      await expect(createDatabase('', template, {})).rejects.toThrow();
      
      // Test with invalid port
      await expect(createDatabase('test-invalid', template, { port: 99999 })).rejects.toThrow();
    });
  });
}); 