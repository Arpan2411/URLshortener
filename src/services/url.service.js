// src/services/url.service.js
const { nanoid } = require('nanoid');
const urlRepository = require('../repositories/url.repository');
const { cacheHelpers } = require('../config/redis');
const { logger } = require('../utils/logger');

class UrlService {
  /**
   * Create a short URL with cache optimization
   */
  async createShortUrl(originalUrl, options = {}) {
    try {
      // Validate URL
      if (!this.isValidUrl(originalUrl)) {
        throw new Error('Invalid URL format');
      }

      // Normalize URL
      const normalizedUrl = this.normalizeUrl(originalUrl);

      // Step 1: Check cache for existing URL
      logger.debug(`Checking cache for URL: ${normalizedUrl}`);
      const cachedUrl = await this.checkCacheForOriginalUrl(normalizedUrl);
      
      if (cachedUrl) {
        logger.info(`URL found in cache: ${normalizedUrl} -> ${cachedUrl.shortCode}`);
        return {
          shortCode: cachedUrl.shortCode,
          shortUrl: cachedUrl.shortUrl,
          originalUrl: cachedUrl.originalUrl,
          isExisting: true,
          clicks: cachedUrl.clicks,
          createdAt: cachedUrl.createdAt,
          fromCache: true,
        };
      }

      // Step 2: Check database if not in cache
      logger.debug(`Cache miss for URL: ${normalizedUrl}, checking DB`);
      const existingUrl = await urlRepository.findByOriginalUrl(normalizedUrl);
      
      if (existingUrl) {
        logger.info(`URL found in DB: ${normalizedUrl} -> ${existingUrl.shortCode}`);
        // Ensure it's cached for future requests
        await urlRepository.cacheUrl(existingUrl);
        
        return {
          shortCode: existingUrl.shortCode,
          shortUrl: existingUrl.shortUrl,
          originalUrl: existingUrl.originalUrl,
          isExisting: true,
          clicks: existingUrl.clicks,
          createdAt: existingUrl.createdAt,
          fromCache: false,
        };
      }

      // Step 3: Generate new short code
      logger.debug(`Creating new short URL for: ${normalizedUrl}`);
      let shortCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        shortCode = this.generateShortCode();
        const exists = await urlRepository.exists(shortCode);
        if (!exists) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique short code after multiple attempts');
      }

      // Step 4: Save to database
      const urlData = {
        originalUrl: normalizedUrl,
        shortCode,
        clicks: 0,
        ...options,
      };

      const savedUrl = await urlRepository.create(urlData);
      
      // Step 5: Ensure it's cached (already cached by repository)
      logger.info(`New short URL created: ${normalizedUrl} -> ${shortCode}`);
      
      return {
        shortCode: savedUrl.shortCode,
        shortUrl: savedUrl.shortUrl,
        originalUrl: savedUrl.originalUrl,
        isExisting: false,
        clicks: savedUrl.clicks,
        createdAt: savedUrl.createdAt,
        fromCache: false,
      };
    } catch (error) {
      logger.error('Error creating short URL:', error);
      throw error;
    }
  }

  /**
   * Check cache for original URL
   */
  async checkCacheForOriginalUrl(originalUrl) {
    try {
      const urlHash = this.hashUrl(originalUrl);
      const cacheKey = `url:original:${urlHash}`;
      return await cacheHelpers.get(cacheKey);
    } catch (error) {
      logger.error('Error checking cache for original URL:', error);
      return null;
    }
  }

  /**
   * Hash URL for cache key
   */
  hashUrl(url) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 16);
  }

  /**
   * Get original URL from short code (Cache First)
   */
  async getOriginalUrl(shortCode) {
    try {
      // Step 1: Check cache
      logger.debug(`Looking up shortCode in cache: ${shortCode}`);
      const cachedUrl = await this.checkCacheForShortCode(shortCode);
      
      if (cachedUrl) {
        logger.info(`URL found in cache: ${shortCode}`);
        // Increment clicks in background
        this.incrementClicksAsync(shortCode);
        
        return {
          originalUrl: cachedUrl.originalUrl,
          shortCode: cachedUrl.shortCode,
          clicks: cachedUrl.clicks + 1,
          createdAt: cachedUrl.createdAt,
          lastAccessedAt: cachedUrl.lastAccessedAt,
          fromCache: true,
        };
      }

      // Step 2: Check database
      logger.debug(`Cache miss for ${shortCode}, checking DB`);
      const url = await urlRepository.findByShortCode(shortCode);
      if (!url) {
        throw new Error('Short URL not found');
      }

      // Step 3: Cache for future requests
      await urlRepository.cacheUrl(url);

      // Step 4: Increment clicks
      this.incrementClicksAsync(shortCode);

      return {
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        clicks: url.clicks + 1,
        createdAt: url.createdAt,
        lastAccessedAt: url.lastAccessedAt,
        fromCache: false,
      };
    } catch (error) {
      logger.error('Error getting original URL:', error);
      throw error;
    }
  }

  /**
   * Check cache for short code
   */
  async checkCacheForShortCode(shortCode) {
    try {
      const cacheKey = `url:code:${shortCode}`;
      return await cacheHelpers.get(cacheKey);
    } catch (error) {
      logger.error('Error checking cache for shortCode:', error);
      return null;
    }
  }

  /**
   * Increment clicks asynchronously (don't block response)
   */
  async incrementClicksAsync(shortCode) {
    try {
      await urlRepository.incrementClicks(shortCode);
    } catch (error) {
      logger.error('Error incrementing clicks (async):', error);
    }
  }

  /**
   * Get URL statistics with cache
   */
  async getUrlStats(shortCode) {
    try {
      // Check cache first
      const cachedStats = await cacheHelpers.get(`url:stats:${shortCode}`);
      if (cachedStats) {
        return cachedStats;
      }

      // Get from database
      const url = await urlRepository.getStats(shortCode);
      if (!url) {
        throw new Error('Short URL not found');
      }

      const stats = {
        shortCode: url.shortCode,
        shortUrl: url.shortUrl,
        originalUrl: url.originalUrl,
        clicks: url.clicks,
        createdAt: url.createdAt,
        lastAccessedAt: url.lastAccessedAt,
        isActive: url.isActive,
      };

      // Cache stats
      await cacheHelpers.set(`url:stats:${shortCode}`, stats, 300);

      return stats;
    } catch (error) {
      logger.error('Error getting URL stats:', error);
      throw error;
    }
  }

  /**
   * Delete URL with cache invalidation
   */
  async deleteUrl(shortCode) {
    try {
      const deleted = await urlRepository.deleteByShortCode(shortCode);
      if (!deleted) {
        throw new Error('Short URL not found');
      }
      
      // Cache already invalidated by repository
      return { message: 'URL deleted successfully', shortCode };
    } catch (error) {
      logger.error('Error deleting URL:', error);
      throw error;
    }
  }

  // ... rest of the methods remain the same
  generateShortCode() {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return nanoid(7, alphabet);
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      const hostname = urlObj.hostname.toLowerCase();
      const normalized = `${urlObj.protocol}//${hostname}${pathname}${urlObj.search}`;
      return normalized;
    } catch {
      return url;
    }
  }

  async getAllUrls(page = 1, limit = 10) {
    return await urlRepository.findAll({ page, limit });
  }

  async bulkCreateShortUrls(urls) {
    const results = [];
    for (const url of urls) {
      try {
        const result = await this.createShortUrl(url);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ success: false, originalUrl: url, error: error.message });
      }
    }
    return results;
  }
}

module.exports = new UrlService();