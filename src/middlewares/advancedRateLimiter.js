// src/middlewares/advancedRateLimiter.js
const { logger } = require('../utils/logger');
const { cacheHelpers } = require('../config/redis');

/**
 * Advanced rate limiter with sliding window and burst protection
 */
class AdvancedRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 10 * 60 * 1000;
    this.maxRequests = options.maxRequests || 100;
    this.burstLimit = options.burstLimit || 150;
    this.prefix = options.prefix || 'rate-limit:';
    this.enableBurst = options.enableBurst !== false;
    
    // Track recent requests for burst detection
    this.burstWindow = 60 * 1000; // 1 minute
  }

  /**
   * Check if request is allowed
   */
  async isAllowed(identifier) {
    try {
      const key = `${this.prefix}${identifier}`;
      const burstKey = `${this.prefix}burst:${identifier}`;

      // Check if Redis is available
      if (!cacheHelpers.get || !await this.isRedisAvailable()) {
        return this.memoryRateLimit(identifier);
      }

      // Get current request count
      const current = await cacheHelpers.get(key) || 0;
      const burstCount = await cacheHelpers.get(burstKey) || 0;

      // Check burst limit
      if (this.enableBurst && burstCount >= this.burstLimit) {
        logger.warn(`Burst limit exceeded for ${identifier}`);
        return {
          allowed: false,
          reason: 'burst_limit_exceeded',
          retryAfter: Math.ceil(this.burstWindow / 1000),
          limit: this.maxRequests,
          current,
          remaining: 0,
        };
      }

      // Check normal limit
      if (current >= this.maxRequests) {
        const ttl = await cacheHelpers.getTTL(key);
        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          retryAfter: Math.ceil((ttl || this.windowMs) / 1000),
          limit: this.maxRequests,
          current,
          remaining: 0,
        };
      }

      // Increment counters
      await Promise.all([
        cacheHelpers.set(key, current + 1, this.windowMs / 1000),
        cacheHelpers.set(burstKey, burstCount + 1, this.burstWindow / 1000),
      ]);

      return {
        allowed: true,
        limit: this.maxRequests,
        current: current + 1,
        remaining: this.maxRequests - (current + 1),
        retryAfter: 0,
      };
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Fallback to allowing request if Redis fails
      return {
        allowed: true,
        limit: this.maxRequests,
        current: 0,
        remaining: this.maxRequests,
        retryAfter: 0,
        fallback: true,
      };
    }
  }

  /**
   * Memory-based rate limiting fallback
   */
  memoryRateLimit(identifier) {
    // Simple in-memory implementation for development
    if (!this.memoryStore) {
      this.memoryStore = new Map();
    }

    const now = Date.now();
    const record = this.memoryStore.get(identifier) || { count: 0, reset: now + this.windowMs };

    // Reset if window expired
    if (now > record.reset) {
      record.count = 0;
      record.reset = now + this.windowMs;
    }

    // Check if over limit
    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        retryAfter: Math.ceil((record.reset - now) / 1000),
        limit: this.maxRequests,
        current: record.count,
        remaining: 0,
        memoryStore: true,
      };
    }

    // Increment count
    record.count += 1;
    this.memoryStore.set(identifier, record);

    return {
      allowed: true,
      limit: this.maxRequests,
      current: record.count,
      remaining: this.maxRequests - record.count,
      retryAfter: 0,
      memoryStore: true,
    };
  }

  /**
   * Check if Redis is available
   */
  async isRedisAvailable() {
    try {
      const { isRedisAvailable } = require('../config/redis');
      return isRedisAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Get rate limit information
   */
  async getInfo(identifier) {
    try {
      const key = `${this.prefix}${identifier}`;
      const current = await cacheHelpers.get(key) || 0;
      const ttl = await cacheHelpers.getTTL(key);

      return {
        identifier,
        limit: this.maxRequests,
        current,
        remaining: Math.max(0, this.maxRequests - current),
        resetIn: ttl > 0 ? ttl : this.windowMs / 1000,
        resetAt: new Date(Date.now() + (ttl > 0 ? ttl * 1000 : this.windowMs)),
      };
    } catch (error) {
      logger.error('Error getting rate limit info:', error);
      return null;
    }
  }

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier) {
    try {
      const key = `${this.prefix}${identifier}`;
      const burstKey = `${this.prefix}burst:${identifier}`;
      
      await Promise.all([
        cacheHelpers.delete(key),
        cacheHelpers.delete(burstKey),
      ]);
      
      if (this.memoryStore) {
        this.memoryStore.delete(identifier);
      }
      
      return true;
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
      return false;
    }
  }

  /**
   * Middleware for Express
   */
  middleware() {
    return async (req, res, next) => {
      const identifier = this.getIdentifier(req);
      const result = await this.isAllowed(identifier);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
      
      if (result.retryAfter > 0) {
        res.setHeader('Retry-After', result.retryAfter);
      }

      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter,
          limit: result.limit,
          current: result.current,
          timestamp: new Date().toISOString(),
        });
      }

      next();
    };
  }

  /**
   * Get identifier from request
   */
  getIdentifier(req) {
    // Use user ID if authenticated, otherwise IP
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    
    // Use IP address
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               req.headers['x-forwarded-for']?.split(',')[0] || 
               'unknown';
    
    // Clean IPv6 localhost
    const cleanIp = ip.replace('::ffff:', '');
    return `ip:${cleanIp}`;
  }
}

/**
 * Create advanced rate limiter instance
 */
const createAdvancedRateLimiter = (options = {}) => {
  return new AdvancedRateLimiter(options);
};

module.exports = {
  AdvancedRateLimiter,
  createAdvancedRateLimiter,
};