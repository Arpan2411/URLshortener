// src/controllers/url.controller.js
const urlService = require('../services/url.service');
const ApiResponse = require('../utils/response');
const { logger } = require('../utils/logger');
const urlValidator = require('../validators/url.validator');

class UrlController {
  /**
   * Create a short URL
   * POST /api/urls/shorten
   */
  async createShortUrl(req, res) {
        try {
      const { error, value } = urlValidator.createUrl.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error.details);
      }

      const { originalUrl } = value;
      const result = await urlService.createShortUrl(originalUrl);

      // Add cache headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      const message = result.isExisting 
        ? result.fromCache 
          ? 'Short URL found in cache' 
          : 'Short URL already exists'
        : 'Short URL created successfully';

      return ApiResponse.success(res, result, message, result.isExisting ? 200 : 201);
    } catch (error) {
      logger.error('Error in createShortUrl controller:', error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Redirect to original URL
   * GET /api/urls/:shortCode
   */
  async getOriginalUrl(req, res) {
        try {
      const { error, value } = urlValidator.getUrl.validate(req.params);
      if (error) {
        return ApiResponse.validationError(res, error.details);
      }

      const { shortCode } = value;
      const result = await urlService.getOriginalUrl(shortCode);

      // Add cache headers for redirect
      res.set({
        'Cache-Control': 'public, max-age=300', // Cache redirect for 5 minutes
        'X-From-Cache': result.fromCache ? 'true' : 'false',
      });

      // Redirect to original URL
      return res.redirect(302, result.originalUrl);
    } catch (error) {
      logger.error('Error in getOriginalUrl controller:', error);
      return ApiResponse.notFound(res, error.message);
    }
  }

  /**
   * Get URL statistics
   * GET /api/urls/:shortCode/stats
   */
  async getUrlStats(req, res) {
        try {
      const { error, value } = urlValidator.getStats.validate(req.params);
      if (error) {
        return ApiResponse.validationError(res, error.details);
      }

      const { shortCode } = value;
      const stats = await urlService.getUrlStats(shortCode);

      // Add cache headers
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Cache-TTL': '300',
      });

      return ApiResponse.success(res, stats, 'URL statistics retrieved successfully');
    } catch (error) {
      logger.error('Error in getUrlStats controller:', error);
      return ApiResponse.notFound(res, error.message);
    }
  }

  /**
   * Get all URLs with pagination
   * GET /api/urls
   */
  async getAllUrls(req, res) {
    try {
      const { error, value } = urlValidator.pagination.validate(req.query);
      if (error) {
        return ApiResponse.validationError(res, error.details);
      }

      const { page, limit } = value;
      const result = await urlService.getAllUrls(page, limit);

      // Add cache headers
      if (page === 1) {
        res.set({
          'Cache-Control': 'public, max-age=60', // 1 minute for first page
          'X-Cache-TTL': '60',
        });
      } else {
        res.set({
          'Cache-Control': 'no-cache',
        });
      }

      return ApiResponse.success(res, result, 'URLs retrieved successfully');
    } catch (error) {
      logger.error('Error in getAllUrls controller:', error);
      return ApiResponse.error(res, error.message);

    }
  }

  /**
   * Get cache statistics
   * GET /api/urls/cache/stats
   */
  async getCacheStats(req, res) {
    try {
      const stats = await cacheHelpers.getStats();
      return ApiResponse.success(res, stats, 'Cache statistics retrieved');
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Clear all cache
   * DELETE /api/urls/cache/clear
   */
  async clearCache(req, res) {
    try {
      await cacheHelpers.clearAll();
      return ApiResponse.success(res, null, 'Cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Delete a short URL
   * DELETE /api/urls/:shortCode
   */
  async deleteUrl(req, res) {
    try {
      // Validate request params
      const { error, value } = urlValidator.deleteUrl.validate(req.params);
      if (error) {
        return ApiResponse.validationError(res, error.details);
      }

      const { shortCode } = value;
      const result = await urlService.deleteUrl(shortCode);

      return ApiResponse.success(res, result, 'URL deleted successfully');
    } catch (error) {
      logger.error('Error in deleteUrl controller:', error);
      return ApiResponse.notFound(res, error.message);
    }
  }

  /**
   * Get URL count
   * GET /api/urls/count
   */
  async getUrlCount(req, res) {
    try {
      const count = await urlRepository.getCount();
      return ApiResponse.success(res, { count }, 'URL count retrieved successfully');
    } catch (error) {
      logger.error('Error in getUrlCount controller:', error);
      return ApiResponse.error(res, error.message);
    }
  }

  /**
   * Bulk create short URLs
   * POST /api/urls/bulk
   */
  async bulkCreateUrls(req, res) {
    try {
      const { urls } = req.body;
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return ApiResponse.badRequest(res, 'Please provide an array of URLs');
      }

      if (urls.length > 100) {
        return ApiResponse.badRequest(res, 'Maximum 100 URLs allowed per request');
      }

      // Validate each URL
      const invalidUrls = urls.filter(url => !urlService.isValidUrl(url));
      if (invalidUrls.length > 0) {
        return ApiResponse.validationError(res, [
          { message: 'Invalid URLs found', invalidUrls }
        ]);
      }

      const results = await urlService.bulkCreateShortUrls(urls);
      return ApiResponse.success(res, results, 'Bulk URL creation completed');
    } catch (error) {
      logger.error('Error in bulkCreateUrls controller:', error);
      return ApiResponse.error(res, error.message);
    }
  }
}

module.exports = new UrlController();