// src/utils/rateLimitMonitor.js
const { cacheHelpers } = require('../config/redis');
const { logger } = require('./logger');

class RateLimitMonitor {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      warning: 0.7, // 70% of limit
      critical: 0.9, // 90% of limit
    };
  }

  /**
   * Monitor rate limit usage
   */
  async monitorUsage(identifier, limit, current) {
    const usage = current / limit;
    
    if (usage >= this.thresholds.critical) {
      this.triggerAlert('critical', identifier, usage);
    } else if (usage >= this.thresholds.warning) {
      this.triggerAlert('warning', identifier, usage);
    }

    return {
      identifier,
      usage: (usage * 100).toFixed(2),
      level: this.getAlertLevel(usage),
    };
  }

  /**
   * Trigger an alert
   */
  triggerAlert(level, identifier, usage) {
    const alert = {
      level,
      identifier,
      usage: (usage * 100).toFixed(2),
      timestamp: new Date().toISOString(),
    };

    this.alerts.push(alert);
    
    if (level === 'critical') {
      logger.warn(`🔴 CRITICAL: Rate limit usage at ${alert.usage}% for ${identifier}`);
    } else {
      logger.warn(`🟡 WARNING: Rate limit usage at ${alert.usage}% for ${identifier}`);
    }

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  /**
   * Get alert level based on usage
   */
  getAlertLevel(usage) {
    if (usage >= this.thresholds.critical) return 'critical';
    if (usage >= this.thresholds.warning) return 'warning';
    return 'normal';
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 100) {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts = [];
  }

  /**
   * Get rate limit analytics
   */
  async getAnalytics() {
    try {
      // Get all rate limit keys from Redis
      const keys = await cacheHelpers.getKeys('rate-limit:*');
      const analytics = {
        totalKeys: keys.length,
        timestamp: new Date().toISOString(),
        keys: [],
      };

      for (const key of keys) {
        const value = await cacheHelpers.get(key);
        const ttl = await cacheHelpers.getTTL(key);
        
        analytics.keys.push({
          key: key.replace('rate-limit:', ''),
          value: parseInt(value, 10) || 0,
          ttl,
        });
      }

      return analytics;
    } catch (error) {
      logger.error('Error getting rate limit analytics:', error);
      return null;
    }
  }
}

module.exports = new RateLimitMonitor();