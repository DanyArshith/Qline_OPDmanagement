const { Queue } = require('bullmq');
const logger = require('../utils/logger');

/**
 * Analytics Queue
 * Handles heavy analytics calculations asynchronously
 */
const analyticsQueue = new Queue('analytics', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 120000 // 2 minutes
        },
        removeOnComplete: {
            count: 50,
            age: 604800 // 7 days
        },
        removeOnFail: {
            count: 50,
            age: 604800
        },
        timeout: 300000 // 5 minute timeout for heavy calculations
    }
});

analyticsQueue.on('error', (error) => {
    logger.error('Analytics queue error:', error);
});

module.exports = analyticsQueue;
