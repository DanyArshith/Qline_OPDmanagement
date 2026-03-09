const NodeCache = require('node-cache');
const redisClient = require('../config/redis');
const logger = require('./logger');

// Layer 1: Memory Cache (Fastest, per-instance)
// Standard TTL: 5 minutes, Check period: 1 minute
const memoryCache = new NodeCache({
    stdTTL: 300,
    checkperiod: 60,
    maxKeys: parseInt(process.env.MEMORY_CACHE_MAX_SIZE) || 1000
});

/**
 * Cache Manager
 * Implements a 3-layer caching strategy:
 * 1. Memory Cache (Node-cache)
 * 2. Redis Cache (Shared)
 * 3. Database (Source of Truth)
 */
class CacheManager {
    constructor() {
        this.stats = {
            memoryHits: 0,
            redisHits: 0,
            misses: 0
        };
    }

    /**
     * Get data from cache
     * @param {string} key - Cache key
     * @param {Object} options - { ttl, tags }
     */
    async get(key, options = {}) {
        const { ttl = 300 } = options;

        // 1. Try Memory Cache
        const memValue = memoryCache.get(key);
        if (memValue !== undefined) {
            this.stats.memoryHits++;
            logger.debug(`Cache HIT (memory): ${key}`);
            return memValue;
        }

        // 2. Try Redis Cache
        if (redisClient) {
            try {
                const redisValue = await redisClient.get(key);
                if (redisValue) {
                    this.stats.redisHits++;
                    const parsed = JSON.parse(redisValue);

                    // Hydrate memory cache for faster subsequent access
                    memoryCache.set(key, parsed, ttl);

                    logger.debug(`Cache HIT (redis): ${key}`);
                    return parsed;
                }
            } catch (error) {
                logger.error('Redis cache error:', error);
            }
        }

        // 3. Cache Miss
        this.stats.misses++;
        logger.debug(`Cache MISS: ${key}`);
        return null;
    }

    /**
     * Set data in cache
     * @param {string} key - Cache key
     * @param {any} value - Data to cache
     * @param {Object} options - { ttl, tags }
     */
    async set(key, value, options = {}) {
        const { ttl = 300, tags = [] } = options;

        // 1. Set Memory Cache
        memoryCache.set(key, value, ttl);

        // 2. Set Redis Cache
        if (redisClient) {
            try {
                // Set value with TTL
                await redisClient.setex(key, ttl, JSON.stringify(value));

                // Handle Tags for invalidation
                if (tags.length > 0) {
                    for (const tag of tags) {
                        await redisClient.sadd(`tag:${tag}`, key);
                        // Set tag expiry slightly longer than key expiry
                        await redisClient.expire(`tag:${tag}`, ttl + 60);
                    }
                }
            } catch (error) {
                logger.error('Redis cache set error:', error);
            }
        }
    }

    /**
     * Delete key from all caches
     * @param {string} key 
     */
    async delete(key) {
        memoryCache.del(key);

        if (redisClient) {
            try {
                await redisClient.del(key);
            } catch (error) {
                logger.error('Redis cache delete error:', error);
            }
        }
    }

    /**
     * Invalidate all keys matching a tag
     * @param {string} tag 
     */
    async invalidateByTag(tag) {
        if (!redisClient) return;

        try {
            const keys = await redisClient.smembers(`tag:${tag}`);

            if (keys.length > 0) {
                // Delete from memory
                for (const key of keys) {
                    memoryCache.del(key);
                }

                // Delete from Redis
                const pipeline = redisClient.pipeline();
                keys.forEach(key => pipeline.del(key));
                pipeline.del(`tag:${tag}`);
                await pipeline.exec();

                logger.info(`Invalidated ${keys.length} cache entries for tag: ${tag}`);
            }
        } catch (error) {
            logger.error('Cache tag invalidation error:', error);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.memoryHits + this.stats.redisHits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.memoryHits + this.stats.redisHits) / total * 100).toFixed(2) : 0;

        return {
            ...this.stats,
            total,
            hitRate: `${hitRate}%`,
            memoryKeys: memoryCache.keys().length
        };
    }
}

module.exports = new CacheManager();
