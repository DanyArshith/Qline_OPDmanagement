const mongoose = require('mongoose');
const DailyQueue = require('../models/DailyQueue');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const QueueEvent = require('../models/QueueEvent');
const notificationService = require('./notificationService');
const { normalizeDate, parseTimeString } = require('../utils/dateUtils');

const toObjectId = (value) => (value && typeof value === 'object' && value._id ? value._id : value);

const recordQueueEvent = async ({
    appointmentId,
    doctorId,
    patientId,
    queueId,
    event,
    previousEvent,
    metadata = {},
    session,
}) => {
    await QueueEvent.create([{
        appointmentId,
        doctorId,
        patientId: toObjectId(patientId),
        queueId,
        event,
        previousEvent,
        timestamp: new Date(),
        metadata,
    }], { session });
};

/**
 * Call Next Patient - Atomically promote next waiting patient
 * CRITICAL: Full race protection with idempotency, rate limiting, and working hours validation
 */
const callNextPatient = async (doctorId, date, io, req) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const normalizedDate = normalizeDate(new Date(date));

        // Fetch queue
        const queue = await DailyQueue.findOne({
            doctorId,
            date: normalizedDate
        }).session(session);

        if (!queue) throw new Error('Queue not found');

        // CRITICAL: Verify doctor ownership (never trust routing layer alone)
        if (queue.doctorId.toString() !== doctorId.toString()) {
            throw new Error('Unauthorized queue access');
        }

        // CRITICAL: Validate queue is active
        if (queue.status !== 'active') {
            throw new Error(`Queue is ${queue.status}. Cannot call next patient.`);
        }

        // CRITICAL: Check working hours BEFORE any atomic operations
        // Prevents promoting patient then auto-closing (inconsistent state)
        const doctor = await Doctor.findById(doctorId).session(session);
        const workEndUTC = parseTimeString(doctor.workingHours.end, normalizedDate);

        if (new Date() > workEndUTC) {
            queue.status = 'closed';

            const response = {
                success: true,
                queueClosed: true,
                reason: 'past_working_hours',
                message: 'Queue closed: past working hours'
            };

            // CRITICAL: Store idempotency data for working hours closure
            const clientActionId = req.headers['x-action-id'];
            if (clientActionId) {
                queue.lastCallNextId = clientActionId;
                queue.lastCallNextResponse = response;
            }
            await queue.save({ session });

            await session.commitTransaction();

            io.to(`doctor:${doctorId}:${date}`).emit('queue:closed', {
                reason: 'past_working_hours',
                timestamp: new Date()
            });

            return response;
        }

        // CRITICAL: Atomic idempotency + rate limiting in ONE operation
        // This prevents race between idempotency check and rate limit update
        const clientActionId = req.headers['x-action-id'];
        if (!clientActionId) {
            throw new Error('X-Action-ID header required for idempotency');
        }

        const rateLimitAndIdempotency = await DailyQueue.findOneAndUpdate(
            {
                _id: queue._id,
                // Atomic conditions:
                // 1. Action ID is different (idempotency)
                // 2. Rate limit window passed (1 second)
                lastCallNextId: { $ne: clientActionId },
                $or: [
                    { lastActionAt: { $exists: false } },
                    { lastActionAt: { $lt: new Date(Date.now() - 1000) } }
                ]
            },
            {
                $set: {
                    lastActionAt: new Date(),
                    lastCallNextId: clientActionId  // Per-action-type ID
                }
            },
            { session, new: true }
        );

        if (!rateLimitAndIdempotency) {
            // Check if it's duplicate or rate limit
            if (queue.lastCallNextId === clientActionId) {
                // Duplicate request - return cached response
                return queue.lastCallNextResponse || {
                    success: true,
                    message: 'Duplicate request - action already performed'
                };
            } else {
                // Rate limit hit
                throw new Error('Action too fast. Please wait 1 second.');
            }
        }

        // CRITICAL: Use updated queue document from findOneAndUpdate
        // The returned document has lastActionAt and lastCallNextId updated
        const updatedQueue = rateLimitAndIdempotency;

        // CRITICAL: Smart zombie detection with socket tracking
        // Only auto-complete if:
        // 1. Appointment is stale (>30 minutes)
        // 2. AND no active doctor socket connected
        const zombieThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
        const zombieInProgress = await Appointment.findOne({
            doctorId,
            date: normalizedDate,
            status: 'in_progress',
            updatedAt: { $lt: zombieThreshold }
        }).session(session);

        if (zombieInProgress) {
            // Check if doctor has active socket (prevents auto-completing long consultations)
            const activeDoctorSockets = io.sockets.adapter.rooms.get(`doctor:${doctorId}:${date}`);
            const doctorSocketActive = activeDoctorSockets && activeDoctorSockets.size > 0;

            if (!doctorSocketActive) {
                // No active doctor socket - safe to auto-complete
                zombieInProgress.status = 'completed';
                await zombieInProgress.save({ session });

                // CRITICAL: Keep waitingList consistent (until future refactor)
                await DailyQueue.findOneAndUpdate(
                    { doctorId, date: normalizedDate },
                    {
                        $set: {
                            'waitingList.$[elem].status': 'completed'
                        }
                    },
                    {
                        arrayFilters: [{ 'elem.appointmentId': zombieInProgress._id }],
                        session
                    }
                );

                await recordQueueEvent({
                    appointmentId: zombieInProgress._id,
                    doctorId,
                    patientId: zombieInProgress.patientId,
                    queueId: updatedQueue._id,
                    event: 'completed',
                    previousEvent: 'in_progress',
                    metadata: {
                        tokenNumber: zombieInProgress.tokenNumber,
                        delayReason: 'auto_completed_stale_session',
                    },
                    session,
                });
            }
            // else: doctor socket is active, they might just be taking longer - don't auto-complete
        }

        // CRITICAL: Check no patient currently in progress
        const existingInProgress = await Appointment.findOne({
            doctorId,
            date: normalizedDate,
            status: 'in_progress'
        }).session(session);

        if (existingInProgress) {
            throw new Error('A patient is already being served');
        }

        // CRITICAL: Atomic selection + update (prevents multi-device race)
        // Phase 5.2: Priority-aware ordering: emergency > senior > standard, then by tokenNumber
        // MongoDB sort maps: emergency=1, senior=2, standard=3 alphabetically works but fragile.
        // Use a two-field sort: priority ASC (emergency < senior < standard alphabetically) + tokenNumber ASC
        const nextAppointment = await Appointment.findOneAndUpdate(
            {
                doctorId,
                date: normalizedDate,
                status: 'waiting'
            },
            {
                $set: { status: 'in_progress', consultationStartTime: new Date() }
            },
            {
                sort: { priority: 1, tokenNumber: 1 }, // priority: emergency < senior < standard
                session,
                new: true
            }
        ).populate('patientId', 'name email');

        if (!nextAppointment) {
            // No waiting patients - auto-close queue
            updatedQueue.status = 'closed';

            // Build response
            const response = {
                success: true,
                queueClosed: true,
                message: 'No patients waiting. Queue closed.',
                currentToken: updatedQueue.currentToken
            };

            // CRITICAL: Store response in transaction for idempotency
            updatedQueue.lastCallNextResponse = response;
            await updatedQueue.save({ session });

            await session.commitTransaction();

            // CRITICAL: Broadcast queue closure (real-time)
            io.to(`doctor:${doctorId}:${date}`).emit('queue:closed', {
                doctorId,
                date,
                reason: 'no_waiting_patients',
                timestamp: new Date()
            });

            return response;
        }

        // Update queue currentToken (action ID already stored via atomic update)
        updatedQueue.currentToken = nextAppointment.tokenNumber;

        // Update waitingList status (optional - will be removed in future refactor)
        await DailyQueue.findOneAndUpdate(
            { doctorId, date: normalizedDate },
            {
                $set: {
                    'waitingList.$[elem].status': 'in_progress'
                }
            },
            {
                arrayFilters: [{ 'elem.appointmentId': nextAppointment._id }],
                session
            }
        );

        await recordQueueEvent({
            appointmentId: nextAppointment._id,
            doctorId,
            patientId: nextAppointment.patientId,
            queueId: updatedQueue._id,
            event: 'in_progress',
            previousEvent: 'waiting',
            metadata: {
                tokenNumber: nextAppointment.tokenNumber,
            },
            session,
        });

        // CRITICAL: Count inside transaction for performance (not after commit)
        const [waitingCount, completedCount] = await Promise.all([
            Appointment.countDocuments({
                doctorId, date: normalizedDate, status: 'waiting'
            }).session(session),
            Appointment.countDocuments({
                doctorId, date: normalizedDate, status: 'completed'
            }).session(session)
        ]);

        // Build response
        const response = {
            success: true,
            currentToken: nextAppointment.tokenNumber,
            appointment: {
                _id: nextAppointment._id,
                patientId: nextAppointment.patientId._id,
                patientName: nextAppointment.patientId.name,
                tokenNumber: nextAppointment.tokenNumber,
                priority: nextAppointment.priority || 'standard', // Phase 5.2
                priorityNote: nextAppointment.priorityNote || null
            },
            queueState: {
                waiting: waitingCount,
                completed: completedCount,
                current: nextAppointment.tokenNumber
            }
        };

        // CRITICAL: Store response for idempotency BEFORE commit
        updatedQueue.lastCallNextResponse = response;
        await updatedQueue.save({ session });

        await session.commitTransaction();

        // Emit to doctor room (all patients + doctor watching)
        io.to(`doctor:${doctorId}:${date}`).emit('queue:token-called', {
            doctorId,
            date,
            currentToken: nextAppointment.tokenNumber,
            appointmentId: nextAppointment._id,
            patientName: nextAppointment.patientId.name,
            queueState: response.queueState,
            timestamp: new Date()
        });

        // Emit to patient's personal room
        io.to(`user:${nextAppointment.patientId._id}`).emit('appointment:status-changed', {
            appointmentId: nextAppointment._id,
            newStatus: 'in_progress',
            doctorId,
            date,
            timestamp: new Date()
        });

        notificationService.sendTokenCalledNotification(nextAppointment, io).catch(() => {});

        return response;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Mark Completed - Mark current patient as completed and call next
 * CRITICAL: Non-recursive implementation to avoid nested transactions
 */
