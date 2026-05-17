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
      bootstrapStatus: 'INIT', // 'INIT' | 'HYDRATING' | 'AUTHENTICATING' | 'AUTHENTICATED' | 'FAILED' | 'GUEST'

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
          bootstrapStatus: 'AUTHENTICATED'
        });
      },

      /**
       * Clear all authentication state and tokens
       */
      logout: () => {
        console.log('ðŸ”  User logged out');

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
          bootstrapStatus: 'GUEST'
        });
      },

      /**
       * Bootstrap session on startup.
       * Restores tokens, validates session with profile request, retries expired sessions once,
       * and transitions the bootstrap lifecycle state. Uses fetch to bypass circular dependencies.
       */
      bootstrap: async () => {
        const state = get();
        if (state.bootstrapStatus !== 'INIT' && state.bootstrapStatus !== 'FAILED') return;

        set({ bootstrapStatus: 'AUTHENTICATING' });

        if (!state.accessToken) {
          console.log('📋 No access token found during bootstrap. Booting as GUEST');
          set({
            bootstrapStatus: 'GUEST',
            isAuthenticated: false,
            user: null
          });
          return;
        }

        const profileUrl = '/api/users/profile';

        try {
          console.log('🔄 Validating session with profile fetch...');
          const response = await window.fetch(profileUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.accessToken}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Session validated successfully for:', userData.email);
            set({
              user: userData,
              isAuthenticated: true,
              bootstrapStatus: 'AUTHENTICATED'
            });
          } else if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ Session validation failed with auth error. Attempting token refresh...');
            
            const refreshToken = state.refreshToken || safeLs.getItem('refreshToken');
            if (refreshToken) {
              try {
                const refreshUrl = `/api/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}`;
                const refreshRes = await window.fetch(refreshUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });

                if (refreshRes.ok) {
                  const refreshData = await refreshRes.json();
                  const { token: newAccessToken, refreshToken: newRefreshToken, expiresIn } = refreshData;

                  // Sync keys
                  safeLs.setItem('accessToken', newAccessToken);
                  safeLs.setItem('token', newAccessToken);
                  if (newRefreshToken) safeLs.setItem('refreshToken', newRefreshToken);

                  const tokenExpiresAt = Date.now() + (expiresIn * 1000);
                  safeLs.setItem('tokenExpiresAt', tokenExpiresAt.toString());

                  set({
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken || state.refreshToken,
                    tokenExpiresAt
                  });

                  // Retry profile fetch with new token
                  console.log('🔄 Retrying profile fetch with fresh token...');
                  const retryRes = await window.fetch(profileUrl, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${newAccessToken}`
                    }
                  });

                  if (retryRes.ok) {
                    const userData = await retryRes.json();
                    console.log('✅ Session validated after refresh for:', userData.email);
                    set({
                      user: userData,
                      isAuthenticated: true,
                      bootstrapStatus: 'AUTHENTICATED'
                    });
                    return;
                  }
                }
              } catch (refreshErr) {
                console.error('❌ Token refresh failed during bootstrap:', refreshErr);
              }
            }

            // Cleanup invalid session
            console.log('❌ Session invalid/expired, logging out');
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
              bootstrapStatus: 'FAILED'
            });
          } else {
            // Keep user from persisted store if server is offline or returned other error codes (e.g. 500)
            console.warn('📡 Server or network error during bootstrap validation. Falling back to cached session.');
            set({
              isAuthenticated: true,
              bootstrapStatus: 'AUTHENTICATED'
            });
          }
        } catch (err) {
          console.warn('📡 Network error during bootstrap. Falling back to cached session.', err);
          set({
            isAuthenticated: true,
            bootstrapStatus: 'AUTHENTICATED'
          });
        }
      },

      /**
       * Initialize session (Legacy wrapper, deprecated but kept for backwards compatibility)
       */
      initializeSession: () => {
        const state = get();
        if (state.accessToken && state.user) {
          set({
            isAuthenticated: true,
            sessionInitialized: true,
          });
        } else {
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
          console.error('🚨 Invalid token refresh parameters');
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

        console.log('🔄 Tokens refreshed, expires at:', new Date(tokenExpiresAt).toISOString());

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
          try {
            if (error) {
              console.error('❌ Error rehydrating auth store:', error);
              useAuthStore.setState({ 
                sessionInitialized: true, 
                isAuthenticated: false,
                bootstrapStatus: 'FAILED'
              });
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
              console.log('📋 No persisted session found');
              
              // Clear legacy keys BEFORE triggering re-render to avoid race conditions
              safeLs.removeItem('accessToken');
              safeLs.removeItem('token');
              safeLs.removeItem('refreshToken');
              safeLs.removeItem('user');
              safeLs.removeItem('tokenExpiresAt');

              useAuthStore.setState({
                sessionInitialized: true,
                isAuthenticated: false,
                user: null,
                accessToken: null,
                refreshToken: null,
                tokenExpiresAt: null,
                bootstrapStatus: 'GUEST'
              });
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
                  console.warn('⚠️  Persisted JWT is expired:', new Date(jwtExpiresAt).toISOString());
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
              console.log('✅ Session restored for:', state.user?.email);
              
              // Sync legacy keys BEFORE triggering re-render to avoid race conditions
              safeLs.setItem('accessToken', state.accessToken);
              safeLs.setItem('token', state.accessToken);
              if (state.refreshToken) safeLs.setItem('refreshToken', state.refreshToken);
              safeLs.setItem('tokenExpiresAt', expiresAt.toString());

              useAuthStore.setState({
                sessionInitialized: true,
                isAuthenticated: true,
                tokenExpiresAt: Number(expiresAt) || state.tokenExpiresAt,
                bootstrapStatus: 'INIT'
              });

            } else {
              console.log('❌ Session expired or invalid, logging out');
              
              // Clear legacy keys BEFORE triggering re-render to avoid race conditions
              safeLs.removeItem('accessToken');
              safeLs.removeItem('token');
              safeLs.removeItem('refreshToken');
              safeLs.removeItem('user');
              safeLs.removeItem('tokenExpiresAt');

              useAuthStore.setState({
                sessionInitialized: true,
                isAuthenticated: false,
                user: null,
                accessToken: null,
                refreshToken: null,
                tokenExpiresAt: null,
                bootstrapStatus: 'FAILED'
              });
            }
          } catch (e) {
            console.error('🔥 Fatal error during auth store rehydration:', e);
            // GUARANTEE authReady is set to true even on fatal errors
            useAuthStore.setState({
              sessionInitialized: true,
              isAuthenticated: false,
              user: null,
              accessToken: null,
              refreshToken: null,
              tokenExpiresAt: null,
              bootstrapStatus: 'FAILED'
            });
          }
        };
      },
    }
  )
);
