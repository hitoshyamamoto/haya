# 📄 .hayaidb Configuration File

## 🎯 Overview

The `.hayaidb` file is a **declarative configuration file** that allows you to define multiple databases with their specific parameters in a single location. This approach simplifies database management by providing a centralized configuration system for your development environment.

## 🚀 Why Use .hayaidb?

### ✅ **Advantages**
- **🔧 Centralized Configuration**: Define all your databases in one place
- **📋 Declarative Approach**: Specify what you want, not how to achieve it
- **🔄 Reproducible Environments**: Share configurations across team members
- **⚡ Batch Operations**: Initialize, start, or stop multiple databases at once
- **📝 Version Control**: Track configuration changes in your repository
- **🛠️ Environment Consistency**: Ensure same setup across different machines

### 🎯 **Use Cases**
- **Multi-Database Projects**: Applications using different database types
- **Microservices Architecture**: Each service with its own database
- **Development Teams**: Standardize database configurations
- **CI/CD Pipelines**: Automated testing with predefined databases
- **Learning & Experimentation**: Quick setup for trying different databases

## 📁 File Structure

The `.hayaidb` file uses **YAML format** with the following structure:

```yaml
version: "1.0"           # Configuration version
project: <project-name>   # Project identifier
databases:               # Database definitions
  <database-name>:       # Unique database identifier
    engine: <engine>     # Database engine type
    environment:         # Environment variables
      KEY: value
    port: <port>         # Port number
    # Additional optional parameters
    volumes:            # Volume mappings
      - source:target
    networks:           # Network configurations
      - network-name
    memory: <limit>     # Memory limit
    restart: <policy>   # Restart policy
```

## 🛠️ Configuration Parameters

### **Core Parameters**

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `version` | Configuration file version | ✅ | `"1.0"` |
| `project` | Project name/identifier | ✅ | `"my-app"` |
| `databases` | Database definitions | ✅ | `{}` |

### **Database Parameters**

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `engine` | Database engine type | ✅ | `postgresql`, `redis`, `influxdb2` |
| `environment` | Environment variables | ✅ | `POSTGRES_DB: mydb` |
| `port` | Port number | ✅ | `5432` |
| `volumes` | Volume mappings | ❌ | `["./data:/var/lib/postgresql/data"]` |
| `networks` | Network configurations | ❌ | `["backend-network"]` |
| `memory` | Memory limit | ❌ | `"512m"` |
| `restart` | Restart policy | ❌ | `"unless-stopped"` |

## 🗄️ Supported Database Engines

### **SQL Databases**
- `postgresql` - PostgreSQL database
- `mariadb` - MariaDB database

### **Analytics Databases**
- `duckdb` - DuckDB analytics database

### **Embedded Databases**
- `sqlite` - SQLite database
- `lmdb` - LMDB memory-mapped key-value store

### **Key-Value Databases**
- `redis` - Redis key-value store
- `leveldb` - LevelDB key-value store
- `tikv` - TiKV distributed key-value store

### **Wide Column Databases**
- `cassandra` - Apache Cassandra

### **Graph Databases**
- `arangodb` - ArangoDB multi-model
- `nebula` - NebulaGraph distributed graph database

### **Time Series**
- `influxdb2` - InfluxDB 2.x
- `influxdb3` - InfluxDB 3 Core
- `timescaledb` - TimescaleDB
- `questdb` - QuestDB
- `victoriametrics` - VictoriaMetrics
- `horaedb` - Apache HoraeDB

### **Vector & Search**
- `qdrant` - Qdrant vector database
- `weaviate` - Weaviate vector database
- `milvus` - Milvus vector database
- `meilisearch` - Meilisearch
- `typesense` - Typesense

## 🔧 Commands Integration

### **Initialize from .hayaidb**
```bash
# Initialize all databases from .hayaidb
hayai init --config .hayaidb

# Initialize specific database
hayai init --config .hayaidb --database demo-postgres
```

### **Batch Operations**
```bash
# Start all databases defined in .hayaidb
hayai start --config .hayaidb

# Stop all databases
hayai stop --config .hayaidb

# List databases from config
hayai list --config .hayaidb
```

