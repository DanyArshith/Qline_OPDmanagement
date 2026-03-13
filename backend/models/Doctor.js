const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
        },
        defaultConsultTime: {
            type: Number, // in minutes
            default: 15,
            min: [5, 'Consultation time must be at least 5 minutes'],
        },
        maxPatientsPerDay: {
            type: Number,
            default: 50,
            min: [1, 'Must allow at least 1 patient per day'],
        },
        averageConsultTime: {
            type: Number,
            default: 15,
        },
        workingHours: {
            start: {
                type: String, // Format: "HH:MM"
                required: true,
            },
            end: {
                type: String, // Format: "HH:MM"
                required: true,
            },
        },
        breakSlots: [
            {
                start: String, // Format: "HH:MM"
                end: String, // Format: "HH:MM"
            },
        ],
        timezone: {
            type: String,
            default: 'UTC',
            // Common values: 'UTC', 'America/New_York', 'Asia/Kolkata', etc.
            // Defines how to interpret workingHours times
        },
        isConfigured: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
doctorSchema.index({ userId: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
