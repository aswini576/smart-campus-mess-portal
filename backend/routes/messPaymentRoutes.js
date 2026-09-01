const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMessPayments, markMessPaymentPaid } = require('../controllers/messPaymentController');
router.use(protect, authorize('admin'));
router.get('/', getMessPayments);
router.patch('/paid', markMessPaymentPaid);
module.exports = router;
