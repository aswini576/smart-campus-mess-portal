const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getChiefOverview, getAnalytics } = require('../controllers/reportController');

router.use(protect, authorize('admin'));
router.get('/chief-overview', getChiefOverview);
router.get('/analytics', getAnalytics);
module.exports = router;
