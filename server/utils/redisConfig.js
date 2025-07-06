const redis = require('redis');

// Redis configuration
const REDIS_CONFIG = {
  // For local development (Redis running locally)
  local: {
    host: 'localhost',
    port: 6379,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  
  // For production (Redis Cloud or other hosted Redis)
  production: {
    url: process.env.REDIS_URL, // Set this in production environment
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  }
};

// Create Redis client with error handling
let redisClient = null;

const createRedisClient = () => {
  try {
    // Determine configuration based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const config = isProduction ? REDIS_CONFIG.production : REDIS_CONFIG.local;
    
    console.log('🔄 Initializing Redis client...');
    console.log('📍 Environment:', isProduction ? 'production' : 'development');
    
    // Create client with appropriate config
    if (isProduction && process.env.REDIS_URL) {
      redisClient = redis.createClient({ url: process.env.REDIS_URL });
      console.log('🌐 Using production Redis URL');
    } else {
      redisClient = redis.createClient({
        socket: {
          host: config.local?.host || 'localhost',
          port: config.local?.port || 6379
        }
      });
      console.log('🏠 Using local Redis at localhost:6379');
    }
    
    // Event handlers
    redisClient.on('connect', () => {
      console.log('✅ Redis client connected successfully');
    });
    
    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis client error:', err.message);
      console.warn('📝 Application will continue without caching');
    });
    
    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting...');
    });
    
    return redisClient;
    
  } catch (error) {
    console.warn('❌ Failed to initialize Redis:', error.message);
    console.warn('📝 Application will continue without caching');
    return null;
  }
};

// Initialize Redis client
const initializeRedis = async () => {
  try {
    if (!redisClient) {
      redisClient = createRedisClient();
    }
    
    if (redisClient) {
      await redisClient.connect();
      console.log('🚀 Redis initialization completed');
      return redisClient;
    }
  } catch (error) {
    console.warn('❌ Redis connection failed:', error.message);
    console.warn('📝 Continuing without cache - all requests will hit ML service');
    return null;
  }
};

// Get Redis client instance
const getRedisClient = () => {
  return redisClient;
};

// Check if Redis is available
const isRedisAvailable = () => {
  return redisClient && redisClient.isReady;
};

// Graceful shutdown
const closeRedisConnection = async () => {
  if (redisClient && redisClient.isReady) {
    console.log('🔄 Closing Redis connection...');
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  }
};

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisAvailable,
  closeRedisConnection
};
