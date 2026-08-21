const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true },
);

feedbackSchema.index({ studentId: 1, mealId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
