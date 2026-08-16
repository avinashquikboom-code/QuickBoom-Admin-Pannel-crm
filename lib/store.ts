import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROLE_DEFAULT_PERMISSIONS, DEFAULT_SUBSCRIPTION_FEATURES, SubscriptionFeatures } from './access-control';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  tenantName?: string;
  roles: string[];
  permissions?: string[];
  subscriptionFeatures?: SubscriptionFeatures;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setTenantId: (tenantId: string) => void;
  switchRole: (role: string) => void;
  toggleSubscriptionFeature: (feature: keyof SubscriptionFeatures, enabled: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: {
        id: 'usr-admin-01',
        email: 'admin@quikboom.com',
        firstName: 'Demo',
        lastName: 'User',
        tenantId: 't-001',
        tenantName: 'QuikBoom Enterprise',
        roles: ['Tenant Owner'],
        permissions: ROLE_DEFAULT_PERMISSIONS['Tenant Owner'],
        subscriptionFeatures: { ...DEFAULT_SUBSCRIPTION_FEATURES },
      },
      token: 'demo-jwt-token-access',
      refreshToken: 'demo-jwt-token-refresh',
      tenantId: 't-001',
      isAuthenticated: true,

      setAuth: (user: User, token: string, refreshToken: string) => {
        const primaryRole = user.roles?.[0] || 'Employee';
        const permissions = user.permissions || ROLE_DEFAULT_PERMISSIONS[primaryRole] || [];
        const subscriptionFeatures = user.subscriptionFeatures || { ...DEFAULT_SUBSCRIPTION_FEATURES };

        set({
          user: {
            ...user,
            permissions,
            subscriptionFeatures,
          },
          token,
          refreshToken,
          tenantId: user.tenantId,
          isAuthenticated: true,
        });
      },

      setTenantId: (tenantId: string) => set({ tenantId }),

      switchRole: (role: string) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const rolePermissions = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS['Employee'];
        
        let demoFirstName = 'Demo';
        let demoLastName = 'User';
        if (role === 'Super Admin') {
          demoFirstName = 'Super';
          demoLastName = 'Admin';
        } else if (role === 'Tenant Owner') {
          demoFirstName = 'Tenant';
          demoLastName = 'Owner';
        } else if (role === 'HR Manager') {
          demoFirstName = 'HR';
          demoLastName = 'Manager';
        } else if (role === 'HR Executive') {
          demoFirstName = 'HR';
          demoLastName = 'Executive';
        } else if (role === 'Manager') {
          demoFirstName = 'Sales';
          demoLastName = 'Manager';
        } else if (role === 'Employee') {
          demoFirstName = 'Staff';
          demoLastName = 'Employee';
        }

        set({
          user: {
            ...currentUser,
            firstName: demoFirstName,
            lastName: demoLastName,
            roles: [role],
            permissions: [...rolePermissions],
          },
        });
      },

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
      name: 'quikboom-next-auth-storage',
    }
  )
);
