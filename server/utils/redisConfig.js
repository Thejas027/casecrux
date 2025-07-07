const redis = require('redis');

// Enhanced Redis configuration for both local and production
const REDIS_CONFIG = {
  // Connection timeout and retry settings
  connectTimeout: 10000, // 10 seconds
  lazyConnect: true,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create Redis client with enhanced error handling
let redisClient = null;

const createRedisClient = () => {
  try {
    // Determine environment and Redis URL
    const isProduction = process.env.NODE_ENV === 'production';
    const redisUrl = getRedisUrl();
    
    if (!redisUrl) {
      return null;
    }
    
    // Create Redis client with URL and configuration
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: REDIS_CONFIG.connectTimeout,
        lazyConnect: REDIS_CONFIG.lazyConnect,
        reconnectStrategy: REDIS_CONFIG.retryStrategy
      }
    });
    
    // Event handlers with enhanced logging
    redisClient.on('connect', () => {
      // Redis client connected successfully
    });
    
    redisClient.on('ready', () => {
      // Redis client ready for operations
    });
    
    redisClient.on('error', (err) => {
      // Redis client error - Application will continue without caching
    });
    
    redisClient.on('reconnecting', () => {
      // Redis client reconnecting...
    });
    
    redisClient.on('end', () => {
      // Redis connection ended
    });
    
    return redisClient;
    
  } catch (error) {
    // Failed to initialize Redis - Application will continue without caching
    return null;
  }
};

// Get the appropriate Redis URL based on environment
const getRedisUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: use production Redis URL
    const prodUrl = process.env.REDIS_URL_PRODUCTION || process.env.REDIS_URL;
    if (prodUrl) {
      return prodUrl;
    }
  } else {
    // Development: try local Redis first, then fallback to production
    const localUrl = process.env.REDIS_URL_LOCAL;
    const prodUrl = process.env.REDIS_URL_PRODUCTION || process.env.REDIS_URL;
    
    if (localUrl) {
      return localUrl;
    } else if (prodUrl) {
      return prodUrl;
    }
  }
  
  return null;
};

// Initialize Redis client with enhanced error handling
const initializeRedis = async () => {
  try {
    if (!redisClient) {
      redisClient = createRedisClient();
    }
    
    if (!redisClient) {
      return null;
    }
    
    // Test connection with timeout
    const connectionPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), REDIS_CONFIG.connectTimeout);
    });
    
    await Promise.race([connectionPromise, timeoutPromise]);
    
    // Test basic operation
    await redisClient.ping();
    
    return redisClient;
    
  } catch (error) {
    // Redis connection failed - Continuing without cache
    
    // Clean up failed client
    if (redisClient) {
      try {
        await redisClient.disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
      redisClient = null;
    }
    
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

// Graceful shutdown with enhanced error handling
const closeRedisConnection = async () => {
  if (redisClient) {
    try {
      if (redisClient.isReady) {
        await redisClient.quit();
        // Redis connection closed gracefully
      } else {
        await redisClient.disconnect();
        // Redis client disconnected
      }
    } catch (error) {
      // Error closing Redis connection
      // Force disconnect if graceful close fails
      try {
        await redisClient.disconnect();
      } catch (forceError) {
        // Force disconnect also failed
      }
    } finally {
      redisClient = null;
    }
  }
};

// Health check function
const checkRedisHealth = async () => {
  try {
    if (!isRedisAvailable()) {
      return { healthy: false, message: 'Redis client not available' };
    }
    
    const start = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - start;
    
    return { 
      healthy: true, 
      message: 'Redis is healthy',
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return { 
      healthy: false, 
      message: `Redis health check failed: ${error.message}` 
    };
  }
};

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisAvailable,
  closeRedisConnection,
  checkRedisHealth,
  getRedisUrl
};
