import axios from 'axios';

// Reserved for future REST API calls. No requests are made by the UI yet.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default api;
