const { Queue } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Email Queue
 * Handles all email sending operations asynchronously
 */
const emailQueue = new Queue('email', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 60000 // Start with 1 minute, doubles each retry
        },
        removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
            age: 86400 // Remove after 24 hours
        },
        removeOnFail: {
            count: 500, // Keep last 500 failed jobs for debugging
            age: 604800 // Remove after 7 days
        }
    }
});

// Queue event listeners
emailQueue.on('error', (error) => {
    logger.error('Email queue error:', error);
});

emailQueue.on('waiting', (jobId) => {
    logger.debug(`Email job ${jobId} is waiting`);
});

module.exports = emailQueue;
