import api from './api';

export const getWeeklyMenu = () => api.get('/meals/weekly').then((response) => response.data);
export const getOrderHistory = () => api.get('/orders/history').then((response) => response.data);
export const bookMeal = (mealId, portionSize) => api.post('/orders', { mealId, portionSize }).then((response) => response.data);
export const cancelBooking = (orderId) => api.patch(`/orders/${orderId}/cancel`).then((response) => response.data);
export const markFoodReceived = (orderId) => api.patch(`/orders/${orderId}/received`).then((response) => response.data);
export const getMyFeedback = () => api.get('/feedback/mine').then((response) => response.data);
export const submitFeedback = (payload) => api.post('/feedback', payload).then((response) => response.data);
export const deleteFeedback = (feedbackId) => api.delete(`/feedback/${feedbackId}`).then((response) => response.data);
export const getProfile = () => api.get('/students/profile').then((response) => response.data);
export const updateProfile = (payload) => api.put('/students/profile', payload).then((response) => response.data);
export const offerMeal = (orderId) => api.post('/orders/offer-meal', { orderId }).then((response) => response.data);
export const getAvailableMeals = () => api.get('/orders/available-meals').then((response) => response.data);
export const claimMeal = (offeredMealId) => api.post('/orders/claim-meal', { offeredMealId }).then((response) => response.data);
export const getOfferedMeals = () => api.get('/orders/offered-meals').then((response) => response.data);
export const getClaimedMeals = () => api.get('/orders/claimed-meals').then((response) => response.data);
