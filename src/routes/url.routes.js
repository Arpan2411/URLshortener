// src/routes/url.routes.js
const express = require('express');
const router = express.Router();
const urlController = require('../controllers/url.controller');

// Create short URL
router.post('/shorten', urlController.createShortUrl);

// Bulk create short URLs
router.post('/bulk', urlController.bulkCreateUrls);

// Get all URLs with pagination
router.get('/', urlController.getAllUrls);

// Get URL count
router.get('/count', urlController.getUrlCount);

// Redirect to original URL
router.get('/:shortCode', urlController.getOriginalUrl);

// Get URL statistics
router.get('/:shortCode/stats', urlController.getUrlStats);

// Delete a short URL
router.delete('/:shortCode', urlController.deleteUrl);

// Cache management routes (admin only - add auth later)
router.get('/cache/stats', urlController.getCacheStats);
router.delete('/cache/clear', urlController.clearCache);

module.exports = router;