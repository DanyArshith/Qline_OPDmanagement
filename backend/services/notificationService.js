const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailLog = require('../models/EmailLog');
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Initialize SendGrid if API key is provided
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    logger.info('✅ SendGrid initialized');
} else {
    logger.warn('⚠️  SendGrid API key not configured');
}

// Fallback SMTP transporter (for development)
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
    logger.info('✅ SMTP transporter initialized');
}

/**
 * Enqueue an in-app notification via BullMQ (non-blocking)
 * The notificationWorker will write to DB and emit socket event
 */
exports.createNotification = async (userId, type, title, message, data = {}) => {
    try {
        const notificationQueue = require('../queues/notificationQueue');
        await notificationQueue.add('create-notification', {
            userId: userId.toString(),
            type,
            title,
            message,
            data
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
        logger.debug(`Notification queued for user ${userId}: ${type}`);

        // In queued mode, DB write (and definitive ID) happens in worker.
        // Return a lightweight payload so callers can continue safely.
        return {
            _id: null,
            userId,
            type,
            title,
            message,
            data,
            queued: true,
            createdAt: new Date(),
        };
    } catch (error) {
        // Fallback to direct DB write if queue is unavailable
        logger.warn(`Notification queue unavailable, writing directly: ${error.message}`);
        return Notification.create({ userId, type, title, message, data });
    }
};

/**
 * Enqueue email delivery via BullMQ (non-blocking, with retry)
 * Creates an EmailLog for tracking, then delegates delivery to emailWorker
 */
exports.sendEmail = async (to, subject, html, text = null, metadata = {}) => {
    // Create email log entry immediately for tracking
    let emailLog;
    try {
        emailLog = await EmailLog.create({
            recipient: to,
            subject,
            htmlBody: html,
            textBody: text || subject,
            status: 'queued',
            metadata,
            maxAttempts: parseInt(process.env.EMAIL_MAX_RETRY_ATTEMPTS) || 3
        });
    } catch (logError) {
        logger.warn('Could not create EmailLog:', logError.message);
    }

    try {
        const emailQueue = require('../queues/emailQueue');
        await emailQueue.add('send-email', {
            to,
            subject,
            html,
            text: text || subject,
            emailLogId: emailLog?._id?.toString()
        }, {
            attempts: parseInt(process.env.EMAIL_MAX_RETRY_ATTEMPTS) || 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { age: 86400 }, // Keep completed jobs for 1 day
            removeOnFail: { age: 604800 }     // Keep failed jobs for 7 days
        });

        logger.debug(`Email queued to ${to}: ${subject}`);
        return { success: true, queued: true, emailLogId: emailLog?._id };

    } catch (queueError) {
        // Queue unavailable: fall back to direct send
        logger.warn(`Email queue unavailable, sending directly: ${queueError.message}`);

        const from = process.env.FROM_EMAIL || 'noreply@qline.com';

        if (process.env.SENDGRID_API_KEY) {
            await sgMail.send({ to, from, subject, text: text || subject, html });
            if (emailLog) {
                emailLog.status = 'sent';
                emailLog.sentAt = new Date();
                emailLog.provider = 'sendgrid';
                emailLog.attempts = 1;
                await emailLog.save();
            }
            return { success: true, provider: 'sendgrid-direct', emailLogId: emailLog?._id };
        }

        if (smtpTransporter) {
            await smtpTransporter.sendMail({ from, to, subject, text: text || subject, html });
            if (emailLog) {
                emailLog.status = 'sent';
                emailLog.sentAt = new Date();
                emailLog.provider = 'smtp';
                emailLog.attempts = 1;
                await emailLog.save();
            }
            return { success: true, provider: 'smtp-direct', emailLogId: emailLog?._id };
        }

        logger.error(`No email provider available for ${to} - ${subject}`);
        if (emailLog) {
            emailLog.status = 'failed';
            emailLog.error = 'no_provider_available';
            await emailLog.save();
        }
        return { success: false, reason: 'no_provider_available' };
    }
};

/**
 * Email template: Appointment Booked
 */
const getAppointmentBookedEmailHTML = (patient, doctor, appointment, tokenNumber) => {
    const date = new Date(appointment.slotStart);
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
        .token { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Appointment Confirmed</h1>
        </div>
        <div class="content">
            <p>Dear ${patient.name},</p>
            <p>Your appointment has been successfully booked.</p>
            
            <div class="info-box">
                <strong>Doctor:</strong> ${doctor.name}<br>
                <strong>Date:</strong> ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                <strong>Time:</strong> ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}<br>
            </div>
            
            <div class="token">
                Token #${tokenNumber}
            </div>
            
            <p><strong>Important:</strong> Please arrive 10 minutes before your scheduled time.</p>
            <p>You will receive a reminder notification 1 hour before your appointment.</p>
        </div>
        <div class="footer">
            <p>Qline - Smart Queue Management System</p>
            <p>This is an automated message. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Email template: Appointment Reminder
 */
const getAppointmentReminderEmailHTML = (patient, doctor, appointment, tokenNumber) => {
    const date = new Date(appointment.slotStart);
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #FF9800; }
        .reminder { font-size: 24px; font-weight: bold; color: #FF9800; text-align: center; padding: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Appointment Reminder</h1>
        </div>
        <div class="content">
            <p>Dear ${patient.name},</p>
            
            <div class="reminder">
                Your appointment is in 1 hour!
            </div>
            
            <div class="info-box">
                <strong>Doctor:</strong> ${doctor.name}<br>
                <strong>Date:</strong> ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                <strong>Time:</strong> ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}<br>
                <strong>Token:</strong> #${tokenNumber}
            </div>
            
            <p><strong>Please be on time!</strong> Arriving early helps avoid delays.</p>
        </div>
        <div class="footer">
            <p>Qline - Smart Queue Management System</p>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Send appointment booked notification (in-app + email)
 */
exports.sendAppointmentBookedNotification = async (appointment, io) => {
    try {
        // Populate if needed
        if (!appointment.populated('patientId')) {
            await appointment.populate('patientId');
        }
        if (!appointment.populated('doctorId')) {
            await appointment.populate({ path: 'doctorId', populate: { path: 'userId' } });
        }

        const patient = appointment.patientId;
        const doctor = appointment.doctorId.userId;
        const tokenNumber = appointment.tokenNumber;

        // Create in-app notification
        const notification = await this.createNotification(
            patient._id,
            'appointment_booked',
            'Appointment Confirmed',
            `Your appointment with Dr. ${doctor.name} has been booked for ${new Date(appointment.slotStart).toLocaleString()}. Token: #${tokenNumber}`,
            {
                appointmentId: appointment._id,
                doctorId: doctor._id,
                tokenNumber,
                date: appointment.date,
                slotStart: appointment.slotStart
            }
        );

        // Emit Socket.IO event if io provided
        if (io && notification?._id) {
            io.to(`user:${patient._id}`).emit('notification:new', {
                id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                createdAt: notification.createdAt
            });
        }

        // Send email
        const emailHTML = getAppointmentBookedEmailHTML(patient, doctor, appointment, tokenNumber);
        await this.sendEmail(
            patient.email,
            'Appointment Confirmed - Qline',
            emailHTML
        );

        logger.info(`Appointment booked notification sent to ${patient.email}`);
        return notification;

    } catch (error) {
        logger.error('Error sending appointment booked notification:', error);
        // Don't throw - notification failures shouldn't break booking
    }
};

/**
 * Send appointment reminder notification (in-app + email)
 */
exports.sendAppointmentReminderNotification = async (appointment, io) => {
    try {
        // Populate if needed
        if (!appointment.populated('patientId')) {
            await appointment.populate('patientId');
        }
        if (!appointment.populated('doctorId')) {
            await appointment.populate({ path: 'doctorId', populate: { path: 'userId' } });
        }

        const patient = appointment.patientId;
        const doctor = appointment.doctorId.userId;
        const tokenNumber = appointment.tokenNumber;

        // Create in-app notification
        const notification = await this.createNotification(
            patient._id,
            'appointment_reminder',
            'Appointment Reminder',
            `Your appointment with Dr. ${doctor.name} is in 1 hour. Token: #${tokenNumber}`,
            {
                appointmentId: appointment._id,
                doctorId: doctor._id,
                tokenNumber,
                date: appointment.date,
                slotStart: appointment.slotStart
            }
        );

        // Emit Socket.IO event if io provided
        if (io && notification?._id) {
            io.to(`user:${patient._id}`).emit('notification:new', {
                id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                createdAt: notification.createdAt
            });
        }

        // Send email
        const emailHTML = getAppointmentReminderEmailHTML(patient, doctor, appointment, tokenNumber);
        await this.sendEmail(
            patient.email,
            'Appointment Reminder - Your appointment is in 1 hour',
            emailHTML
        );

        logger.info(`Appointment reminder sent to ${patient.email}`);
        return notification;

    } catch (error) {
        logger.error('Error sending appointment reminder:', error);
    }
};

/**
 * Send token called notification (in-app + Socket.IO)
 */
exports.sendTokenCalledNotification = async (appointment, io) => {
    try {
        const patient = appointment.patientId;
        const tokenNumber = appointment.tokenNumber;

        // Create in-app notification
        const notification = await this.createNotification(
            patient._id || patient,
            'token_called',
            'Your Token is Called',
            `Token #${tokenNumber} has been called. Please proceed to the consultation room.`,
            {
                appointmentId: appointment._id,
                tokenNumber
            }
        );

        // Emit Socket.IO event if io provided
        if (io && notification?._id) {
            io.to(`user:${patient._id || patient}`).emit('notification:new', {
                id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                createdAt: notification.createdAt
            });
        }

        logger.info(`Token called notification sent for token #${tokenNumber}`);
        return notification;

    } catch (error) {
        logger.error('Error sending token called notification:', error);
    }
};

/**
 * Get user notifications (paginated)
 */
exports.getUserNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
    try {
        const skip = (page - 1) * limit;
        const query = { userId };

        if (unreadOnly) {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Notification.countDocuments(query);

        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        logger.error('Error getting user notifications:', error);
        throw error;
    }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            throw new Error('Notification not found');
        }

        return notification;
    } catch (error) {
        logger.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read for a user
 */
exports.markAllAsRead = async (userId) => {
    try {
        const result = await Notification.updateMany(
            { userId, read: false },
            { read: true, readAt: new Date() }
        );

        logger.info(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
        return result;
    } catch (error) {
        logger.error('Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        return notification;
    } catch (error) {
        logger.error('Error deleting notification:', error);
        throw error;
    }
};

/**
 * Get unread count for user
 */
exports.getUnreadCount = async (userId) => {
    try {
        const count = await Notification.countDocuments({
            userId,
            read: false
        });

        return count;
    } catch (error) {
        logger.error('Error getting unread count:', error);
        throw error;
    }
};
