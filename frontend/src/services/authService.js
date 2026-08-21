import api from './api';

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function register(details) {
  const { data } = await api.post('/auth/register', details);
  return data;
}

export async function resetPassword(details) {
  const { data } = await api.post('/auth/forgot-password', details);
  return data;
}
