# Hayai ⚡

> Instantly create and manage local databases with one command

Fast, modern CLI tool for managing local SQL and NoSQL databases with Docker. Built for backend developers who need quick database instances for development and testing.

## 🚀 Features

- **100% Open-Source Databases**: Only includes databases with permissive licenses
- **One Command Setup**: Initialize any database with a single command
- **Docker-Powered**: Automated container management with health checks
- **Auto Port Management**: Intelligent port allocation (5000-6000 range)
- **Admin Dashboards**: Built-in web interfaces for database management
- **Environment Integration**: Automatic `.env` file updates with connection URIs
- **Modern CLI**: Interactive prompts with beautiful output

## 📦 Supported Databases

All databases are **100% open-source** with permissive licenses:

### SQL Databases
- **PostgreSQL** (PostgreSQL License - MIT-like) - Most popular open-source database
- **MariaDB** (GPL v2) - MySQL community fork with enhanced features
- **SQLite** (Public Domain) - Lightweight embedded database
- **DuckDB** (MIT) - Analytics-focused embedded database

### Key-Value Stores
- **Redis** (BSD 3-Clause) - High-performance in-memory data store

### Wide Column Stores  
- **Apache Cassandra** (Apache 2.0) - Distributed NoSQL database

### Time Series Databases
- **InfluxDB 3 Core** (MIT/Apache 2.0) - Modern time series with Python integration
- **TimescaleDB** (Timescale License) - PostgreSQL-based time series database
- **QuestDB** (Apache 2.0) - High-performance time series with SQL support
- **VictoriaMetrics** (Apache 2.0) - Prometheus-compatible metrics database
- **Apache HoraeDB** (Apache 2.0) - Cloud-native distributed time series database

### Vector Databases
- **Qdrant** (Apache 2.0) - Vector database with REST API
- **Weaviate** (BSD 3-Clause) - Vector search engine with ML models
- **Milvus** (Apache 2.0) - Vector database for AI applications

### Graph Databases
- **ArangoDB** (Apache 2.0) - Multi-model database (graph, document, key-value)

### Search Databases
- **Meilisearch** (MIT) - Modern full-text search engine
- **Typesense** (GPL v3) - Fast, typo-tolerant search engine

### Embedded Databases
- **LevelDB** (BSD) - High-performance key-value storage library

## 🛠️ Installation

```bash
npm install -g hayai
```

## 🎯 Quick Start

```bash
# Initialize a PostgreSQL database
hayai init

# Start all databases
hayai start

# List running databases
hayai list

# Open admin dashboards
hayai studio

# Stop all databases
hayai stop
```

## 📋 Commands

### `hayai init`
Initialize a new database instance with interactive prompts or command-line options.

```bash
# Interactive mode
hayai init

# Quick setup
hayai init -n mydb -e postgresql -p 5432 -y

# With admin dashboard
hayai init --admin-dashboard
```

### `hayai start [name]`
Start database instances. Start all if no name specified.

```bash
# Start all databases
hayai start

# Start specific database
hayai start mydb
```

### `hayai stop [name]`
Stop database instances.

```bash
# Stop all databases
hayai stop

# Stop specific database
hayai stop mydb
```

### `hayai list`
List all database instances with their status.

```bash
# List all databases
hayai list

# Show only running databases
hayai list --running

# JSON output
hayai list --format json
```

### `hayai remove <name>`
Remove a database instance (with confirmation).

```bash
# Remove database
hayai remove mydb

# Force removal without confirmation
hayai remove mydb --force
```

### `hayai studio [name]`
Open admin dashboards for database management.

```bash
# Open all dashboards
hayai studio

# Open specific dashboard
hayai studio mydb
```

### `hayai logs <name>`
View logs from a database instance.

```bash
# View logs
hayai logs mydb

# Follow logs
hayai logs mydb --follow
```

### `hayai snapshot <name>`
Create a snapshot of a database instance.

```bash
# Create snapshot
hayai snapshot mydb

# Compressed snapshot
hayai snapshot mydb --compress
```

## 🔧 Configuration

Hayai uses a `hayai.config.yaml` file for configuration:

```yaml
version: '1.0.0'
docker:
  network_name: hayai-network
  compose_file: docker-compose.yml
  data_directory: ./data
logging:
  level: info
  file: hayai.log
defaults:
  port_range:
    start: 5000
    end: 6000
  volume_driver: local
  restart_policy: unless-stopped
```

## 🌟 Why Hayai?

### 🛡️ Security First
- **No Deprecated Dependencies**: All dependencies are up-to-date
- **Zero Vulnerabilities**: Clean `npm audit` results
- **Secure by Default**: Only trusted, open-source databases

### 🎯 Developer Experience
- **Interactive CLI**: Beautiful prompts with validation
- **Smart Defaults**: Sensible configuration out of the box
- **Error Handling**: Clear error messages and recovery suggestions

### 📊 Database Diversity
- **SQL**: PostgreSQL, MariaDB, SQLite, DuckDB
- **Key-Value**: Redis
- **Wide Column**: Apache Cassandra
- **Time Series**: InfluxDB, TimescaleDB, QuestDB, VictoriaMetrics, Apache HoraeDB
- **Vector**: Qdrant, Weaviate, Milvus
- **Graph**: ArangoDB
- **Search**: Meilisearch, Typesense

## 📚 Examples

### Setting up a development environment

```bash
# PostgreSQL for main data
hayai init -n maindb -e postgresql -y

# Redis for caching
hayai init -n cache -e redis -y

# Meilisearch for search
hayai init -n search -e meilisearch -y

# Start all
hayai start
```

### AI/ML Development

```bash
# Qdrant for vector search
hayai init -n vectors -e qdrant -y

# PostgreSQL for structured data
hayai init -n data -e postgresql -y

# Start and access
hayai start
hayai studio
```

## 🔄 Dependency Management

Hayai is built with modern, secure dependencies:

### Core Dependencies
- **chalk** ^5.4.1 - Terminal colors
- **commander** ^12.1.0 - CLI framework
- **dockerode** ^4.0.7 - Docker API client
- **inquirer** ^9.2.12 - Interactive prompts
- **ora** ^8.2.0 - Loading spinners
- **yaml** ^2.8.0 - YAML parser

### Development Dependencies
- **typescript** ^5.8.3 - TypeScript compiler
- **@types/node** ^22.10.6 - Node.js type definitions
- **eslint** ^8.57.1 - Code linting
- **prettier** ^3.6.2 - Code formatting

All dependencies are regularly updated and security-audited.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Docker** - Container platform
- **Open-source database communities** - For creating amazing databases
- **Node.js ecosystem** - For excellent tooling

---

Built by [hitoshyamamoto](https://github.com/hitoshyamamoto)
