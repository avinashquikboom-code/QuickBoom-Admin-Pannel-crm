import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  tenantName?: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setTenantId: (tenantId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tenantId: null,
      isAuthenticated: false,

      setAuth: (user: User, token: string, refreshToken: string) =>
        set({
          user,
          token,
          refreshToken,
          tenantId: user.tenantId,
          isAuthenticated: true,
        }),

      setTenantId: (tenantId: string) => set({ tenantId }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          tenantId: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'quikboom-auth-storage',
    },
  ),
);
