import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include token if available
api.interceptors.request.use((config) => {
  let token;
  const auth = localStorage.getItem('erp.auth');
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      token = parsed.token;
    } catch {}
  }
  // Fallback to direct token storage
  if (!token) {
    token = localStorage.getItem('token');
  }
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