### **Configuration Validation**
```bash
# Validate .hayaidb configuration
hayai validate --config .hayaidb

# Check configuration syntax
hayai config check
```

## 📝 Environment Variables Guide

### **Common Environment Variables**

#### **PostgreSQL**
```yaml
environment:
  POSTGRES_DB: database_name          # Database name
  POSTGRES_USER: username             # Database user
  POSTGRES_PASSWORD: password         # Database password
  POSTGRES_HOST_AUTH_METHOD: trust    # Authentication method
  POSTGRES_INITDB_ARGS: "--encoding=UTF-8"  # Init arguments
```

#### **Redis**
```yaml
environment:
  REDIS_PASSWORD: password            # Redis password
  REDIS_AOF_ENABLED: "yes"            # Enable AOF persistence
  REDIS_RDB_ENABLED: "yes"            # Enable RDB persistence
  REDIS_MAXMEMORY: "256mb"            # Memory limit
  REDIS_MAXMEMORY_POLICY: "allkeys-lru"  # Eviction policy
```

#### **InfluxDB 2.x**
```yaml
environment:
  INFLUXDB_DB: database_name          # Database name
  INFLUXDB_ADMIN_USER: admin          # Admin username
  INFLUXDB_ADMIN_PASSWORD: password   # Admin password
  INFLUXDB_USER: user                 # Regular user
  INFLUXDB_USER_PASSWORD: password    # User password
  INFLUXDB_HTTP_AUTH_ENABLED: "true"  # Enable HTTP auth
```

## 🔄 Migration from Manual Setup

### **Before (Manual Setup)**
```bash
hayai init -n postgres -e postgresql -p 5432
hayai init -n redis -e redis -p 6379
hayai init -n influx -e influxdb2 -p 8086
```

### **After (Declarative Setup)**
```yaml
# .hayaidb
version: "1.0"
project: my-app
databases:
  postgres:
    engine: postgresql
    port: 5432
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
  redis:
    engine: redis
    port: 6379
    environment:
      REDIS_PASSWORD: password
  influx:
    engine: influxdb2
    port: 8086
    environment:
      INFLUXDB_DB: myapp
      INFLUXDB_ADMIN_USER: admin
      INFLUXDB_ADMIN_PASSWORD: password
```

```bash
# Single command replaces all manual setup
hayai init --config .hayaidb
```

## 🚀 Best Practices

### **1. Naming Conventions**
```yaml
databases:
  # Good: descriptive names
  user-service-postgres:
    engine: postgresql
  
  session-cache-redis:
    engine: redis
  
  # Avoid: generic names
  db1:
    engine: postgresql
```

### **2. Environment Organization**
```yaml
# Separate environments
databases:
  # Development
  dev-postgres:
    engine: postgresql
    environment:
      POSTGRES_DB: myapp_dev
  
  # Testing
  test-postgres:
    engine: postgresql
    environment:
      POSTGRES_DB: myapp_test
```

### **3. Security Considerations**
```yaml
# Use environment variables for secrets
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-defaultpassword}
  REDIS_PASSWORD: ${REDIS_PASSWORD:-defaultpassword}
```

### **4. Resource Management**
```yaml
databases:
  heavy-database:
    engine: postgresql
    memory: "1g"              # Limit memory usage
    restart: "unless-stopped" # Auto-restart policy
```

## 🐛 Troubleshooting

### **Common Issues**

#### **Port Conflicts**
```yaml
# Error: Port already in use
databases:
  postgres:
    port: 5432  # Already used by system PostgreSQL
    
# Solution: Use different port
databases:
  postgres:
    port: 5433  # Use alternative port
```

#### **Invalid Engine Names**
```yaml
# Error: Unknown engine
databases:
  mydb:
    engine: mysql  # Not supported
    
# Solution: Use supported engine
databases:
  mydb:
    engine: mariadb  # Supported alternative
```

#### **Missing Required Environment Variables**
```yaml
# Error: Missing required environment variables
databases:
  postgres:
    engine: postgresql
    # Missing: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
    
# Solution: Add required variables
databases:
  postgres:
    engine: postgresql
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
```

## 📚 Examples

