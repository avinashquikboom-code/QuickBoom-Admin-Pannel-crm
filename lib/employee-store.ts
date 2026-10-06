import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SubscriptionFeatures } from './access-control';
import type { User as UserType } from './store';

interface EmployeeAuthState {
  user: UserType | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  setAuth: (user: UserType, token: string, refreshToken?: string) => void;
  updateTokens: (token: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserType>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useEmployeeAuthStore = create<EmployeeAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, token, refreshToken = '') => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          _hasHydrated: true,
        });
      },

      updateTokens: (token, refreshToken) => {
        set((state) => ({
          token,
          refreshToken: refreshToken || state.refreshToken,
        }));
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'qb-employee-auth-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : ({} as any))),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
