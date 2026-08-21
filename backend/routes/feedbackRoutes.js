const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createFeedback, getMyFeedback, getFeedbackForChief, getFeedbackAnalytics } = require('../controllers/feedbackController');

router.get('/mine', protect, authorize('student'), getMyFeedback);
router.post('/', protect, authorize('student'), createFeedback);
router.get('/analytics', protect, authorize('messChief', 'admin'), getFeedbackAnalytics);
router.get('/', protect, authorize('messChief', 'admin'), getFeedbackForChief);

module.exports = router;