For complete examples and advanced configurations, see:
- [Complete .hayaidb example](/.hayaidb)
- [Development setup examples](/examples/development.hayaidb)
- [Microservices examples](/examples/microservices.hayaidb)
- [CI/CD examples](/examples/ci-cd.hayaidb)

## 🎯 Real-World Use Cases

### **Case 1: Simple Web Application** 
*Complexity Level: 🟢 Beginner*

Perfect for a simple web application with basic database needs.

```yaml
version: "1.0"
project: simple-blog
description: "Basic blog application with PostgreSQL"

databases:
  blog-database:
    engine: postgresql
    port: 5432
    environment:
      POSTGRES_DB: blog
      POSTGRES_USER: blogger
      POSTGRES_PASSWORD: myblog123
    memory: "256m"
    restart: "unless-stopped"
```

**What this provides:**
- ✅ Single PostgreSQL database
- ✅ Basic authentication
- ✅ Memory limit for resource control
- ✅ Auto-restart on failure

**Usage:**
```bash
# Initialize the blog database
hayai init --config .hayaidb

# Start the database
hayai start --config .hayaidb

# Connect to database
psql -h localhost -p 5432 -U blogger -d blog
```

**Perfect for:**
- Learning SQL and database basics
- Simple CRUD applications
- Personal projects and prototypes
- Single-developer projects

---

### **Case 2: E-commerce Microservices Platform**
*Complexity Level: 🟡 Intermediate*

Complex e-commerce platform with multiple specialized databases for different services.

```yaml
version: "1.0"
project: ecommerce-platform
description: "Multi-service e-commerce platform"

networks:
  - frontend-network
  - backend-network
  - cache-network

volumes:
  - user-data
  - product-data
  - order-data
  - search-data
  - cache-data
  - analytics-data

databases:
  # User Management Service
  user-service-db:
    engine: postgresql
    port: 5432
    environment:
      POSTGRES_DB: users
      POSTGRES_USER: user_admin
      POSTGRES_PASSWORD: secure_users_2024
      POSTGRES_MAX_CONNECTIONS: "200"
      POSTGRES_SHARED_BUFFERS: "256MB"
    volumes:
      - "user-data:/var/lib/postgresql/data"
      - "./backups/users:/backups"
    networks:
      - backend-network
    memory: "512m"
    restart: "unless-stopped"

  # Product Catalog Service
  product-catalog-db:
    engine: postgresql
    port: 5433
    environment:
      POSTGRES_DB: products
      POSTGRES_USER: product_admin
      POSTGRES_PASSWORD: secure_products_2024
      POSTGRES_MAX_CONNECTIONS: "150"
      POSTGRES_WORK_MEM: "8MB"
    volumes:
      - "product-data:/var/lib/postgresql/data"
      - "./backups/products:/backups"
    networks:
      - backend-network
    memory: "512m"
    restart: "unless-stopped"

  # Order Management Service
  order-service-db:
    engine: postgresql
    port: 5434
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: order_admin
      POSTGRES_PASSWORD: secure_orders_2024
      POSTGRES_ARCHIVE_MODE: "on"
      POSTGRES_WAL_LEVEL: "replica"
    volumes:
      - "order-data:/var/lib/postgresql/data"
      - "./backups/orders:/backups"
    networks:
      - backend-network
    memory: "512m"
    restart: "unless-stopped"

  # Search Engine
  product-search:
    engine: meilisearch
    port: 7700
    environment:
      MEILI_MASTER_KEY: "search_master_key_2024"
      MEILI_ENV: "development"
      MEILI_HTTP_ADDR: "0.0.0.0:7700"
      MEILI_DB_PATH: "/data.ms"
    volumes:
      - "search-data:/data.ms"
    networks:
      - frontend-network
      - backend-network
    memory: "256m"
    restart: "unless-stopped"

  # Session Store & Cache
  redis-cache:
    engine: redis
    port: 6379
    environment:
      REDIS_PASSWORD: "cache_password_2024"
      REDIS_MAXMEMORY: "512mb"
      REDIS_MAXMEMORY_POLICY: "allkeys-lru"
      REDIS_AOF_ENABLED: "yes"
      REDIS_DATABASES: "16"
    volumes:
      - "cache-data:/data"
    networks:
      - cache-network
      - backend-network
    memory: "512m"
    restart: "unless-stopped"

  # Analytics & Metrics
  analytics-db:
    engine: influxdb2
    port: 8086
    environment:
      DOCKER_INFLUXDB_INIT_MODE: "setup"
      DOCKER_INFLUXDB_INIT_USERNAME: "analytics_admin"
      DOCKER_INFLUXDB_INIT_PASSWORD: "analytics_password_2024"
      DOCKER_INFLUXDB_INIT_ORG: "ecommerce-org"
      DOCKER_INFLUXDB_INIT_BUCKET: "user-analytics"
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: "analytics-token-super-secret-2024"
      INFLUXDB_DATA_RETENTION_CHECK_PERIOD: "1h"
    volumes:
      - "analytics-data:/var/lib/influxdb2"
      - "./backups/analytics:/backups"
    networks:
      - backend-network
    memory: "512m"
    restart: "unless-stopped"

global:
  network:
    frontend-network:
      driver: bridge
    backend-network:
      driver: bridge
      internal: true
    cache-network:
      driver: bridge
      internal: true
```

