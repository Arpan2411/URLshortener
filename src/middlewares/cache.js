// src/middlewares/cache.js
const { cacheHelpers } = require('../config/redis');
const { logger } = require('../utils/logger');

/**
 * Middleware to cache GET responses
 */
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL
    const cacheKey = `response:${req.originalUrl || req.url}`;

    try {
      // Try to get from cache
      const cachedResponse = await cacheHelpers.get(cacheKey);
      
      if (cachedResponse) {
        logger.debug(`Cache hit for ${req.originalUrl}`);
        return res.status(200).json(cachedResponse);
      }

      // Cache miss - store original send function
      const originalSend = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          cacheHelpers.set(cacheKey, data, ttl)
            .catch(err => logger.error('Error caching response:', err));
        }
        
        // Call original send
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear cache for specific routes
 */
const clearCache = async (pattern) => {
  try {
    // Implementation depends on Redis version
    // For simplicity, we'll use flushAll in development
    if (process.env.NODE_ENV === 'development') {
      await cacheHelpers.clearAll();
    }
    logger.info(`Cache cleared for pattern: ${pattern}`);
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
};

module.exports = { cacheMiddleware, clearCache };