// Global setup for integration and database tests
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');
  
  try {
    // Check if Docker is available
    await checkDockerAvailability();
    
    // Clean up any existing test containers
    await cleanupTestContainers();
    
    // Pull required Docker images for faster test execution
    await pullRequiredImages();
    
    // Create test network if it doesn't exist
    await createTestNetwork();
    
    console.log('✅ Test environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
}

async function checkDockerAvailability() {
  try {
    await execAsync('docker --version');
    await execAsync('docker-compose --version');
    
    // Check if Docker daemon is running
    await execAsync('docker info');
    
    console.log('✅ Docker is available and running');
  } catch (error) {
    throw new Error('Docker is not available or not running. Please install Docker and ensure it\'s running.');
  }
}

async function cleanupTestContainers() {
  try {
    // Stop and remove any existing test containers
    const { stdout: containers } = await execAsync('docker ps -a --filter "name=test-" -q');
    if (containers.trim()) {
      await execAsync(`docker rm -f ${containers.trim().split('\n').join(' ')}`);
      console.log('🧹 Cleaned up existing test containers');
    }
    
    // Remove test volumes
    const { stdout: volumes } = await execAsync('docker volume ls --filter "name=test-" -q');
    if (volumes.trim()) {
      await execAsync(`docker volume rm ${volumes.trim().split('\n').join(' ')}`);
      console.log('🧹 Cleaned up existing test volumes');
    }
    
    // Remove test networks (except the one we'll create)
    const { stdout: networks } = await execAsync('docker network ls --filter "name=test-" -q');
    if (networks.trim()) {
      const networkIds = networks.trim().split('\n').filter(id => id !== 'hayai-test-network');
      if (networkIds.length > 0) {
        await execAsync(`docker network rm ${networkIds.join(' ')}`);
        console.log('🧹 Cleaned up existing test networks');
      }
    }
    
  } catch (error) {
    // Non-critical error, just log it
    console.log('⚠️  Some cleanup operations failed (this is usually fine)');
  }
}

async function pullRequiredImages() {
  const images = [
    'postgres:16-alpine',
    'redis:7.0-alpine',
    'mariadb:11',
    'qdrant/qdrant:v1.7.0',
    'getmeili/meilisearch:v1.5',
  ];
  
  console.log('📦 Pulling required Docker images...');
  
  for (const image of images) {
    try {
      await execAsync(`docker pull ${image}`, { timeout: 60000 }); // 60 second timeout per image
      console.log(`✅ Pulled ${image}`);
    } catch (error) {
      console.log(`⚠️  Failed to pull ${image}, will try during test execution`);
    }
  }
}

async function createTestNetwork() {
  try {
    // Check if network already exists
    await execAsync('docker network inspect hayai-test-network');
    console.log('✅ Test network already exists');
  } catch (error) {
    // Network doesn't exist, create it
    try {
      await execAsync('docker network create hayai-test-network');
      console.log('✅ Created test network');
    } catch (createError) {
      console.log('⚠️  Failed to create test network, tests will use default network');
    }
  }
} 