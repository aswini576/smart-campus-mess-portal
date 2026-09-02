import api from './api';

export const getMyPayments = () => api.get('/payments/mine').then((response) => response.data);
export const getPayments = () => api.get('/payments').then((response) => response.data);
export const updatePaymentStatus = (orderId, paidAmount) => api.patch(`/payments/${orderId}/status`, { paidAmount }).then((response) => response.data);
export const deleteOrderRecord = (orderId) => api.delete(`/payments/${orderId}`);
