import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Storage implementation that works both client and server side
const storage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage not available
    }
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage not available
    }
  },
};

/**
 * Authentication Store
 * 
 * Manages user authentication state with JWT tokens and user information.
 * Persists tokens and user data to localStorage via Zustand persist middleware.
 * Automatically validates tokens on page reload and maintains session across page reloads.
 * 
 * Fields:
 * - user: Logged-in user object (id, email, firstName, lastName, role)
 * - accessToken: JWT access token for API requests (24h expiry)
 * - refreshToken: Refresh token for obtaining new access tokens (7d expiry)
 * - tokenExpiresAt: Timestamp when access token expires (ms since epoch)
 * - isAuthenticated: Boolean flag indicating login status
 * - sessionInitialized: Whether localStorage has been checked on app load
 * 
 * Methods:
 * - login(userData, accessToken, refreshToken, expiresIn): Set auth state after login
 * - logout(): Clear all auth state and tokens
 * - updateUser(userData): Update user information
 * - updateTokens(accessToken, refreshToken, expiresIn): Update tokens (called by refresh)
 * - initializeSession(): Restore session from localStorage on app load
 * - isTokenExpired(): Check if current access token is expired
 * - getAccessToken(): Get current access token
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      sessionInitialized: false,

      /**
       * Set user and tokens after successful login
       * @param {Object} userData - User information
       * @param {string} accessToken - Access token from auth endpoint
       * @param {string} refreshToken - Refresh token from auth endpoint
       * @param {number} expiresIn - Token expiration time in seconds
       */
      login: (userData, accessToken, refreshToken, expiresIn) => {
        if (!userData || !accessToken || !refreshToken) {
          console.error('🚨 Invalid login parameters:', { userData, accessToken, refreshToken });
          return;
        }

        const tokenExpiresAt = Date.now() + (expiresIn * 1000);
        
        // Store in localStorage for persistence
        storage.setItem('accessToken', accessToken);
        storage.setItem('token', accessToken); // For backward compatibility
        storage.setItem('refreshToken', refreshToken);
        storage.setItem('user', JSON.stringify(userData));
        storage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
        
        console.log('✅ User logged in:', userData.email, 'Token expires at:', new Date(tokenExpiresAt).toISOString());
        
        set({
          user: userData,
          accessToken,
          refreshToken,
          tokenExpiresAt,
          isAuthenticated: true,
          sessionInitialized: true,
        });
      },

      /**
       * Clear all authentication state and tokens
       * Called on logout or when refresh token fails
       */
      logout: () => {
        console.log('🔐 User logged out');
        
        storage.removeItem('accessToken');
        storage.removeItem('token'); // For backward compatibility
        storage.removeItem('refreshToken');
        storage.removeItem('user');
        storage.removeItem('tokenExpiresAt');
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          sessionInitialized: true,
        });
      },

      /**
       * Initialize session from localStorage on app load
       * Validates tokens and restores authenticated state
       * Must be called once on app initialization
       */
      initializeSession: () => {
        try {
          const storedUser = storage.getItem('user');
          const storedAccessToken = storage.getItem('accessToken') || storage.getItem('token');
          const storedRefreshToken = storage.getItem('refreshToken');
          const storedTokenExpiresAt = storage.getItem('tokenExpiresAt');
          
          if (storedUser && storedAccessToken && storedRefreshToken && storedTokenExpiresAt) {
            const user = JSON.parse(storedUser);
            const tokenExpiresAt = parseInt(storedTokenExpiresAt, 10);
            const isExpired = tokenExpiresAt - Date.now() < 60 * 1000; // 1 minute buffer
            
            console.log('📋 Session restore:', {
              email: user.email,
              tokenExpired: isExpired,
              expiresIn: Math.max(0, (tokenExpiresAt - Date.now()) / 1000)
            });
            
            set({
              user,
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
              tokenExpiresAt,
              isAuthenticated: !isExpired,
              sessionInitialized: true,
            });
          } else {
            console.log('📋 No existing session found');
            set({ sessionInitialized: true });
          }
        } catch (error) {
          console.error('❌ Error initializing session:', error);
          // Clear corrupted session data
          storage.removeItem('user');
          storage.removeItem('accessToken');
          storage.removeItem('token');
          storage.removeItem('refreshToken');
          storage.removeItem('tokenExpiresAt');
          
          set({ sessionInitialized: true });
        }
      },

      /**
       * Update user profile information
       * Does not affect authentication tokens
       * @param {Object} userData - Updated user data
       */
      updateUser: (userData) => {
        storage.setItem('user', JSON.stringify(userData));
        set({ user: userData });
      },

      /**
       * Update tokens after refresh (called by axios interceptor)
       * Keeps user and isAuthenticated unchanged
       * @param {string} accessToken - New access token
       * @param {string} refreshToken - New refresh token (optional)
       * @param {number} expiresIn - Token expiration time in seconds
       */
      updateTokens: (accessToken, refreshToken, expiresIn) => {
        if (!accessToken || !expiresIn) {
          console.error('🚨 Invalid token refresh parameters');
          return;
        }

        const tokenExpiresAt = Date.now() + (expiresIn * 1000);
        
        storage.setItem('accessToken', accessToken);
        storage.setItem('token', accessToken); // For backward compatibility
        
        if (refreshToken) {
          storage.setItem('refreshToken', refreshToken);
        }
        
        storage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
        
        console.log('🔄 Tokens refreshed, expires at:', new Date(tokenExpiresAt).toISOString());
        
        set({
          accessToken,
          ...(refreshToken && { refreshToken }),
          tokenExpiresAt,
        });
      },

      /**
       * Check if current access token is expired
       * Includes 1-minute buffer to refresh before actual expiry
       * @returns {boolean} True if token is expired or about to expire
       */
      isTokenExpired: () => {
        const state = get();
        if (!state.tokenExpiresAt) return true;
        
        const timeUntilExpiry = state.tokenExpiresAt - Date.now();
        const BUFFER_MS = 60 * 1000; // 1 minute buffer
        
        return timeUntilExpiry < BUFFER_MS;
      },

      /**
       * Get current access token
       * Returns null if token is expired or user not authenticated
       * @returns {string|null} Current access token or null
       */
      getAccessToken: () => {
        const state = get();
        return state.isAuthenticated && !state.isTokenExpired()
          ? state.accessToken
          : null;
      },
    }),
    {
      name: 'auth-storage',
      storage: storage,
      // Only persist specific fields to localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
        sessionInitialized: state.sessionInitialized,
      }),
    }
  )
);
