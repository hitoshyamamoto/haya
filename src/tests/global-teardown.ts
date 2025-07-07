// Global teardown for integration and database tests
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up all test containers
    await cleanupTestContainers();
    
    // Clean up test volumes
    await cleanupTestVolumes();
    
    // Clean up test networks
    await cleanupTestNetworks();
    
    // Clean up test images (optional, commented out to save time)
    // await cleanupTestImages();
    
    console.log('✅ Test environment cleanup complete');
    
  } catch (error) {
    console.error('⚠️  Some cleanup operations failed:', error);
    // Don't throw error as this shouldn't fail the tests
  }
}

async function cleanupTestContainers() {
  try {
    // Get all test containers (running and stopped)
    const { stdout: containers } = await execAsync('docker ps -a --filter "name=test-" -q');
    
    if (containers.trim()) {
      const containerIds = containers.trim().split('\n').filter(id => id.length > 0);
      
      if (containerIds.length > 0) {
        // Force remove all test containers
        await execAsync(`docker rm -f ${containerIds.join(' ')}`);
        console.log(`🗑️  Removed ${containerIds.length} test containers`);
      }
    } else {
      console.log('✅ No test containers to clean up');
    }
    
  } catch (error) {
    console.log('⚠️  Failed to cleanup test containers:', error);
  }
}

async function cleanupTestVolumes() {
  try {
    // Get all test volumes
    const { stdout: volumes } = await execAsync('docker volume ls --filter "name=test-" -q');
    
    if (volumes.trim()) {
      const volumeIds = volumes.trim().split('\n').filter(id => id.length > 0);
      
      if (volumeIds.length > 0) {
        // Remove all test volumes
        await execAsync(`docker volume rm ${volumeIds.join(' ')}`);
        console.log(`🗑️  Removed ${volumeIds.length} test volumes`);
      }
    } else {
      console.log('✅ No test volumes to clean up');
    }
    
  } catch (error) {
    console.log('⚠️  Failed to cleanup test volumes:', error);
  }
}

async function cleanupTestNetworks() {
  try {
    // Get all test networks
    const { stdout: networks } = await execAsync('docker network ls --filter "name=test-" -q');
    
    if (networks.trim()) {
      const networkIds = networks.trim().split('\n').filter(id => id.length > 0);
      
      if (networkIds.length > 0) {
        // Remove all test networks
        await execAsync(`docker network rm ${networkIds.join(' ')}`);
        console.log(`🗑️  Removed ${networkIds.length} test networks`);
      }
    } else {
      console.log('✅ No test networks to clean up');
    }
    
  } catch (error) {
    console.log('⚠️  Failed to cleanup test networks:', error);
  }
}

async function cleanupTestImages() {
  try {
    // Get all dangling images (optional cleanup)
    const { stdout: danglingImages } = await execAsync('docker images -f "dangling=true" -q');
    
    if (danglingImages.trim()) {
      const imageIds = danglingImages.trim().split('\n').filter(id => id.length > 0);
      
      if (imageIds.length > 0) {
        await execAsync(`docker rmi ${imageIds.join(' ')}`);
        console.log(`🗑️  Removed ${imageIds.length} dangling images`);
      }
    }
    
    // Prune unused images, networks, and volumes
    await execAsync('docker system prune -f');
    console.log('🧹 Performed Docker system cleanup');
    
  } catch (error) {
    console.log('⚠️  Failed to cleanup Docker images:', error);
  }
}

// Force cleanup on process exit
process.on('exit', () => {
  console.log('🔄 Process exiting, performing final cleanup...');
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  await globalTeardown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  await globalTeardown();
  process.exit(0);
}); 