const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DailyQueue = require('../models/DailyQueue');
const Doctor = require('../models/Doctor');
const notificationService = require('./notificationService');
const {
    normalizeDate,
    addMinutes,
} = require('../utils/dateUtils');
const {
    findNextAvailableSlot,
} = require('./slotService');

const REBOOKABLE_STATUSES = ['booked', 'waiting'];

const getDayAfter = (dateInput) => {
    const nextDay = normalizeDate(dateInput);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    return nextDay;
};

const getEndOfInactiveRangeExclusive = (inactiveUntil) => {
    const end = normalizeDate(inactiveUntil);
    end.setUTCDate(end.getUTCDate() + 1);
    return end;
};

const loadQueue = async (doctorId, date, session) => {
    const queue = await DailyQueue.findOne({ doctorId, date }).session(session);
    if (!queue) {
        return null;
    }

    return queue;
};

const removeAppointmentFromQueue = async ({ doctorId, date, appointmentId, session }) => {
    const queue = await loadQueue(doctorId, date, session);
    if (!queue) {
        return;
    }

    queue.appointmentCount = Math.max(0, (queue.appointmentCount || 0) - 1);
    queue.waitingList = (queue.waitingList || []).filter(
        (entry) => entry.appointmentId?.toString() !== appointmentId.toString()
    );
    await queue.save({ session });
};

const reserveQueueToken = async ({ doctorId, date, appointmentId, session }) => {
    let queue = await loadQueue(doctorId, date, session);

    if (!queue) {
        queue = new DailyQueue({
            doctorId,
            date,
            currentToken: 0,
            appointmentCount: 0,
            lastTokenNumber: 0,
            waitingList: [],
            status: 'active',
        });
    }

    queue.appointmentCount += 1;
    queue.lastTokenNumber += 1;

    const tokenNumber = queue.lastTokenNumber;
    queue.waitingList.push({
        appointmentId,
        tokenNumber,
        status: 'waiting',
    });

    await queue.save({ session });

    return { queue, tokenNumber };
};

const notifyRescheduled = async (event, io) => {
    await notificationService.sendAppointmentRescheduledNotification({
        patientId: event.patientId,
        appointmentId: event.appointmentId,
        doctorId: event.doctorId,
        doctorName: event.doctorName,
        previousSlotStart: event.previousSlotStart,
        newSlotStart: event.newSlotStart,
        reason: event.reason,
    }, io);
};

const notifyCancelled = async (event, io) => {
    await notificationService.sendDoctorUnavailableNotification({
        patientId: event.patientId,
        appointmentId: event.appointmentId,
        doctorId: event.doctorId,
        doctorName: event.doctorName,
        slotStart: event.previousSlotStart,
        reason: event.reason,
        cancelled: true,
    }, io);
};

const updateAvailability = async ({
    doctorId,
    isActive,
    inactiveFrom,
    inactiveUntil,
    inactiveReason,
    handlingMode = 'reschedule',
    io,
}) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const queuedNotifications = [];

    try {
        const doctor = await Doctor.findById(doctorId)
            .populate('userId', 'name')
            .session(session);
        if (!doctor) {
            throw new Error('Doctor profile not found');
        }

        if (isActive) {
            doctor.isActive = true;
            doctor.inactiveFrom = null;
            doctor.inactiveUntil = null;
            doctor.inactiveReason = '';
            await doctor.save({ session });

            await session.commitTransaction();

            if (io) {
                io.to(`doctor:${doctorId}`).emit('doctor:availability-updated', {
                    doctorId,
                    isActive: true,
                    inactiveFrom: null,
                    inactiveUntil: null,
                });
            }

            return {
                doctor,
                handledAppointments: 0,
                rescheduledAppointments: 0,
                cancelledAppointments: 0,
            };
        }

        const fromDate = normalizeDate(inactiveFrom);
        const untilDate = normalizeDate(inactiveUntil);

        doctor.isActive = false;
        doctor.inactiveFrom = fromDate;
        doctor.inactiveUntil = untilDate;
        doctor.inactiveReason = inactiveReason || '';
        await doctor.save({ session });

        const affectedAppointments = await Appointment.find({
            doctorId,
            status: { $in: REBOOKABLE_STATUSES },
            slotStart: {
                $gte: fromDate,
                $lt: getEndOfInactiveRangeExclusive(untilDate),
            },
        })
            .sort({ slotStart: 1, createdAt: 1 })
            .session(session);

        let rescheduledAppointments = 0;
        let cancelledAppointments = 0;
        const searchStart = getDayAfter(untilDate);
        const doctorName = doctor.userId?.name || null;

        for (const appointment of affectedAppointments) {
            const previousSlotStart = new Date(appointment.slotStart);
            await removeAppointmentFromQueue({
                doctorId,
                date: normalizeDate(appointment.date),
                appointmentId: appointment._id,
                session,
            });

            if (handlingMode === 'reschedule') {
                const nextSlot = await findNextAvailableSlot(doctorId, searchStart, {
                    session,
                    doctorDoc: doctor,
                    searchWindowDays: 45,
                });

                if (nextSlot) {
                    const nextDate = normalizeDate(nextSlot.date);
                    const reserved = await reserveQueueToken({
                        doctorId,
                        date: nextDate,
                        appointmentId: appointment._id,
                        session,
                    });

                    appointment.date = nextDate;
                    appointment.slotStart = new Date(nextSlot.slotStart);
                    appointment.slotEnd = new Date(nextSlot.slotEnd);
                    appointment.tokenNumber = reserved.tokenNumber;
                    appointment.status = 'waiting';
                    appointment.consultationStartTime = undefined;
                    appointment.consultationEndTime = undefined;
                    appointment.consultationDuration = undefined;
                    await appointment.save({ session });

                    queuedNotifications.push({
                        type: 'rescheduled',
                        appointmentId: appointment._id,
                        patientId: appointment.patientId,
                        doctorId,
                        doctorName,
                        previousSlotStart,
                        newSlotStart: appointment.slotStart,
                        reason: doctor.inactiveReason,
                    });
                    rescheduledAppointments += 1;
                    continue;
                }
            }

            appointment.status = 'cancelled';
            await appointment.save({ session });
            queuedNotifications.push({
                type: 'cancelled',
                appointmentId: appointment._id,
                patientId: appointment.patientId,
                doctorId,
                doctorName,
                previousSlotStart,
                reason: doctor.inactiveReason,
            });
            cancelledAppointments += 1;
        }

        await session.commitTransaction();

        await Promise.allSettled(
            queuedNotifications.map((event) => (
                event.type === 'rescheduled'
                    ? notifyRescheduled(event, io)
                    : notifyCancelled(event, io)
            ))
        );

        if (io) {
            io.to(`doctor:${doctorId}`).emit('doctor:availability-updated', {
                doctorId,
                isActive: false,
                inactiveFrom: fromDate,
                inactiveUntil: untilDate,
                inactiveReason: doctor.inactiveReason,
            });
        }

        return {
            doctor,
            handledAppointments: affectedAppointments.length,
            rescheduledAppointments,
            cancelledAppointments,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = {
    updateAvailability,
};
