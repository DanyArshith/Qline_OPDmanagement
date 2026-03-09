const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Create medical record (doctor only)
 * POST /api/medical-records
 */
exports.createRecord = asyncHandler(async (req, res) => {
    const doctorUserId = req.user.userId;
    const {
        appointmentId,
        chiefComplaint,
        symptoms,
        diagnosis,
        notes,
        medications,
        labTests,
        vitals,
        followUp
    } = req.body;

    // Fetch appointment with doctor populated
    const appointment = await Appointment.findById(appointmentId)
        .populate({ path: 'doctorId', populate: { path: 'userId' } });

    if (!appointment) {
        return res.status(404).json({
            success: false,
            error: 'Appointment not found'
        });
    }

    // Verify doctor owns this appointment
    if (appointment.doctorId.userId._id.toString() !== doctorUserId) {
        return res.status(403).json({
            success: false,
            error: 'You are not authorized to create a record for this appointment'
        });
    }

    // Check if record already exists
    const existingRecord = await MedicalRecord.findOne({ appointmentId });
    if (existingRecord) {
        return res.status(400).json({
            success: false,
            error: 'Medical record already exists for this appointment'
        });
    }

    // Create medical record
    const record = await MedicalRecord.create({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId._id,
        appointmentId,
        date: appointment.date,
        chiefComplaint,
        symptoms,
        diagnosis,
        notes,
        medications,
        labTests,
        vitals,
        followUp
    });

    // Update appointment status to completed
    appointment.status = 'completed';
    await appointment.save();

    logger.info(`Medical record created for appointment ${appointmentId}`);

    res.status(201).json({
        success: true,
        record
    });
});

/**
 * Get patient medical history (doctor or patient themselves)
 * GET /api/medical-records/patient/:patientId
 */
exports.getPatientHistory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { patientId } = req.params;

    // Patients can only view their own records
    if (req.user.role === 'patient' && userId !== patientId) {
        return res.status(403).json({
            success: false,
            error: 'You can only view your own medical records'
        });
    }

    const records = await MedicalRecord.find({ patientId })
        .populate('doctorId')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
        .sort({ date: -1 });

    res.json({
        success: true,
        count: records.length,
        records
    });
});

/**
 * Get my medical history (patient only)
 * GET /api/medical-records/my-history
 */
exports.getMyHistory = asyncHandler(async (req, res) => {
    const patientId = req.user.userId;

    const records = await MedicalRecord.find({ patientId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
        .populate({ path: 'appointmentId', select: 'date slotStart slotEnd tokenNumber' })
        .sort({ date: -1 });

    res.json({
        success: true,
        count: records.length,
        records
    });
});

/**
 * Get single medical record
 * GET /api/medical-records/:id
 */
exports.getRecord = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const record = await MedicalRecord.findById(id)
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
        .populate('patientId', 'name email')
        .populate('appointmentId');

    if (!record) {
        return res.status(404).json({
            success: false,
            error: 'Medical record not found'
        });
    }

    // Check authorization - doctor who created it or patient
    const isDoctorOwner = record.doctorId.userId._id.toString() === userId;
    const isPatientOwner = record.patientId._id.toString() === userId;

    if (!isDoctorOwner && !isPatientOwner) {
        return res.status(403).json({
            success: false,
            error: 'You are not authorized to view this record'
        });
    }

    res.json({
        success: true,
        record
    });
});

/**
 * Update medical record (doctor only, own records only)
 * PATCH /api/medical-records/:id
 */
exports.updateRecord = asyncHandler(async (req, res) => {
    const doctorUserId = req.user.userId;
    const { id } = req.params;

    const record = await MedicalRecord.findById(id)
        .populate({ path: 'doctorId', populate: { path: 'userId' } });

    if (!record) {
        return res.status(404).json({
            success: false,
            error: 'Medical record not found'
        });
    }

    // Verify doctor owns this record
    if (record.doctorId.userId._id.toString() !== doctorUserId) {
        return res.status(403).json({
            success: false,
            error: 'You can only update your own medical records'
        });
    }

    // Update allowed fields
    const allowedUpdates = [
        'chiefComplaint',
        'symptoms',
        'diagnosis',
        'notes',
        'medications',
        'labTests',
        'vitals',
        'followUp'
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            record[field] = req.body[field];
        }
    });

    await record.save();

    logger.info(`Medical record ${id} updated by doctor ${doctorUserId}`);

    res.json({
        success: true,
        record
    });
});