**What this provides:**
- ✅ 6 specialized databases for different services
- ✅ Network isolation (frontend, backend, cache)
- ✅ Dedicated volumes for data persistence
- ✅ Service-specific optimizations
- ✅ Backup strategies for each service
- ✅ Memory limits and restart policies

**Usage:**
```bash
# Initialize all services
hayai init --config .hayaidb

# Start specific services
hayai start --config .hayaidb --database user-service-db
hayai start --config .hayaidb --database product-catalog-db

# Start all services
hayai start --config .hayaidb

# Check status
hayai list --config .hayaidb
```

**Perfect for:**
- E-commerce platforms
- Microservices architectures
- Multi-team development
- Production-ready applications
- Scalable web applications

---

### **Case 3: Enterprise Data Platform**
*Complexity Level: 🔴 Advanced*

Enterprise-grade data platform with multiple environments, replication, and advanced configurations.

```yaml
version: "1.0"
project: enterprise-data-platform
description: "Enterprise data platform with multi-environment support"

# Global network configuration
networks:
  - data-ingestion-network
  - data-processing-network
  - data-analytics-network
  - monitoring-network
  - external-network

# Global volume configuration
volumes:
  - primary-postgres-data
  - replica-postgres-data
  - timeseries-data
  - vector-data
  - search-data
  - cache-cluster-data
  - analytics-data
  - monitoring-data

databases:
  # PRIMARY DATABASE CLUSTER
  primary-postgres:
    engine: postgresql
    port: 5432
    environment:
      # Database Configuration
      POSTGRES_DB: enterprise_primary
      POSTGRES_USER: db_admin
      POSTGRES_PASSWORD: "${POSTGRES_ADMIN_PASSWORD}"
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: "${POSTGRES_REPLICATION_PASSWORD}"
      
      # Performance Optimization
      POSTGRES_SHARED_BUFFERS: "1GB"
      POSTGRES_EFFECTIVE_CACHE_SIZE: "3GB"
      POSTGRES_WORK_MEM: "16MB"
      POSTGRES_MAINTENANCE_WORK_MEM: "256MB"
      POSTGRES_CHECKPOINT_SEGMENTS: "32"
      POSTGRES_CHECKPOINT_COMPLETION_TARGET: "0.7"
      POSTGRES_WAL_BUFFERS: "16MB"
      
      # Connection & Security
      POSTGRES_MAX_CONNECTIONS: "500"
      POSTGRES_LISTEN_ADDRESSES: "*"
      POSTGRES_SSL: "on"
      POSTGRES_SSL_CERT_FILE: "/etc/ssl/certs/postgresql.crt"
      POSTGRES_SSL_KEY_FILE: "/etc/ssl/private/postgresql.key"
      
      # Replication Configuration
      POSTGRES_WAL_LEVEL: "replica"
      POSTGRES_ARCHIVE_MODE: "on"
      POSTGRES_ARCHIVE_COMMAND: "cp %p /archives/%f"
      POSTGRES_MAX_WAL_SENDERS: "3"
      POSTGRES_WAL_KEEP_SEGMENTS: "64"
      
      # Monitoring & Logging
      POSTGRES_LOG_DESTINATION: "stderr,csvlog"
      POSTGRES_LOGGING_COLLECTOR: "on"
      POSTGRES_LOG_DIRECTORY: "/var/log/postgresql"
      POSTGRES_LOG_STATEMENT: "ddl"
      POSTGRES_LOG_MIN_DURATION_STATEMENT: "500"
      POSTGRES_LOG_LINE_PREFIX: "%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h"
      
    volumes:
      - "primary-postgres-data:/var/lib/postgresql/data"
      - "./ssl/postgresql:/etc/ssl"
      - "./backups/primary:/backups"
      - "./archives/primary:/archives"
      - "./logs/primary:/var/log/postgresql"
    networks:
      - data-ingestion-network
      - data-processing-network
      - monitoring-network
    memory: "2g"
    cpu_limit: "2"
    restart: "unless-stopped"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U db_admin -d enterprise_primary"]
      interval: "10s"
      timeout: "5s"
      retries: 5
      start_period: "30s"

  # READ REPLICA DATABASE
  replica-postgres:
    engine: postgresql
    port: 5433
    environment:
      POSTGRES_DB: enterprise_replica
      POSTGRES_USER: db_readonly
      POSTGRES_PASSWORD: "${POSTGRES_READONLY_PASSWORD}"
      POSTGRES_MASTER_SERVICE: "primary-postgres"
      POSTGRES_REPLICA_MODE: "slave"
      POSTGRES_MASTER_PORT: "5432"
      POSTGRES_SHARED_BUFFERS: "512MB"
      POSTGRES_EFFECTIVE_CACHE_SIZE: "1GB"
      POSTGRES_MAX_CONNECTIONS: "300"
    volumes:
      - "replica-postgres-data:/var/lib/postgresql/data"
      - "./backups/replica:/backups"
    networks:
      - data-analytics-network
      - monitoring-network
    memory: "1g"
    restart: "unless-stopped"
    depends_on:
      - primary-postgres

  # TIME SERIES DATA WAREHOUSE
  timeseries-warehouse:
    engine: influxdb2
    port: 8086
    environment:
      # Advanced InfluxDB Configuration
      DOCKER_INFLUXDB_INIT_MODE: "setup"
      DOCKER_INFLUXDB_INIT_USERNAME: "influx_admin"
      DOCKER_INFLUXDB_INIT_PASSWORD: "${INFLUXDB_ADMIN_PASSWORD}"
      DOCKER_INFLUXDB_INIT_ORG: "enterprise"
      DOCKER_INFLUXDB_INIT_BUCKET: "metrics"
      DOCKER_INFLUXDB_INIT_RETENTION: "30d"
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: "${INFLUXDB_ADMIN_TOKEN}"
      
      # Performance Configuration
      INFLUXDB_DATA_CACHE_MAX_MEMORY_SIZE: "2gb"
      INFLUXDB_DATA_CACHE_SNAPSHOT_MEMORY_SIZE: "100mb"
      INFLUXDB_DATA_CACHE_SNAPSHOT_WRITE_COLD_DURATION: "5m"
      INFLUXDB_DATA_COMPACT_FULL_WRITE_COLD_DURATION: "2h"
      INFLUXDB_DATA_MAX_SERIES_PER_DATABASE: "10000000"
      INFLUXDB_DATA_MAX_VALUES_PER_TAG: "1000000"
      
      # Retention Policies
      INFLUXDB_DATA_RETENTION_CHECK_PERIOD: "10m"
      INFLUXDB_CONTINUOUS_QUERIES_ENABLED: "true"
      INFLUXDB_CONTINUOUS_QUERIES_LOG_ENABLED: "true"
      
      # HTTP & Security
      INFLUXDB_HTTP_BIND_ADDRESS: ":8086"
      INFLUXDB_HTTP_AUTH_ENABLED: "true"
      INFLUXDB_HTTP_LOG_ENABLED: "true"
      INFLUXDB_HTTP_HTTPS_ENABLED: "true"
      INFLUXDB_HTTP_HTTPS_CERTIFICATE: "/etc/ssl/influxdb.crt"
      INFLUXDB_HTTP_HTTPS_PRIVATE_KEY: "/etc/ssl/influxdb.key"
      
    volumes:
      - "timeseries-data:/var/lib/influxdb2"
      - "./ssl/influxdb:/etc/ssl"
      - "./backups/timeseries:/backups"
      - "./config/influxdb:/etc/influxdb2"
    networks:
      - data-ingestion-network
      - data-analytics-network
      - monitoring-network
    memory: "2g"
    cpu_limit: "2"
    restart: "unless-stopped"

  # VECTOR DATABASE FOR AI/ML
  vector-database:
    engine: qdrant
    port: 6333
    environment:
      QDRANT_SERVICE_HTTP_PORT: "6333"
      QDRANT_SERVICE_GRPC_PORT: "6334"
      QDRANT_LOG_LEVEL: "INFO"
      QDRANT_STORAGE_PATH: "/qdrant/storage"
      QDRANT_SNAPSHOTS_PATH: "/qdrant/snapshots"
      QDRANT_SERVICE_ENABLE_CORS: "true"
      QDRANT_CLUSTER_ENABLED: "true"
      QDRANT_CLUSTER_NODE_ID: "1"
      QDRANT_SERVICE_API_KEY: "${QDRANT_API_KEY}"
      QDRANT_TLS_CERT: "/etc/ssl/qdrant.crt"
      QDRANT_TLS_KEY: "/etc/ssl/qdrant.key"
    volumes:
      - "vector-data:/qdrant/storage"
      - "./backups/vector:/qdrant/snapshots"
      - "./ssl/qdrant:/etc/ssl"
    networks:
      - data-analytics-network
      - external-network
    memory: "1g"
    restart: "unless-stopped"

  # ENTERPRISE SEARCH ENGINE
  enterprise-search:
    engine: meilisearch
    port: 7700
    environment:
      MEILI_MASTER_KEY: "${MEILISEARCH_MASTER_KEY}"
      MEILI_ENV: "production"
      MEILI_HTTP_ADDR: "0.0.0.0:7700"
      MEILI_DB_PATH: "/data.ms"
      MEILI_SNAPSHOT_DIR: "/snapshots"
      MEILI_DUMPS_DIR: "/dumps"
      MEILI_LOG_LEVEL: "INFO"
      MEILI_MAX_INDEXING_MEMORY: "1gb"
      MEILI_MAX_INDEXING_THREADS: "4"
      MEILI_SSL_CERT_PATH: "/etc/ssl/meilisearch.crt"
      MEILI_SSL_KEY_PATH: "/etc/ssl/meilisearch.key"
    volumes:
      - "search-data:/data.ms"
      - "./backups/search:/snapshots"
      - "./dumps/search:/dumps"
      - "./ssl/meilisearch:/etc/ssl"
    networks:
      - data-analytics-network
      - external-network
    memory: "1g"
    restart: "unless-stopped"

  # REDIS CLUSTER FOR CACHING
  redis-cluster-master:
    engine: redis
    port: 6379
    environment:
      REDIS_PASSWORD: "${REDIS_CLUSTER_PASSWORD}"
      REDIS_MAXMEMORY: "1gb"
      REDIS_MAXMEMORY_POLICY: "allkeys-lru"
      REDIS_AOF_ENABLED: "yes"
      REDIS_RDB_ENABLED: "yes"
      REDIS_SAVE: "900 1 300 10 60 10000"
      REDIS_CLUSTER_ENABLED: "yes"
      REDIS_CLUSTER_CONFIG_FILE: "/etc/redis/nodes.conf"
      REDIS_CLUSTER_NODE_TIMEOUT: "15000"
      REDIS_CLUSTER_ANNOUNCE_IP: "redis-cluster-master"
      REDIS_CLUSTER_ANNOUNCE_PORT: "6379"
      REDIS_CLUSTER_ANNOUNCE_BUS_PORT: "16379"
      REDIS_TLS_CERT_FILE: "/etc/ssl/redis.crt"
      REDIS_TLS_KEY_FILE: "/etc/ssl/redis.key"
      REDIS_TLS_CA_CERT_FILE: "/etc/ssl/ca.crt"
    volumes:
      - "cache-cluster-data:/data"
      - "./config/redis:/etc/redis"
      - "./ssl/redis:/etc/ssl"
    networks:
      - data-processing-network
      - external-network
    memory: "1g"
    restart: "unless-stopped"

  # ANALYTICS DATABASE
  analytics-warehouse:
    engine: questdb
    port: 9000
    environment:
      QUESTDB_HTTP_BIND_TO: "0.0.0.0:9000"
      QUESTDB_PG_BIND_TO: "0.0.0.0:8812"
      QUESTDB_ILP_BIND_TO: "0.0.0.0:9009"
      QUESTDB_HTTP_SECURITY_READONLY: "false"
      QUESTDB_PG_USER: "questdb_user"
      QUESTDB_PG_PASSWORD: "${QUESTDB_PASSWORD}"
      QUESTDB_TELEMETRY_ENABLED: "false"
      QUESTDB_LOG_LEVEL: "INFO"
      QUESTDB_SHARED_WORKER_COUNT: "4"
      QUESTDB_HTTP_WORKER_COUNT: "4"
    volumes:
      - "analytics-data:/var/lib/questdb"
      - "./backups/analytics:/backups"
    networks:
      - data-analytics-network
      - monitoring-network
    memory: "1g"
    restart: "unless-stopped"

# Global configuration for enterprise setup
global:
  # Network configuration
  networks:
    data-ingestion-network:
      driver: bridge
      ipam:
        config:
          - subnet: "172.21.0.0/16"
    data-processing-network:
      driver: bridge
      internal: true
      ipam:
        config:
          - subnet: "172.22.0.0/16"
    data-analytics-network:
      driver: bridge
      internal: true
      ipam:
        config:
          - subnet: "172.23.0.0/16"
    monitoring-network:
      driver: bridge
      ipam:
        config:
          - subnet: "172.24.0.0/16"
    external-network:
      driver: bridge
      ipam:
        config:
          - subnet: "172.25.0.0/16"

  # Volume configuration
  volumes:
    driver: local
    driver_opts:
      type: "ext4"
      device: "/dev/disk/by-label/enterprise-data"

  # Security configuration
  security:
    enable_ssl: true
    ssl_cert_path: "./ssl"
    enable_secrets: true
    secrets_backend: "vault"

  # Backup configuration
  backup:
    enabled: true
    schedule: "0 2 * * *"  # Daily at 2 AM
    retention: "30d"
    compression: "gzip"
    encryption: true

  # Monitoring configuration
  monitoring:
    enabled: true
    prometheus_port: 9090
    grafana_port: 3000
    alertmanager_port: 9093

  # Resource limits
  resources:
    default_memory: "512m"
    default_cpu_limit: "1"
    max_memory: "4g"
    max_cpu_limit: "4"
```

