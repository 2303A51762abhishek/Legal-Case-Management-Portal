import axios from 'axios';

// Base Axios instance pointing to the backend API server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Automatically attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('juris_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handler (e.g., token expiration)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem('juris_token');
      localStorage.removeItem('juris_user');
    }
    return Promise.reject(error);
  }
);

export default api;
