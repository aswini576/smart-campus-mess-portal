const { getPool } = require('../config/db');

const itemSelect = `SELECT id AS _id, item_name AS itemName, quantity, unit,
  low_stock_threshold AS lowStockThreshold, updated_at AS updatedDate,
  created_at AS createdAt, updated_at AS updatedAt FROM inventory`;
const usageSelect = `SELECT iu.id AS _id, iu.inventory_id AS inventoryId, iu.item_name AS itemName,
  iu.quantity, iu.unit, iu.note, iu.used_at AS usedAt, iu.created_at AS createdAt,
  u.id AS usedById, u.name AS usedByName, m.id AS mealIdValue,
  m.food_name AS mealFoodName, m.meal_type AS mealType FROM inventory_usage iu
  JOIN users u ON u.id = iu.used_by LEFT JOIN meals m ON m.id = iu.meal_id`;

const presentUsage = (row) => ({
  _id: row._id, inventoryId: row.inventoryId, itemName: row.itemName,
  quantity: row.quantity, unit: row.unit, note: row.note, usedAt: row.usedAt, createdAt: row.createdAt,
  usedBy: { _id: row.usedById, name: row.usedByName },
  mealId: row.mealIdValue ? { _id: row.mealIdValue, foodName: row.mealFoodName, mealType: row.mealType } : null,
});
const validNumber = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;
function validateItem(body) {
  if (!body.itemName?.trim() || !body.unit?.trim()) return 'Item name and unit are required.';
  if (!validNumber(body.quantity) || !validNumber(body.lowStockThreshold ?? 0)) return 'Quantity and low-stock threshold must be 0 or more.';
  return null;
}

async function getInventory(_request, response, next) {
  try { const [items] = await getPool().query(`${itemSelect} ORDER BY item_name`); return response.json({ items }); } catch (error) { return next(error); }
}
async function createInventoryItem(request, response, next) {
  try {
    const message = validateItem(request.body); if (message) return response.status(400).json({ message });
    const { itemName, quantity, unit, lowStockThreshold = 0 } = request.body;
    const [result] = await getPool().execute('INSERT INTO inventory (item_name, quantity, unit, low_stock_threshold) VALUES (?, ?, ?, ?)', [itemName.trim(), Number(quantity), unit.trim(), Number(lowStockThreshold)]);
    const [items] = await getPool().execute(`${itemSelect} WHERE id = ?`, [result.insertId]);
    return response.status(201).json({ item: items[0] });
  } catch (error) { return next(error); }
}
async function updateInventoryItem(request, response, next) {
  try {
    const message = validateItem(request.body); if (message) return response.status(400).json({ message });
    const { itemName, quantity, unit, lowStockThreshold = 0 } = request.body;
    const [result] = await getPool().execute('UPDATE inventory SET item_name = ?, quantity = ?, unit = ?, low_stock_threshold = ? WHERE id = ?', [itemName.trim(), Number(quantity), unit.trim(), Number(lowStockThreshold), request.params.itemId]);
    if (!result.affectedRows) return response.status(404).json({ message: 'Inventory item not found.' });
    const [items] = await getPool().execute(`${itemSelect} WHERE id = ?`, [request.params.itemId]);
    return response.json({ item: items[0] });
  } catch (error) { return next(error); }
}
async function deleteInventoryItem(request, response, next) {
  try { const [result] = await getPool().execute('DELETE FROM inventory WHERE id = ?', [request.params.itemId]); return result.affectedRows ? response.status(204).send() : response.status(404).json({ message: 'Inventory item not found.' }); } catch (error) { return next(error); }
}
async function getLowStock(_request, response, next) {
  try { const [items] = await getPool().query(`${itemSelect} WHERE quantity <= low_stock_threshold ORDER BY quantity`); return response.json({ items }); } catch (error) { return next(error); }
}
async function recordUsage(request, response, next) {
  const connection = await getPool().getConnection();
  try {
    const quantity = Number(request.body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return response.status(400).json({ message: 'Usage quantity must be greater than zero.' });
    await connection.beginTransaction();
    const [items] = await connection.execute('SELECT id, item_name, quantity, unit FROM inventory WHERE id = ? FOR UPDATE', [request.params.itemId]);
    const item = items[0];
    if (!item || Number(item.quantity) < quantity) throw Object.assign(new Error('Insufficient stock or ingredient not found.'), { statusCode: 400 });
    const mealId = request.body.mealId || null;
    if (mealId) { const [meals] = await connection.execute('SELECT id FROM meals WHERE id = ?', [mealId]); if (!meals.length) throw Object.assign(new Error('Meal not found.'), { statusCode: 400 }); }
    await connection.execute('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [quantity, item.id]);
    const [result] = await connection.execute('INSERT INTO inventory_usage (inventory_id, item_name, quantity, unit, meal_id, note, used_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [item.id, item.item_name, quantity, item.unit, mealId, request.body.note?.trim() || '', request.user.id]);
    await connection.commit();
    const [rows] = await getPool().execute(`${usageSelect} WHERE iu.id = ?`, [result.insertId]);
    return response.status(201).json({ usage: presentUsage(rows[0]) });
  } catch (error) { await connection.rollback(); return next(error); } finally { connection.release(); }
}
async function getUsageHistory(_request, response, next) {
  try { const [rows] = await getPool().query(`${usageSelect} ORDER BY iu.used_at DESC LIMIT 100`); return response.json({ usage: rows.map(presentUsage) }); } catch (error) { return next(error); }
}
async function getInventoryDashboard(_request, response, next) {
  try {
    const [[items], [lowStockItems], [usageRows]] = await Promise.all([
      getPool().query(`${itemSelect} ORDER BY item_name`),
      getPool().query(`${itemSelect} WHERE quantity <= low_stock_threshold ORDER BY quantity`),
      getPool().query(`${usageSelect} ORDER BY iu.used_at DESC LIMIT 8`),
    ]);
    return response.json({ totalItems: items.length, items, lowStockCount: lowStockItems.length, lowStockItems, recentUsage: usageRows.map(presentUsage) });
  } catch (error) { return next(error); }
}
module.exports = { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStock, recordUsage, getUsageHistory, getInventoryDashboard };
