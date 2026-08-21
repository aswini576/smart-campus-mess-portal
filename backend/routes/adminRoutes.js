const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { listUsers, createUser, updateUser, deleteUser, setStudentApproval, getAttendanceStats, getSettings, updateSettings } = require('../controllers/adminController');

router.use(protect, authorize('admin'));
router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.patch('/users/:userId/approval', setStudentApproval);
router.delete('/users/:userId', deleteUser);
router.get('/attendance-stats', getAttendanceStats);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
module.exports = router;
