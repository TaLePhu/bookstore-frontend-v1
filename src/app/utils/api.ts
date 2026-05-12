import axios from 'axios';

// Get base URL from env if available, else default to localhost:3000
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';
const AUTH_ERROR_HANDLED_ENDPOINTS = [
  '/auth/login',
  'auth/login',
  '/auth/register',
  'auth/register',
  '/auth/check-email',
  'auth/check-email',
  '/auth/verify-email',
  'auth/verify-email',
  '/auth/resend-code',
  'auth/resend-code',
];

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Optionally handle 401 response and refresh token here in the future
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const shouldLetFormHandleError = AUTH_ERROR_HANDLED_ENDPOINTS.some((endpoint) =>
      requestUrl.endsWith(endpoint)
    );

    if (error.response?.status === 401 && !shouldLetFormHandleError) {
      // Clear local storage and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
