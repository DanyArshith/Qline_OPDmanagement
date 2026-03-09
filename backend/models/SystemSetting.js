const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: 'system',
        },
        settings: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

systemSettingSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
