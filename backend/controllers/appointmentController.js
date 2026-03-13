const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const DailyQueue = require('../models/DailyQueue');
const QueueEvent = require('../models/QueueEvent');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeDate, isInPast, getSlotDuration } = require('../utils/dateUtils');
const notificationService = require('../services/notificationService');

/**
 * @desc    Book an appointment slot (Transaction-safe with conditional atomic increment)
 * @route   POST /api/appointments/book
 * @access  Private (Patient only)
 */
const bookAppointment = asyncHandler(async (req, res) => {
    const { doctorId, date, slotStart, slotEnd } = req.body;
    const patientId = req.user.userId;

    const dateObj = new Date(date);
    const slotStartDate = new Date(slotStart);
    const slotEndDate = new Date(slotEnd);

    // 1. Fetch doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.workingHours || !doctor.defaultConsultTime || !doctor.maxPatientsPerDay) {
        res.status(400);
        throw new Error('Doctor has not fully configured their schedule');
    }

    // 2. Normalize date
    const normalizedDate = normalizeDate(dateObj);

    // 3. Validate slot day matches
    const slotDay = normalizeDate(slotStartDate);
    if (slotDay.getTime() !== normalizedDate.getTime()) {
        res.status(400);
        throw new Error('Slot must be on the same day as booking date');
    }

    // 4. Validate time range
    if (slotEndDate <= slotStartDate) {
        res.status(400);
        throw new Error('Invalid slot time range');
    }

    // 5. Validate slot duration
    const duration = getSlotDuration(slotStartDate, slotEndDate);
    const expectedDuration = doctor.defaultConsultTime * 60 * 1000;
    if (Math.abs(duration - expectedDuration) > 1000) {
        res.status(400);
        throw new Error(`Slot duration must be exactly ${doctor.defaultConsultTime} minutes`);
    }

    // 6. Check not in past
    if (isInPast(slotStartDate)) {
        res.status(400);
        throw new Error('Cannot book appointments in the past');
    }

    // 7. Check slot not already booked (atomic: slot uniqueness via unique index)
    const existingSlot = await Appointment.findOne({
        doctorId,
        date: normalizedDate,
        slotStart: slotStartDate,
        status: { $in: ['booked', 'waiting', 'in_progress'] },
    });
    if (existingSlot) {
        res.status(409);
        throw new Error('This slot is no longer available');
    }

    // 8. Atomic increment queue count (upsert creates queue if not exists)
    const queue = await DailyQueue.findOneAndUpdate(
        {
            doctorId,
            date: normalizedDate,
            appointmentCount: { $lt: doctor.maxPatientsPerDay },
        },
        { $inc: { appointmentCount: 1, lastTokenNumber: 1 } },
        { new: true, upsert: true }
    );

    if (!queue) {
        res.status(400);
        throw new Error('Doctor has reached maximum appointments for this day');
    }

    const tokenNumber = queue.lastTokenNumber;

    // 9. Create the appointment
    let createdAppointment;
    try {
        createdAppointment = await Appointment.create({
            doctorId,
            patientId,
            date: normalizedDate,
            slotStart: slotStartDate,
            slotEnd: slotEndDate,
            tokenNumber,
            status: 'waiting',
        });
    } catch (err) {
        // Roll back the queue increment on failure
        await DailyQueue.findOneAndUpdate(
            { doctorId, date: normalizedDate },
            { $inc: { appointmentCount: -1, lastTokenNumber: -1 } }
        );
        if (err.code === 11000) {
            res.status(409);
            throw new Error('This slot is no longer available');
        }
        throw err;
    }

    // 10. Add to queue waiting list
    await DailyQueue.findOneAndUpdate(
        { doctorId, date: normalizedDate },
        {
            $push: {
                waitingList: {
                    appointmentId: createdAppointment._id,
                    tokenNumber,
                    status: 'waiting',
                },
            },
        }
    );

    // 11. Log queue events (best-effort)
    QueueEvent.create([
        {
            appointmentId: createdAppointment._id,
            doctorId,
            patientId,
            queueId: queue._id,
            event: 'created',
            timestamp: new Date(),
            metadata: { tokenNumber, estimatedWaitTime: 0 }
        },
        {
            appointmentId: createdAppointment._id,
            doctorId,
            patientId,
            queueId: queue._id,
            event: 'waiting',
            previousEvent: 'created',
            timestamp: new Date(),
            metadata: { tokenNumber, position: queue.appointmentCount }
        }
    ]).catch(() => {});

    // Notifications (best-effort)
    notificationService
        .sendAppointmentBookedNotification(createdAppointment, req.app.get('io'))
        .catch(() => {});

    res.status(201).json({
        success: true,
        appointment: createdAppointment,
        message: `Appointment booked successfully. Token number: ${tokenNumber}`,
    });
});

