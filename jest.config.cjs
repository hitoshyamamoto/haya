/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
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
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
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
    '!node_modules/**/*',
  ],
  
  coverageDirectory: 'coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
  ],
  
  // Test timeouts
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ],
  
  // Verbose output for CI
  verbose: process.env.CI === 'true',
  
  // Reporter configuration
  reporters: ['default'],
  
  // Bail configuration for CI
  bail: process.env.CI === 'true' ? 1 : false,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Collect coverage only when explicitly requested
  collectCoverage: process.env.COLLECT_COVERAGE === 'true',
  
  // Adjusted coverage thresholds for gradual testing adoption
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
    // Specific thresholds for well-tested modules
    './src/core/templates.ts': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
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
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|inquirer|commander)/)',
  ],
  
  // Additional Jest options for TypeScript
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
}; 