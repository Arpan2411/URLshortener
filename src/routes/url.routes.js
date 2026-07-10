// src/routes/url.routes.js
const express = require('express');
const router = express.Router();
const urlController = require('../controllers/url.controller');
const homeController = require('../controllers/home.controller');
const {
  standardRateLimiter,
  strictRateLimiter,
  liberalRateLimiter,
  veryStrictRateLimiter,
  getRateLimitStatus,
} = require('../middlewares/rateLimiter');
const { createAdvancedRateLimiter } = require('../middlewares/advancedRateLimiter');

// Create different rate limiters for different endpoints
const createUrlLimiter = createAdvancedRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 100,
  burstLimit: 150,
  enableBurst: true,
});

const bulkCreateLimiter = createAdvancedRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  burstLimit: 30,
  enableBurst: true,
});

// Route to get rate limit status
router.get('/rate-limit/status', async (req, res) => {
  try {
    const status = await getRateLimitStatus(req);
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting rate limit status',
    });
  }
});

// Apply rate limiting to different endpoints
router.post('/shorten', 
  standardRateLimiter, // 100 requests per 10 minutes
  urlController.createShortUrl
);

router.post('/bulk', 
  veryStrictRateLimiter, // 10 requests per hour
  urlController.bulkCreateUrls
);

router.get('/',
  liberalRateLimiter, // 200 requests per 10 minutes
  urlController.getAllUrls
);

router.get('/count',
  liberalRateLimiter,
  urlController.getUrlCount
);

// Redirect endpoint with higher rate limit (cached)
router.get('/:shortCode',
  (req, res, next) => {
    // Apply stricter rate limit for redirects if needed
    // But we use liberal since it's cached
    return liberalRateLimiter(req, res, next);
  },
  urlController.getOriginalUrl
);

router.get('/:shortCode/stats',
  standardRateLimiter,
  urlController.getUrlStats
);

router.delete('/:shortCode',
  strictRateLimiter, // 30 requests per 5 minutes
  urlController.deleteUrl
);

// Cache management routes (admin only)
router.get('/cache/stats',
  strictRateLimiter,
  urlController.getCacheStats
);

router.delete('/cache/clear',
  veryStrictRateLimiter,
  urlController.clearCache
);

module.exports = router;