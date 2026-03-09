const { Worker } = require('bullmq');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const Appointment = require('../models/Appointment');

/**
 * Reminder Worker
 * Processes jobs from the 'reminders' queue
 */
const reminderWorker = new Worker('reminders', async (job) => {
    const { appointmentId } = job.data;
    const logPrefix = `[ReminderJob ${job.id}]`;

    logger.debug(`${logPrefix} Processing reminder for appointment ${appointmentId}`);

    try {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId')
            .populate({
                path: 'doctorId',
                populate: { path: 'userId' }
            });

        if (!appointment) {
            logger.warn(`${logPrefix} Appointment not found, skipping`);
            return { skipped: true, reason: 'not_found' };
        }

        if (appointment.status === 'cancelled' || appointment.status === 'completed') {
            logger.info(`${logPrefix} Appointment ${appointment.status}, skipping reminder`);
            return { skipped: true, reason: `status_${appointment.status}` };
        }

        if (appointment.reminderSent) {
            logger.info(`${logPrefix} Reminder already sent, skipping`);
            return { skipped: true, reason: 'already_sent' };
        }

        // Send reminder via notification service (which will enqueue email)
        // We pass a flag to avoid circular dependency if notificationService tries to queue existing reminder
        // But notificationService.sendAppointmentReminderNotification sends email + push

        // We need existing notificationService logic, but refactored to NOT use direct sendEmail if we want to be pure
        // However, notificationService.sendEmail will now enqueue email jobs, so it's safe!

        await notificationService.sendAppointmentReminderNotification(appointment);

        // Mark as sent
        appointment.reminderSent = true;
        await appointment.save();

        logger.info(`${logPrefix} Reminder sent successfully`);
        return { success: true };

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
    concurrency: parseInt(process.env.REMINDER_WORKER_CONCURRENCY) || 3
});

reminderWorker.on('completed', (job) => {
    logger.debug(`Reminder job ${job.id} completed`);
});

reminderWorker.on('failed', (job, err) => {
    logger.error(`Reminder job ${job.id} failed: ${err.message}`);
});

module.exports = reminderWorker;
