const redis = require('redis');
const { logger } = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
    });

    client.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    await client.connect();
    logger.info('Redis connected');
    return client;
  } catch (error) {
    logger.error('Redis connection error:', error);
    throw error;
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
    throw error;
  }
};

module.exports = { connectRedis, getRedisClient, disconnectRedis };