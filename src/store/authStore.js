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
      authState: 'guest', // 'guest' | 'authenticating' | 'authenticated' | 'expired'
      _refreshPromise: null, // Holds active deduplicated session refresh promise

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
          authState: 'authenticated'
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
          authState: 'guest',
          _refreshPromise: null
        });
      },

      /**
       * Synchronize tokens across store and storage
       */
      updateTokens: (accessToken, refreshToken, expiresIn) => {
        console.log('🔄 Syncing store tokens...');
        const tokenExpiresAt = Date.now() + (expiresIn * 1000);
        
        safeLs.setItem('accessToken', accessToken);
        safeLs.setItem('token', accessToken);
        if (refreshToken) safeLs.setItem('refreshToken', refreshToken);
        safeLs.setItem('tokenExpiresAt', tokenExpiresAt.toString());

        set({
          accessToken,
          refreshToken: refreshToken || get().refreshToken,
          tokenExpiresAt,
          isAuthenticated: true,
          authState: 'authenticated'
        });
      },

      /**
       * Unified, centralized session refresh function.
       * Can be safely called concurrently by Axios interceptors, page bootstrap hooks, etc.
       * Prevents duplicate network requests by caching and returning a single active promise.
       */
      refreshSession: async () => {
        const state = get();
        if (state._refreshPromise) {
          console.log('🔄 Reusing active session refresh promise...');
          return state._refreshPromise;
        }

        const refreshToken = state.refreshToken || safeLs.getItem('refreshToken');
        if (!refreshToken) {
          console.warn('⚠️ No refresh token available for session refresh.');
          throw new Error('No refresh token available');
        }

        console.log('🔄 Initiating centralized session refresh...');
        
        const refreshPromise = (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout protection

          try {
            const refreshUrl = `/api/auth/refresh-token?refreshToken=${encodeURIComponent(refreshToken)}`;
            const response = await window.fetch(refreshUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`Refresh request failed with status: ${response.status}`);
            }

            const data = await response.json();
            if (!data || !data.token) {
              throw new Error('Invalid response payload from token refresh endpoint');
            }

            const { token: newAccessToken, refreshToken: newRefreshToken, expiresIn } = data;

            // Sync localStorage keys
            safeLs.setItem('accessToken', newAccessToken);
            safeLs.setItem('token', newAccessToken);
            if (newRefreshToken) safeLs.setItem('refreshToken', newRefreshToken);

            const tokenExpiresAt = Date.now() + (expiresIn * 1000);
            safeLs.setItem('tokenExpiresAt', tokenExpiresAt.toString());

            set({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken || state.refreshToken,
              tokenExpiresAt,
              isAuthenticated: true,
              authState: 'authenticated',
              _refreshPromise: null // Release active promise cache
            });

            console.log('✅ Centralized session refresh successful.');
            return newAccessToken;
          } catch (err) {
            clearTimeout(timeoutId);
            console.error('❌ Centralized session refresh failed:', err.name === 'AbortError' ? 'Timeout (15s)' : err.message);

            // Clean up invalid session
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
              authState: 'expired',
              _refreshPromise: null // Release active promise cache
            });

            throw err;
          }
        })();

        set({ _refreshPromise: refreshPromise });
        return refreshPromise;
      },

      /**
       * Bootstrap session silently in the background on startup.
       * Restores tokens, validates session with profile request, retries expired sessions once,
       * and transitions the bootstrap lifecycle state. Uses fetch to bypass circular dependencies.
       */
      bootstrap: async () => {
        const state = get();
        if (state.authState !== 'authenticating') return;

        if (!state.accessToken) {
          console.log('📋 No access token found during bootstrap. Booting as guest');
          set({
            authState: 'guest',
            isAuthenticated: false,
            user: null
          });
          return;
        }

        const profileUrl = '/api/users/profile';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout protection

        try {
          console.log('🔄 Validating session with profile fetch...');
          const response = await window.fetch(profileUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.accessToken}`
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Session validated successfully for:', userData.email);
            set({
              user: userData,
              isAuthenticated: true,
              authState: 'authenticated'
            });
          } else if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ Session validation failed with auth error. Attempting centralized token refresh...');
            
            try {
              const newAccessToken = await state.refreshSession();
              
              // Retry profile fetch with new token
              console.log('🔄 Retrying profile fetch with fresh token...');
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);

              const retryRes = await window.fetch(profileUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${newAccessToken}`
                },
                signal: retryController.signal
              });

              clearTimeout(retryTimeoutId);

              if (retryRes.ok) {
                const userData = await retryRes.json();
                console.log('✅ Session validated after refresh for:', userData.email);
                set({
                  user: userData,
                  isAuthenticated: true,
                  authState: 'authenticated'
                });
              } else {
                throw new Error('Profile fetch failed on retry');
              }
            } catch (refreshErr) {
              console.error('❌ Centralized refresh & retry failed during bootstrap:', refreshErr);
              // Store is already cleaned up inside refreshSession()'s catch block
            }
          } else {
            // Keep user from persisted store if server is offline or returned other error codes (e.g. 500)
            console.warn('📡 Server or network error during bootstrap validation. Falling back to cached session.');
            set({
              isAuthenticated: true,
              authState: 'authenticated'
            });
          }
        } catch (err) {
          clearTimeout(timeoutId);
          console.warn('📡 Network error or timeout during bootstrap. Falling back to cached session.', err.name === 'AbortError' ? 'Timeout' : err.message);
          set({
            isAuthenticated: true,
            authState: 'authenticated'
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
                authState: 'expired'
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
                authState: 'guest'
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
                authState: 'authenticating'
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
                authState: 'expired'
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
              authState: 'expired'
            });
          }
        };
      },
    }
  )
);
