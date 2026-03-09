import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Safe localStorage wrapper for legacy key sync (not used as Zustand storage)
const safeLs = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, value); } catch { /* noop */ }
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(key); } catch { /* noop */ }
  },
};

/**
 * Authentication Store
 * 
 * Manages user authentication state with JWT tokens and user information.
 * Uses Zustand persist middleware as the SINGLE source of truth for auth state.
 * The persist middleware key 'auth-storage' stores all auth data.
 * 
 * Legacy localStorage keys (accessToken, token, refreshToken, etc.) are kept
 * in sync for backward compatibility with components that read them directly.
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
       */
      login: (userData, accessToken, refreshToken, expiresIn) => {
        if (!userData || !accessToken || !refreshToken) {
          console.error('ðŸš¨ Invalid login parameters:', { userData, accessToken, refreshToken });
          return;
        }

        const tokenExpiresAt = Date.now() + (expiresIn * 1000);

        // Sync legacy localStorage keys for backward compatibility
        safeLs.setItem('accessToken', accessToken);
        safeLs.setItem('token', accessToken);
        safeLs.setItem('refreshToken', refreshToken);
        safeLs.setItem('tokenExpiresAt', tokenExpiresAt.toString());

        console.log('âœ… User logged in:', userData.email, 'Token expires at:', new Date(tokenExpiresAt).toISOString());

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
       */
      logout: () => {
        console.log('ðŸ” User logged out');

        // Clear legacy localStorage keys
        safeLs.removeItem('accessToken');
        safeLs.removeItem('token');
        safeLs.removeItem('refreshToken');
        safeLs.removeItem('user');
        safeLs.removeItem('tokenExpiresAt');

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
       * Initialize session after Zustand hydration completes.
       * Validates the hydrated token and marks session as initialized.
       * Does NOT read from raw localStorage â€” Zustand persist is the source of truth.
       */
      initializeSession: () => {
        const state = get();

        if (state.accessToken && state.user && state.tokenExpiresAt) {
          const isExpired = state.tokenExpiresAt - Date.now() < 60 * 1000;

          console.log('ðŸ“‹ Session restore:', {
            email: state.user.email,
            role: state.user.role,
            tokenExpired: isExpired,
            expiresIn: Math.max(0, (state.tokenExpiresAt - Date.now()) / 1000)
          });

          // Sync legacy localStorage keys in case they got out of sync
          safeLs.setItem('accessToken', state.accessToken);
          safeLs.setItem('token', state.accessToken);
          if (state.refreshToken) {
            safeLs.setItem('refreshToken', state.refreshToken);
          }
          safeLs.setItem('tokenExpiresAt', state.tokenExpiresAt.toString());

          set({
            isAuthenticated: !isExpired,
            sessionInitialized: true,
          });
        } else {
          console.log('ðŸ“‹ No existing session found');
          // Clear any stale legacy keys
          safeLs.removeItem('accessToken');
          safeLs.removeItem('token');
          safeLs.removeItem('refreshToken');
          safeLs.removeItem('user');
          safeLs.removeItem('tokenExpiresAt');

          set({ sessionInitialized: true });
        }
      },

      /**
       * Update user profile information
       */
      updateUser: (userData) => {
        set({ user: userData });
      },

      /**
       * Update tokens after refresh (called by axios interceptor)
       */
      updateTokens: (accessToken, refreshToken, expiresIn) => {
        if (!accessToken || !expiresIn) {
          console.error('ðŸš¨ Invalid token refresh parameters');
          return;
        }

        const tokenExpiresAt = Date.now() + (expiresIn * 1000);

        // Sync legacy localStorage keys
        safeLs.setItem('accessToken', accessToken);
        safeLs.setItem('token', accessToken);

        if (refreshToken) {
          safeLs.setItem('refreshToken', refreshToken);
        }

        safeLs.setItem('tokenExpiresAt', tokenExpiresAt.toString());

        console.log('ðŸ”„ Tokens refreshed, expires at:', new Date(tokenExpiresAt).toISOString());

        set({
          accessToken,
          ...(refreshToken && { refreshToken }),
          tokenExpiresAt,
        });
      },

      /**
       * Check if current access token is expired
       */
      isTokenExpired: () => {
        const state = get();
        if (!state.tokenExpiresAt) return true;

        const timeUntilExpiry = state.tokenExpiresAt - Date.now();
        const BUFFER_MS = 60 * 1000;

        return timeUntilExpiry < BUFFER_MS;
      },

      /**
       * Get current access token
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
      storage: createJSONStorage(() => localStorage),
      // Persist all auth fields
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      // Mark session as initialized once hydration completes
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('âŒ Error rehydrating auth store:', error);
            useAuthStore.setState({ sessionInitialized: true, isAuthenticated: false });
            return;
          }

          // Helper to parse JWT
          const parseJwt = (token) => {
            try {
              return JSON.parse(atob(token.split('.')[1]));
            } catch (e) {
              return null;
            }
          };

          // Defensive: If no state, treat as logged out
          if (!state || !state.accessToken) {
            console.log('ðŸ“‹ No persisted session found');
            useAuthStore.setState({
              sessionInitialized: true,
              isAuthenticated: false,
              user: null,
              accessToken: null,
              refreshToken: null,
              tokenExpiresAt: null
            });
            // Clear legacy keys
            safeLs.removeItem('accessToken');
            safeLs.removeItem('token');
            safeLs.removeItem('refreshToken');
            safeLs.removeItem('user');
            safeLs.removeItem('tokenExpiresAt');
            return;
          }

          // Validate token via JWT exp claim (more robust than stored timestamp)
          let isValid = false;
          let expiresAt = state.tokenExpiresAt;

          try {
            const decoded = parseJwt(state.accessToken);
            if (decoded && decoded.exp) {
              // JWT exp is in seconds, convert to ms
              const jwtExpiresAt = decoded.exp * 1000;
              // Check if expired (with 1 minute buffer)
              isValid = jwtExpiresAt - Date.now() > 60 * 1000;
              expiresAt = jwtExpiresAt; // Sync stored expiry with actual token

              if (!isValid) {
                console.warn('âš ï¸ Persisted JWT is expired:', new Date(jwtExpiresAt).toISOString());
              }
            } else {
              // Fallback to stored timestamp if parsing fails
              const storedExp = Number(state.tokenExpiresAt);
              isValid = !isNaN(storedExp) && (storedExp - Date.now() > 60 * 1000);
              expiresAt = storedExp;
            }
          } catch (e) {
            console.error('Error validating persisted token:', e);
            isValid = false;
          }

          if (isValid) {
            console.log('âœ… Session restored for:', state.user?.email);
            useAuthStore.setState({
              sessionInitialized: true,
              isAuthenticated: true,
              tokenExpiresAt: Number(expiresAt) || state.tokenExpiresAt
            });

            // Sync legacy keys
            safeLs.setItem('accessToken', state.accessToken);
            safeLs.setItem('token', state.accessToken);
            if (state.refreshToken) safeLs.setItem('refreshToken', state.refreshToken);
            safeLs.setItem('tokenExpiresAt', expiresAt.toString());

          } else {
            console.log('âŒ Session expired or invalid, logging out');
            useAuthStore.setState({
              sessionInitialized: true,
              isAuthenticated: false,
              user: null,
              accessToken: null,
              refreshToken: null,
              tokenExpiresAt: null
            });
            // Clear legacy keys
            safeLs.removeItem('accessToken');
            safeLs.removeItem('token');
            safeLs.removeItem('refreshToken');
            safeLs.removeItem('user');
            safeLs.removeItem('tokenExpiresAt');
          }
        };
      },
    }
  )
);
