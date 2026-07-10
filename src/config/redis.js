// src/config/redis.js
const redis = require('redis');
const { logger } = require('../utils/logger');

let client = null;
const DEFAULT_CACHE_TTL = 3600; // 1 hour in seconds
let isRedisConnected = false;

const connectRedis = async () => {
  try {
    const redisConfig = {
      socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.warn('Redis max retries reached, stopping reconnection');
            return new Error('Redis max retries reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    };

    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }

    client = redis.createClient(redisConfig);

    // Error handling - don't throw, just log and continue
    client.on('error', (error) => {
      logger.warn('Redis error; continuing without it', error);
      isRedisConnected = false;
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
      isRedisConnected = true;
    });

    client.on('ready', () => {
      logger.info('Redis is ready');
      isRedisConnected = true;
    });

    client.on('end', () => {
      logger.warn('Redis connection ended');
      isRedisConnected = false;
    });

    // Try to connect
    await client.connect();
    isRedisConnected = true;
    return client;
  } catch (error) {
    logger.warn('Redis connection failed; continuing without it', error);
    isRedisConnected = false;
    // Return null instead of throwing - app should work without Redis
    return null;
  }
};

const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
};

const disconnectRedis = async () => {
  try {
    if (client) {
      await client.quit();
      logger.info('Redis disconnected');
    }
  } catch (error) {
    logger.error('Redis disconnection error:', error);
  }
};

const cacheHelpers = {
  /**
   * Get cached data by key
   */
  async get(key) {
    try {
      if (!client) return null;
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set data in cache with TTL
   */
  async set(key, value, ttl = DEFAULT_CACHE_TTL) {
    try {
      if (!client) return false;
      await client.set(key, JSON.stringify(value), {
        EX: ttl,
      });
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete cached data by key
   */
  async delete(key) {
    try {
      if (!client) return false;
      await client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      if (!client) return false;
            return await client.exists(key);
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Get cache TTL for key
   */
  async getTTL(key) {
    try {
      if (!client) return -2;
      return await client.ttl(key);
    } catch (error) {
      logger.error(`Redis TTL error for key ${key}:`, error);
      return -2;
    }
  },

  /**
   * Cache with automatic fallback
   */
  async getOrSet(key, fetchFn, ttl = DEFAULT_CACHE_TTL) {
    try {
      // Try to get from cache
            const cached = await this.get(key);
      if (cached !== null) {
        logger.debug(`Cache hit for key: ${key}`);
        return cached;
      }

      // Cache miss - fetch from source
      logger.debug(`Cache miss for key: ${key}`);
      const data = await fetchFn();
      
      if (data !== null && data !== undefined) {
        // Store in cache
        await this.set(key, data, ttl);
      }
      
      return data;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      // On error, fallback to fetching the data directly
      return await fetchFn();
    }
  },
   /**
   * Clear all cache (use with caution)
   */
  async clearAll() {
    try {
      if (!client) return false;
      await client.flushAll();
      logger.info('All cache cleared');
      return true;
    } catch (error) {
      logger.error('Redis clearAll error:', error);
      return false;
    }
  },

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (!client) return null;
      const info = await client.info('stats');
      return {
        totalConnections: info.total_connections_received,
        totalCommands: info.total_commands_processed,
        keyspaceHits: info.keyspace_hits,
        keyspaceMisses: info.keyspace_misses,
        hitRate: info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses) || 0,
      };
    } catch (error) {
      logger.error('Redis stats error:', error);
      return null;
    }
  }
};

module.exports = { connectRedis, getRedisClient, disconnectRedis, cacheHelpers, DEFAULT_CACHE_TTL };