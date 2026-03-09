const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const {
    normalizeDate,
    parseTimeString,
    addMinutes,
    hasOverlap,
} = require('../utils/dateUtils');

/**
 * Generate available time slots for a doctor on a specific date
 * @param {string} doctorId - Doctor's MongoDB ID
 * @param {Date|string} date - Date to generate slots for
 * @returns {Promise<Array>} - Array of slot objects with availability status
 */
const generateSlots = async (doctorId, date) => {
    // 1. Fetch doctor configuration
    const doctor = await Doctor.findById(doctorId);

    // 2. Validate doctor is fully configured
    if (
        !doctor ||
        !doctor.workingHours ||
        !doctor.defaultConsultTime ||
        !doctor.maxPatientsPerDay
    ) {
        throw new Error('Doctor has not fully configured their schedule');
    }

    // 3. Normalize date to midnight UTC
    const normalizedDate = normalizeDate(date);

    // 4. Parse working hours to full Date objects
    const workStart = parseTimeString(
        doctor.workingHours.start,
        normalizedDate
    );
    const workEnd = parseTimeString(doctor.workingHours.end, normalizedDate);

    // 5. Parse break slots to full Date objects
    const breaks = (doctor.breakSlots || []).map((br) => ({
        start: parseTimeString(br.start, normalizedDate),
        end: parseTimeString(br.end, normalizedDate),
    }));

    // 6. Generate all possible slots
    const slots = [];
    let currentTime = new Date(workStart);
    const consultTimeMs = doctor.defaultConsultTime * 60 * 1000;

    while (currentTime.getTime() + consultTimeMs <= workEnd.getTime()) {
        const slotEnd = addMinutes(currentTime, doctor.defaultConsultTime);

        // Check if slot overlaps with any break
        const overlapsBreak = breaks.some((br) =>
            hasOverlap(currentTime, slotEnd, br.start, br.end)
        );

        if (!overlapsBreak) {
            slots.push({
                start: new Date(currentTime),
                end: new Date(slotEnd),
                available: true, // Will be updated based on bookings
            });
        }

        currentTime = new Date(slotEnd);
    }

    // 7. Fetch existing appointments (only booked and in_progress)
    // CRITICAL: Cancelled appointments must NOT block slots
    const existingAppointments = await Appointment.find({
        doctorId,
        date: normalizedDate,
        status: { $in: ['booked', 'waiting', 'in_progress'] },
    }).lean();

    // 8. Mark slots as unavailable if booked
    slots.forEach((slot) => {
        const isBooked = existingAppointments.some(
            (apt) => apt.slotStart.getTime() === slot.start.getTime()
        );
        slot.available = !isBooked;
    });

    return slots;
};

/**
 * Check if a specific slot is available for booking
 * @param {string} doctorId - Doctor's MongoDB ID
 * @param {Date} date - Normalized date
 * @param {Date} slotStart - Start time of slot
 * @param {Date} slotEnd - End time of slot
 * @returns {Promise<Object>} - { available: boolean, message: string }
 */
const checkSlotAvailability = async (doctorId, date, slotStart, slotEnd) => {
    // 1. Fetch doctor configuration
    const doctor = await Doctor.findById(doctorId);

    // 2. Validate complete doctor configuration
    if (
        !doctor ||
        !doctor.workingHours ||
        !doctor.defaultConsultTime ||
        !doctor.maxPatientsPerDay
    ) {
        return {
            available: false,
            message: 'Doctor has not fully configured their schedule',
        };
    }

    // 3. Normalize date
    const normalizedDate = normalizeDate(date);

    // 4. Validate same day
    const slotDay = normalizeDate(slotStart);
    if (slotDay.getTime() !== normalizedDate.getTime()) {
        return {
            available: false,
            message: 'Slot date does not match booking date',
        };
    }

    // 5. Parse working hours
    const workStart = parseTimeString(
        doctor.workingHours.start,
        normalizedDate
    );
    const workEnd = parseTimeString(doctor.workingHours.end, normalizedDate);

    // 6. Check slot is within working hours
    if (slotStart < workStart || slotEnd > workEnd) {
        return {
            available: false,
            message: 'Slot is outside doctor working hours',
        };
    }

    // 7. Check slot doesn't overlap with breaks
    const breaks = (doctor.breakSlots || []).map((br) => ({
        start: parseTimeString(br.start, normalizedDate),
        end: parseTimeString(br.end, normalizedDate),
    }));

    const overlapsBreak = breaks.some((br) =>
        hasOverlap(slotStart, slotEnd, br.start, br.end)
    );

    if (overlapsBreak) {
        return {
            available: false,
            message: 'Slot overlaps with doctor break time',
        };
    }

    // 8. Check slot not already booked
    const existingAppointment = await Appointment.findOne({
        doctorId,
        date: normalizedDate,
        slotStart,
        status: { $in: ['booked', 'waiting', 'in_progress'] },
    });

    if (existingAppointment) {
        return {
            available: false,
            message: 'This slot is already booked',
        };
    }

    // 9. Check daily capacity not reached
    const appointmentsCount = await Appointment.countDocuments({
        doctorId,
        date: normalizedDate,
        status: { $in: ['booked', 'waiting', 'in_progress'] },
    });

    if (appointmentsCount >= doctor.maxPatientsPerDay) {
        return {
            available: false,
            message: 'Doctor has reached maximum appointments for this day',
        };
    }

    return {
        available: true,
        message: 'Slot is available',
    };
};

module.exports = {
    generateSlots,
    checkSlotAvailability,
};
