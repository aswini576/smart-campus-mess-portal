const router = require('express').Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { bookMeal, cancelBooking, getOrderHistory, markFoodReceived, offerMeal, getAvailableMeals, claimMeal, getOfferedMeals, getClaimedMeals } = require('../controllers/orderController');

router.use(protect, authorize('student'));
router.get('/history', getOrderHistory);
router.post('/', bookMeal);
router.patch('/:orderId/cancel', cancelBooking);
router.patch('/:orderId/received', markFoodReceived);
router.post('/offer-meal', offerMeal);
router.get('/available-meals', getAvailableMeals);
router.post('/claim-meal', claimMeal);
router.get('/offered-meals', getOfferedMeals);
router.get('/claimed-meals', getClaimedMeals);
module.exports = router;
