import { describe, test, beforeAll, afterAll, expect } from 'jest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseTemplates } from '../../core/templates.js';
import { createDatabase, startDatabase, stopDatabase, removeDatabase } from '../../core/docker.js';

const execAsync = promisify(exec);

describe('SQL Databases Specific Tests', () => {
  const testTimeout = 180000; // 3 minutes per test
  const testInstances: string[] = [];

  beforeAll(async () => {
    await cleanupTestInstances();
  }, 30000);

  afterAll(async () => {
    await cleanupTestInstances();
  }, 30000);

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

  describe('PostgreSQL Database', () => {
    test('should create and connect to PostgreSQL database', async () => {
      const template = DatabaseTemplates.getTemplate('postgresql');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-postgresql-${Date.now()}`;
      testInstances.push(instanceName);

      // Create database
      const instance = await createDatabase(instanceName, template, { port: undefined });
      expect(instance.connection_uri).toContain('postgresql://');
      expect(instance.connection_uri).toContain('admin:password');

      // Start database
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Test connection
      const { stdout } = await execAsync(`docker exec ${instanceName} pg_isready -U admin -d database`);
      expect(stdout).toContain('accepting connections');

      // Test basic SQL operations
      await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "CREATE TABLE test_table (id SERIAL PRIMARY KEY, name VARCHAR(50));"`);
      await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "INSERT INTO test_table (name) VALUES ('test');"`);
      
      const { stdout: queryResult } = await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "SELECT * FROM test_table;" -t`);
      expect(queryResult).toContain('test');
    }, testTimeout);

    test('should verify PostgreSQL version and features', async () => {
      const template = DatabaseTemplates.getTemplate('postgresql');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-postgresql-version-${Date.now()}`;
      testInstances.push(instanceName);

      await createDatabase(instanceName, template, { port: undefined });
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check PostgreSQL version
      const { stdout } = await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "SELECT version();" -t`);
      expect(stdout).toContain('PostgreSQL');
      expect(stdout).toContain('16'); // Version should be 16

      // Test JSON support
      await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "CREATE TABLE json_test (data JSONB);"`);
      await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "INSERT INTO json_test (data) VALUES ('{\\"key\\": \\"value\\"}');"`);
      
      const { stdout: jsonResult } = await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "SELECT data->>'key' FROM json_test;" -t`);
      expect(jsonResult.trim()).toContain('value');
    }, testTimeout);

    test('should test PostgreSQL admin dashboard', async () => {
      const template = DatabaseTemplates.getTemplate('postgresql');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-postgresql-admin-${Date.now()}`;
      testInstances.push(instanceName);

      await createDatabase(instanceName, template, { adminDashboard: true });
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Test that Adminer is accessible
      const { stdout } = await execAsync(`docker exec ${instanceName} curl -s http://localhost:8080 || echo "Dashboard not accessible"`);
      expect(stdout).toContain('Adminer') || expect(stdout).toContain('Login');
    }, testTimeout);
  });

  describe('MariaDB Database', () => {
    test('should create and connect to MariaDB database', async () => {
      const template = DatabaseTemplates.getTemplate('mariadb');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-mariadb-${Date.now()}`;
      testInstances.push(instanceName);

      // Create database
      const instance = await createDatabase(instanceName, template, { port: undefined });
      expect(instance.connection_uri).toContain('mysql://');
      expect(instance.connection_uri).toContain('admin:password');

      // Start database
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 15000)); // MariaDB takes longer to start

      // Test connection
      const { stdout } = await execAsync(`docker exec ${instanceName} mysqladmin ping -u admin -ppassword`);
      expect(stdout).toContain('alive');

      // Test basic SQL operations
      await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "CREATE TABLE database.test_table (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50));"`);
      await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "INSERT INTO database.test_table (name) VALUES ('test');"`);
      
      const { stdout: queryResult } = await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "SELECT * FROM database.test_table;" -s`);
      expect(queryResult).toContain('test');
    }, testTimeout);

    test('should verify MariaDB version and features', async () => {
      const template = DatabaseTemplates.getTemplate('mariadb');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-mariadb-version-${Date.now()}`;
      testInstances.push(instanceName);

      await createDatabase(instanceName, template, { port: undefined });
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Check MariaDB version
      const { stdout } = await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "SELECT VERSION();" -s`);
      expect(stdout).toContain('MariaDB');
      expect(stdout).toContain('11'); // Version should be 11

      // Test JSON support
      await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "CREATE TABLE database.json_test (data JSON);"`);
      await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "INSERT INTO database.json_test (data) VALUES ('{\\\"key\\\": \\\"value\\\"}');"`);
      
      const { stdout: jsonResult } = await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "SELECT JSON_EXTRACT(data, '$.key') FROM database.json_test;" -s`);
      expect(jsonResult).toContain('value');
    }, testTimeout);
  });

  describe('SQLite Database', () => {
    test('should create and use SQLite database', async () => {
      const template = DatabaseTemplates.getTemplate('sqlite');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-sqlite-${Date.now()}`;
      testInstances.push(instanceName);

      // Create database
      const instance = await createDatabase(instanceName, template, { port: undefined });
      expect(instance.connection_uri).toContain('sqlite:///');

      // Start database
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test SQLite operations
      await execAsync(`docker exec ${instanceName} sqlite3 /data/database.db "CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT);"`);
      await execAsync(`docker exec ${instanceName} sqlite3 /data/database.db "INSERT INTO test_table (name) VALUES ('test');"`);
      
      const { stdout: queryResult } = await execAsync(`docker exec ${instanceName} sqlite3 /data/database.db "SELECT * FROM test_table;"`);
      expect(queryResult).toContain('test');

      // Test SQLite version
      const { stdout: versionResult } = await execAsync(`docker exec ${instanceName} sqlite3 --version`);
      expect(versionResult).toContain('3.'); // SQLite version 3.x
    }, testTimeout);

    test('should test SQLite file persistence', async () => {
      const template = DatabaseTemplates.getTemplate('sqlite');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-sqlite-persist-${Date.now()}`;
      testInstances.push(instanceName);

      await createDatabase(instanceName, template, { port: undefined });
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Create table and insert data
      await execAsync(`docker exec ${instanceName} sqlite3 /data/database.db "CREATE TABLE persist_test (id INTEGER PRIMARY KEY, data TEXT);"`);
      await execAsync(`docker exec ${instanceName} sqlite3 /data/database.db "INSERT INTO persist_test (data) VALUES ('persistent_data');"`);

      // Stop and restart database
      await stopDatabase(instanceName);
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if data persists
      const { stdout: queryResult } = await execAsync(`docker exec ${instanceName} sqlite3 /data/database.db "SELECT * FROM persist_test;"`);
      expect(queryResult).toContain('persistent_data');
    }, testTimeout);
  });

  describe('DuckDB Database', () => {
    test('should create and use DuckDB database', async () => {
      const template = DatabaseTemplates.getTemplate('duckdb');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-duckdb-${Date.now()}`;
      testInstances.push(instanceName);

      // Create database
      const instance = await createDatabase(instanceName, template, { port: undefined });
      expect(instance.connection_uri).toContain('duckdb:///');

      // Start database
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test DuckDB operations
      await execAsync(`docker exec ${instanceName} duckdb /data/database.db "CREATE TABLE test_table (id INTEGER PRIMARY KEY, name VARCHAR);"`);
      await execAsync(`docker exec ${instanceName} duckdb /data/database.db "INSERT INTO test_table (name) VALUES ('test');"`);
      
      const { stdout: queryResult } = await execAsync(`docker exec ${instanceName} duckdb /data/database.db "SELECT * FROM test_table;"`);
      expect(queryResult).toContain('test');

      // Test DuckDB version
      const { stdout: versionResult } = await execAsync(`docker exec ${instanceName} duckdb --version`);
      expect(versionResult).toContain('1.'); // DuckDB version 1.x
    }, testTimeout);

    test('should test DuckDB analytics features', async () => {
      const template = DatabaseTemplates.getTemplate('duckdb');
      expect(template).toBeDefined();
      
      if (!template) return;

      const instanceName = `test-duckdb-analytics-${Date.now()}`;
      testInstances.push(instanceName);

      await createDatabase(instanceName, template, { port: undefined });
      await startDatabase(instanceName);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Create sample data for analytics
      await execAsync(`docker exec ${instanceName} duckdb /data/database.db "CREATE TABLE sales (id INTEGER, amount DECIMAL, date DATE);"`);
      await execAsync(`docker exec ${instanceName} duckdb /data/database.db "INSERT INTO sales VALUES (1, 100.50, '2024-01-01'), (2, 200.75, '2024-01-02'), (3, 150.25, '2024-01-03');"`);

      // Test analytics queries
      const { stdout: sumResult } = await execAsync(`docker exec ${instanceName} duckdb /data/database.db "SELECT SUM(amount) FROM sales;"`);
      expect(sumResult).toContain('451.5');

      const { stdout: avgResult } = await execAsync(`docker exec ${instanceName} duckdb /data/database.db "SELECT AVG(amount) FROM sales;"`);
      expect(avgResult).toContain('150.5');

      // Test date functions
      const { stdout: dateResult } = await execAsync(`docker exec ${instanceName} duckdb /data/database.db "SELECT COUNT(*) FROM sales WHERE date >= '2024-01-01';"`);
      expect(dateResult).toContain('3');
    }, testTimeout);
  });

  describe('SQL Database Comparison', () => {
    test('should compare performance characteristics', async () => {
      const sqlEngines = ['postgresql', 'mariadb'];
      const results: Record<string, number> = {};

      for (const engine of sqlEngines) {
        const template = DatabaseTemplates.getTemplate(engine);
        if (!template) continue;

        const instanceName = `test-perf-${engine}-${Date.now()}`;
        testInstances.push(instanceName);

        await createDatabase(instanceName, template, { port: undefined });
        await startDatabase(instanceName);
        await new Promise(resolve => setTimeout(resolve, engine === 'mariadb' ? 15000 : 10000));

        // Measure simple query performance
        const startTime = Date.now();
        
        if (engine === 'postgresql') {
          await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "CREATE TABLE perf_test (id SERIAL PRIMARY KEY, data TEXT);"`);
          await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "INSERT INTO perf_test (data) SELECT 'test' FROM generate_series(1, 1000);"`);
        } else if (engine === 'mariadb') {
          await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "CREATE TABLE database.perf_test (id INT AUTO_INCREMENT PRIMARY KEY, data TEXT);"`);
          // Generate INSERT statement with multiple VALUES
          const values = Array(1000).fill("('test')").join(',');
          await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "INSERT INTO database.perf_test (data) VALUES ${values}"`);
        }

        const endTime = Date.now();
        results[engine] = endTime - startTime;
      }

      // Both should complete within reasonable time
      Object.values(results).forEach(time => {
        expect(time).toBeLessThan(30000); // 30 seconds max
      });
    }, testTimeout);

    test('should test SQL compatibility', async () => {
      const sqlEngines = ['postgresql', 'mariadb'];
      const testQueries = [
        'SELECT 1 + 1 AS result',
        'SELECT UPPER(\\'hello\\') AS upper_text',
        'SELECT NOW() AS current_time',
        'SELECT LENGTH(\\'test\\') AS text_length'
      ];

      for (const engine of sqlEngines) {
        const template = DatabaseTemplates.getTemplate(engine);
        if (!template) continue;

        const instanceName = `test-sql-compat-${engine}-${Date.now()}`;
        testInstances.push(instanceName);

        await createDatabase(instanceName, template, { port: undefined });
        await startDatabase(instanceName);
        await new Promise(resolve => setTimeout(resolve, engine === 'mariadb' ? 15000 : 10000));

        for (const query of testQueries) {
          let result: string;
          
          if (engine === 'postgresql') {
            const { stdout } = await execAsync(`docker exec ${instanceName} psql -U admin -d database -c "${query};" -t`);
            result = stdout.trim();
          } else {
            const { stdout } = await execAsync(`docker exec ${instanceName} mysql -u admin -ppassword -e "${query};" -s`);
            result = stdout.trim();
          }

          expect(result).toBeDefined();
          expect(result.length).toBeGreaterThan(0);
        }
      }
    }, testTimeout);
  });
}); 