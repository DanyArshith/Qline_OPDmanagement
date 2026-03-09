const queueService = require('../services/queueService');
const asyncHandler = require('../utils/asyncHandler');
const Doctor = require('../models/Doctor');

const resolveDoctorProfileId = async (userId, res) => {
    const doctor = await Doctor.findOne({ userId }).select('_id').lean();
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }
    return doctor._id;
};

/**
 * Call Next Patient
 * POST /api/queue/call-next
 */
exports.callNextPatient = asyncHandler(async (req, res) => {
    const doctorId = await resolveDoctorProfileId(req.user.userId, res);
    const { date } = req.body;

    const result = await queueService.callNextPatient(doctorId, date, req.app.get('io'), req);

    res.json(result);
});

/**
 * Mark Patient as Completed
 * POST /api/queue/mark-completed
 */
exports.markCompleted = asyncHandler(async (req, res) => {
    const doctorId = await resolveDoctorProfileId(req.user.userId, res);
    const { date } = req.body;

    const result = await queueService.markCompleted(doctorId, date, req.app.get('io'), req);

    res.json(result);
});

/**
 * Mark Patient as No Show
 * POST /api/queue/mark-no-show
 */
exports.markNoShow = asyncHandler(async (req, res) => {
    const doctorId = await resolveDoctorProfileId(req.user.userId, res);
    const { date } = req.body;

    const result = await queueService.markNoShow(doctorId, date, req.app.get('io'), req);

    res.json(result);
});

/**
 * Pause Queue
 * POST /api/queue/pause
 */
exports.pauseQueue = asyncHandler(async (req, res) => {
    const doctorId = await resolveDoctorProfileId(req.user.userId, res);
    const { date } = req.body;

    const result = await queueService.pauseQueue(doctorId, date, req.app.get('io'));

    res.json(result);
});

/**
 * Resume Queue
 * POST /api/queue/resume
 */
exports.resumeQueue = asyncHandler(async (req, res) => {
    const doctorId = await resolveDoctorProfileId(req.user.userId, res);
    const { date } = req.body;

    const result = await queueService.resumeQueue(doctorId, date, req.app.get('io'));

    res.json(result);
});

/**
 * Get Current Queue State
 * GET /api/queue/current-state
 */
exports.getCurrentState = asyncHandler(async (req, res) => {
    const doctorId = await resolveDoctorProfileId(req.user.userId, res);
    const { date } = req.query;

    const state = await queueService.getQueueState(doctorId, date);

    res.json(state);
});
