const { 
  getFromCache, 
  setInCache, 
  generateContentHash, 
  generateCacheKey,
  CACHE_TTL 
} = require('../utils/cacheHelper');

// Middleware to check cache before ML processing
const cacheMiddleware = (cacheType = 'summary') => {
  return async (req, res, next) => {
    try {
      // Generate cache key based on request content
      const cacheKey = await generateCacheKeyForRequest(req, cacheType);
      
      if (!cacheKey) {
        console.log('⚠️ Could not generate cache key - proceeding without cache');
        return next();
      }
      
      // Try to get from cache
      const cachedResult = await getFromCache(cacheKey);
      
      if (cachedResult) {
        // Cache hit - return cached result
        console.log(`🎯 Cache HIT for ${cacheType} - returning cached result`);
        
        // Add cache metadata to response
        const response = {
          ...cachedResult,
          _cache: {
            hit: true,
            key: cacheKey.substring(0, 32) + '...',
            timestamp: new Date().toISOString()
          }
        };
        
        return res.json(response);
      }
      
      // Cache miss - continue to ML processing
      console.log(`❌ Cache MISS for ${cacheType} - proceeding to ML service`);
      
      // Store cache key in request for later use
      req.cacheKey = cacheKey;
      req.cacheType = cacheType;
      
      next();
      
    } catch (error) {
      console.error('❌ Cache middleware error:', error.message);
      // Continue without cache on error
      next();
    }
  };
};

// Middleware to cache ML response
const cacheResponseMiddleware = () => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = async function(data) {
      try {
        // Cache the response if we have a cache key
        if (req.cacheKey && data && !data.error) {
          console.log(`💾 Caching ML response for ${req.cacheType}`);
          
          // Determine TTL based on cache type
          let ttl = CACHE_TTL.FULL_SUMMARY;
          if (req.cacheType === 'chunk') ttl = CACHE_TTL.CHUNK_SUMMARY;
          if (req.cacheType === 'category') ttl = CACHE_TTL.CATEGORY_TEMPLATE;
          
          // Cache the response
          await setInCache(req.cacheKey, data, ttl);
          
          // Add cache metadata
          data._cache = {
            hit: false,
            key: req.cacheKey.substring(0, 32) + '...',
            timestamp: new Date().toISOString(),
            ttl: ttl
          };
        }
        
        // Call original json method
        originalJson.call(this, data);
        
      } catch (error) {
        console.error('❌ Cache response middleware error:', error.message);
        // Still send response even if caching fails
        originalJson.call(this, data);
      }
    };
    
    next();
  };
};

// Generate cache key for different request types
const generateCacheKeyForRequest = async (req, cacheType) => {
  try {
    let contentToHash = '';
    let options = {};
    
    // Extract content based on request type
    if (req.body) {
      // For text-based requests
      if (req.body.text) {
        contentToHash = req.body.text;
      }
      // For URL-based requests
      else if (req.body.urls && Array.isArray(req.body.urls)) {
        contentToHash = req.body.urls.sort().join('|'); // Sort for consistent hashing
      }
      // For PDF content (if base64 or buffer)
      else if (req.body.content) {
        contentToHash = req.body.content;
      }
      // For file uploads
      else if (req.file) {
        contentToHash = req.file.buffer || req.file.path || '';
      }
      // For category-based requests
      else if (req.body.category) {
        contentToHash = req.body.category;
        options.category = req.body.category;
      }
      // Fallback - hash entire body
      else {
        contentToHash = JSON.stringify(req.body);
      }
      
      // Add request options to cache key
      if (req.body.summary_type) options.summary_type = req.body.summary_type;
      if (req.body.language) options.language = req.body.language;
      if (req.body.max_length) options.max_length = req.body.max_length;
    }
    
    if (!contentToHash) {
      console.log('⚠️ No content found for cache key generation');
      return null;
    }
    
    // Generate content hash
    const contentHash = generateContentHash(contentToHash, options);
    if (!contentHash) return null;
    
    // Generate structured cache key
    const cacheKey = generateCacheKey(cacheType, contentHash, options);
    
    console.log(`🔑 Generated cache key: ${cacheKey}`);
    return cacheKey;
    
  } catch (error) {
    console.error('❌ Error generating cache key for request:', error.message);
    return null;
  }
};

// Cache statistics endpoint
const getCacheStatsHandler = async (req, res) => {
  try {
    const { getCacheStats } = require('../utils/cacheHelper');
    const stats = await getCacheStats();
    
    res.json({
      cache: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache statistics',
      details: error.message
    });
  }
};

// Clear cache endpoint (for development/testing)
const clearCacheHandler = async (req, res) => {
  try {
    const { clearCachePattern } = require('../utils/cacheHelper');
    const pattern = req.query.pattern || 'casecrux:*';
    
    const cleared = await clearCachePattern(pattern);
    
    res.json({
      message: 'Cache cleared successfully',
      pattern,
      keysCleared: cleared,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
};

module.exports = {
  cacheMiddleware,
  cacheResponseMiddleware,
  getCacheStatsHandler,
  clearCacheHandler
};
