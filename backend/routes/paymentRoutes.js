const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMyPayments, getPayments, updatePaymentStatus } = require('../controllers/paymentController');

router.get('/mine', protect, authorize('student'), getMyPayments);
router.get('/', protect, authorize('admin'), getPayments);
router.patch('/:orderId/status', protect, authorize('admin'), updatePaymentStatus);

module.exports = router;
