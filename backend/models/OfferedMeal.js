const mongoose = require('mongoose');

const offeredMealSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    originalStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    claimedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    mealDate: { type: Date, required: true },
    mealType: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
    status: { type: String, required: true, enum: ['offered', 'claimed', 'expired', 'cancelled'], default: 'offered' },
    offeredTime: { type: Date, default: Date.now, required: true },
    claimedTime: { type: Date, default: null },
    expiryTime: { type: Date, required: true },
  },
  { timestamps: true, collection: 'offered_meals' },
);

offeredMealSchema.index({ status: 1, expiryTime: 1, mealDate: 1 });

module.exports = mongoose.model('OfferedMeal', offeredMealSchema);
