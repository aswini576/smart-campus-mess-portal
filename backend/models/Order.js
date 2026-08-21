const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
    status: { type: String, enum: ['booked', 'cancelled', 'attended'], default: 'booked', required: true },
    bookingTime: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

orderSchema.index(
  { studentId: 1, mealId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['booked', 'attended'] } } },
);

module.exports = mongoose.model('Order', orderSchema);
