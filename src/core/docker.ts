import { readFile, writeFile, access, mkdir, rm } from 'fs/promises';
import { constants } from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { DatabaseInstance, DatabaseTemplate, ComposeFile, DockerService } from './types.js';
import { getConfig, getComposeFilePath, getDataDirectory } from './config.js';
import { allocatePort } from './port-manager.js';

export class DockerManager {
  private static instance: DockerManager;
  private instances: Map<string, DatabaseInstance> = new Map();
  private composeFile: ComposeFile | null = null;

  private constructor() {}

  public static getInstance(): DockerManager {
    if (!DockerManager.instance) {
      DockerManager.instance = new DockerManager();
    }
    return DockerManager.instance;
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  public async initialize(): Promise<void> {
    await this.loadExistingInstances();
    await this.loadComposeFile();
  }

  public async createDatabase(
    name: string,
    template: DatabaseTemplate,
    options: {
      port?: number;
      adminDashboard?: boolean;
      customEnv?: Record<string, string>;
    } = {}
  ): Promise<DatabaseInstance> {
    // Validate name
    if (this.instances.has(name)) {
      throw new Error(`Database instance '${name}' already exists`);
    }

    // Allocate port
    const port = await allocatePort(name, options.port);
    
    // Create data directory
    const dataDir = await getDataDirectory();
    const instanceDataDir = path.join(dataDir, name);
    await mkdir(instanceDataDir, { recursive: true });

    // Create database instance
    const instance: DatabaseInstance = {
      name,
      engine: template.engine.name,
      port,
      volume: instanceDataDir,
      environment: {
        ...template.engine.environment,
        ...options.customEnv,
      },
      status: 'stopped',
      created_at: new Date().toISOString(),
      connection_uri: this.generateConnectionUri(template, port, name),
    };

    // Add to instances
    this.instances.set(name, instance);

    // Update compose file
    await this.updateComposeFile();

    return instance;
  }

  public async removeDatabase(name: string): Promise<void> {
    const instance = this.instances.get(name);
    if (!instance) {
      throw new Error(`Database instance '${name}' not found`);
    }

    // Remove from instances
    this.instances.delete(name);

    // Clean up data directory
    if (await this.pathExists(instance.volume)) {
      await rm(instance.volume, { recursive: true });
    }

    // Update compose file
    await this.updateComposeFile();
  }

  public async startDatabase(name: string): Promise<void> {
    const instance = this.instances.get(name);
    if (!instance) {
      throw new Error(`Database instance '${name}' not found`);
    }

    // NOTE: Docker container start implementation pending
    // This will use dockerode to start the actual container
    instance.status = 'running';
    this.instances.set(name, instance);
  }

  public async stopDatabase(name: string): Promise<void> {
    const instance = this.instances.get(name);
    if (!instance) {
      throw new Error(`Database instance '${name}' not found`);
    }

    // NOTE: Docker container stop implementation pending
    // This will use dockerode to stop the actual container
    instance.status = 'stopped';
    this.instances.set(name, instance);
  }

  public async startAllDatabases(): Promise<void> {
    for (const [name] of this.instances) {
      await this.startDatabase(name);
    }
  }

  public async stopAllDatabases(): Promise<void> {
    for (const [name] of this.instances) {
      await this.stopDatabase(name);
    }
  }

  public getInstance(name: string): DatabaseInstance | undefined {
    return this.instances.get(name);
  }

  public getAllInstances(): DatabaseInstance[] {
    return Array.from(this.instances.values());
  }

  public getRunningInstances(): DatabaseInstance[] {
    return this.getAllInstances().filter(instance => instance.status === 'running');
  }

  public getStoppedInstances(): DatabaseInstance[] {
    return this.getAllInstances().filter(instance => instance.status === 'stopped');
  }

  private async updateComposeFile(): Promise<void> {
    const config = await getConfig();
    const composeFilePath = await getComposeFilePath();

    this.composeFile = {
      version: '3.8',
      services: {},
      volumes: {},
      networks: {
        [config.docker.network_name]: {
          driver: 'bridge',
        },
      },
    };

    // Add services for each database instance
    for (const [name, instance] of this.instances) {
      const serviceName = `${name}-db`;
      
      this.composeFile.services[serviceName] = {
        name: serviceName,
        image: this.getImageForEngine(instance.engine),
        ports: [`${instance.port}:${this.getDefaultPortForEngine(instance.engine)}`],
        volumes: [`${instance.volume}:${this.getDefaultVolumeForEngine(instance.engine)}`],
        environment: instance.environment,
        restart: config.defaults.restart_policy,
        healthcheck: this.getHealthcheckForEngine(instance.engine),
      };

      // Add volume
      this.composeFile.volumes[`${name}-data`] = {
        driver: config.defaults.volume_driver,
      };
    }

    // Write compose file
    const yamlContent = yaml.stringify(this.composeFile, {
      indent: 2,
      lineWidth: 120,
      minContentWidth: 20,
    });

    await writeFile(composeFilePath, yamlContent, 'utf-8');
  }

  private async loadExistingInstances(): Promise<void> {
    // NOTE: Persistent storage integration pending
    // Will load instances from compose file or database on restart
    this.instances.clear();
  }

  private async loadComposeFile(): Promise<void> {
    const composeFilePath = await getComposeFilePath();
    
    if (await this.pathExists(composeFilePath)) {
      try {
        const content = await readFile(composeFilePath, 'utf-8');
        this.composeFile = yaml.parse(content) as ComposeFile;
      } catch (error) {
        console.warn('Failed to load existing compose file:', error);
        this.composeFile = null;
      }
    }
  }

  private generateConnectionUri(template: DatabaseTemplate, port: number, dbName: string): string {
    const engine = template.engine;
    const env = engine.environment;

    switch (engine.name) {
      case 'postgresql':
        return `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@localhost:${port}/${env.POSTGRES_DB}`;
      
      case 'mariadb':
        return `mysql://${env.MYSQL_USER}:${env.MYSQL_PASSWORD}@localhost:${port}/${env.MYSQL_DATABASE}`;
      
      case 'redis':
        return `redis://:${env.REDIS_PASSWORD}@localhost:${port}`;
      
      case 'cassandra':
        return `cassandra://localhost:${port}`;
      
      case 'qdrant':
        return `http://localhost:${port}`;
      
      case 'weaviate':
        return `http://localhost:${port}`;
      
      case 'milvus':
        return `http://localhost:${port}`;
      
      case 'arangodb':
        return `http://localhost:${port}`;
      
      case 'meilisearch':
        return `http://localhost:${port}`;
      
      case 'typesense':
        return `http://localhost:${port}`;
      
      case 'sqlite':
        return `sqlite:///${dbName}.db`;
      
      case 'duckdb':
        return `duckdb:///${dbName}.duckdb`;
      
      case 'leveldb':
        return `leveldb:///${dbName}`;
      
      // Time Series Databases
      case 'influxdb3':
        return `http://localhost:${port}`;
      
      case 'influxdb2':
        return `http://localhost:${port}`;
      
      case 'timescaledb':
        return `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@localhost:${port}/${env.POSTGRES_DB}`;
      
      case 'questdb':
        return `postgresql://admin:quest@localhost:8812/qdb`;
      
      case 'victoriametrics':
        return `http://localhost:${port}`;
      
      case 'horaedb':
        return `http://localhost:${port}`;
      
      default:
        return `http://localhost:${port}`;
    }
  }

  private getImageForEngine(engineName: string): string {
    const imageMap: Record<string, string> = {
      postgresql: 'postgres:16-alpine',
      mariadb: 'mariadb:11',
      redis: 'redis:7.0-alpine',
      cassandra: 'cassandra:4.1',
      qdrant: 'qdrant/qdrant:v1.7.0',
      weaviate: 'semitechnologies/weaviate:1.23.0',
      milvus: 'milvusdb/milvus:v2.3.0',
      arangodb: 'arangodb:3.11',
      meilisearch: 'getmeili/meilisearch:v1.5',
      typesense: 'typesense/typesense:0.25.0',
      sqlite: 'alpine:latest',
      duckdb: 'alpine:latest',
      leveldb: 'alpine:latest',
      // Time Series Databases
      influxdb3: 'influxdb:latest',
      influxdb2: 'influxdb:latest',
      timescaledb: 'timescale/timescaledb:latest-pg16',
      questdb: 'questdb/questdb:latest',
      victoriametrics: 'victoriametrics/victoria-metrics:latest',
      horaedb: 'apache/horaedb:latest',
    };

    return imageMap[engineName] || 'alpine:latest';
  }

  private getDefaultPortForEngine(engineName: string): number {
    const portMap: Record<string, number> = {
      postgresql: 5432,
      mariadb: 3306,
      redis: 6379,
      cassandra: 9042,
      qdrant: 6333,
      weaviate: 8080,
      milvus: 19530,
      arangodb: 8529,
      meilisearch: 7700,
      typesense: 8108,
      sqlite: 0, // No port for embedded
      duckdb: 0, // No port for embedded
      leveldb: 0, // No port for embedded
      // Time Series Databases
      influxdb3: 8086,
      influxdb2: 8086,
      timescaledb: 5432,
      questdb: 9000,
      victoriametrics: 8428,
      horaedb: 8831,
    };

    return portMap[engineName] || 8080;
  }

  private getDefaultVolumeForEngine(engineName: string): string {
    const volumeMap: Record<string, string> = {
      postgresql: '/var/lib/postgresql/data',
      mariadb: '/var/lib/mysql',
      redis: '/data',
      cassandra: '/var/lib/cassandra',
      qdrant: '/qdrant/storage',
      weaviate: '/var/lib/weaviate',
      milvus: '/var/lib/milvus',
      arangodb: '/var/lib/arangodb3',
      meilisearch: '/meili_data',
      typesense: '/data',
      sqlite: '/data',
      duckdb: '/data',
      leveldb: '/data',
      // Time Series Databases
      influxdb3: '/var/lib/influxdb3',
      influxdb2: '/var/lib/influxdb2',
      timescaledb: '/var/lib/postgresql/data',
      questdb: '/var/lib/questdb',
      victoriametrics: '/victoria-metrics-data',
      horaedb: '/opt/horaedb',
    };

    return volumeMap[engineName] || '/data';
  }

  private getHealthcheckForEngine(engineName: string): any {
    const healthcheckMap: Record<string, any> = {
      postgresql: {
        test: 'pg_isready -U admin -d database',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      mariadb: {
        test: 'healthcheck.sh --connect --innodb_initialized',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      redis: {
        test: 'redis-cli ping',
        interval: '10s',
        timeout: '3s',
        retries: 5,
      },
      cassandra: {
        test: 'nodetool status',
        interval: '30s',
        timeout: '10s',
        retries: 5,
      },
      qdrant: {
        test: 'wget --no-verbose --tries=1 --spider http://localhost:6333/health || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      weaviate: {
        test: 'wget --no-verbose --tries=1 --spider http://localhost:8080/v1/.well-known/ready || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      milvus: {
        test: 'curl -f http://localhost:9091/healthz || exit 1',
        interval: '30s',
        timeout: '10s',
        retries: 5,
      },
      arangodb: {
        test: 'curl -f http://localhost:8529/_api/version || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      meilisearch: {
        test: 'wget --no-verbose --tries=1 --spider http://localhost:7700/health || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      typesense: {
        test: 'curl -f http://localhost:8108/health || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      // Time Series Databases
      influxdb3: {
        test: 'curl -f http://localhost:8086/health || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      influxdb2: {
        test: 'curl -f http://localhost:8086/health || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      timescaledb: {
        test: 'pg_isready -U admin -d hayai_db',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      questdb: {
        test: 'curl -f http://localhost:9000/status || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      victoriametrics: {
        test: 'wget --no-verbose --tries=1 --spider http://localhost:8428/health || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      horaedb: {
        test: 'curl -f http://localhost:8831/health || exit 1',
        interval: '30s',
        timeout: '10s',
        retries: 5,
      },
    };

    return healthcheckMap[engineName] || {
      test: 'echo "healthy"',
      interval: '30s',
      timeout: '10s',
      retries: 3,
    };
  }

  public async getComposeFileContent(): Promise<string> {
    if (!this.composeFile) {
      await this.updateComposeFile();
    }
    
    return yaml.stringify(this.composeFile, {
      indent: 2,
      lineWidth: 120,
      minContentWidth: 20,
    });
  }

  public async updateEnvironmentFile(envFilePath: string = '.env'): Promise<void> {
    const envPath = path.resolve(envFilePath);
    let envContent = '';

    // Load existing .env file if it exists
    if (await this.pathExists(envPath)) {
      envContent = await readFile(envPath, 'utf-8');
    }

    // Add connection URIs for each database
    const envLines = envContent.split('\n');
    const updatedLines: string[] = [];
    const addedVars = new Set<string>();

    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key] = line.split('=');
        if (key && !key.toUpperCase().endsWith('_DB_URL')) {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }

    // Add database connection URIs
    updatedLines.push('');
    updatedLines.push('# Database connections generated by Hayai');
    
    for (const [name, instance] of this.instances) {
      const varName = `${name.toUpperCase()}_DB_URL`;
      if (!addedVars.has(varName)) {
        updatedLines.push(`${varName}=${instance.connection_uri}`);
        addedVars.add(varName);
      }
    }

    await writeFile(envPath, updatedLines.join('\n'), 'utf-8');
  }
}

// Convenience functions for global access
export const getDockerManager = (): DockerManager => {
  return DockerManager.getInstance();
};

export const createDatabase = async (
  name: string,
  template: DatabaseTemplate,
  options: {
    port?: number;
    adminDashboard?: boolean;
    customEnv?: Record<string, string>;
  } = {}
): Promise<DatabaseInstance> => {
  const manager = DockerManager.getInstance();
  await manager.initialize();
  return await manager.createDatabase(name, template, options);
};

export const removeDatabase = async (name: string): Promise<void> => {
  const manager = DockerManager.getInstance();
  await manager.initialize();
  await manager.removeDatabase(name);
};

export const startDatabase = async (name: string): Promise<void> => {
  const manager = DockerManager.getInstance();
  await manager.initialize();
  await manager.startDatabase(name);
};

export const stopDatabase = async (name: string): Promise<void> => {
  const manager = DockerManager.getInstance();
  await manager.initialize();
  await manager.stopDatabase(name);
};

export const getAllDatabases = async (): Promise<DatabaseInstance[]> => {
  const manager = DockerManager.getInstance();
  await manager.initialize();
  return manager.getAllInstances();
}; 