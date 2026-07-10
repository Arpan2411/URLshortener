// src/config/env.js
const { logger } = require('../utils/logger');

/**
 * Validate and load environment variables
 */
const validateEnv = () => {
  const required = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'REDIS_HOST',
    'REDIS_PORT',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate numeric values
  const port = parseInt(process.env.PORT, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number between 1 and 65535');
  }

  // Validate environment
  const validEnvs = ['development', 'production', 'test', 'staging'];
  if (!validEnvs.includes(process.env.NODE_ENV)) {
    throw new Error(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
  }

  return true;
};

/**
 * Get environment configuration
 */
const getConfig = () => {
  return {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    isStaging: process.env.NODE_ENV === 'staging',

    // Database
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },

    // Redis
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || '',
      url: process.env.REDIS_URL,
    },

    // Cache
    cache: {
      ttl: parseInt(process.env.CACHE_TTL, 10) || 3600,
      enabled: process.env.CACHE_ENABLED !== 'false',
    },

    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 600000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    },

    // Security
    security: {
      jwtSecret: process.env.JWT_SECRET,
      saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 10,
      corsOrigin: process.env.CORS_ORIGIN?.split(',') || '*',
    },

    // URL Settings
    url: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      shortCodeLength: parseInt(process.env.SHORT_URL_LENGTH, 10) || 7,
      maxOriginalLength: parseInt(process.env.MAX_URL_LENGTH, 10) || 2048,
    },

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      format: process.env.LOG_FORMAT || 'json',
    },
  };
};

/**
 * Log environment configuration (without sensitive data)
 */
const logConfig = () => {
  const config = getConfig();
  const safeConfig = {
    ...config,
    mongodb: {
      ...config.mongodb,
      uri: config.mongodb.uri?.replace(/\/\/[^@]+@/, '//***:***@'), // Hide credentials
    },
    security: {
      ...config.security,
      jwtSecret: config.security.jwtSecret ? '***' : undefined,
    },
    redis: {
      ...config.redis,
      password: config.redis.password ? '***' : undefined,
    },
  };

  logger.info('Environment Configuration loaded', safeConfig);
};

module.exports = {
  validateEnv,
  getConfig,
  logConfig,
};