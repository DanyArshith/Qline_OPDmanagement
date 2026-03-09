const { Queue } = require('bullmq');
const logger = require('../utils/logger');

/**
 * Reminder Queue
 * Handles appointment reminder scheduling and delivery
 */
const reminderQueue = new Queue('reminders', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },
    defaultJobOptions: {
        attempts: 2, // Reminders are time-sensitive, don't retry too much
        backoff: {
            type: 'exponential',
            delay: 30000 // 30 seconds
        },
        removeOnComplete: {
            count: 200,
            age: 86400
        },
        removeOnFail: {
            count: 100,
            age: 259200 // 3 days
        }
    }
});

reminderQueue.on('error', (error) => {
    logger.error('Reminder queue error:', error);
});

module.exports = reminderQueue;
