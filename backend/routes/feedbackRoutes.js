const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createFeedback, deleteMyFeedback, getMyFeedback, getFeedbackForChief, getFeedbackAnalytics } = require('../controllers/feedbackController');

router.get('/mine', protect, authorize('student'), getMyFeedback);
router.post('/', protect, authorize('student'), createFeedback);
router.delete('/:feedbackId', protect, authorize('student'), deleteMyFeedback);
router.get('/analytics', protect, authorize('admin'), getFeedbackAnalytics);
router.get('/', protect, authorize('admin'), getFeedbackForChief);

module.exports = router;
