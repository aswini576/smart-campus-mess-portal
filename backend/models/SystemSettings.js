const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    campusName: { type: String, default: 'CampusBite' },
    bookingReminderHours: { type: Number, default: 4, min: 0 },
    allowStudentCancellation: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