/**
 * @desc    Get patient's appointments (upcoming and past)
 * @route   GET /api/appointments/my-appointments
 * @access  Private (Patient only)
 */
const getMyAppointments = asyncHandler(async (req, res) => {
    const patientId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));

    const total = await Appointment.countDocuments({ patientId });
    const appointments = await Appointment.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .sort({ slotStart: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const pages = Math.ceil(total / limit);

    // Reshape so frontend can read appt.doctorId.name and appt.doctorId.department
    const shaped = appointments.map((a) => ({
        ...a,
        doctorId: a.doctorId
            ? { ...a.doctorId, name: a.doctorId.userId?.name }
            : null,
    }));

    res.status(200).json({
        success: true,
        data: shaped,
        total,
        page,
        pages,
    });
});

/**
 * @desc    Get doctor's appointments for a specific date
 * @route   GET /api/appointments/doctor-appointments?date=YYYY-MM-DD
 * @access  Private (Doctor only)
 */
const getDoctorAppointments = asyncHandler(async (req, res) => {
    const { date } = req.query;

    if (!date) {
        res.status(400);
        throw new Error('Date query parameter is required');
    }

    const doctor = await Doctor.findOne({ userId: req.user.userId });

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    const normalizedDate = normalizeDate(new Date(date));

    const appointments = await Appointment.find({
        doctorId: doctor._id,
        date: normalizedDate,
    })
        .populate('patientId', 'name email')
        .sort({ slotStart: 1 })
        .lean();

    res.status(200).json({
        success: true,
        date: normalizedDate,
        count: appointments.length,
        appointments,
    });
});

/**
 * @desc    Cancel an appointment (Patient or Doctor)
 * @route   DELETE /api/appointments/:id/cancel
 * @access  Private (Patient or Doctor who owns the appointment)
 */
const cancelAppointment = asyncHandler(async (req, res) => {
    const { id: appointmentId } = req.params;
    const userId = req.user.userId;

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Fetch appointment with session and exec()
        const appointment = await Appointment.findById(appointmentId)
            .session(session)
            .exec();

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        // 2. Validate ownership (patient or doctor)
        const doctor = await Doctor.findById(appointment.doctorId).session(session);
        const isPatient = appointment.patientId.toString() === userId;
        const isDoctor = doctor && doctor.userId.toString() === userId;

        if (!isPatient && !isDoctor) {
            throw new Error('Unauthorized to cancel this appointment');
        }

        // 3. Prevent double cancellation
        if (appointment.status === 'cancelled') {
            throw new Error('Appointment already cancelled');
        }

        const previousStatus = appointment.status;

        // 4. Update appointment status
        appointment.status = 'cancelled';
        await appointment.save({ session });

        // 5. Atomic decrement
        const queue = await DailyQueue.findOneAndUpdate(
            { doctorId: appointment.doctorId, date: appointment.date },
            { $inc: { appointmentCount: -1 } },
            { new: true, session }
        );

        // 6. Safeguard against negative count
        if (queue && queue.appointmentCount < 0) {
            throw new Error('Invalid queue state - negative count');
        }

        // 7. Update waiting list status
        await DailyQueue.findOneAndUpdate(
            { doctorId: appointment.doctorId, date: appointment.date },
            {
                $set: {
                    'waitingList.$[elem].status': 'cancelled',
                },
            },
            {
                arrayFilters: [{ 'elem.appointmentId': appointmentId }],
                session,
            }
        );

        await QueueEvent.create([{
            appointmentId: appointment._id,
            doctorId: appointment.doctorId,
            patientId: appointment.patientId,
            queueId: queue?._id,
            event: 'cancelled',
            previousEvent: previousStatus,
            timestamp: new Date(),
            metadata: {
                tokenNumber: appointment.tokenNumber,
            },
        }], { session });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully',
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400);
        throw error;
    } finally {
        session.endSession();
    }
});


