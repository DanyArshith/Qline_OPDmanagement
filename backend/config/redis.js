const logger = require('../utils/logger');

let redisClient = null;

try {
    const Redis = require('ioredis');

    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
    };

    // Production-specific Redis config
    if (process.env.NODE_ENV === 'production') {
        // CRITICAL: Set memory limits to prevent crashes
        redisConfig.maxmemory = process.env.REDIS_MAX_MEMORY || '256mb';
        redisConfig.maxmemoryPolicy = process.env.REDIS_EVICTION_POLICY || 'allkeys-lru';

        // More aggressive retry strategy for production
        redisConfig.retryStrategy = (times) => {
            if (times > 5) {
                logger.error('Redis connection failed after 5 retries in production');
                // In production with REQUIRE_REDIS_IN_PRODUCTION=true, this should crash the app
                if (process.env.REQUIRE_REDIS_IN_PRODUCTION === 'true') {
                    throw new Error('Redis is required in production but unavailable');
                }
                return null;
            }
            const delay = Math.min(times * 100, 3000);
            return delay;
        };
    } else {
        // Development: more lenient retry
        redisConfig.retryStrategy = (times) => {
            if (times > 3) {
                logger.warn('Redis connection failed after 3 retries, giving up');
                return null;
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
        };
    }

    redisClient = new Redis(redisConfig);

    redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err.message);

        // In production, Redis errors should be fatal if required
        if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_REDIS_IN_PRODUCTION === 'true') {
            logger.error('🚨 Redis required in production but encountered error');
            process.exit(1);
        }
    });

    redisClient.on('connect', () => {
        logger.info('✅ Redis Connected');
    });

    redisClient.on('ready', () => {
        logger.info('✅ Redis Ready');

        // Set production memory config if not already set
        if (process.env.NODE_ENV === 'production') {
            const maxmemory = process.env.REDIS_MAX_MEMORY || '256mb';
            const policy = process.env.REDIS_EVICTION_POLICY || 'allkeys-lru';

            redisClient.config('SET', 'maxmemory', maxmemory).catch(err => {
                logger.warn('Could not set Redis maxmemory:', err.message);
            });

            redisClient.config('SET', 'maxmemory-policy', policy).catch(err => {
                logger.warn('Could not set Redis maxmemory-policy:', err.message);
            });
        }
    });

    redisClient.on('close', () => {
        logger.warn('⚠️  Redis Connection Closed');
    });

    // Attempt to connect
    redisClient.connect().catch(err => {
        logger.warn('⚠️  Redis not available:', err.message);

        if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_REDIS_IN_PRODUCTION === 'true') {
            logger.error('🚨 Redis is required in production but connection failed');
            process.exit(1);
        }

        logger.info('ℹ️  Application will run without Redis caching');
        redisClient = null;
    });

} catch (error) {
    logger.warn('⚠️  Redis module not available:', error.message);

    if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_REDIS_IN_PRODUCTION === 'true') {
        logger.error('🚨 Redis is required in production');
        throw error;
    }

    logger.info('ℹ️  Application will run without Redis');
    redisClient = null;
}

module.exports = redisClient;
