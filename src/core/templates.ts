import { DatabaseEngine, DatabaseTemplate } from './types.js';

export class DatabaseTemplates {
  private static templates: Map<string, DatabaseTemplate> = new Map();

  static {
    // ✅ SQL Databases (100% Open-Source)
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

    this.addTemplate('mariadb', {
      name: 'MariaDB',
      engine: {
        name: 'mariadb',
        type: 'sql',
        version: '11',
        image: 'mariadb:11',
        ports: [3306],
        volumes: ['/var/lib/mysql'],
        environment: {
          MYSQL_ROOT_PASSWORD: 'rootpassword',
          MYSQL_DATABASE: 'database',
          MYSQL_USER: 'admin',
          MYSQL_PASSWORD: 'password',
        },
        healthcheck: {
          test: 'healthcheck.sh --connect --innodb_initialized',
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

    this.addTemplate('sqlite', {
      name: 'SQLite',
      engine: {
        name: 'sqlite',
        type: 'embedded',
        version: '3',
        image: 'alpine:latest',
        ports: [],
        volumes: ['/data'],
        environment: {},
      },
    });

    this.addTemplate('duckdb', {
      name: 'DuckDB',
      engine: {
        name: 'duckdb',
        type: 'embedded',
        version: '1.0',
        image: 'alpine:latest',
        ports: [],
        volumes: ['/data'],
        environment: {},
      },
    });

    // ✅ Key-Value Databases (100% Open-Source)
    this.addTemplate('redis', {
      name: 'Redis',
      engine: {
        name: 'redis',
        type: 'keyvalue',
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
        port: 8081,
        image: 'rediscommander/redis-commander:latest',
      },
    });

    // ✅ Wide Column Databases (100% Open-Source)
    this.addTemplate('cassandra', {
      name: 'Apache Cassandra',
      engine: {
        name: 'cassandra',
        type: 'widecolumn',
        version: '4.1',
        image: 'cassandra:4.1',
        ports: [9042, 7000],
        volumes: ['/var/lib/cassandra'],
        environment: {
          CASSANDRA_CLUSTER_NAME: 'HayaiCluster',
          CASSANDRA_DC: 'dc1',
          CASSANDRA_RACK: 'rack1',
        },
        healthcheck: {
          test: 'nodetool status',
          interval: '30s',
          timeout: '10s',
          retries: 5,
        },
      },
    });

    // ✅ Vector Databases (100% Open-Source)
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

    this.addTemplate('milvus', {
      name: 'Milvus',
      engine: {
        name: 'milvus',
        type: 'vector',
        version: '2.3',
        image: 'milvusdb/milvus:v2.3.0',
        ports: [19530, 9091],
        volumes: ['/var/lib/milvus'],
        environment: {
          ETCD_USE_EMBED: 'true',
          ETCD_DATA_DIR: '/var/lib/milvus/etcd',
          COMMON_STORAGETYPE: 'local',
        },
        healthcheck: {
          test: 'curl -f http://localhost:9091/healthz || exit 1',
          interval: '30s',
          timeout: '10s',
          retries: 5,
        },
      },
    });

    // ✅ Graph Databases (100% Open-Source)
    this.addTemplate('arangodb', {
      name: 'ArangoDB',
      engine: {
        name: 'arangodb',
        type: 'graph',
        version: '3.11',
        image: 'arangodb:3.11',
        ports: [8529],
        volumes: ['/var/lib/arangodb3'],
        environment: {
          ARANGO_ROOT_PASSWORD: 'password',
        },
        healthcheck: {
          test: 'curl -f http://localhost:8529/_api/version || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 8529,
        image: 'arangodb:3.11',
      },
    });

    // ✅ Search Databases (100% Open-Source)
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
      admin_dashboard: {
        enabled: true,
        port: 7700,
        image: 'getmeili/meilisearch:v1.5',
      },
    });

    this.addTemplate('typesense', {
      name: 'Typesense',
      engine: {
        name: 'typesense',
        type: 'search',
        version: '0.25',
        image: 'typesense/typesense:0.25.0',
        ports: [8108],
        volumes: ['/data'],
        environment: {
          TYPESENSE_API_KEY: 'xyz',
          TYPESENSE_DATA_DIR: '/data',
        },
        healthcheck: {
          test: 'curl -f http://localhost:8108/health || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
    });

    // ✅ Embedded Databases
    this.addTemplate('leveldb', {
      name: 'LevelDB',
      engine: {
        name: 'leveldb',
        type: 'embedded',
        version: '1.0',
        image: 'alpine:latest',
        ports: [],
        volumes: ['/data'],
        environment: {},
      },
    });

    // ✅ Time Series Databases (100% Open-Source)
    this.addTemplate('influxdb', {
      name: 'InfluxDB 3 Core',
      engine: {
        name: 'influxdb',
        type: 'timeseries',
        version: '3.0',
        image: 'influxdb:latest',
        ports: [8086, 8181],
        volumes: ['/var/lib/influxdb3'],
        environment: {
          INFLUXDB_DB: 'hayai_db',
          INFLUXDB_ADMIN_USER: 'admin',
          INFLUXDB_ADMIN_PASSWORD: 'password',
        },
        healthcheck: {
          test: 'curl -f http://localhost:8086/health || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 8086,
        image: 'influxdb:latest',
      },
      client_sdk: {
        enabled: true,
        languages: ['typescript', 'python', 'javascript', 'go'],
      },
    });

    this.addTemplate('timescaledb', {
      name: 'TimescaleDB',
      engine: {
        name: 'timescaledb',
        type: 'timeseries',
        version: '2.17',
        image: 'timescale/timescaledb:latest-pg16',
        ports: [5432],
        volumes: ['/var/lib/postgresql/data'],
        environment: {
          POSTGRES_DB: 'hayai_db',
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
        languages: ['typescript', 'python', 'javascript', 'go', 'rust'],
      },
    });

    this.addTemplate('questdb', {
      name: 'QuestDB',
      engine: {
        name: 'questdb',
        type: 'timeseries',
        version: '8.3',
        image: 'questdb/questdb:latest',
        ports: [9000, 8812, 9009],
        volumes: ['/var/lib/questdb'],
        environment: {
          QUESTDB_DATABASE: 'hayai_db',
          QUESTDB_USER: 'admin',
          QUESTDB_PASSWORD: 'password',
        },
        healthcheck: {
          test: 'curl -f http://localhost:9000/status || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 9000,
        image: 'questdb/questdb:latest',
      },
      client_sdk: {
        enabled: true,
        languages: ['typescript', 'python', 'javascript', 'java', 'go'],
      },
    });

    this.addTemplate('victoriametrics', {
      name: 'VictoriaMetrics',
      engine: {
        name: 'victoriametrics',
        type: 'timeseries',
        version: '1.107',
        image: 'victoriametrics/victoria-metrics:latest',
        ports: [8428],
        volumes: ['/victoria-metrics-data'],
        environment: {
          VM_RETENTION_PERIOD: '12',
          VM_STORAGE_DATA_PATH: '/victoria-metrics-data',
        },
        healthcheck: {
          test: 'wget --no-verbose --tries=1 --spider http://localhost:8428/health || exit 1',
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      admin_dashboard: {
        enabled: true,
        port: 8428,
        image: 'victoriametrics/victoria-metrics:latest',
      },
    });

    this.addTemplate('horaedb', {
      name: 'Apache HoraeDB',
      engine: {
        name: 'horaedb',
        type: 'timeseries',
        version: '2.1',
        image: 'apache/horaedb:latest',
        ports: [8831, 3307],
        volumes: ['/opt/horaedb'],
        environment: {
          HORAEDB_DATA_DIR: '/opt/horaedb/data',
        },
        healthcheck: {
          test: 'curl -f http://localhost:8831/health || exit 1',
          interval: '30s',
          timeout: '10s',
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

  public static getOpenSourceInfo(): Record<string, { license: string; fullyOpenSource: boolean; notes: string }> {
    return {
      postgresql: {
        license: 'PostgreSQL License (MIT-like)',
        fullyOpenSource: true,
        notes: 'Totalmente livre e amplamente adotado'
      },
      mariadb: {
        license: 'GPL v2',
        fullyOpenSource: true,
        notes: 'Fork do MySQL, mantido pela comunidade'
      },
      sqlite: {
        license: 'Domínio Público',
        fullyOpenSource: true,
        notes: 'Sem necessidade de licença nem atribuição'
      },
      duckdb: {
        license: 'MIT',
        fullyOpenSource: true,
        notes: 'Otimizado para analytics locais'
      },
      redis: {
        license: 'BSD 3-Clause',
        fullyOpenSource: true,
        notes: 'Totalmente open-source'
      },
      cassandra: {
        license: 'Apache 2.0',
        fullyOpenSource: true,
        notes: 'Totalmente open-source'
      },
      qdrant: {
        license: 'Apache 2.0',
        fullyOpenSource: true,
        notes: 'Rápido, com API REST e suporte nativo a embeddings'
      },
      weaviate: {
        license: 'BSD 3-Clause',
        fullyOpenSource: true,
        notes: 'Requer Docker para instância local'
      },
      milvus: {
        license: 'Apache 2.0',
        fullyOpenSource: true,
        notes: 'Criado para IA e busca semântica'
      },
      arangodb: {
        license: 'Apache 2.0',
        fullyOpenSource: true,
        notes: 'Suporta Graph + Document + Key-Value'
      },
      meilisearch: {
        license: 'MIT',
        fullyOpenSource: true,
        notes: 'Leve e moderno, ótimo para projetos com TypeScript'
      },
      typesense: {
        license: 'GPL v3',
        fullyOpenSource: true,
        notes: 'Alternativa moderna ao Meilisearch'
      },
      leveldb: {
        license: 'BSD',
        fullyOpenSource: true,
        notes: 'Baixo nível, usado internamente por muitas ferramentas'
      },
      influxdb: {
        license: 'MIT/Apache 2.0',
        fullyOpenSource: true,
        notes: 'InfluxDB 3 Core - Otimizado para dados recentes (72h), com Python integrado'
      },
      timescaledb: {
        license: 'Timescale License (TSL)',
        fullyOpenSource: false,
        notes: 'Source-available, permite uso interno, proíbe apenas hospedagem como serviço'
      },
      questdb: {
        license: 'Apache 2.0',
        fullyOpenSource: true,
        notes: 'Performance excepcional, SQL nativo, formato Parquet'
      },
      victoriametrics: {
        license: 'Apache 2.0',
        fullyOpenSource: true,
        notes: 'Alternativa ao Prometheus, otimizada para métricas e monitoramento'
      },
      horaedb: {
        license: 'Apache 2.0',
        fullyOpenSource: true,
        notes: 'Apache HoraeDB - Distribuído, cloud-native, em incubação'
      }
    };
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

export const getOpenSourceInfo = (): Record<string, { license: string; fullyOpenSource: boolean; notes: string }> => {
  return DatabaseTemplates.getOpenSourceInfo();
}; 