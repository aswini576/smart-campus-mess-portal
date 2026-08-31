const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStock, recordUsage, getUsageHistory, getInventoryDashboard } = require('../controllers/inventoryController');

router.use(protect, authorize('admin'));
router.get('/', getInventory);
router.get('/dashboard', getInventoryDashboard);
router.get('/low-stock', getLowStock);
router.get('/usage', getUsageHistory);
router.post('/', createInventoryItem);
router.put('/:itemId', updateInventoryItem);
router.delete('/:itemId', deleteInventoryItem);
router.post('/:itemId/usage', recordUsage);
module.exports = router;
