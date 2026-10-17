import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SUBSCRIPTION_FEATURES, SubscriptionFeatures } from './access-control';

export interface User {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  customerId: number | string | null;
  customerName?: string;
  role?: string;
  roles: string[];
  accountType?: string;
  subscriptionFeatures?: SubscriptionFeatures;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  customerId: number | string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateTokens: (token: string, refreshToken?: string) => void;
  setCustomerId: (customerId: number | string) => void;
  toggleSubscriptionFeature: (feature: keyof SubscriptionFeatures, enabled: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      customerId: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (hasHydrated: boolean) => set({ _hasHydrated: hasHydrated }),

      setAuth: (user: User, token: string, refreshToken: string) => {
        const subscriptionFeatures = user.subscriptionFeatures || { ...DEFAULT_SUBSCRIPTION_FEATURES };

        if (typeof window !== 'undefined') {
          try {
            if (token) {
              localStorage.setItem('accessToken', token);
              localStorage.setItem('token', token);
            }
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(user));
          } catch (_) {}
        }

        set({
          user: {
            ...user,
            subscriptionFeatures,
          },
          token,
          refreshToken,
          customerId: user.customerId,
          isAuthenticated: true,
          _hasHydrated: true,
        });
      },

      updateTokens: (token: string, refreshToken?: string) => {
        if (typeof window !== 'undefined') {
          try {
            if (token) {
              localStorage.setItem('accessToken', token);
              localStorage.setItem('token', token);
            }
            if (refreshToken) {
              localStorage.setItem('refreshToken', refreshToken);
            }
          } catch (_) {}
        }

        set((state) => ({
          token,
          refreshToken: refreshToken || state.refreshToken,
          isAuthenticated: true,
          _hasHydrated: true,
        }));
      },

      setCustomerId: (customerId: number | string) => set({ customerId }),

      toggleSubscriptionFeature: (feature: keyof SubscriptionFeatures, enabled: boolean) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const currentFeatures = currentUser.subscriptionFeatures || { ...DEFAULT_SUBSCRIPTION_FEATURES };
        set({
          user: {
            ...currentUser,
            subscriptionFeatures: {
              ...currentFeatures,
              [feature]: enabled,
            },
          },
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            import('./services/fcm.service')
              .then(({ fcmWebService }) => fcmWebService.unregisterTokenFromBackend())
              .catch(() => {});
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('quikboom-next-auth-storage');
          } catch (_) {}
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          customerId: null,
          isAuthenticated: false,
          _hasHydrated: true,
        });
      },
    }),
    {
      name: 'quikboom-next-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
