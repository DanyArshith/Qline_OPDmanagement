const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const { validateTimeFormat, validateBreakSlots } = require('../utils/dateUtils');
const { generateSlots } = require('../services/slotService');
const User = require('../models/User');
const cacheManager = require('../utils/cacheManager');
const logger = require('../utils/logger');
const { getAverageWaitTimeByHour } = require('../services/estimationService');

/**
 * @desc    Configure doctor's schedule (working hours, breaks, consultation time, max patients)
 * @route   POST /api/doctors/configure
 * @access  Private (Doctor only)
 */
const configureSchedule = asyncHandler(async (req, res) => {
    const {
        department,
        workingHours,
        breakSlots,
        defaultConsultTime,
        maxPatientsPerDay,
    } = req.body;

    // Validate time formats
    if (!validateTimeFormat(workingHours.start) || !validateTimeFormat(workingHours.end)) {
        res.status(400);
        throw new Error('Invalid time format. Use HH:MM format');
    }

    // Validate start < end
    if (workingHours.start >= workingHours.end) {
        res.status(400);
        throw new Error('Working hours end time must be after start time');
    }

    // Validate break slots
    if (breakSlots && breakSlots.length > 0) {
        breakSlots.forEach((br) => {
            if (!validateTimeFormat(br.start) || !validateTimeFormat(br.end)) {
                res.status(400);
                throw new Error('Invalid break time format. Use HH:MM format');
            }
        });
        validateBreakSlots(breakSlots, workingHours);
    }

    // Validate consultation time
    if (defaultConsultTime < 5 || defaultConsultTime > 120) {
        res.status(400);
        throw new Error('Consultation time must be between 5 and 120 minutes');
    }

    // Validate max patients
    if (maxPatientsPerDay < 1 || maxPatientsPerDay > 200) {
        res.status(400);
        throw new Error('Max patients per day must be between 1 and 200');
    }

    // Find or create doctor profile
    let doctor = await Doctor.findOne({ userId: req.user.userId });

    if (doctor) {
        // Update existing
        doctor.department = department || doctor.department;
        doctor.workingHours = workingHours;
        doctor.breakSlots = breakSlots || [];
        doctor.defaultConsultTime = defaultConsultTime;
        doctor.maxPatientsPerDay = maxPatientsPerDay;
        doctor.isConfigured = true;
        await doctor.save();
    } else {
        // Create new
        doctor = await Doctor.create({
            userId: req.user.userId,
            department,
            workingHours,
            breakSlots: breakSlots || [],
            defaultConsultTime,
            maxPatientsPerDay,
            isConfigured: true,
        });
    }

    // Clear cache for this doctor's slots and availability
    // This ensures patients see updated schedule immediately
    const cacheTag = `doctor:${doctor._id}:slots`;
    await cacheManager.invalidateByTag(cacheTag);
    logger.info(`Cache invalidated for doctor ${doctor._id} after schedule update`);

    res.status(200).json({
        success: true,
        doctor: {
            id: doctor._id,
            department: doctor.department,
            workingHours: doctor.workingHours,
            breakSlots: doctor.breakSlots,
            defaultConsultTime: doctor.defaultConsultTime,
            maxPatientsPerDay: doctor.maxPatientsPerDay,
            isConfigured: doctor.isConfigured,
        },
    });
});

/**
 * @desc    Get logged-in doctor's schedule configuration
 * @route   GET /api/doctors/my-schedule
 * @access  Private (Doctor only)
 */
const getMySchedule = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ userId: req.user.userId });

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    res.status(200).json({
        success: true,
        doctor: {
            id: doctor._id,
            department: doctor.department,
            workingHours: doctor.workingHours,
            breakSlots: doctor.breakSlots,
            defaultConsultTime: doctor.defaultConsultTime,
            maxPatientsPerDay: doctor.maxPatientsPerDay,
            isConfigured: doctor.isConfigured,
        },
    });
});

