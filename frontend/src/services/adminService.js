import api from './api';
export const getUsers = (role) => api.get('/admin/users', { params: { role } }).then((r) => r.data);
export const createUser = (payload) => api.post('/admin/users', payload).then((r) => r.data);
export const setStudentApproval = (id, isApproved) => api.patch(`/admin/users/${id}/approval`, { isApproved }).then((r) => r.data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getAttendanceStats = () => api.get('/admin/attendance-stats').then((r) => r.data);
