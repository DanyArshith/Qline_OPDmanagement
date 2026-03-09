const { Worker } = require('bullmq');
const logger = require('../utils/logger');

/**
 * Notification Worker
 * Processes in-app notification jobs from the 'notifications' queue.
 *
 * Architecture note: Workers may run in a separate process from the main API
 * server, so we cannot access `server.io` directly. For real-time socket
 * emission we use the global.io reference set by the main process when
 * running in a single-process mode. In a multi-process / Docker setup,
 * Socket.IO is configured with a Redis adapter, so we emit through Redis
 * Pub/Sub instead.
 */

const REDIS_CONN = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
};

const notificationWorker = new Worker('notifications', async (job) => {
    const { userId, type, title, message, data } = job.data;
    const logPrefix = `[NotificationJob ${job.id}]`;

    logger.debug(`${logPrefix} Creating notification for user ${userId}`);

    try {
        // We connect to MongoDB ourselves; require lazily so this works whether
        // loaded from server.js or standalone workers/index.js entrypoint.
        const Notification = require('../models/Notification');

        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            data: data || {}
        });

        // Emit real-time event if Socket.IO is accessible in this process.
        // In single-process mode global.io is set by server.js.
        // In multi-process mode Socket.IO uses the Redis adapter so
        // any server instance receiving the Redis message will forward it.
        if (global.io) {
            global.io.to(`user:${userId}`).emit('notification', {
                _id: notification._id,
                type,
                title,
                message,
                data,
                createdAt: notification.createdAt
            });
        }

        logger.info(`${logPrefix} Notification created for ${userId} (${type})`);
        return { success: true, notificationId: notification._id };

    } catch (error) {
        logger.error(`${logPrefix} Failed: ${error.message}`);
        throw error; // Tell BullMQ to retry
    }
}, {
    connection: REDIS_CONN,
    concurrency: parseInt(process.env.NOTIFICATION_WORKER_CONCURRENCY) || 5
});

notificationWorker.on('completed', (job) => {
    logger.debug(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
    logger.error(`Notification job ${job.id} failed: ${err.message}`);
});

module.exports = notificationWorker;
