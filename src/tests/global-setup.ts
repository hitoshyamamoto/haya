// Global setup for integration tests
export default async function globalSetup() {
  console.log('🧪 Setting up global test environment...');
  
  // Set environment variables
  process.env.NODE_ENV = 'test';
  process.env.DOCKER_HOST = process.env.DOCKER_HOST || 'unix:///var/run/docker.sock';
  
  // Additional setup can be added here
  console.log('✅ Global test environment ready');
} 