const markCompleted = async (doctorId, date, io, req) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const normalizedDate = normalizeDate(new Date(date));

        const queue = await DailyQueue.findOne({
            doctorId,
            date: normalizedDate
        }).session(session);

        if (!queue) throw new Error('Queue not found');

        // Verify ownership
        if (queue.doctorId.toString() !== doctorId.toString()) {
            throw new Error('Unauthorized queue access');
        }

        // Idempotency check
        const clientActionId = req.headers['x-action-id'];
        if (!clientActionId) {
            throw new Error('X-Action-ID header required');
        }

        if (queue.lastCompleteId === clientActionId) {
            return queue.lastCompleteResponse || {
                success: true,
                message: 'Duplicate request - already completed'
            };
        }

        // Find current in-progress appointment
        const currentAppointment = await Appointment.findOne({
            doctorId,
            date: normalizedDate,
            status: 'in_progress'
        }).session(session);

        if (!currentAppointment) {
            throw new Error('No patient currently being served');
        }

                // Mark as completed
        currentAppointment.status = 'completed';
        currentAppointment.consultationEndTime = new Date();
        if (currentAppointment.consultationStartTime) {
            currentAppointment.consultationDuration = Math.max(1, Math.round((currentAppointment.consultationEndTime - currentAppointment.consultationStartTime) / 60000));
        } else {
            currentAppointment.consultationDuration = 15;
        }
        await currentAppointment.save({ session });

        // Update dotor's average consult time
        const Doctor = require('../models/Doctor');
        const doctorDoc = await Doctor.findById(doctorId).session(session);
        if (doctorDoc) {
            doctorDoc.averageConsultTime = Math.round(((doctorDoc.averageConsultTime || doctorDoc.defaultConsultTime) * 9 + currentAppointment.consultationDuration) / 10);
            await doctorDoc.save({ session });
        }

        // Update waitingList
        await DailyQueue.findOneAndUpdate(
            { doctorId, date: normalizedDate },
            { $set: { 'waitingList.$[elem].status': 'completed' } },
            { arrayFilters: [{ 'elem.appointmentId': currentAppointment._id }], session }
        );

        await recordQueueEvent({
            appointmentId: currentAppointment._id,
            doctorId,
            patientId: currentAppointment.patientId,
            queueId: queue._id,
            event: 'completed',
            previousEvent: 'in_progress',
            metadata: {
                tokenNumber: currentAppointment.tokenNumber,
            },
            session,
        });

        // Directly call next patient (in same transaction - not recursive)
        // Phase 5.2: Priority-aware ordering
        const nextAppointment = await Appointment.findOneAndUpdate(
            { doctorId, date: normalizedDate, status: 'waiting' },
            { $set: { status: 'in_progress', consultationStartTime: new Date() } },
            { sort: { priority: 1, tokenNumber: 1 }, session, new: true }
        ).populate('patientId', 'name email');

        if (nextAppointment) {
            queue.currentToken = nextAppointment.tokenNumber;

            // Update waitingList for next patient
            await DailyQueue.findOneAndUpdate(
                { doctorId, date: normalizedDate },
                { $set: { 'waitingList.$[elem].status': 'in_progress' } },
                { arrayFilters: [{ 'elem.appointmentId': nextAppointment._id }], session }
            );

            await recordQueueEvent({
                appointmentId: nextAppointment._id,
                doctorId,
                patientId: nextAppointment.patientId,
                queueId: queue._id,
                event: 'in_progress',
                previousEvent: 'waiting',
                metadata: {
                    tokenNumber: nextAppointment.tokenNumber,
                },
                session,
            });
        } else {
            // No more patients - auto-close
            queue.status = 'closed';
        }

        // Build response
        const response = {
            success: true,
            completedToken: currentAppointment.tokenNumber,
            nextToken: nextAppointment?.tokenNumber || null,
            queueClosed: !nextAppointment
        };

        // CRITICAL: Store idempotency data BEFORE commit
        queue.lastCompleteId = clientActionId;
        queue.lastCompleteResponse = response;
        await queue.save({ session });

        await session.commitTransaction();

        // Emit events
        io.to(`user:${currentAppointment.patientId}`).emit('appointment:status-changed', {
            appointmentId: currentAppointment._id,
            newStatus: 'completed',
            timestamp: new Date()
        });

        if (nextAppointment) {
            io.to(`doctor:${doctorId}:${date}`).emit('queue:token-called', {
                currentToken: nextAppointment.tokenNumber,
                patientName: nextAppointment.patientId.name,
                timestamp: new Date()
            });

            io.to(`user:${nextAppointment.patientId._id}`).emit('appointment:status-changed', {
                appointmentId: nextAppointment._id,
                newStatus: 'in_progress',
                timestamp: new Date()
            });

            notificationService.sendTokenCalledNotification(nextAppointment, io).catch(() => {});
        } else {
            io.to(`doctor:${doctorId}:${date}`).emit('queue:closed', {
                reason: 'all_completed',
                timestamp: new Date()
            });
        }

        return response;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Mark No Show - Mark current patient as no-show and call next
 * CRITICAL: Non-recursive implementation, does NOT decrement counts
 */
