// src/repositories/url.repository.js
const Url = require('../models/Url');
const { cacheHelpers } = require('../config/redis');
const { logger } = require('../utils/logger');

// Cache key patterns
const CACHE_KEYS = {
    URL_BY_CODE: (code) => `url:code:${code}`,
    URL_BY_ORIGINAL: (urlHash) => `url:original:${urlHash}`,
    URL_STATS: (code) => `url:stats:${code}`,
    URL_LIST: (page, limit) => `url:list:${page}:${limit}`,
    URL_COUNT: 'url:count',
};

class UrlRepository {
    /**
     * Create a new short URL with cache invalidation
     */
    async create(urlData) {
        try {
            const url = new Url(urlData);
            const savedUrl = await url.save();

            // Cache the new URL
            await this.cacheUrl(savedUrl);

            // Invalidate list cache
            await cacheHelpers.delete(CACHE_KEYS.URL_COUNT);

            return savedUrl;
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('Short code already exists. Please try again.');
            }
            throw error;
        }
    }

    /**
     * Find a URL by short code (Cache First)
     */
    async findByShortCode(shortCode) {
        try {
            const cacheKey = CACHE_KEYS.URL_BY_CODE(shortCode);

            // Check cache first
            const cached = await cacheHelpers.get(cacheKey);
            if (cached) {
                logger.debug(`Cache hit: URL found for code ${shortCode}`);
                return cached;
            }

            // Cache miss - check database
            logger.debug(`Cache miss: Looking up URL for code ${shortCode} in DB`);
            const url = await Url.findByShortCode(shortCode);

            if (url) {
                // Cache the result for future requests
                await this.cacheUrl(url);
            }

            return url;
        } catch (error) {
            logger.error(`Error finding URL by shortCode ${shortCode}:`, error);
            // Fallback to database directly
            return await Url.findByShortCode(shortCode);
        }
    }

    /**
     * Find a URL by original URL (Cache First)
     */
    async findByOriginalUrl(originalUrl) {
        try {
            const urlHash = this.hashUrl(originalUrl);
            const cacheKey = CACHE_KEYS.URL_BY_ORIGINAL(urlHash);

            // Check cache first
            const cached = await cacheHelpers.get(cacheKey);
            if (cached) {
                logger.debug(`Cache hit: URL found for ${originalUrl}`);
                return cached;
            }

            // Cache miss - check database
            logger.debug(`Cache miss: Looking up URL ${originalUrl} in DB`);
            const url = await Url.findByOriginalUrl(originalUrl);

            if (url) {
                // Cache the result for future requests
                await this.cacheUrl(url);

                // Also cache by original URL
                await cacheHelpers.set(cacheKey, url, 3600);
            }

            return url;
        } catch (error) {
            logger.error(`Error finding URL by originalUrl ${originalUrl}:`, error);
            return await Url.findByOriginalUrl(originalUrl);
        }
    }

    /**
     * Increment clicks and update cache
     */
    async incrementClicks(shortCode) {
        try {
            // Update in database
            const url = await Url.findOneAndUpdate(
                { shortCode, isActive: true },
                {
                    $inc: { clicks: 1 },
                    $set: { lastAccessedAt: new Date() }
                },
                { new: true }
            );

            if (url) {
                // Update cache with new click count
                await this.cacheUrl(url);
            }

            return url;
        } catch (error) {
            logger.error(`Error incrementing clicks for ${shortCode}:`, error);
            throw error;
        }
    }

    /**
     * Get URL statistics with cache
     */
    async getStats(shortCode) {
        try {
            const cacheKey = CACHE_KEYS.URL_STATS(shortCode);

            // Try cache first
            const cached = await cacheHelpers.get(cacheKey);
            if (cached) {
                return cached;
            }

            // Cache miss - get from DB
            const url = await Url.findOne({ shortCode });
            if (url) {
                await cacheHelpers.set(cacheKey, url.toJSON(), 300); // 5 minutes TTL
            }

            return url;
        } catch (error) {
            logger.error(`Error getting stats for ${shortCode}:`, error);
            return await Url.findOne({ shortCode });
        }
    }

    /**
     * Get all URLs with pagination (with cache)
     */
    async findAll({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 }) {
        try {
            const cacheKey = CACHE_KEYS.URL_LIST(page, limit);

            // Try cache first for first page (most requested)
            if (page === 1) {
                const cached = await cacheHelpers.get(cacheKey);
                if (cached) {
                    return cached;
                }
            }

            // Cache miss or not first page
            const skip = (page - 1) * limit;
            const sort = { [sortBy]: sortOrder };

            const [urls, total] = await Promise.all([
                Url.find({ isActive: true })
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Url.countDocuments({ isActive: true }),
            ]);

            const result = {
                urls,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };

            // Cache first page results
            if (page === 1) {
                await cacheHelpers.set(cacheKey, result, 60); // 1 minute TTL
            }

            return result;
        } catch (error) {
            logger.error('Error finding all URLs:', error);
            throw error;
        }
    }

    /**
     * Get URL count with cache
     */
    async getCount() {
        try {
            const cacheKey = CACHE_KEYS.URL_COUNT;

            // Try cache first
            const cached = await cacheHelpers.get(cacheKey);
            if (cached !== null) {
                return cached;
            }

            // Cache miss
            const count = await Url.countDocuments({ isActive: true });
            await cacheHelpers.set(cacheKey, count, 300); // 5 minutes TTL

            return count;
        } catch (error) {
            logger.error('Error getting URL count:', error);
            return await Url.countDocuments({ isActive: true });
        }
    }

    /**
     * Delete a URL (soft delete) with cache invalidation
     */
    async deleteByShortCode(shortCode) {
        try {
            const url = await Url.findOneAndUpdate(
                { shortCode },
                { isActive: false },
                { new: true }
            );

            if (url) {
                // Invalidate all related caches
                await this.invalidateUrlCache(shortCode, url.originalUrl);
            }

            return url;
        } catch (error) {
            logger.error(`Error deleting URL ${shortCode}:`, error);
            throw error;
        }
    }

    /**
     * Check if URL exists with cache
     */
    async exists(shortCode) {
        try {
            const cacheKey = CACHE_KEYS.URL_BY_CODE(shortCode);

            // Check if exists in cache
            const exists = await cacheHelpers.exists(cacheKey);
            if (exists) {
                return true;
            }

            // Check in database
            const count = await Url.countDocuments({ shortCode, isActive: true });
            return count > 0;
        } catch (error) {
            logger.error(`Error checking existence for ${shortCode}:`, error);
            const count = await Url.countDocuments({ shortCode, isActive: true });
            return count > 0;
        }
    }

    /**
     * Cache a URL object
     */
    async cacheUrl(url) {
        try {
            if (!url) return false;

            const urlData = url.toJSON ? url.toJSON() : url;
            const shortCode = urlData.shortCode;
            const originalUrl = urlData.originalUrl;

            // Cache by short code
            const codeKey = CACHE_KEYS.URL_BY_CODE(shortCode);
            await cacheHelpers.set(codeKey, urlData, 3600);

            // Cache by original URL
            if (originalUrl) {
                const urlHash = this.hashUrl(originalUrl);
                const originalKey = CACHE_KEYS.URL_BY_ORIGINAL(urlHash);
                await cacheHelpers.set(originalKey, urlData, 3600);
            }

            return true;
        } catch (error) {
            logger.error('Error caching URL:', error);
            return false;
        }
    }

    /**
     * Invalidate all caches related to a URL
     */
    async invalidateUrlCache(shortCode, originalUrl) {
        try {
            // Delete by short code
            await cacheHelpers.delete(CACHE_KEYS.URL_BY_CODE(shortCode));

            // Delete by original URL
            if (originalUrl) {
                const urlHash = this.hashUrl(originalUrl);
                await cacheHelpers.delete(CACHE_KEYS.URL_BY_ORIGINAL(urlHash));
            }

            // Delete stats cache
            await cacheHelpers.delete(CACHE_KEYS.URL_STATS(shortCode));

            // Invalidate list caches (multiple pages)
            await cacheHelpers.delete(CACHE_KEYS.URL_COUNT);

            return true;
        } catch (error) {
            logger.error('Error invalidating cache:', error);
            return false;
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
     * Bulk create with cache
     */
    async bulkCreate(urls) {
        try {
            const created = await Url.insertMany(urls);

            // Cache all created URLs
            for (const url of created) {
                await this.cacheUrl(url);
            }

            // Invalidate count cache
            await cacheHelpers.delete(CACHE_KEYS.URL_COUNT);

            return created;
        } catch (error) {
            logger.error('Error bulk creating URLs:', error);
            throw error;
        }
    }
}

module.exports = new UrlRepository();