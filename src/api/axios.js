import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Use relative path /api for all environments (works with Docker and local dev)
// Vite proxy in dev mode or Nginx in production will route to backend
// In development: /api is proxied to http://localhost:8080 by Vite
// In production: /api is routed by Nginx reverse proxy
// Use environment variable for API URL in production, fallback to /api for dev/proxy
const VITE_API_URL = import.meta.env.VITE_API_URL || '';

// Use relative path /api for all environments to leverage Vercel rewrites/proxy
// This resolves CORS issues on mobile and ensures same-origin requests
let API_URL = '/api';

// Normalize API_URL (ensure it ends with / for consistent joining with relative paths)
if (!API_URL.endsWith('/')) {
  API_URL = `${API_URL}/`;
}

console.log('🌐 API Base URL:', API_URL);

/**
 * Axios instance for API calls with JWT authentication
 * 
 * Features:
 * - Automatic JWT token injection into Authorization header
 * - Token refresh with queuing for concurrent requests
 * - Comprehensive error handling with semantic error types
 * - Automatic logout on authentication failure
 * - Request retry after successful token refresh
 * 
 * Token Refresh Flow:
 * 1. Request fails with 401 Unauthorized
 * 2. If already refreshing, queue the failed request
 * 3. Refresh token using refreshToken
 * 4. Update tokens in localStorage and auth store
 * 5. Retry original request with new token
 * 6. Process all queued requests with new token
 * 
 * Error Handling:
 * - 400: Bad Request (validation errors, business logic)
 * - 401: Unauthorized (expired token, invalid credentials)
 * - 403: Forbidden (insufficient permissions)
 * - 404: Not Found (resource doesn't exist)
 * - 409: Conflict (duplicate email, insufficient stock)
 * - 500: Internal Server Error
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Configure retry parameters
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Remove isRefreshing, failedQueue, processQueue entirely as they are handled by centralized store!

/**
 * Request interceptor - Inject JWT token into Authorization header
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (stored by axios interceptor or auth store)
    const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (import.meta.env.DEV) {
      console.log(`📡 [API Request Start] ${config.method?.toUpperCase()} ${config.url}`, accessToken ? 'with token' : 'no token');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and token refresh via centralized authStore
 */
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ [API Response Success] :', response.config?.url, response.status);
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    if (import.meta.env.DEV) {
      console.error('❌ [API Response Error] :', originalRequest?.url, response?.status || 'Network Error / Timeout');
    }

    /**
     * Handle 401 Unauthorized or 403 Forbidden
     * Attempts to refresh token if available, otherwise redirects to login
     * SKIP for login/register endpoints - let the component handle the error
     */
    if ((response?.status === 401 || response?.status === 403) && originalRequest && !originalRequest._retry) {
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh-token');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        console.log('🔄 Interceptor caught 401/403. Initiating centralized session refresh...');
        const newAccessToken = await useAuthStore.getState().refreshSession();
        
        // Update authorization header on the retried request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log('✅ Centralized refresh completed. Retrying request:', originalRequest.url);
        return api(originalRequest);
      } catch (refreshErr) {
        console.error('❌ Centralized refresh failed during request retry:', refreshErr.message);
        
        // Redirect to login only if not already on the login page and on a key route
        if (!window.location.pathname.includes('/login') && 
            (originalRequest.url?.includes('profile') || originalRequest.url?.includes('orders') || originalRequest.url?.includes('admin') || originalRequest.url?.includes('cart'))) {
          window.location.href = '/login?session=expired';
        }
        
        return Promise.reject(refreshErr);
      }
    }

    /**
     * Handle 404 Not Found
     * Requested resource does not exist
     */
    if (response?.status === 404) {
      const message = response.data?.message || 'The requested resource was not found';
      console.warn('Resource not found:', message);
    }

    /**
     * Handle 409 Conflict
     * Resource already exists or constraints violated (e.g., duplicate email, insufficient stock)
     */
    if (response?.status === 409) {
      const message = response.data?.message || 'A conflict occurred';
      console.warn('Conflict:', message);
    }

    /**
     * Handle 400 Bad Request
     * Validation errors or business logic violations
     * Include field-level errors from response
     */
    if (response?.status === 400) {
      const message = response.data?.message || 'Invalid request';
      const fieldErrors = response.data?.fieldErrors || {};
      console.warn('Bad request:', message, fieldErrors);
    }

    /**
     * Handle 500 Internal Server Error
     * Server-side error
     */
    /**
     * Handle Network Errors and Timeouts with Auto-Retry
     * Only retry GET requests to ensure idempotency
     */
    const isNetworkError = !response && !error.message?.includes('auth');
    const isIdempotent = originalRequest.method === 'get';
    
    if ((isNetworkError || response?.status >= 500) && isIdempotent && (originalRequest._retryCount || 0) < MAX_RETRIES) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      console.warn(`⚠️ Retrying request (${originalRequest._retryCount}/${MAX_RETRIES}):`, originalRequest.url);
      
      // Delay before retry
      return new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        .then(() => api(originalRequest));
    }

    // Return error for component-level handling
    return Promise.reject(error);
  }
);

export default api;