const markNoShow = async (doctorId, date, io, req) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const normalizedDate = normalizeDate(new Date(date));

        const queue = await DailyQueue.findOne({
            doctorId,
            date: normalizedDate
        }).session(session);

        if (!queue) throw new Error('Queue not found');

        // Verify ownership
        if (queue.doctorId.toString() !== doctorId.toString()) {
            throw new Error('Unauthorized queue access');
        }

        // Idempotency check
        const clientActionId = req.headers['x-action-id'];
        if (!clientActionId) {
            throw new Error('X-Action-ID header required');
        }

        if (queue.lastNoShowId === clientActionId) {
            return queue.lastNoShowResponse || {
                success: true,
                message: 'Duplicate request - already marked no-show'
            };
        }

        // Find current in-progress appointment
        const currentAppointment = await Appointment.findOne({
            doctorId,
            date: normalizedDate,
            status: 'in_progress'
        }).session(session);

        if (!currentAppointment) {
            throw new Error('No patient currently being served');
        }

        // Mark as no_show (do NOT decrement appointmentCount)
        currentAppointment.status = 'no_show';
        await currentAppointment.save({ session });

        // Update waitingList
        await DailyQueue.findOneAndUpdate(
            { doctorId, date: normalizedDate },
            { $set: { 'waitingList.$[elem].status': 'no_show' } },
            { arrayFilters: [{ 'elem.appointmentId': currentAppointment._id }], session }
        );

        await recordQueueEvent({
            appointmentId: currentAppointment._id,
            doctorId,
            patientId: currentAppointment.patientId,
            queueId: queue._id,
            event: 'no_show',
            previousEvent: 'in_progress',
            metadata: {
                tokenNumber: currentAppointment.tokenNumber,
            },
            session,
        });

        // Directly call next patient (in same transaction - not recursive)
        // Phase 5.2: Priority-aware ordering
        const nextAppointment = await Appointment.findOneAndUpdate(
            { doctorId, date: normalizedDate, status: 'waiting' },
            { $set: { status: 'in_progress', consultationStartTime: new Date() } },
            { sort: { priority: 1, tokenNumber: 1 }, session, new: true }
        ).populate('patientId', 'name email');

        if (nextAppointment) {
            queue.currentToken = nextAppointment.tokenNumber;

            // Update waitingList for next patient
            await DailyQueue.findOneAndUpdate(
                { doctorId, date: normalizedDate },
                { $set: { 'waitingList.$[elem].status': 'in_progress' } },
                { arrayFilters: [{ 'elem.appointmentId': nextAppointment._id }], session }
            );

            await recordQueueEvent({
                appointmentId: nextAppointment._id,
                doctorId,
                patientId: nextAppointment.patientId,
                queueId: queue._id,
                event: 'in_progress',
                previousEvent: 'waiting',
                metadata: {
                    tokenNumber: nextAppointment.tokenNumber,
                },
                session,
            });
        } else {
            // No more patients - auto-close
            queue.status = 'closed';
        }

        // Build response
        const response = {
            success: true,
            noShowToken: currentAppointment.tokenNumber,
            nextToken: nextAppointment?.tokenNumber || null,
            queueClosed: !nextAppointment
        };

        // CRITICAL: Store idempotency data BEFORE commit
        queue.lastNoShowId = clientActionId;
        queue.lastNoShowResponse = response;
        await queue.save({ session });

        await session.commitTransaction();

        // Emit events
        io.to(`user:${currentAppointment.patientId}`).emit('appointment:status-changed', {
            appointmentId: currentAppointment._id,
            newStatus: 'no_show',
            timestamp: new Date()
        });

        if (nextAppointment) {
            io.to(`doctor:${doctorId}:${date}`).emit('queue:token-called', {
                currentToken: nextAppointment.tokenNumber,
                patientName: nextAppointment.patientId.name,
                timestamp: new Date()
            });

            io.to(`user:${nextAppointment.patientId._id}`).emit('appointment:status-changed', {
                appointmentId: nextAppointment._id,
                newStatus: 'in_progress',
                timestamp: new Date()
            });

            notificationService.sendTokenCalledNotification(nextAppointment, io).catch(() => {});
        } else {
            io.to(`doctor:${doctorId}:${date}`).emit('queue:closed', {
                reason: 'all_completed',
                timestamp: new Date()
            });
        }

        return response;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Pause Queue - Temporarily pause queue (break time)
 */
