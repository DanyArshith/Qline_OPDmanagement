const logger = require('../utils/logger');

let Redlock = null;
let redlock = null;
let redisClient = null;

// Attempt to initialize Redlock for distributed locking
try {
    redisClient = require('../config/redis');
    if (redisClient) {
        Redlock = require('redlock');
        redlock = new Redlock(
            [redisClient],
            {
                driftFactor: 0.01,
                retryCount: 3,
                retryDelay: 200,
                retryJitter: 200,
                automaticExtensionThreshold: 500
            }
        );

        redlock.on('error', (error) => {
            logger.error('Redlock error:', error);
        });

        logger.info('✅ Distributed lock (Redlock) initialized');
    } else {
        logger.warn('⚠️  Redis not available, distributed locks disabled');
    }
} catch (error) {
    logger.warn('⚠️  Distributed locks not available:', error.message);
}

/**
 * Acquire a distributed lock
 * @param {string} resource - Lock identifier
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Promise<object|null>} Lock object or null if unavailable
 */
exports.acquireLock = async (resource, ttl = 5 * 60 * 1000) => {
    if (!redlock) {
        logger.warn(`Cannot acquire lock "${resource}" - Redlock not available`);
        return null;
    }

    try {
        const lock = await redlock.acquire([`lock:${resource}`], ttl);
        logger.debug(`Lock acquired: ${resource}`);
        return lock;
    } catch (error) {
        // Lock is already held by another process
        logger.debug(`Failed to acquire lock "${resource}":`, error.message);
        return null;
    }
};

/**
 * Release a distributed lock
 * @param {object} lock - Lock object from acquireLock
 */
exports.releaseLock = async (lock) => {
    if (!lock) return;

    try {
        await lock.release();
        logger.debug('Lock released');
    } catch (error) {
        logger.error('Error releasing lock:', error);
    }
};

/**
 * Execute function with distributed lock
 * @param {string} resource - Lock identifier
 * @param {function} fn - Function to execute while holding lock
 * @param {number} ttl - Lock TTL in milliseconds
 */
exports.withLock = async (resource, fn, ttl = 5 * 60 * 1000) => {
    const lock = await exports.acquireLock(resource, ttl);

    if (!lock) {
        logger.info(`Skipping execution - another instance holds lock: ${resource}`);
        return { skipped: true, reason: 'lock_held_by_another_instance' };
    }

    try {
        const result = await fn();
        return { skipped: false, result };
    } finally {
        await exports.releaseLock(lock);
    }
};
