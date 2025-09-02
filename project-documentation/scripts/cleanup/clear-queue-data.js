/**
 * Clear Queue Data Script for CRM Backend
 * Removes all case-related queue jobs and Redis cache data
 */

const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Initialize Redis client
const redis = new Redis(redisConfig);

// Queue names to clear
const queueNames = [
  'background-sync',
  'notifications',
  'file-processing',
  'geolocation'
];

/**
 * Clear all jobs from a specific queue
 */
async function clearQueue(queueName) {
  console.log(`🧹 Clearing queue: ${queueName}...`);
  
  try {
    const queue = new Queue(queueName, { connection: redisConfig });
    
    // Clear all jobs
    await queue.obliterate({ force: true });
    
    console.log(`✅ Cleared queue: ${queueName}`);
    await queue.close();
  } catch (error) {
    console.error(`❌ Error clearing queue ${queueName}:`, error.message);
  }
}

/**
 * Clear all queues
 */
async function clearAllQueues() {
  console.log('🧹 Clearing all job queues...');
  
  try {
    for (const queueName of queueNames) {
      await clearQueue(queueName);
    }
    
    console.log('✅ All queues cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing queues:', error);
  }
}

/**
 * Clear Redis cache data
 */
async function clearRedisCache() {
  console.log('🧹 Clearing Redis cache...');
  
  try {
    // Get all keys
    const keys = await redis.keys('*');
    
    if (keys.length > 0) {
      // Filter case-related keys
      const caseKeys = keys.filter(key => 
        key.includes('case') ||
        key.includes('verification') ||
        key.includes('mobile') ||
        key.includes('sync') ||
        key.includes('notification') ||
        key.includes('file') ||
        key.includes('geolocation') ||
        key.startsWith('bull:') ||
        key.startsWith('queue:')
      );
      
      if (caseKeys.length > 0) {
        await redis.del(...caseKeys);
        console.log(`🗑️ Removed ${caseKeys.length} case-related keys from Redis`);
      }
      
      // Clear all Redis data (optional - uncomment if needed)
      // await redis.flushall();
      // console.log('🗑️ Cleared all Redis data');
      
      console.log('✅ Redis cache cleared');
    } else {
      console.log('ℹ️ No keys found in Redis cache');
    }
  } catch (error) {
    console.error('❌ Error clearing Redis cache:', error.message);
  }
}

/**
 * Clear session data
 */
async function clearSessionData() {
  console.log('🧹 Clearing session data...');
  
  try {
    // Clear session-related keys
    const sessionKeys = await redis.keys('sess:*');
    if (sessionKeys.length > 0) {
      await redis.del(...sessionKeys);
      console.log(`🗑️ Removed ${sessionKeys.length} session keys`);
    }
    
    console.log('✅ Session data cleared');
  } catch (error) {
    console.error('❌ Error clearing session data:', error.message);
  }
}

/**
 * Clear background job data
 */
async function clearBackgroundJobs() {
  console.log('🧹 Clearing background job data...');
  
  try {
    // Clear job-related keys
    const jobKeys = await redis.keys('*job*');
    if (jobKeys.length > 0) {
      await redis.del(...jobKeys);
      console.log(`🗑️ Removed ${jobKeys.length} job-related keys`);
    }
    
    console.log('✅ Background job data cleared');
  } catch (error) {
    console.error('❌ Error clearing background job data:', error.message);
  }
}

/**
 * Clear WebSocket connection data
 */
async function clearWebSocketData() {
  console.log('🧹 Clearing WebSocket data...');
  
  try {
    // Clear WebSocket-related keys
    const wsKeys = await redis.keys('*ws*');
    const socketKeys = await redis.keys('*socket*');
    const allWsKeys = [...wsKeys, ...socketKeys];
    
    if (allWsKeys.length > 0) {
      await redis.del(...allWsKeys);
      console.log(`🗑️ Removed ${allWsKeys.length} WebSocket-related keys`);
    }
    
    console.log('✅ WebSocket data cleared');
  } catch (error) {
    console.error('❌ Error clearing WebSocket data:', error.message);
  }
}

/**
 * Main cleanup function
 */
async function clearAllQueueData() {
  console.log('🚀 Starting queue and cache cleanup...');
  console.log('================================================');
  
  try {
    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connection established');
    
    // Clear all data types
    await clearAllQueues();
    await clearRedisCache();
    await clearSessionData();
    await clearBackgroundJobs();
    await clearWebSocketData();
    
    console.log('================================================');
    console.log('🎉 Queue and cache cleanup completed successfully!');
    console.log('\n🔄 Queue data cleared:');
    console.log('   ✅ Background sync queue');
    console.log('   ✅ Notification queue');
    console.log('   ✅ File processing queue');
    console.log('   ✅ Geolocation queue');
    console.log('   ✅ Redis cache');
    console.log('   ✅ Session data');
    console.log('   ✅ Background jobs');
    console.log('   ✅ WebSocket data');
    
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Restart any queue workers');
    console.log('   3. Clear mobile app and frontend storage');
    console.log('   4. Verify no old queue jobs are processing');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('ℹ️ Redis server not running - queue cleanup skipped');
      console.log('   If Redis is used, start Redis server and run this script again');
    } else {
      console.error('💥 Queue cleanup failed:', error.message);
      process.exit(1);
    }
  } finally {
    await redis.quit();
  }
}

// Run the script immediately
clearAllQueueData();