/**
 * @desc    Get available slots for a doctor on a specific date
 * @route   GET /api/doctors/:id/slots?date=YYYY-MM-DD
 * @access  Public (or authenticated)
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
    const { id: doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
        res.status(400);
        throw new Error('Date query parameter is required');
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        res.status(400);
        throw new Error('Invalid date format');
    }

    // Generate slots
    const slots = await generateSlots(doctorId, dateObj);

    res.status(200).json({
        success: true,
        date,
        doctorId,
        slots,
    });
});

/**
 * @desc    Get today's appointments for logged-in doctor
 * @route   GET /api/doctors/today-appointments
 * @access  Private (Doctor only)
 */
const getTodayAppointments = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ userId: req.user.userId });

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    // Get today's date normalized to midnight UTC
    const today = new Date();
    const normalizedDate = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
    ));

    // Fetch appointments
    const Appointment = require('../models/Appointment');
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
 * @desc    Search/list doctors (name, department, pagination)
 * @route   GET /api/doctors
 * @access  Public
 */
const searchDoctors = asyncHandler(async (req, res) => {
    const { q, department, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    // Build user filter for name search
    let userIds;
    if (q) {
        const matchedUsers = await User.find(
            { name: { $regex: q, $options: 'i' } },
            '_id'
        ).lean();
        userIds = matchedUsers.map((u) => u._id);
    }

    // Build doctor filter
    const filter = {};
    if (userIds) filter.userId = { $in: userIds };
    if (department) filter.department = department;

    const total = await Doctor.countDocuments(filter);
    const doctors = await Doctor.find(filter)
        .populate('userId', 'name email')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

    const pages = Math.ceil(total / limitNum);

    // Calculate waiting times for each doctor
    const doctorsWithDetails = await Promise.all(
        doctors.map(async (d) => {
            // Get today's appointments for this doctor
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Count current waiting patients
            const waitingCount = await Appointment.countDocuments({
                doctorId: d._id,
                date: { $gte: today, $lt: tomorrow },
                status: { $in: ['waiting', 'booked'] }
            });

            // Calculate average waiting time
            // Get completed appointments from last 30 days and calculate average
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const completedAppointments = await Appointment.countDocuments({
                doctorId: d._id,
                status: 'completed',
                createdAt: { $gte: thirtyDaysAgo }
            });

            // Average based on doctor's consultation time and historical data
            // Formula: Number of Patients in Queue * Average Consultation Time
            const avgTime = d.averageConsultTime || d.defaultConsultTime || 15;
            let estimatedWaitTime = avgTime * waitingCount;
            
            // Cap at 180 minutes max estimate (bumped up to be more realistic for busy OPDs)
            estimatedWaitTime = Math.min(estimatedWaitTime, 180);

            return {
                ...d,
                user: d.userId,
                waitingTime: {
                    estimatedWaitMinutes: Math.round(estimatedWaitTime),
                    patientsInQueue: waitingCount,
                    averageConsultationTime: avgTime,
                    description: `${Math.round(estimatedWaitTime)} min wait • ${waitingCount} in queue`
                }
            };
        })
    );

    res.status(200).json({
        success: true,
        data: doctorsWithDetails,
        total,
        page: pageNum,
        pages,
    });
});

/**
 * @desc    Get a single doctor profile by ID
 * @route   GET /api/doctors/:id
 * @access  Public
 */
const getDoctorById = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id)
        .populate('userId', 'name email')
        .lean();

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    // Calculate waiting time for this doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const waitingCount = await Appointment.countDocuments({
        doctorId: doctor._id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['waiting', 'booked'] }
    });

    const estimatedWaitTime = Math.min(doctor.defaultConsultTime * (waitingCount + 1), 120);

    // Expose a convenience `user` field matching frontend expectation
    res.status(200).json({
        success: true,
        data: {
            ...doctor,
            user: doctor.userId,
            waitingTime: {
                estimatedWaitMinutes: Math.round(estimatedWaitTime),
                patientsInQueue: waitingCount,
                averageConsultationTime: doctor.defaultConsultTime,
                description: `${Math.round(estimatedWaitTime)} min wait • ${waitingCount} in queue`
            }
        },
    });
});

module.exports = {
    configureSchedule,
    getMySchedule,
    getAvailableSlots,
    getTodayAppointments,
    searchDoctors,
    getDoctorById,
};
