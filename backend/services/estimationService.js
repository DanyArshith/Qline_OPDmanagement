const QueueEvent = require('../models/QueueEvent');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const cacheManager = require('../utils/cacheManager');
const logger = require('../utils/logger');

/**
 * Smart Queue Estimation Service (Phase 5.2)
 * Uses historical QueueEvent data to calculate accurate, dynamic wait time estimates.
 * Falls back to doctor's defaultConsultTime if no historical data available.
 */

const CACHE_TTL_ESTIMATES = 600; // 10 minutes

/**
 * Get average consultation duration for a doctor
 * Calculated from in_progress → completed event pairs over the last 30 days
 */
exports.getAverageConsultTime = async (doctorId) => {
    const cacheKey = `estimate:consultTime:${doctorId}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Find all completed events in the last 30 days for this doctor
        const completedEvents = await QueueEvent.find({
            doctorId,
            event: 'completed',
            timestamp: { $gte: thirtyDaysAgo }
        }).select('appointmentId timestamp').lean();

        if (completedEvents.length < 3) {
            // Not enough data — fallback to doctor's default
            const doctor = await Doctor.findById(doctorId).select('defaultConsultTime').lean();
            const fallback = doctor?.defaultConsultTime || 15;
            await cacheManager.set(cacheKey, fallback, { ttl: CACHE_TTL_ESTIMATES });
            return fallback;
        }

        // For each completed event, find matching in_progress event
        const appointmentIds = completedEvents.map(e => e.appointmentId);
        const inProgressEvents = await QueueEvent.find({
            appointmentId: { $in: appointmentIds },
            event: 'in_progress'
        }).select('appointmentId timestamp').lean();

        // Build a lookup map: appointmentId -> inProgress timestamp
        const inProgressMap = {};
        inProgressEvents.forEach(e => {
            inProgressMap[e.appointmentId.toString()] = e.timestamp;
        });

        // Calculate durations (in minutes)
        const durations = [];
        completedEvents.forEach(completedEvent => {
            const inProgressAt = inProgressMap[completedEvent.appointmentId.toString()];
            if (inProgressAt) {
                const durationMs = completedEvent.timestamp - inProgressAt;
                const durationMin = durationMs / 60000;
                // Sanity check: ignore durations > 2 hours or < 1 minute
                if (durationMin >= 1 && durationMin <= 120) {
                    durations.push(durationMin);
                }
            }
        });

        if (durations.length < 3) {
            const doctor = await Doctor.findById(doctorId).select('defaultConsultTime').lean();
            const fallback = doctor?.defaultConsultTime || 15;
            await cacheManager.set(cacheKey, fallback, { ttl: CACHE_TTL_ESTIMATES });
            return fallback;
        }

        // Use trimmed mean (remove top/bottom 10%) to avoid outlier skew
        durations.sort((a, b) => a - b);
        const trimCount = Math.floor(durations.length * 0.1);
        const trimmed = durations.slice(trimCount, durations.length - trimCount);
        const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
        const result = Math.round(avg);

        await cacheManager.set(cacheKey, result, { ttl: CACHE_TTL_ESTIMATES, tags: [`doctor:${doctorId}`] });
        logger.debug(`Avg consult time for doctor ${doctorId}: ${result} min (from ${durations.length} samples)`);
        return result;

    } catch (error) {
        logger.error('Error calculating average consult time:', error);
        const doctor = await Doctor.findById(doctorId).select('defaultConsultTime').lean();
        return doctor?.defaultConsultTime || 15;
    }
};

/**
 * Get average wait time between 'waiting' → 'in_progress' for a doctor
 * by hour-of-day to account for busy periods.
 */
exports.getAverageWaitTimeByHour = async (doctorId, hour) => {
    const cacheKey = `estimate:waitTime:${doctorId}:${hour}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Get all 'in_progress' events at this hour of day for this doctor
        const inProgressEvents = await QueueEvent.aggregate([
            {
                $match: {
                    doctorId: require('mongoose').Types.ObjectId.createFromHexString
                        ? require('mongoose').Types.ObjectId.createFromHexString(doctorId.toString())
                        : doctorId,
                    event: 'in_progress',
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $addFields: {
                    hourOfDay: { $hour: '$timestamp' }
                }
            },
            {
                $match: { hourOfDay: hour }
            },
            {
                $project: { appointmentId: 1, timestamp: 1 }
            }
        ]);

        if (inProgressEvents.length < 3) {
            // No hourly data — return generic estimate
            return null;
        }

        const appointmentIds = inProgressEvents.map(e => e.appointmentId);
        const waitingEvents = await QueueEvent.find({
            appointmentId: { $in: appointmentIds },
            event: 'waiting'
        }).select('appointmentId timestamp').lean();

        const waitingMap = {};
        waitingEvents.forEach(e => {
            waitingMap[e.appointmentId.toString()] = e.timestamp;
        });

        const waits = [];
        inProgressEvents.forEach(ipEvent => {
            const waitedAt = waitingMap[ipEvent.appointmentId.toString()];
            if (waitedAt) {
                const waitMin = (ipEvent.timestamp - waitedAt) / 60000;
                if (waitMin >= 0 && waitMin <= 180) {
                    waits.push(waitMin);
                }
            }
        });

        if (waits.length < 2) return null;

        const avg = waits.reduce((a, b) => a + b, 0) / waits.length;
        const result = Math.round(avg);

        await cacheManager.set(cacheKey, result, { ttl: CACHE_TTL_ESTIMATES });
        return result;

    } catch (error) {
        logger.error('Error calculating avg wait by hour:', error);
        return null;
    }
};