**What this provides:**
- ✅ Primary-replica PostgreSQL setup
- ✅ Multi-specialized databases (time series, vector, search)
- ✅ SSL/TLS encryption for all services
- ✅ Network isolation with custom subnets
- ✅ Environment variable management
- ✅ Backup and monitoring strategies
- ✅ Resource limits and health checks
- ✅ Cluster configurations

**Usage:**
```bash
# Set environment variables
export POSTGRES_ADMIN_PASSWORD="super_secure_password"
export POSTGRES_REPLICATION_PASSWORD="replication_password"
export INFLUXDB_ADMIN_TOKEN="super_secret_token"

# Initialize entire platform
hayai init --config .hayaidb

# Start core services first
hayai start --config .hayaidb --database primary-postgres
hayai start --config .hayaidb --database replica-postgres

# Start analytics services
hayai start --config .hayaidb --database timeseries-warehouse
hayai start --config .hayaidb --database vector-database

# Start all services
hayai start --config .hayaidb

# Monitor status
hayai list --config .hayaidb --verbose
```

**Perfect for:**
- Enterprise applications
- Big data platforms
- AI/ML production environments
- Multi-tenant systems
- High-availability requirements
- Compliance-heavy industries

## 🔗 Related Commands

- `hayai init --help` - Initialize database help
- `hayai config --help` - Configuration management
- `hayai validate --help` - Configuration validation
- `hayai list --help` - List databases help

---

*For more information, visit the [Hayai Documentation](https://github.com/hitoshyamamoto/hayai) or run `hayai --help`.* 