const pauseQueue = async (doctorId, date, io) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const normalizedDate = normalizeDate(new Date(date));

        const queue = await DailyQueue.findOne({
            doctorId,
            date: normalizedDate
        }).session(session);

        if (!queue) throw new Error('Queue not found');

        // Verify ownership
        if (queue.doctorId.toString() !== doctorId.toString()) {
            throw new Error('Unauthorized queue access');
        }

        if (queue.status === 'paused') {
            return { success: true, message: 'Queue is already paused' };
        }

        if (queue.status === 'closed') {
            throw new Error('Cannot pause a closed queue');
        }

        queue.status = 'paused';
        await queue.save({ session });

        await session.commitTransaction();

        // Broadcast pause event
        io.to(`doctor:${doctorId}:${date}`).emit('queue:paused', {
            doctorId,
            date,
            timestamp: new Date()
        });

        return { success: true, message: 'Queue paused successfully' };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Resume Queue - Resume paused queue
 */
const resumeQueue = async (doctorId, date, io) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const normalizedDate = normalizeDate(new Date(date));

        const queue = await DailyQueue.findOne({
            doctorId,
            date: normalizedDate
        }).session(session);

        if (!queue) throw new Error('Queue not found');

        // Verify ownership
        if (queue.doctorId.toString() !== doctorId.toString()) {
            throw new Error('Unauthorized queue access');
        }

        if (queue.status === 'active') {
            return { success: true, message: 'Queue is already active' };
        }

        if (queue.status === 'closed') {
            throw new Error('Cannot resume a closed queue');
        }

        queue.status = 'active';
        await queue.save({ session });

        await session.commitTransaction();

        // Broadcast resume event
        io.to(`doctor:${doctorId}:${date}`).emit('queue:resumed', {
            doctorId,
            date,
            timestamp: new Date()
        });

        return { success: true, message: 'Queue resumed successfully' };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get Queue State - Fetch current queue state for doctor
 */
