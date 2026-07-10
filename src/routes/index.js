// src/routes/index.js
const express = require('express');
const router = express.Router();
const urlRoutes = require('./url.routes');
const rateLimitRoutes = require('./rateLimit.routes');

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'URL Shortener API is running',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Rate limit routes
router.use('/rate-limit', rateLimitRoutes);

// URL routes
router.use('/urls', urlRoutes);

// Root route
router.get('/', (req, res) => {
    res.json({
        name: 'URL Shortener API',
        version: '1.0.0',
        endpoints: {
            home: '/home',
            health: '/api/health',
            shorten: 'POST /api/urls/shorten',
            redirect: 'GET /api/urls/:shortCode',
            stats: 'GET /api/urls/:shortCode/stats',
            all: 'GET /api/urls',
            bulk: 'POST /api/urls/bulk',
            rateLimit: '/api/rate-limit/status',
        },
    });
});

module.exports = router;