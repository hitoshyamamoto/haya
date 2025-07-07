<div align="center">
  <img src="assets/logo_hayai.png" alt="Hayai Logo" width="200"/>
  <h1>Hayai ⚡</h1>
  <p><em>Instantly create and manage local databases with one command</em></p>
  
  ![GitHub Actions](https://github.com/hitoshyamamoto/hayai/workflows/CI/badge.svg)
  ![npm version](https://img.shields.io/npm/v/hayai.svg)
  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
  
  ![npm downloads](https://img.shields.io/npm/dw/hayai.svg)
  ![GitHub stars](https://img.shields.io/github/stars/hitoshyamamoto/hayai.svg?style=social)
  ![GitHub forks](https://img.shields.io/github/forks/hitoshyamamoto/hayai.svg?style=social)
  
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
  ![Databases](https://img.shields.io/badge/Databases-18-success)
  ![CLI](https://img.shields.io/badge/CLI-Tool-blue)
  
  ![Security](https://img.shields.io/badge/Security-0%20vulnerabilities-brightgreen)
  ![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)
  ![Maintenance](https://img.shields.io/badge/Maintained-Yes-brightgreen)
</div>

<br>

## 🇯🇵 About the Name

**Hayai** (速い) means "fast" or "quick" in Japanese. This CLI tool lives up to its name by instantly creating and managing local databases with a single command.

## 🚀 What is Hayai?

Fast, modern CLI tool for managing local SQL and NoSQL databases with Docker. Built for backend developers who need quick database instances for development and testing.

**Perfect for:**
- 🏗️ **Local Development** - Spin up databases instantly
- 🧪 **Testing Environments** - Isolated database instances
- 🔬 **Experimentation** - Try different databases quickly
- 📚 **Learning** - Explore various database technologies

## ⚡ Quick Start

```bash
# Install globally
npm install -g hayai

# Initialize a PostgreSQL database
hayai init

# Start all databases
hayai start

# Open admin dashboards
hayai studio
```

## 🎯 Key Features

- **🔓 100% Open-Source**: Only includes databases with permissive licenses
- **⚡ One Command Setup**: Initialize any database with a single command
- **🐳 Docker-Powered**: Automated container management with health checks
- **🔧 Smart Port Management**: Intelligent port allocation (5000-6000 range)
- **🌐 Admin Dashboards**: Built-in web interfaces for database management
- **🔗 Environment Integration**: Automatic `.env` file updates with connection URIs
- **✨ Modern CLI**: Interactive prompts with beautiful output

## 📦 Supported Databases

All databases are **100% open-source** with permissive licenses:

<details>
<summary><strong>SQL Databases (4)</strong></summary>

- **PostgreSQL** (PostgreSQL License) - Most popular open-source database
- **MariaDB** (GPL v2) - MySQL community fork with enhanced features
- **SQLite** (Public Domain) - Lightweight embedded database
- **DuckDB** (MIT) - Analytics-focused embedded database
</details>

<details>
<summary><strong>Time Series Databases (5)</strong></summary>

- **InfluxDB 3 Core** (MIT/Apache 2.0) - Modern time series with Python integration
- **TimescaleDB** (Timescale License) - PostgreSQL-based time series database
- **QuestDB** (Apache 2.0) - High-performance time series with SQL support
- **VictoriaMetrics** (Apache 2.0) - Prometheus-compatible metrics database
- **Apache HoraeDB** (Apache 2.0) - Cloud-native distributed time series database
</details>

<details>
<summary><strong>Vector Databases (3)</strong></summary>

- **Qdrant** (Apache 2.0) - Vector database with REST API
- **Weaviate** (BSD 3-Clause) - Vector search engine with ML models
- **Milvus** (Apache 2.0) - Vector database for AI applications
</details>

<details>
<summary><strong>Search Databases (2)</strong></summary>

- **Meilisearch** (MIT) - Modern full-text search engine
- **Typesense** (GPL v3) - Fast, typo-tolerant search engine
</details>

<details>
<summary><strong>Specialized Databases (4)</strong></summary>

- **Redis** (BSD 3-Clause) - High-performance in-memory key-value store
- **Apache Cassandra** (Apache 2.0) - Distributed wide column store
- **ArangoDB** (Apache 2.0) - Multi-model database (graph, document, key-value)
- **LevelDB** (BSD) - High-performance key-value storage library
</details>

**Total: 18 databases across 8 categories**

## 🛠️ Installation

### Prerequisites
- **Node.js** 18.0.0 or higher
- **Docker** and **Docker Compose**

### Install Hayai
```bash
npm install -g hayai
```

### Verify Installation
```bash
hayai --version
```

## 📋 Commands Reference

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `hayai init` | Initialize a new database instance | `hayai init -n mydb -e postgresql` |
| `hayai start [name]` | Start database instances | `hayai start` or `hayai start mydb` |
| `hayai stop [name]` | Stop database instances | `hayai stop` or `hayai stop mydb` |
| `hayai list` | List all database instances | `hayai list --running` |
| `hayai studio [name]` | Open admin dashboards | `hayai studio mydb` |

### Management Commands

| Command | Description | Example |
|---------|-------------|---------|
| `hayai remove <name>` | Remove database instance | `hayai remove mydb --force` |
| `hayai logs <name>` | View database logs | `hayai logs mydb --follow` |
| `hayai snapshot <name>` | Create database snapshot | `hayai snapshot mydb --compress` |

### Detailed Usage

<details>
<summary><strong>hayai init</strong> - Initialize Database</summary>

```bash
# Interactive mode
hayai init

# Quick setup
hayai init -n mydb -e postgresql -p 5432 -y

# With admin dashboard
hayai init --admin-dashboard

# Custom configuration
hayai init -n cache -e redis -p 6379 --memory 512mb
```

**Options:**
- `-n, --name <name>` - Database name
- `-e, --engine <engine>` - Database engine
- `-p, --port <port>` - Port number
- `-y, --yes` - Skip confirmations
- `--admin-dashboard` - Enable admin dashboard
</details>

<details>
<summary><strong>hayai start</strong> - Start Databases</summary>

```bash
# Start all databases
hayai start

# Start specific database
hayai start mydb

# Start with custom options
hayai start --detach --timeout 60
```
</details>

<details>
<summary><strong>hayai list</strong> - List Databases</summary>

```bash
# List all databases
hayai list

# Show only running databases
hayai list --running

# JSON output
hayai list --format json

# Detailed view
hayai list --verbose
```
</details>

## 🔧 Configuration

Hayai uses a `hayai.config.yaml` file for global configuration:

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

## 📚 Usage Examples

### Development Environment Setup

```bash
# Main database
hayai init -n maindb -e postgresql -y

# Caching layer
hayai init -n cache -e redis -y

# Search functionality
hayai init -n search -e meilisearch -y

# Start all services
hayai start

# Check status
hayai list
```

### AI/ML Development Stack

```bash
# Vector database for embeddings
hayai init -n vectors -e qdrant -y

# Time series for metrics
hayai init -n metrics -e influxdb -y

# Traditional data storage
hayai init -n data -e postgresql -y

# Launch everything
hayai start
hayai studio  # Open all dashboards
```

### Microservices Testing

```bash
# User service database
hayai init -n users -e postgresql -p 5432 -y

# Session store
hayai init -n sessions -e redis -p 6379 -y

# Analytics database
hayai init -n analytics -e questdb -p 9000 -y

# Graph relationships
hayai init -n graph -e arangodb -p 8529 -y
```

## 🌟 Why Choose Hayai?

### 🛡️ Security & Reliability
- **No Deprecated Dependencies** - All dependencies are up-to-date
- **Zero Vulnerabilities** - Clean `npm audit` results
- **Secure by Default** - Only trusted, open-source databases
- **Health Checks** - Automated container monitoring

### 🎯 Developer Experience
- **Interactive CLI** - Beautiful prompts with validation
- **Smart Defaults** - Sensible configuration out of the box
- **Error Handling** - Clear error messages and recovery suggestions
- **Auto-completion** - Shell completion support

### 🚀 Performance & Flexibility
- **Fast Setup** - Databases ready in seconds
- **Resource Efficient** - Optimized Docker configurations
- **Multi-Database** - Run multiple instances simultaneously
- **Environment Isolation** - Clean separation between projects

### 📊 Comprehensive Database Support
- **SQL Databases** - PostgreSQL, MariaDB, SQLite, DuckDB
- **Time Series** - InfluxDB, TimescaleDB, QuestDB, VictoriaMetrics, HoraeDB
- **Vector Search** - Qdrant, Weaviate, Milvus
- **Search Engines** - Meilisearch, Typesense
- **Specialized** - Redis, Cassandra, ArangoDB, LevelDB

## 🔄 Dependency Management

### Core Dependencies
- **chalk** ^5.4.1 - Terminal colors and styling
- **commander** ^12.1.0 - Command-line interface framework
- **dockerode** ^4.0.7 - Docker Engine API client
- **inquirer** ^9.2.12 - Interactive command-line prompts
- **ora** ^8.2.0 - Loading spinners and progress indicators
- **yaml** ^2.8.0 - YAML parser and stringifier

### Development Dependencies
- **typescript** ^5.8.3 - TypeScript compiler
- **@types/node** ^22.10.6 - Node.js type definitions
- **eslint** ^8.57.1 - Code linting
- **jest** ^29.7.0 - Testing framework

All dependencies are regularly updated and security-audited.

## 🎨 Project Branding

### Logo Usage
The Hayai logo is located in the `assets/` directory:

- **Main Logo**: `assets/logo_hayai.png` - Primary logo for README and documentation
- **Complete Logo**: `assets/complete_logo_hayai.png` - Full logo with text
- **Format**: PNG with transparent background
- **Usage**: Free for open-source projects, attribution appreciated

### GitHub Repository Settings
To use the logo in different GitHub contexts:

1. **Social Preview**: Repository Settings → General → Social Preview (1280x640px)
2. **README Header**: Already configured using `logo_hayai.png`
3. **Issues/PRs**: Reference using `![Hayai Logo](assets/logo_hayai.png)`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/hitoshyamamoto/hayai.git

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Docker** - Container platform that makes everything possible
- **Open-source database communities** - For creating amazing databases
- **Node.js ecosystem** - For excellent tooling and libraries
- **Japanese language** - For inspiring our name (速い - hayai)

---

<div align="center">
  <p>Built to simplify and accelerate your development by <a href="https://github.com/hitoshyamamoto">hitoshyamamoto</a></p>
  <p><em>Making database management 速い (hayai) since 2025</em></p>
</div>
