const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true, unique: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    lowStockThreshold: { type: Number, default: 0, min: 0 },
    updatedDate: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Inventory', inventorySchema);
