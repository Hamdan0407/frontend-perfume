import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Use relative path /api for all environments (works with Docker and local dev)
// Vite proxy in dev mode or Nginx in production will route to backend
// In development: /api is proxied to http://localhost:8080 by Vite
// In production: /api is routed by Nginx reverse proxy
// Use environment variable for API URL in production, fallback to /api for dev/proxy
const VITE_API_URL = import.meta.env.VITE_API_URL;
const API_URL = VITE_API_URL
  ? (VITE_API_URL.endsWith('/') ? VITE_API_URL : `${VITE_API_URL}/`)
  : '/api/';

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
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 * @param {Error|null} error - Error if refresh failed, null if successful
 * @param {string|null} token - New access token if successful
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

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

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and token refresh
 */
api.interceptors.response.use(
  (response) => {
    // Success: Return response as-is
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', response.config?.url, response.status);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', error.config?.url, error.response?.status);
    }
    const { config, response } = error;
    const originalRequest = config;

    /**
     * Handle 401 Unauthorized
     * Attempts to refresh token if available, otherwise redirects to login
     * SKIP for login/register endpoints - let the component handle the error
     */
    if (response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh tokens for login/register - these are initial auth attempts
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh-token');

      if (isAuthEndpoint) {
        // Let the auth component handle the error directly
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Token refresh already in progress - queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        // Attempt to refresh the access token
        return axios
          .post(`${API_URL.endsWith('/') ? API_URL : API_URL + '/'}auth/refresh-token/`, null, {
            params: { refreshToken },
            headers: {
              'Content-Type': 'application/json',
            },
          })
          .then((res) => {
            const { token: newAccessToken, refreshToken: newRefreshToken, expiresIn } = res.data;

            // Update tokens in localStorage
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('token', newAccessToken); // For backward compatibility
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            // Update auth store tokens
            try {
              const authStore = useAuthStore.getState();
              if (authStore.updateTokens) {
                authStore.updateTokens(newAccessToken, newRefreshToken, expiresIn);
              }
            } catch (e) {
              // Silent fail if auth store not initialized
              if (process.env.NODE_ENV === 'development') {
                console.debug('Auth store update failed during token refresh:', e);
              }
            }

            // Update original request header and retry
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);

            return api(originalRequest);
          })
          .catch((err) => {
            // Token refresh failed - clear all auth data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiresAt');
            localStorage.removeItem('auth-storage');

            // Clear auth store
            try {
              const authStore = useAuthStore.getState();
              if (authStore.logout) {
                authStore.logout();
              }
            } catch (e) {
              // Silent fail if auth store not initialized
              if (process.env.NODE_ENV === 'development') {
                console.debug('Auth store logout failed:', e);
              }
            }

            processQueue(err, null);

            // Redirect to login with session expired message
            window.location.href = '/login?session=expired';
            return Promise.reject(err);
          });
      } else {
        // No refresh token available - user must re-authenticate
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('auth-storage');

        try {
          const authStore = useAuthStore.getState();
          if (authStore.logout) {
            authStore.logout();
          }
        } catch (e) {
          // Silent fail if auth store not initialized
          if (process.env.NODE_ENV === 'development') {
            console.debug('Auth store logout failed:', e);
          }
        }

        window.location.href = '/login?session=expired';
        return Promise.reject(error);
      }
    }

    /**
     * Handle 403 Forbidden
     * User is authenticated but lacks permissions for this resource
     */
    if (response?.status === 403) {
      const message = response.data?.message || 'You do not have permission to access this resource';
      console.warn('Access forbidden:', message);

      // Optionally redirect to unauthorized page
      // window.location.href = '/unauthorized';
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
    if (response?.status >= 500) {
      const message = response.data?.message || 'An error occurred on the server';
      console.error('Server error:', message);
    }

    // Return error for component-level handling
    return Promise.reject(error);
  }
);

export default api;

