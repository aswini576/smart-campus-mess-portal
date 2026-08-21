const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const mealSchema = new mongoose.Schema(
  {
    mealType: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
    foodName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    bookingDeadline: { type: Date, required: true },
    isAvailable: { type: Boolean, default: true },
    quantity: { type: Number, required: true, min: 0 },
    ingredients: { type: [ingredientSchema], default: [] },
  },
  { timestamps: true },
);

mealSchema.index({ mealType: 1, date: 1 });

module.exports = mongoose.model('Meal', mealSchema);
