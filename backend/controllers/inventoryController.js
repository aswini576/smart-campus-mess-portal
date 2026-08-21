const Inventory = require('../models/Inventory');
const InventoryUsage = require('../models/InventoryUsage');
const mongoose = require('mongoose');
async function getInventory(_request, response, next) { try { return response.status(200).json({ items: await Inventory.find().sort({ itemName: 1 }) }); } catch (error) { return next(error); } }
async function createInventoryItem(request, response, next) { try { const item = await Inventory.create(request.body); return response.status(201).json({ item }); } catch (error) { return next(error); } }
async function updateInventoryItem(request, response, next) { try { const item = await Inventory.findByIdAndUpdate(request.params.itemId, { ...request.body, updatedDate: new Date() }, { new: true, runValidators: true }); if (!item) return response.status(404).json({ message: 'Inventory item not found.' }); return response.status(200).json({ item }); } catch (error) { return next(error); } }
async function deleteInventoryItem(request, response, next) { try { const item = await Inventory.findByIdAndDelete(request.params.itemId); if (!item) return response.status(404).json({ message: 'Inventory item not found.' }); return response.status(204).send(); } catch (error) { return next(error); } }
async function getLowStock(_request, response, next) {
  try { const items = await Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }).sort({ quantity: 1 }); return response.status(200).json({ items }); } catch (error) { return next(error); }
}
async function recordUsage(request, response, next) {
  const session = await mongoose.startSession();
  try {
    const { quantity, note, mealId } = request.body;
    if (!quantity || Number(quantity) <= 0) return response.status(400).json({ message: 'Usage quantity must be greater than zero.' });
    let usage;
    await session.withTransaction(async () => {
      const item = await Inventory.findOneAndUpdate({ _id: request.params.itemId, quantity: { $gte: Number(quantity) } }, { $inc: { quantity: -Number(quantity) }, $set: { updatedDate: new Date() } }, { new: true, session });
      if (!item) throw Object.assign(new Error('Insufficient stock or ingredient not found.'), { statusCode: 400 });
      [usage] = await InventoryUsage.create([{ inventoryId: item._id, itemName: item.itemName, quantity: Number(quantity), unit: item.unit, mealId: mealId || null, note, usedBy: request.user._id }], { session });
    });
    return response.status(201).json({ usage });
  } catch (error) { return next(error); } finally { await session.endSession(); }
}
async function getUsageHistory(_request, response, next) {
  try { const usage = await InventoryUsage.find().populate('usedBy', 'name').populate('mealId', 'foodName mealType').sort({ usedAt: -1 }).limit(100); return response.status(200).json({ usage }); } catch (error) { return next(error); }
}
async function getInventoryDashboard(_request, response, next) {
  try {
    const [items, lowStockItems, recentUsage] = await Promise.all([Inventory.find().sort({ itemName: 1 }), Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }).sort({ quantity: 1 }), InventoryUsage.find().populate('usedBy', 'name').sort({ usedAt: -1 }).limit(8)]);
    return response.status(200).json({ totalItems: items.length, items, lowStockCount: lowStockItems.length, lowStockItems, recentUsage });
  } catch (error) { return next(error); }
}
module.exports = { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStock, recordUsage, getUsageHistory, getInventoryDashboard };
