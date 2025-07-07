const crypto = require('crypto');
const { getRedisClient, isRedisAvailable } = require('./redisConfig');

// Cache TTL (Time To Live) configurations in seconds
const CACHE_TTL = {
  FULL_SUMMARY: 24 * 60 * 60,        // 24 hours for complete summaries
  PARTIAL_SUMMARY: 12 * 60 * 60,     // 12 hours for partial results
  CHUNK_SUMMARY: 7 * 24 * 60 * 60,   // 7 days for text chunks (reusable)
  CATEGORY_TEMPLATE: 30 * 24 * 60 * 60, // 30 days for category templates
  USER_RECENT: 7 * 24 * 60 * 60      // 7 days for user's recent summaries
};

// Generate unique hash for content
const generateContentHash = (content, options = {}) => {
  try {
    // Normalize content for consistent hashing
    const normalizedContent = content
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
    
    // Include options in hash if provided (e.g., summary type, language)
    const hashInput = normalizedContent + JSON.stringify(options);
    
    // Generate MD5 hash (fast and sufficient for caching)
    const hash = crypto
      .createHash('md5')
      .update(hashInput, 'utf8')
      .digest('hex');
      
    return hash;
    
  } catch (error) {
    // Error generating content hash
    return null;
  }
};

// Generate cache key with proper namespace
const generateCacheKey = (type, identifier, options = {}) => {
  const namespace = 'casecrux';
  const version = 'v1'; // For cache invalidation when algorithm changes
  
  let key = `${namespace}:${version}:${type}:${identifier}`;
  
  // Add options to key if provided
  if (Object.keys(options).length > 0) {
    const optionsStr = Object.entries(options)
      .sort() // Ensure consistent key generation
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    key += `:${crypto.createHash('md5').update(optionsStr).digest('hex').substring(0, 8)}`;
  }
  
  return key;
};

// Get data from cache
const getFromCache = async (cacheKey) => {
  if (!isRedisAvailable()) {
    // Redis not available - cache miss
    return null;
  }
  
  try {
    const client = getRedisClient();
    const startTime = Date.now();
    
    const cachedData = await client.get(cacheKey);
    const duration = Date.now() - startTime;
    
    if (cachedData) {
      return JSON.parse(cachedData);
    } else {
      return null;
    }
    
  } catch (error) {
    // Cache read error
    return null;
  }
};

// Set data in cache with TTL
const setInCache = async (cacheKey, data, ttlSeconds = CACHE_TTL.FULL_SUMMARY) => {
  if (!isRedisAvailable()) {
    // Redis not available - skipping cache set
    return false;
  }
  
  try {
    const client = getRedisClient();
    const startTime = Date.now();
    
    // Store data with expiration
    const serializedData = JSON.stringify(data);
    await client.setEx(cacheKey, ttlSeconds, serializedData);
    
    const duration = Date.now() - startTime;
    const sizeKB = (serializedData.length / 1024).toFixed(2);
    
    return true;
    
  } catch (error) {
    // Cache write error
    return false;
  }
};

// Delete from cache
const deleteFromCache = async (cacheKey) => {
  if (!isRedisAvailable()) {
    return false;
  }
  
  try {
    const client = getRedisClient();
    const result = await client.del(cacheKey);
    return result > 0;
    
  } catch (error) {
    // Cache delete error
    return false;
  }
};

// Cache statistics
const getCacheStats = async () => {
  if (!isRedisAvailable()) {
    return { available: false };
  }
  
  try {
    const client = getRedisClient();
    const info = await client.info('memory');
    const keyCount = await client.dbSize();
    
    return {
      available: true,
      keyCount,
      memoryInfo: info,
      connected: client.isReady
    };
    
  } catch (error) {
    // Error getting cache stats
    return { available: false, error: error.message };
  }
};

// Clear cache by pattern (for development/testing)
const clearCachePattern = async (pattern) => {
  if (!isRedisAvailable()) {
    return 0;
  }
  
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      const result = await client.del(keys);
      return result;
    }
    
    return 0;
    
  } catch (error) {
    // Error clearing cache pattern
    return 0;
  }
};

module.exports = {
  // Core caching functions
  getFromCache,
  setInCache,
  deleteFromCache,
  
  // Utility functions
  generateContentHash,
  generateCacheKey,
  getCacheStats,
  clearCachePattern,
  
  // Constants
  CACHE_TTL
};
