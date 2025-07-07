# Contributing to Hayai v0.4.1

Welcome to Hayai! We're building the fastest way to manage local databases with Docker.

## 📦 Database Categories (v0.4.1)

Hayai uses **8 technical categories** based on query interface, not deployment method:

- **SQL (4):** postgresql, mariadb, sqlite, duckdb
- **Embedded (1):** leveldb  
- **Key-Value (1):** redis
- **Wide Column (1):** cassandra
- **Vector (3):** qdrant, weaviate, milvus
- **Graph (1):** arangodb
- **Search (2):** meilisearch, typesense
- **Time Series (6):** influxdb2, influxdb3, timescaledb, questdb, victoriametrics, horaedb

### Adding New Database Support

When adding a new database:
1. Categorize by **query interface** (SQL, Graph, etc.) not deployment
2. Update `src/core/templates.ts` with the new template
3. Update `src/core/types.ts` if new category needed
4. Update README.md and CLI help text
5. Add tests for the new database template

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries
- **ci**: Changes to CI configuration files and scripts
- **revert**: Reverts a previous commit

### Examples

```bash
feat: add support for ArangoDB database
fix: resolve port allocation conflict in docker manager
docs: update README with installation instructions
chore: update dependencies to latest versions
refactor: simplify database template structure
test: add unit tests for port manager
ci: setup GitHub Actions workflow
perf: optimize docker container startup time
style: format code with prettier
revert: revert commit abc123
```

### Rules

1. Use imperative mood in the subject line
2. Do not capitalize the first letter
3. Do not end the subject line with a period
4. Keep the subject line under 50 characters
5. Use the body to explain what and why vs. how
6. Separate subject from body with a blank line

### Scopes (optional)

When applicable, you can add a scope to provide additional context:

```bash
feat(cli): add new --format option to list command
fix(docker): resolve container networking issue
docs(readme): update installation section
```

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`
5. Check linting: `npm run lint`

## Pull Request Process

1. Follow the commit message guidelines
2. Update documentation if needed
3. Add tests for new features
4. Ensure all tests pass
5. Update the README.md if needed

## Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful variable and function names
- Add JSDoc comments for public APIs 