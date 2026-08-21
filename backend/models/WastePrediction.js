const mongoose = require('mongoose');

const wastePredictionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    expectedUsers: { type: Number, required: true, min: 0 },
    foodRequired: { type: Number, required: true, min: 0 },
    wasteAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('WastePrediction', wastePredictionSchema);
