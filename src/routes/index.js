// src/routes/index.js
const express = require('express');
const router = express.Router();
const urlRoutes = require('./url.routes');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'URL Shortener API is running',
    timestamp: new Date().toISOString(),
  });
});

// URL routes
router.use('/urls', urlRoutes);

module.exports = router;