// Global test setup
import { jest } from '@jest/globals';

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.CI = 'true';

// Set test timeout globally
jest.setTimeout(30000);

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidConnectionUri(): R;
      toBeValidPort(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidConnectionUri(received: string) {
    const validProtocols = [
      'postgresql://',
      'mysql://',
      'redis://',
      'sqlite:///',
      'duckdb:///',
      'http://',
      'https://',
    ];
    
    const isValid = validProtocols.some(protocol => received.startsWith(protocol));
    
    return {
      message: () => 
        `expected ${received} to ${isValid ? 'not ' : ''}be a valid connection URI`,
      pass: isValid,
    };
  },
  
  toBeValidPort(received: number) {
    const isValid = Number.isInteger(received) && received >= 1024 && received <= 65535;
    
    return {
      message: () => 
        `expected ${received} to ${isValid ? 'not ' : ''}be a valid port number (1024-65535)`,
      pass: isValid,
    };
  },
});

// Suppress console.log during tests unless DEBUG is set
if (!process.env.DEBUG) {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.log = (...args: any[]) => {
    // Only show logs that contain 'test' or are errors
    if (args.some(arg => String(arg).includes('test')) || process.env.VERBOSE_TESTS) {
      originalConsoleLog(...args);
    }
  };
  
  console.warn = (...args: any[]) => {
    if (process.env.VERBOSE_TESTS) {
      originalConsoleWarn(...args);
    }
  };
  
  console.error = (...args: any[]) => {
    // Always show errors
    originalConsoleError(...args);
  };
}

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce logging during tests 