// src/routes/rateLimit.routes.js
const express = require('express');
const router = express.Router();
const rateLimitController = require('../controllers/rateLimit.controller');
const { veryStrictRateLimiter } = require('../middlewares/rateLimiter');

// Rate limit management routes (admin only - add auth middleware)
router.get('/status', rateLimitController.getStatus);
router.get('/analytics', veryStrictRateLimiter, rateLimitController.getAnalytics);
router.get('/alerts', veryStrictRateLimiter, rateLimitController.getAlerts);
router.delete('/alerts', veryStrictRateLimiter, rateLimitController.clearAlerts);
router.post('/reset', veryStrictRateLimiter, rateLimitController.resetLimit);

module.exports = router;