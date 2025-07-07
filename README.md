# ⚡ Hayai

**Instantly create and manage local SQL, NoSQL, and Vector databases with one command.**  
Hayai is a fast, modern CLI tool designed to automate and simplify the local database experience for backend developers.

---

## 🚀 Why Hayai?

Setting up local databases can be slow, repetitive, and error-prone. Hayai automates this process by generating `docker-compose` files, resolving ports, creating volumes, and wiring your `.env` with usable connection URIs — so you can focus on modeling data and writing code.

Whether you're building APIs, experimenting with LLMs, or prototyping RAG pipelines, Hayai gives you ready-to-use infrastructure in seconds.

---

## 🧠 Philosophy

Hayai doesn't try to build your backend. It doesn't define your schema or generate business logic.  
Instead, it provides the database foundation you need — fast, modular, and developer-first.

It's a tool that helps you **start building, not just configuring**.

---

## ⚙️ Features

- ✅ **One-command setup** with `hayai init`
- ✅ **Supports SQL, NoSQL, Vector, Time-Series and more**
- ✅ **Docker Compose generated automatically**
- ✅ **Port allocation and volume setup included**
- ✅ **.env file updated with DB URIs**
- ✅ **Client SDKs (`client.ts`, `client.py`) optional**
- ✅ **Admin dashboards via `hayai studio`**
- ✅ **Snapshot/restore support**
- ✅ **Extensible via templates and plugins**

---

## 📦 Supported Database Types

| Type         | Engines                               |
|--------------|----------------------------------------|
| SQL          | PostgreSQL, MySQL, MariaDB             |
| NoSQL        | MongoDB, Redis, Cassandra              |
| VectorDB     | Qdrant, Weaviate, Milvus               |
| Time-Series  | InfluxDB, TimescaleDB                  |
| Search       | Meilisearch, Typesense, Elasticsearch  |
| Graph        | Neo4j, ArangoDB                        |
| Embedded     | SQLite, DuckDB                         |

> Hayai supports the free/open editions of each engine. Enterprise editions are not bundled.

---

## 🔧 Getting Started

### 1. Install and Initialize

```bash
npx hayai init
```

Answer a few simple questions:

- Choose your DB engine (e.g. PostgreSQL, MongoDB, Qdrant)
- Name your instance
- Select persistence and port mode
- Enable admin dashboard (optional)
- Generate client code (optional)

### 2. Start Your Databases
```bash
hayai start
```
This will start all configured databases via Docker Compose.

### 3. Use the Environment
Check the generated `.env`:

```env
AUTH_DB_URL=postgres://admin:admin@localhost:5433/db
VECTOR_DB_URL=http://localhost:6333
```

Import the optional client SDK:

```ts
import { authDb } from './client/auth-db.ts'
```

## 🔎 Useful Commands

```bash
hayai list           # List running instances
hayai logs <name>    # View logs from a DB
hayai remove <name>  # Remove DB + volume + env entry
hayai stop           # Stop all DBs
hayai snapshot <db>  # Save current DB state
hayai studio         # Launch admin dashboards
```

## 📁 Project Structure

```
hayai/
├── cli/                  # CLI interface
├── templates/            # DB configuration templates
├── core/                 # Engine logic
├── api/                  # Optional REST interface
├── dashboard/            # Optional visual interface
├── hayai.config.yaml     # Global config file
├── docker-compose.yml    # Auto-generated services
└── .env                  # Auto-generated connection URIs
```

## 👤 Who It's For

- Backend developers who need fast DBs
- Full-stack devs integrating multiple data sources
- AI/LLM engineers experimenting with vector stores
- API designers using SQL/NoSQL combos
- DevOps creating local environments
- Educators teaching DBs and system architecture

## 🚫 What Hayai Doesn't Do

- Define or manage schema
- Generate backend APIs
- Replace your logic or framework
- Deploy to production cloud environments (yet)

## 📄 License

MIT License © 2025 hitoshyamamoto  
See LICENSE for details.

## 🙌 Contribute

Want to add support for a new database? Improve the CLI?  
Check out CONTRIBUTING.md and help make Hayai even better.
