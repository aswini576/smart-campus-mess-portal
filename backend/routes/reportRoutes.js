const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getChiefOverview, getAnalytics, getOriginalFoodCostReport, getStudentPaymentReport } = require('../controllers/reportController');

router.use(protect, authorize('admin'));
router.get('/chief-overview', getChiefOverview);
router.get('/analytics', getAnalytics);
router.get('/original-food-cost', getOriginalFoodCostReport);
router.get('/student-payments', getStudentPaymentReport);
module.exports = router;
