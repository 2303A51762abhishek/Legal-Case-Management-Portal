import axios from 'axios';

// Base Axios client pointing to the Express backend API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true, // Enables HttpOnly cookie exchange
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token from localStorage if available
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

// Response Interceptor: Handles 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear invalid stored tokens
      localStorage.removeItem('juris_token');
    }
    return Promise.reject(error);
  }
);

export default api;
