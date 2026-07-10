// src/constants/index.js
module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
  },

  // Cache TTLs (in seconds)
  CACHE_TTL: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
    WEEK: 604800, // 7 days
  },

  // Rate Limit Settings
  RATE_LIMIT: {
    WINDOW: 10 * 60 * 1000, // 10 minutes
    MAX: 100, // 100 requests
    BURST_WINDOW: 60 * 1000, // 1 minute
    BURST_MAX: 150, // 150 requests in burst window
  },

  // URL Settings
  URL: {
    SHORT_CODE_LENGTH: 7,
    MAX_ORIGINAL_LENGTH: 2048,
    BASE62_CHARSET: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  },

  // MongoDB Collection Names
  COLLECTIONS: {
    URLS: 'urls',
    USERS: 'users',
    ANALYTICS: 'analytics',
  },

  // Redis Key Prefixes
  REDIS_KEYS: {
    URL_BY_CODE: (code) => `url:code:${code}`,
    URL_BY_ORIGINAL: (hash) => `url:original:${hash}`,
    URL_STATS: (code) => `url:stats:${code}`,
    URL_LIST: (page, limit) => `url:list:${page}:${limit}`,
    URL_COUNT: 'url:count',
    RATE_LIMIT: (identifier) => `rate-limit:${identifier}`,
    SESSION: (id) => `session:${id}`,
  },

  // Error Messages
  ERRORS: {
    URL_NOT_FOUND: 'Short URL not found',
    URL_EXPIRED: 'Short URL has expired',
    URL_INACTIVE: 'Short URL is inactive',
    INVALID_URL: 'Invalid URL format',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden access',
    INTERNAL_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
  },

  // Success Messages
  SUCCESS: {
    URL_CREATED: 'Short URL created successfully',
    URL_DELETED: 'Short URL deleted successfully',
    URL_UPDATED: 'Short URL updated successfully',
  },

  // Environment
  ENV: {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
    TEST: 'test',
  },

  // Regular Expressions
  REGEX: {
    URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    SHORT_CODE: /^[a-zA-Z0-9_-]+$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  },
};