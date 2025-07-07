// Global teardown for integration tests
export default async function globalTeardown() {
  console.log('🧹 Cleaning up global test environment...');
  
  // Cleanup tasks can be added here
  // For now, just log that teardown is complete
  console.log('✅ Global test environment cleaned up');
} 