const getQueueState = async (doctorId, date) => {
    const normalizedDate = normalizeDate(new Date(date));

    let queue = await DailyQueue.findOne({ doctorId, date: normalizedDate });

    // Auto-create queue if no queue exists for this date
    if (!queue) {
        const apptCount = await Appointment.countDocuments({ doctorId, date: normalizedDate });
        queue = await DailyQueue.create({
            doctorId,
            date: normalizedDate,
            status: 'active',
            appointmentCount: apptCount,
            lastTokenNumber: apptCount,
            currentToken: null,
        });
    }

    const [waiting, inProgress, completed, noShow, booked] = await Promise.all([
        Appointment.countDocuments({ doctorId, date: normalizedDate, status: 'waiting' }),
        Appointment.countDocuments({ doctorId, date: normalizedDate, status: 'in_progress' }),
        Appointment.countDocuments({ doctorId, date: normalizedDate, status: 'completed' }),
        Appointment.countDocuments({ doctorId, date: normalizedDate, status: 'no_show' }),
        Appointment.countDocuments({ doctorId, date: normalizedDate, status: 'booked' }),
    ]);

    const waitingList = await Appointment.find({
        doctorId,
        date: normalizedDate,
        status: { $in: ['waiting', 'booked'] }
    }).sort({ priority: 1, tokenNumber: 1 })
      .select('tokenNumber patientId priority')
      .populate('patientId', 'name email');

    const currentPatient = await Appointment.findOne({
        doctorId,
        date: normalizedDate,
        status: 'in_progress'
    }).select('tokenNumber patientId').populate('patientId', 'name email');

    return {
        doctorId,
        date: normalizedDate,
        status: queue.status,
        currentToken: queue.currentToken,
        currentPatient: currentPatient ? {
            tokenNumber: currentPatient.tokenNumber,
            patientName: currentPatient.patientId?.name || 'Patient'
        } : null,
        counts: {
            waiting: waiting + booked,
            inProgress,
            completed,
            noShow,
            total: queue.appointmentCount
        },
        waitingList: waitingList.map(apt => ({
            tokenNumber: apt.tokenNumber,
            patientName: apt.patientId?.name || 'Patient',
            priority: apt.priority || 'standard',
        }))
    };
};

module.exports = {
    callNextPatient,
    markCompleted,
    markNoShow,
    pauseQueue,
    resumeQueue,
    getQueueState
};
