const express = require('express');
const router = express.Router();
const urlController = require('../controllers/url.controller');
const { liberalRateLimiter } = require('../middlewares/rateLimiter');
const homeController = require('../controllers/home.controller');

router.get('/', homeController.getHome);
router.get('/home', homeController.getHome);
router.get('/:shortCode', liberalRateLimiter, urlController.getOriginalUrl);

module.exports = router;