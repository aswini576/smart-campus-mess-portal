const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMyPayments, getPayments, updatePaymentStatus, deleteOrder } = require('../controllers/paymentController');

router.get('/mine', protect, authorize('student'), getMyPayments);
router.get('/', protect, authorize('admin'), getPayments);
router.patch('/:orderId/status', protect, authorize('admin'), updatePaymentStatus);
router.delete('/:orderId', protect, authorize('admin'), deleteOrder);

module.exports = router;
