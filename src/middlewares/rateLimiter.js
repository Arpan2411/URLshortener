// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient, isRedisAvailable } = require('../config/redis');
const { logger } = require('../utils/logger');

/**
 * Create a rate limiter with Redis store
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 10 * 60 * 1000, // 10 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = (req) => {
      return ipKeyGenerator(req);
    },
    skipSuccessfulRequests = false,
    standardHeaders = true,
    legacyHeaders = false,
    skip = (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  } = options;

  // Configure Redis store if Redis is available
  let store = null;
  
  if (isRedisAvailable()) {
    try {
      const client = getRedisClient();
      if (client) {
        store = new RedisStore({
          sendCommand: (...args) => client.sendCommand(args),
          prefix: 'rate-limit:',
        });
        logger.info('Rate limiter using Redis store');
      }
    } catch (error) {
      logger.warn('Failed to create Redis store for rate limiter:', error.message);
    }
  }

//   testing 
    logger.info(`Redis available: ${isRedisAvailable()}`);

  // Fallback to memory store if Redis is not available
  if (!store) {
    logger.warn('Rate limiter using memory store (not suitable for production)');
  }

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    statusCode,
    keyGenerator,
    skipSuccessfulRequests,
    standardHeaders,
    legacyHeaders,
    skip,
    store,
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).json({
        success: false,
        message: options.message.message,
        retryAfter: options.message.retryAfter,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per 5 minutes
  message: 'Too many requests to this endpoint. Please slow down.',
});

/**
 * Standard rate limiter for general endpoints
 */
const standardRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes
  message: 'Too many requests. Please try again in 10 minutes.',
});

/**
 * Liberal rate limiter for read-only endpoints
 */
const liberalRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200, // 200 requests per 10 minutes
  message: 'Too many requests. Please try again later.',
});

/**
 * Very strict rate limiter for auth/bulk operations
 */
const veryStrictRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Operation limit exceeded. Please try again in an hour.',
});

/**
 * Custom rate limiter with dynamic limits based on user role
 */
const createDynamicRateLimiter = (getMaxRequests) => {
  return createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: (req) => {
      // Dynamic limit based on user role or other factors
      const maxRequests = getMaxRequests(req);
      return maxRequests;
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip || req.connection.remoteAddress;
    },
  });
};

/**
 * Skip rate limiting for specific IPs (whitelist)
 */
const whitelistRateLimiter = (whitelistedIPs = []) => {
  return createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 1000, // Higher limit for whitelisted IPs
    skip: (req) => {
      const ip = req.ip || req.connection.remoteAddress;
      return whitelistedIPs.includes(ip) || req.path === '/health';
    },
  });
};

/**
 * Rate limiter with custom headers for API clients
 */
const apiRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: true,
  message: 'API rate limit exceeded. Please check your rate limits.',
});

/**
 * Get rate limit status for a client
 */
const getRateLimitStatus = async (req) => {
  try {
    const key = `rate-limit:${req.ip}`;
    const client = getRedisClient();
    
    if (!client || !isRedisAvailable()) {
      return {
        available: true,
        limit: 100,
        remaining: 100,
        reset: new Date(Date.now() + 10 * 60 * 1000),
      };
    }

    const [count, ttl] = await Promise.all([
      client.get(key),
      client.ttl(key),
    ]);

    const current = parseInt(count, 10) || 0;
    const limit = 100; // Default limit
    const remaining = Math.max(0, limit - current);

    return {
      available: remaining > 0,
      limit,
      remaining,
      reset: new Date(Date.now() + (ttl > 0 ? ttl * 1000 : 10 * 60 * 1000)),
    };
  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    return null;
  }
};

module.exports = {
  createRateLimiter,
  strictRateLimiter,
  standardRateLimiter,
  liberalRateLimiter,
  veryStrictRateLimiter,
  createDynamicRateLimiter,
  whitelistRateLimiter,
  apiRateLimiter,
  getRateLimitStatus,
};