/**
 * @desc    Set priority for an appointment (doctor only)
 * @route   PATCH /api/appointments/:id/priority
 * @access  Private (Doctor only)
 */
const setPriority = asyncHandler(async (req, res) => {
    const { id: appointmentId } = req.params;
    const { priority, priorityNote } = req.body;
    const doctorUserId = req.user.userId;

    const validPriorities = ['emergency', 'senior', 'standard'];
    if (!validPriorities.includes(priority)) {
        res.status(400);
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    const doctor = await require('../models/Doctor').findOne({ userId: doctorUserId }).lean();
    if (!doctor) {
        res.status(403);
        throw new Error('Doctor profile not found');
    }

    const appointment = await Appointment.findOneAndUpdate(
        { _id: appointmentId, doctorId: doctor._id },
        { $set: { priority, priorityNote: priorityNote || '' } },
        { new: true }
    );

    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found or you do not have permission');
    }

    // Emit real-time update so queue display re-sorts
    const io = req.app.get('io');
    if (io) {
        io.to(`doctor:${doctor._id}:${appointment.date.toISOString().split('T')[0]}`).emit('queue:priority-updated', {
            appointmentId: appointment._id,
            tokenNumber: appointment.tokenNumber,
            priority,
            priorityNote
        });
    }

    res.status(200).json({
        success: true,
        message: `Appointment priority set to ${priority}`,
        appointment: {
            _id: appointment._id,
            tokenNumber: appointment.tokenNumber,
            priority: appointment.priority,
            priorityNote: appointment.priorityNote
        }
    });
});

/**
 * @desc    Get live wait time estimate for patient
 * @route   GET /api/appointments/:id/wait-info
 * @access  Private (Patient)
 */
const getWaitInfo = asyncHandler(async (req, res) => {
    const { id: appointmentId } = req.params;
    const { estimationService } = require('../services/estimationService');

    // Verify ownership: allow patient to query their own appointment
    const appointment = await Appointment.findById(appointmentId)
        .select('patientId doctorId status')
        .lean();

    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    if (appointment.patientId.toString() !== req.user.userId) {
        res.status(403);
        throw new Error('Not authorized to view this appointment');
    }

    const waitInfo = await require('../services/estimationService').getPatientWaitInfo(appointmentId);

    res.status(200).json({
        success: true,
        ...waitInfo
    });
});

/**
 * @desc    Get a single appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private (patient who owns it or the associated doctor)
 */
const getAppointmentById = asyncHandler(async (req, res) => {
    const { id: appointmentId } = req.params;
    const { userId, role } = req.user;

    const appointment = await Appointment.findById(appointmentId)
        .populate('patientId', 'name email')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .lean();

    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    // Authorisation: patient owns it, or doctor is the treating doctor
    const isPatient = appointment.patientId?._id?.toString() === userId;
    const Doctor = require('../models/Doctor');
    let isDoctor = false;
    if (role === 'doctor') {
        const doc = await Doctor.findOne({ userId }).lean();
        isDoctor = doc && doc._id.toString() === appointment.doctorId?._id?.toString();
    }

    if (!isPatient && !isDoctor && role !== 'admin') {
        res.status(403);
        throw new Error('Not authorised to view this appointment');
    }

    // Reshape doctorId to include name
    const shaped = {
        ...appointment,
        doctorId: appointment.doctorId
            ? { ...appointment.doctorId, name: appointment.doctorId.userId?.name }
            : null,
    };

    res.status(200).json({ success: true, data: shaped });
});

module.exports = {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    cancelAppointment,
    setPriority,
    getWaitInfo,
    getAppointmentById,
};

