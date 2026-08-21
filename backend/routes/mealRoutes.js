const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getWeeklyMenu, getMeals, createMeal, updateMeal, deleteMeal, getFoodDemand } = require('../controllers/mealController');

router.get('/weekly', protect, authorize('student', 'messChief', 'admin'), getWeeklyMenu);
router.use(protect, authorize('messChief', 'admin'));
router.get('/', getMeals);
router.get('/demand', getFoodDemand);
router.post('/', createMeal);
router.put('/:mealId', updateMeal);
router.delete('/:mealId', deleteMeal);
module.exports = router;
