# Hayai Test Suite

Comprehensive testing framework for the Hayai Database Management CLI project.

## Test Structure

```
src/tests/
├── unit/                    # Unit tests (fast, no external dependencies)
├── integration/             # Integration tests (with Docker/databases)
├── cli/                     # CLI command tests
├── database-specific/       # Database-specific functionality tests
└── README.md               # This file
```

## Test Categories

### 🔧 Unit Tests (`src/tests/unit/`)
- **Purpose**: Test individual functions and modules in isolation
- **Speed**: Fast (< 1 second each)
- **Dependencies**: None (no Docker, no external services)
- **Examples**: Template validation, type checking, utility functions

```bash
npm run test:unit
```

### 🔗 Integration Tests (`src/tests/integration/`)
- **Purpose**: Test database creation, connection, and management
- **Speed**: Medium (10-180 seconds each)
- **Dependencies**: Docker, Docker Compose
- **Examples**: Database instance lifecycle, port management, Docker integration

```bash
npm run test:integration
```

### 💻 CLI Tests (`src/tests/cli/`)
- **Purpose**: Test all CLI commands end-to-end
- **Speed**: Medium (30-120 seconds each)
- **Dependencies**: Docker, built CLI
- **Examples**: `hayai init`, `hayai start`, `hayai list`, `hayai remove`

```bash
npm run test:cli
```

### 🗄️ Database-Specific Tests (`src/tests/database-specific/`)
- **Purpose**: Test specific database features and functionality
- **Speed**: Slow (60-180 seconds each)
- **Dependencies**: Docker, specific database images
- **Examples**: SQL operations, PostgreSQL JSON support, Redis commands

```bash
npm run test:database
```

## Running Tests

### Quick Development Testing
```bash
# Run only unit tests (fastest)
npm run test:unit

# Run all tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Full Test Suite
```bash
# Run all test categories sequentially
npm run test:all

# Run specific test file
npm test -- src/tests/unit/templates.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="PostgreSQL"
```

### CI/CD Testing
```bash
# CI optimized run
npm run test:ci

# Test specific database only
npm test -- --testPathPattern="postgresql"
```

## Test Requirements

### System Requirements
- **Node.js**: 18.0.0 or higher
- **Docker**: Latest version
- **Docker Compose**: Latest version
- **Operating System**: Linux, macOS, Windows (unit tests only for Windows)

### Environment Setup
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Ensure Docker is running
docker --version
docker-compose --version
```

### Environment Variables
```bash
# Optional: Set test environment
export NODE_ENV=test

# Optional: Configure test timeouts
export JEST_TIMEOUT=180000
```

## Test Configuration

### Jest Configuration (`jest.config.cjs`)
- **Test Environment**: Node.js
- **Test Match**: `**/*.test.ts`
- **Transform**: TypeScript via ts-jest
- **Coverage**: Enabled for CI
- **Timeouts**: Configurable per test type

### Test Database Naming
All test databases use the naming pattern:
- `test-{purpose}-{timestamp}`
- Example: `test-postgresql-1704067200000`

This ensures:
- ✅ No conflicts with user databases
- ✅ Easy identification for cleanup
- ✅ Automatic cleanup after tests

## Debugging Tests

### Running Individual Tests
```bash
# Run specific test file with debug output
npm test -- --verbose src/tests/integration/database.test.ts

# Run single test case
npm test -- --testNamePattern="should create PostgreSQL database"

# Run with additional logging
DEBUG=* npm test
```

### Docker Debugging
```bash
# Check running containers during tests
docker ps

# Check test container logs
docker logs test-postgresql-12345

# Manual cleanup if needed
docker ps -a --filter "name=test-" -q | xargs docker rm -f
```

### Common Issues

#### Docker Not Available
```bash
# Error: Docker not found
Solution: Install Docker and ensure it's running
docker --version
```

#### Port Conflicts
```bash
# Error: Port already in use
Solution: Tests use auto-allocated ports (5000-6000 range)
# If needed, stop conflicting services
```

#### Test Timeouts
```bash
# Error: Test timeout
Solution: Increase timeout for specific test types
jest.setTimeout(300000); // 5 minutes
```

#### Permission Issues
```bash
# Error: Docker permission denied
Solution: Add user to docker group (Linux)
sudo usermod -aG docker $USER
```

## Test Writing Guidelines

### Unit Test Example
```typescript
import { describe, test, expect } from 'jest';
import { DatabaseTemplates } from '../../core/templates.js';

describe('DatabaseTemplates', () => {
  test('should return PostgreSQL template', () => {
    const template = DatabaseTemplates.getTemplate('postgresql');
    expect(template).toBeDefined();
    expect(template?.name).toBe('PostgreSQL');
  });
});
```

### Integration Test Example
```typescript
import { describe, test, beforeAll, afterAll, expect } from 'jest';
import { createDatabase, removeDatabase } from '../../core/docker.js';

describe('Database Integration', () => {
  const testInstances: string[] = [];

  afterAll(async () => {
    // Cleanup all test instances
    for (const instance of testInstances) {
      await removeDatabase(instance);
    }
  });

  test('should create database instance', async () => {
    const instanceName = `test-example-${Date.now()}`;
    testInstances.push(instanceName);
    
    const instance = await createDatabase(instanceName, template, {});
    expect(instance.name).toBe(instanceName);
  });
});
```

## Performance Benchmarks

### Expected Test Times
| Test Category | Count | Duration | 
|---------------|-------|----------|
| Unit Tests | ~15 | < 10s |
| Integration Tests | ~25 | 5-15 min |
| CLI Tests | ~40 | 10-20 min |
| Database Tests | ~20 | 15-30 min |
| **Total** | **~100** | **30-75 min** |

### Optimization Tips
- Run unit tests first (fastest feedback)
- Use `test:watch` during development
- Parallelize database tests when possible
- Clean up Docker resources regularly

## Continuous Integration

### GitHub Actions Workflow
- **Matrix Testing**: Node.js 18.x and 20.x
- **Platform Testing**: Ubuntu, Windows, macOS
- **Test Categorization**: Parallel execution of test types
- **Database Compatibility**: Individual database testing
- **Cleanup**: Automatic Docker resource cleanup

### Status Checks
All PRs must pass:
- ✅ Unit Tests (both Node versions)
- ✅ Integration Tests (both Node versions)
- ✅ CLI Tests (both Node versions)
- ✅ Database-Specific Tests (both Node versions)
- ✅ Cross-platform compatibility
- ✅ Security audit
- ✅ Linting and type checking

---

For more information about contributing to the test suite, see [CONTRIBUTING.md](../../CONTRIBUTING.md). 