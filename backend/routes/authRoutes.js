const router = require('express').Router();
const { register, login, resetPassword, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const authRateLimit = require('../middleware/authRateLimit');

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/forgot-password', authRateLimit, resetPassword);
router.get('/me', protect, getCurrentUser);

module.exports = router;
