const { Queue } = require('bullmq');
const logger = require('../utils/logger');

/**
 * Notification Queue
 * Handles in-app notification delivery
 */
const notificationQueue = new Queue('notifications', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 10000 // 10 seconds
        },
        removeOnComplete: {
            count: 500,
            age: 86400
        },
        removeOnFail: {
            count: 200,
            age: 259200
        }
    }
});

notificationQueue.on('error', (error) => {
    logger.error('Notification queue error:', error);
});

module.exports = notificationQueue;
