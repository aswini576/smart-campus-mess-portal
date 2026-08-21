const mongoose = require('mongoose');

const inventoryUsageSchema = new mongoose.Schema(
  {
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: String, required: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', default: null },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    usedAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

inventoryUsageSchema.index({ inventoryId: 1, usedAt: -1 });
module.exports = mongoose.model('InventoryUsage', inventoryUsageSchema);
