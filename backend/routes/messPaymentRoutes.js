const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMessPayments, markMessPaymentPaid, deleteMessPayment } = require('../controllers/messPaymentController');
router.use(protect, authorize('admin'));
router.get('/', getMessPayments);
router.patch('/paid', markMessPaymentPaid);
router.delete('/:weekStart', deleteMessPayment);
module.exports = router;