/**
 * Estimate wait time for a patient at a given position in queue.
 * 
 * @param {ObjectId} doctorId
 * @param {number} patientsAhead - Number of patients ahead in queue (including in_progress)
 * @param {boolean} hasInProgress - Whether a patient is currently being seen
 * @returns {number} Estimated wait time in minutes
 */
exports.estimateWaitTime = async (doctorId, patientsAhead, hasInProgress = false) => {
    try {
        const avgConsult = await exports.getAverageConsultTime(doctorId);
        const currentHour = new Date().getHours();
        const hourlyWait = await exports.getAverageWaitTimeByHour(doctorId, currentHour);

        let estimate;

        if (patientsAhead === 0 && !hasInProgress) {
            estimate = 0; // Next up
        } else if (patientsAhead === 0 && hasInProgress) {
            // Current patient finishing soon ~half of avg consult
            estimate = Math.round(avgConsult / 2);
        } else {
            // Base: patientsAhead * avgConsult
            estimate = patientsAhead * avgConsult;

            // If we have hourly data, blend it (60% historical, 40% formula)
            if (hourlyWait !== null) {
                const formulaEstimate = estimate;
                const historicalEstimate = hourlyWait + (Math.max(0, patientsAhead - 1) * avgConsult);
                estimate = Math.round(formulaEstimate * 0.4 + historicalEstimate * 0.6);
            }

            // Add buffer if currently in progress (started but not done)
            if (hasInProgress) {
                estimate += Math.round(avgConsult * 0.5);
            }
        }

        return Math.max(0, estimate);

    } catch (error) {
        logger.error('Error estimating wait time:', error);
        const doctor = await Doctor.findById(doctorId).select('defaultConsultTime').lean();
        return (patientsAhead * (doctor?.defaultConsultTime || 15));
    }
};

/**
 * Get queue position and estimated wait for a specific appointment
 */
exports.getPatientWaitInfo = async (appointmentId) => {
    try {
        const appointment = await Appointment.findById(appointmentId)
            .select('doctorId date status tokenNumber priority')
            .lean();

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
            return { position: 0, estimatedWait: 0, status: appointment.status };
        }

        if (appointment.status === 'in_progress') {
            return { position: 0, estimatedWait: 0, status: 'in_progress', message: 'Your turn now!' };
        }

        // Count patients ahead based on priority ordering
        // Priority: emergency (1) > senior (2) > standard (3), then tokenNumber
        const PRIORITY_ORDER = { emergency: 1, senior: 2, standard: 3 };
        const myPriority = PRIORITY_ORDER[appointment.priority] || 3;

        const waitingPatients = await Appointment.find({
            doctorId: appointment.doctorId,
            date: appointment.date,
            status: 'waiting'
        }).select('tokenNumber priority').lean();

        // Sort by priority then tokenNumber (same logic as callNext)
        waitingPatients.sort((a, b) => {
            const pa = PRIORITY_ORDER[a.priority] || 3;
            const pb = PRIORITY_ORDER[b.priority] || 3;
            if (pa !== pb) return pa - pb;
            return a.tokenNumber - b.tokenNumber;
        });

        const position = waitingPatients.findIndex(p => p._id?.toString() === appointmentId.toString());
        const patientsAhead = position >= 0 ? position : waitingPatients.length;

        const hasInProgress = await Appointment.exists({
            doctorId: appointment.doctorId,
            date: appointment.date,
            status: 'in_progress'
        });

        const estimatedWait = await exports.estimateWaitTime(
            appointment.doctorId,
            patientsAhead,
            !!hasInProgress
        );

        return {
            position: patientsAhead + 1, // 1-based position
            patientsAhead,
            estimatedWait,
            priority: appointment.priority,
            status: appointment.status
        };

    } catch (error) {
        logger.error('Error getting patient wait info:', error);
        throw error;
    }
};
