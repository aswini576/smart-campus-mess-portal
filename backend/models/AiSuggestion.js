const mongoose = require('mongoose');

const aiSuggestionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    response: {
      scaling_adjustments: [{ _id: false, item: String, delta_kg: Number }],
      efficiency_summary: String,
    },
    sourceStats: { expectedUsers: Number, mealCount: Number, historicalWasteKg: Number },
  },
  { timestamps: true, collection: 'ai_suggestions' },
);

module.exports = mongoose.model('AiSuggestion', aiSuggestionSchema);
