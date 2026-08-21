import api from './api';

export const getMyPayments = () => api.get('/payments/mine').then((response) => response.data);
export const getPayments = () => api.get('/payments').then((response) => response.data);
export const updatePaymentStatus = (orderId, status) => api.patch(`/payments/${orderId}/status`, { status }).then((response) => response.data);
