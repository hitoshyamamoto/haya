/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  
  // Simple test pattern - just look for .test.ts files
  testMatch: ['**/*.test.ts'],
  
  // TypeScript transformation
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
  
  // ES modules support
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // No coverage by default - keep it simple
  collectCoverage: false,
  
  // Basic settings
  testTimeout: 30000,
  clearMocks: true,
  forceExit: true,
}; 