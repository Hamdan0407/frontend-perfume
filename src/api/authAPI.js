import api from './axios';

/**
 * Authentication API Service
 * 
 * Handles all auth-related API calls:
 * - Login
 * - Register
 * - Token refresh
 * - Logout (client-side only)
 */

const authAPI = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Auth response with tokens
   * 
   * Response:
   * {
   *   token: "access_token",
   *   refreshToken: "refresh_token",
   *   expiresIn: 86400,
   *   user: { id, email, firstName, lastName, role }
   * }
   */
  login: async (email, password) => {
    console.log('📤 authAPI.login called with:', email);
    const response = await api.post('/auth/login', { email, password });
    console.log('📥 authAPI.login response.data:', response.data);
    return response.data;
  },

  /**
   * Register new user account
   * @param {Object} userData - User registration data
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Password (must meet policy)
   * @param {string} userData.firstName - First name
   * @param {string} userData.lastName - Last name
   * @param {string} userData.phoneNumber - Optional phone number
   * @returns {Promise} - Auth response with tokens
   * 
   * Validation errors:
   * - Email: required, valid format, unique
   * - Password: 8+ chars, uppercase, lowercase, digit, special char
   * - Names: required, 2-50 chars
   * 
   * Responses:
   * - 200: Success with tokens
   * - 400: Validation error with fieldErrors
   * - 409: Email already exists (CONFLICT)
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token from login/register
   * @returns {Promise} - New tokens
   * 
   * Response:
   * {
   *   token: "new_access_token",
   *   refreshToken: "new_refresh_token",
   *   expiresIn: 86400,
   *   user: { id, email, ... }
   * }
   * 
   * Errors:
   * - 401: Invalid or expired refresh token
   */
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  /**
   * Logout user (client-side only)
   * Clears tokens from localStorage
   */
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-storage');
  },

  /**
   * Get current user profile (requires auth)
   * @returns {Promise} - User profile data
   */
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data.data;
  },

  /**
   * Update user profile (requires auth)
   * @param {Object} userData - User data to update
   * @returns {Promise} - Updated user data
   */
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data.data;
  },

  /**
   * Change user password (requires auth)
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password (must meet policy)
   * @returns {Promise} - Success message
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/users/password/change', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Login/Register with Google OAuth
   * @param {string} token - Google credential token from Google Sign-In
   * @returns {Promise} - Auth response with tokens
   */
  loginWithGoogle: async (token) => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },
};

export default authAPI;
