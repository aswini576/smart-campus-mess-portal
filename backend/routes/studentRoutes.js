const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/studentController');

router.use(protect, authorize('student'));
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
module.exports = router;
