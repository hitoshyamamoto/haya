/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2020',
      },
    }],
  },
  
  // Enable ES modules
  extensionsToTreatAsEsm: ['.ts'],
  
  // Module name mapping for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/tests/**/*',
    '!dist/**/*',
  ],
  
  coverageDirectory: 'coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
  ],
  
  // Test timeouts (can be overridden per test)
  testTimeout: 30000, // Default 30 seconds
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  
  // Test environment options
  testEnvironmentOptions: {
    node: {
      experimental: {
        modules: true,
      },
    },
  },
  
  // Verbose output for CI
  verbose: process.env.CI === 'true',
  
  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/tests/unit/**/*.test.ts'],
      testTimeout: 10000, // 10 seconds for unit tests
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts'],
      testTimeout: 180000, // 3 minutes for integration tests
      globalSetup: '<rootDir>/src/tests/global-setup.ts',
      globalTeardown: '<rootDir>/src/tests/global-teardown.ts',
    },
    {
      displayName: 'cli',
      testMatch: ['<rootDir>/src/tests/cli/**/*.test.ts'],
      testTimeout: 120000, // 2 minutes for CLI tests
      globalSetup: '<rootDir>/src/tests/global-setup.ts',
      globalTeardown: '<rootDir>/src/tests/global-teardown.ts',
    },
    {
      displayName: 'database-specific',
      testMatch: ['<rootDir>/src/tests/database-specific/**/*.test.ts'],
      testTimeout: 180000, // 3 minutes for database tests
      globalSetup: '<rootDir>/src/tests/global-setup.ts',
      globalTeardown: '<rootDir>/src/tests/global-teardown.ts',
    },
  ],
  
  // Reporter configuration
  reporters: ['default'],
  
  // Bail configuration for CI
  bail: process.env.CI === 'true' ? 1 : false,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Collect coverage only in CI or when explicitly requested
  collectCoverage: process.env.CI === 'true' || process.env.COLLECT_COVERAGE === 'true',
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/core/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Error handling
  errorOnDeprecated: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Maximum worker processes
  maxWorkers: process.env.CI === 'true' ? 2 : '50%',
  
  // Notify configuration
  notify: false,
  notifyMode: 'failure-change',
  
  // Watch configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/.git/',
  ],
}; 