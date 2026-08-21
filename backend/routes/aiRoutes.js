const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { runDailyLock, getLatest } = require('../controllers/aiController');
router.use(protect, authorize('messChief', 'admin'));
router.post('/daily-lock', runDailyLock);
router.get('/latest', getLatest);
module.exports = router;
