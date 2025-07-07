import * as fs from 'fs-extra';
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
    await fs.ensureDir(instanceDataDir);

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
    if (await fs.pathExists(instance.volume)) {
      await fs.remove(instance.volume);
    }

    // Update compose file
    await this.updateComposeFile();
  }

  public async startDatabase(name: string): Promise<void> {
    const instance = this.instances.get(name);
    if (!instance) {
      throw new Error(`Database instance '${name}' not found`);
    }

    // TODO: Implement Docker container start logic
    instance.status = 'running';
    this.instances.set(name, instance);
  }

  public async stopDatabase(name: string): Promise<void> {
    const instance = this.instances.get(name);
    if (!instance) {
      throw new Error(`Database instance '${name}' not found`);
    }

    // TODO: Implement Docker container stop logic
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

    await fs.writeFile(composeFilePath, yamlContent, 'utf-8');
  }

  private async loadExistingInstances(): Promise<void> {
    // TODO: Load instances from persistent storage or compose file
    // For now, start with empty instances
    this.instances.clear();
  }

  private async loadComposeFile(): Promise<void> {
    const composeFilePath = await getComposeFilePath();
    
    if (await fs.pathExists(composeFilePath)) {
      try {
        const content = await fs.readFile(composeFilePath, 'utf-8');
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
      
      case 'mysql':
        return `mysql://${env.MYSQL_USER}:${env.MYSQL_PASSWORD}@localhost:${port}/${env.MYSQL_DATABASE}`;
      
      case 'mongodb':
        return `mongodb://${env.MONGO_INITDB_ROOT_USERNAME}:${env.MONGO_INITDB_ROOT_PASSWORD}@localhost:${port}/${env.MONGO_INITDB_DATABASE}`;
      
      case 'redis':
        return `redis://:${env.REDIS_PASSWORD}@localhost:${port}`;
      
      case 'qdrant':
        return `http://localhost:${port}`;
      
      case 'weaviate':
        return `http://localhost:${port}`;
      
      case 'influxdb':
        return `http://localhost:${port}`;
      
      case 'elasticsearch':
        return `http://localhost:${port}`;
      
      case 'meilisearch':
        return `http://localhost:${port}`;
      
      default:
        return `http://localhost:${port}`;
    }
  }

  private getImageForEngine(engineName: string): string {
    const imageMap: Record<string, string> = {
      postgresql: 'postgres:16-alpine',
      mysql: 'mysql:8.0',
      mongodb: 'mongo:7.0',
      redis: 'redis:7.0-alpine',
      qdrant: 'qdrant/qdrant:v1.7.0',
      weaviate: 'semitechnologies/weaviate:1.23.0',
      influxdb: 'influxdb:2.7-alpine',
      elasticsearch: 'docker.elastic.co/elasticsearch/elasticsearch:8.11.0',
      meilisearch: 'getmeili/meilisearch:v1.5',
    };

    return imageMap[engineName] || 'alpine:latest';
  }

  private getDefaultPortForEngine(engineName: string): number {
    const portMap: Record<string, number> = {
      postgresql: 5432,
      mysql: 3306,
      mongodb: 27017,
      redis: 6379,
      qdrant: 6333,
      weaviate: 8080,
      influxdb: 8086,
      elasticsearch: 9200,
      meilisearch: 7700,
    };

    return portMap[engineName] || 8080;
  }

  private getDefaultVolumeForEngine(engineName: string): string {
    const volumeMap: Record<string, string> = {
      postgresql: '/var/lib/postgresql/data',
      mysql: '/var/lib/mysql',
      mongodb: '/data/db',
      redis: '/data',
      qdrant: '/qdrant/storage',
      weaviate: '/var/lib/weaviate',
      influxdb: '/var/lib/influxdb2',
      elasticsearch: '/usr/share/elasticsearch/data',
      meilisearch: '/meili_data',
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
      mysql: {
        test: 'mysqladmin ping -h 127.0.0.1 -u admin --password=password',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      mongodb: {
        test: 'echo "db.runCommand("ping").ok" | mongosh localhost:27017/test --quiet',
        interval: '10s',
        timeout: '10s',
        retries: 5,
      },
      redis: {
        test: 'redis-cli ping',
        interval: '10s',
        timeout: '3s',
        retries: 5,
      },
      qdrant: {
        test: 'wget --no-verbose --tries=1 --spider http://localhost:6333/health || exit 1',
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
    };

    return healthcheckMap[engineName];
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
    if (await fs.pathExists(envPath)) {
      envContent = await fs.readFile(envPath, 'utf-8');
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

    await fs.writeFile(envPath, updatedLines.join('\n'), 'utf-8');
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