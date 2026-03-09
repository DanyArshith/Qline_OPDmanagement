const User = require('../models/User');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get current user's profile
 * GET /api/profile
 */
exports.getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    let doctorProfile = null;
    if (user.role === 'doctor') {
        doctorProfile = await Doctor.findOne({ userId: req.user.userId }).lean();
    }

    res.json({ success: true, user, doctorProfile });
});

/**
 * Update current user's profile
 * PUT /api/profile
 */
exports.updateProfile = asyncHandler(async (req, res) => {
    const allowed = ['name', 'phone', 'address', 'dateOfBirth', 'gender', 'emergencyContact'];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: updates },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Update doctor professional fields if applicable
    if (user.role === 'doctor') {
        const doctorFields = {};
        if (req.body.bio !== undefined) doctorFields.bio = req.body.bio;
        if (req.body.specialization !== undefined) doctorFields.specialization = req.body.specialization;
        if (req.body.department !== undefined) doctorFields.department = req.body.department;
        if (Object.keys(doctorFields).length > 0) {
            await Doctor.findOneAndUpdate({ userId: req.user.userId }, { $set: doctorFields });
        }
    }

    res.json({ success: true, user });
});
