const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const EmailLog = require('../models/EmailLog');
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize SMTP
let smtpTransporter = null;
if (process.env.SMTP_HOST) {
    smtpTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

/**
 * Email Worker
 * Processes jobs from the 'email' queue
 */
const emailWorker = new Worker('email', async (job) => {
    const { to, subject, html, text, emailLogId } = job.data;
    const logPrefix = `[EmailJob ${job.id}]`;

    logger.debug(`${logPrefix} Processing email to ${to}`);

    try {
        // 1. Try SendGrid
        if (process.env.SENDGRID_API_KEY) {
            try {
                const msg = {
                    to,
                    from: process.env.FROM_EMAIL || 'noreply@qline.com',
                    subject,
                    text: text || subject,
                    html
                };

                await sgMail.send(msg);

                // Update log
                if (emailLogId) {
                    await EmailLog.findByIdAndUpdate(emailLogId, {
                        status: 'sent',
                        sentAt: new Date(),
                        provider: 'sendgrid',
                        attempts: job.attemptsMade + 1,
                        lastAttemptAt: new Date()
                    });
                }

                logger.info(`${logPrefix} Sent via SendGrid to ${to}`);
                return { success: true, provider: 'sendgrid' };
            } catch (sgError) {
                logger.warn(`${logPrefix} SendGrid failed: ${sgError.message}. Trying fallback if available.`);
                // Continue to SMTP fallback
            }
        }

        // 2. Fallback to SMTP
        if (smtpTransporter) {
            await smtpTransporter.sendMail({
                from: process.env.FROM_EMAIL || 'noreply@qline.com',
                to,
                subject,
                text: text || subject,
                html
            });

            // Update log
            if (emailLogId) {
                await EmailLog.findByIdAndUpdate(emailLogId, {
                    status: 'sent',
                    sentAt: new Date(),
                    provider: 'smtp',
                    attempts: job.attemptsMade + 1,
                    lastAttemptAt: new Date()
                });
            }

            logger.info(`${logPrefix} Sent via SMTP to ${to}`);
            return { success: true, provider: 'smtp' };
        }

        // No provider available
        throw new Error('No email provider configured (SendGrid or SMTP)');

    } catch (error) {
        // Update log with failure
        if (emailLogId) {
            await EmailLog.findByIdAndUpdate(emailLogId, {
                status: 'failed',
                error: error.message,
                attempts: job.attemptsMade + 1,
                lastAttemptAt: new Date()
            });
        }

        logger.error(`${logPrefix} Failed: ${error.message}`);
        throw error; // Throw so BullMQ knows to retry
    }
}, {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },
    concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY) || 5,
    limiter: {
        max: 10,
        duration: 1000 // Max 10 emails per second
    }
});

// Event listeners
emailWorker.on('completed', (job) => {
    logger.debug(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job.id} failed: ${err.message}`);
});

module.exports = emailWorker;
