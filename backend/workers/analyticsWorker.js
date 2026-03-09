const { Worker } = require('bullmq');
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

/**
 * Analytics Worker
 * Processes jobs from the 'analytics' queue
 */
const analyticsWorker = new Worker('analytics', async (job) => {
    const { doctorId, date } = job.data;
    const logPrefix = `[AnalyticsJob ${job.id}]`;

    logger.info(`${logPrefix} Calculating analytics for doctor ${doctorId} on ${date}`);

    try {
        const result = await analyticsService.calculateDailyAnalytics(doctorId, date);

        logger.info(`${logPrefix} Analytics calculation complete`);
        return { success: true, result };

    } catch (error) {
        logger.error(`${logPrefix} Failed: ${error.message}`);
        throw error;
    }
}, {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },
    concurrency: parseInt(process.env.ANALYTICS_WORKER_CONCURRENCY) || 2,
    lockDuration: 60000 // Higher lock duration for heavy tasks
});

analyticsWorker.on('completed', (job) => {
    logger.info(`Analytics job ${job.id} completed`);
});

analyticsWorker.on('failed', (job, err) => {
    logger.error(`Analytics job ${job.id} failed: ${err.message}`);
});

module.exports = analyticsWorker;
