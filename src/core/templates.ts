import { DatabaseEngine, DatabaseTemplate } from './types.js';

export class DatabaseTemplates {
  private static templates: Map<string, DatabaseTemplate> = new Map();

  static {
    // SQL Databases
    this.addTemplate('postgresql', {
      name: 'PostgreSQL',
      engine: {
        name: 'postgresql',
        type: 'sql',
        version: '16',
        image: 'postgres:16-alpine',
        ports: [5432],
        volumes: ['/var/lib/postgresql/data'],
        environment: {
          POSTGRES_DB: 'database',
          POSTGRES_USER: 'admin',
          POSTGRES_PASSWORD: 'password',
        },
        healthcheck: {
          test: 'pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 8080,
        image: 'adminer:4.8.1',
      },
      client_sdk: {
        enabled: true,
        languages: ['typescript', 'python', 'javascript'],
      },
    });

    this.addTemplate('mysql', {
      name: 'MySQL',
      engine: {
        name: 'mysql',
        type: 'sql',
        version: '8.0',
        image: 'mysql:8.0',
        ports: [3306],
        volumes: ['/var/lib/mysql'],
        environment: {
          MYSQL_ROOT_PASSWORD: 'rootpassword',
          MYSQL_DATABASE: 'database',
          MYSQL_USER: 'admin',
          MYSQL_PASSWORD: 'password',
        },
        healthcheck: {
          test: 'mysqladmin ping -h 127.0.0.1 -u $$MYSQL_USER --password=$$MYSQL_PASSWORD',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 8080,
        image: 'adminer:4.8.1',
      },
    });

    // NoSQL Databases
    this.addTemplate('mongodb', {
      name: 'MongoDB',
      engine: {
        name: 'mongodb',
        type: 'nosql',
        version: '7.0',
        image: 'mongo:7.0',
        ports: [27017],
        volumes: ['/data/db'],
        environment: {
          MONGO_INITDB_ROOT_USERNAME: 'admin',
          MONGO_INITDB_ROOT_PASSWORD: 'password',
          MONGO_INITDB_DATABASE: 'database',
        },
        healthcheck: {
          test: 'echo "db.runCommand("ping").ok" | mongosh localhost:27017/test --quiet',
          interval: '10s',
          timeout: '10s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 8081,
        image: 'mongo-express:1.0.0',
      },
    });

    this.addTemplate('redis', {
      name: 'Redis',
      engine: {
        name: 'redis',
        type: 'nosql',
        version: '7.0',
        image: 'redis:7.0-alpine',
        ports: [6379],
        volumes: ['/data'],
        environment: {
          REDIS_PASSWORD: 'password',
        },
        healthcheck: {
          test: 'redis-cli ping',
          interval: '10s',
          timeout: '3s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 8082,
        image: 'rediscommander/redis-commander:latest',
      },
    });

    // Vector Databases
    this.addTemplate('qdrant', {
      name: 'Qdrant',
      engine: {
        name: 'qdrant',
        type: 'vector',
        version: '1.7',
        image: 'qdrant/qdrant:v1.7.0',
        ports: [6333, 6334],
        volumes: ['/qdrant/storage'],
        environment: {
          QDRANT__SERVICE__HTTP_PORT: '6333',
          QDRANT__SERVICE__GRPC_PORT: '6334',
        },
        healthcheck: {
          test: 'wget --no-verbose --tries=1 --spider http://localhost:6333/health || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 6333,
        image: 'qdrant/qdrant:v1.7.0',
      },
    });

    this.addTemplate('weaviate', {
      name: 'Weaviate',
      engine: {
        name: 'weaviate',
        type: 'vector',
        version: '1.23',
        image: 'semitechnologies/weaviate:1.23.0',
        ports: [8080],
        volumes: ['/var/lib/weaviate'],
        environment: {
          QUERY_DEFAULTS_LIMIT: '25',
          AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true',
          PERSISTENCE_DATA_PATH: '/var/lib/weaviate',
          DEFAULT_VECTORIZER_MODULE: 'none',
          ENABLE_MODULES: 'text2vec-openai,text2vec-cohere,text2vec-huggingface',
        },
        healthcheck: {
          test: 'wget --no-verbose --tries=1 --spider http://localhost:8080/v1/.well-known/ready || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
    });

    // Time Series Databases
    this.addTemplate('influxdb', {
      name: 'InfluxDB',
      engine: {
        name: 'influxdb',
        type: 'timeseries',
        version: '2.7',
        image: 'influxdb:2.7-alpine',
        ports: [8086],
        volumes: ['/var/lib/influxdb2'],
        environment: {
          DOCKER_INFLUXDB_INIT_MODE: 'setup',
          DOCKER_INFLUXDB_INIT_USERNAME: 'admin',
          DOCKER_INFLUXDB_INIT_PASSWORD: 'password',
          DOCKER_INFLUXDB_INIT_ORG: 'myorg',
          DOCKER_INFLUXDB_INIT_BUCKET: 'mybucket',
          DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: 'mytoken',
        },
        healthcheck: {
          test: 'influx ping',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 8086,
        image: 'influxdb:2.7-alpine',
      },
    });

    // Search Databases
    this.addTemplate('elasticsearch', {
      name: 'Elasticsearch',
      engine: {
        name: 'elasticsearch',
        type: 'search',
        version: '8.11',
        image: 'docker.elastic.co/elasticsearch/elasticsearch:8.11.0',
        ports: [9200, 9300],
        volumes: ['/usr/share/elasticsearch/data'],
        environment: {
          'discovery.type': 'single-node',
          'xpack.security.enabled': 'false',
          'xpack.security.enrollment.enabled': 'false',
        },
        healthcheck: {
          test: 'curl -s -f http://localhost:9200/_cluster/health || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 5601,
        image: 'docker.elastic.co/kibana/kibana:8.11.0',
      },
    });

    this.addTemplate('meilisearch', {
      name: 'Meilisearch',
      engine: {
        name: 'meilisearch',
        type: 'search',
        version: '1.5',
        image: 'getmeili/meilisearch:v1.5',
        ports: [7700],
        volumes: ['/meili_data'],
        environment: {
          MEILI_MASTER_KEY: 'masterkey',
          MEILI_ENV: 'development',
        },
        healthcheck: {
          test: 'wget --no-verbose --tries=1 --spider http://localhost:7700/health || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
    });
  }

  private static addTemplate(key: string, template: DatabaseTemplate): void {
    this.templates.set(key, template);
  }

  public static getTemplate(engine: string): DatabaseTemplate | undefined {
    return this.templates.get(engine.toLowerCase());
  }

  public static getAllTemplates(): Map<string, DatabaseTemplate> {
    return new Map(this.templates);
  }

  public static getTemplatesByType(type: string): Map<string, DatabaseTemplate> {
    const filtered = new Map<string, DatabaseTemplate>();
    for (const [key, template] of this.templates) {
      if (template.engine.type === type) {
        filtered.set(key, template);
      }
    }
    return filtered;
  }

  public static getAvailableEngines(): string[] {
    return Array.from(this.templates.keys());
  }

  public static getAvailableTypes(): string[] {
    const types = new Set<string>();
    for (const template of this.templates.values()) {
      types.add(template.engine.type);
    }
    return Array.from(types);
  }

  public static isEngineSupported(engine: string): boolean {
    return this.templates.has(engine.toLowerCase());
  }

  public static getEnginesByType(type: string): string[] {
    const engines: string[] = [];
    for (const [key, template] of this.templates) {
      if (template.engine.type === type) {
        engines.push(key);
      }
    }
    return engines;
  }
}

// Convenience functions for global access
export const getTemplate = (engine: string): DatabaseTemplate | undefined => {
  return DatabaseTemplates.getTemplate(engine);
};

export const getAllTemplates = (): Map<string, DatabaseTemplate> => {
  return DatabaseTemplates.getAllTemplates();
};

export const getTemplatesByType = (type: string): Map<string, DatabaseTemplate> => {
  return DatabaseTemplates.getTemplatesByType(type);
};

export const getAvailableEngines = (): string[] => {
  return DatabaseTemplates.getAvailableEngines();
};

export const getAvailableTypes = (): string[] => {
  return DatabaseTemplates.getAvailableTypes();
};

export const isEngineSupported = (engine: string): boolean => {
  return DatabaseTemplates.isEngineSupported(engine);
};

export const getEnginesByType = (type: string): string[] => {
  return DatabaseTemplates.getEnginesByType(type);
}; 