// src/controllers/rateLimit.controller.js
const rateLimitMonitor = require('../utils/rateLimitMonitor');
const ApiResponse = require('../utils/response');
const { logger } = require('../utils/logger');

class RateLimitController {
  /**
   * Get rate limit status for current client
   */
  async getStatus(req, res) {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const identifier = `ip:${ip}`;
      
      // Get rate limit info from Redis
      const { cacheHelpers } = require('../config/redis');
      const key = `rate-limit:${identifier}`;
      const current = await cacheHelpers.get(key) || 0;
      const ttl = await cacheHelpers.getTTL(key);
      
      const limit = 100; // Default limit
      const remaining = Math.max(0, limit - current);

      const status = {
        identifier,
        limit,
        current,
        remaining,
        resetIn: ttl > 0 ? ttl : 600,
        resetAt: new Date(Date.now() + (ttl > 0 ? ttl * 1000 : 600000)),
      };

      return ApiResponse.success(res, status, 'Rate limit status retrieved');
    } catch (error) {
      logger.error('Error getting rate limit status:', error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Get rate limit analytics
   */
  async getAnalytics(req, res) {
    try {
      const analytics = await rateLimitMonitor.getAnalytics();
      return ApiResponse.success(res, analytics, 'Rate limit analytics retrieved');
    } catch (error) {
      logger.error('Error getting rate limit analytics:', error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Get recent alerts
   */
  async getAlerts(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 100;
      const alerts = rateLimitMonitor.getAlerts(limit);
      return ApiResponse.success(res, { alerts, count: alerts.length }, 'Alerts retrieved');
    } catch (error) {
      logger.error('Error getting alerts:', error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Clear alerts
   */
  async clearAlerts(req, res) {
    try {
      rateLimitMonitor.clearAlerts();
      return ApiResponse.success(res, null, 'Alerts cleared');
    } catch (error) {
      logger.error('Error clearing alerts:', error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Reset rate limit for specific IP (admin only)
   */
  async resetLimit(req, res) {
    try {
      const { ip } = req.body;
      if (!ip) {
        return ApiResponse.badRequest(res, 'IP address is required');
      }

      const { cacheHelpers } = require('../config/redis');
      const key = `rate-limit:ip:${ip}`;
      await cacheHelpers.delete(key);

      return ApiResponse.success(res, { ip }, 'Rate limit reset successfully');
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
      return ApiResponse.error(res, error.message);
    }
  }
}

module.exports = new RateLimitController();