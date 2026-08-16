import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  Clock,
  Calendar,
  Laptop,
  MapPin,
  Banknote,
  UserCheck,
  Contact,
  Kanban,
  CheckSquare,
  Activity,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  Database,
  CreditCard,
  Layers,
  FileText,
  User,
  Sliders,
  DollarSign,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import { User as UserType } from './store';

export type UserRole =
  | 'Super Admin'
  | 'Tenant Owner'
  | 'Tenant Admin'
  | 'HR Manager'
  | 'HR Executive'
  | 'Manager'
  | 'Employee';

export interface SubscriptionFeatures {
  crm: boolean;
  hrm: boolean;
  payroll: boolean;
  data_capture: boolean;
  geo_tracking: boolean;
  reports: boolean;
}

export const DEFAULT_SUBSCRIPTION_FEATURES: SubscriptionFeatures = {
  crm: true,
  hrm: true,
  payroll: true,
  data_capture: true,
  geo_tracking: true,
  reports: true,
};

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': [
    'platform.all',
    'dashboard.view',
    'crm.all',
    'leads.view',
    'contacts.view',
    'companies.view',
    'deals.view',
    'tasks.view',
    'activities.view',
    'data_capture.view',
    'hrm.all',
    'employee.view',
    'employee.manage',
    'department.view',
    'designation.view',
    'attendance.view_all',
    'leave.view_all',
    'remote.view_all',
    'visits.view_all',
    'payroll.view',
    'payroll.manage',
    'geo_tracking.view',
    'reports.view',
    'reports.team',
    'reports.platform',
    'notifications.view',
    'roles.manage',
    'settings.view',
    'settings.global',
    'subscription.view',
    'tenants.manage',
    'plans.manage',
    'subscriptions.manage',
    'billing.manage',
    'payments.view',
    'coupons.manage',
    'features.manage',
    'audit_logs.view',
    'data_reset.all',
    'data_reset.view',
    'data_reset.module',
    'data_reset.employee',
  ],
  // Retain definition of disabled roles for future activation without active access in current version
  'Tenant Owner': [],
  'Tenant Admin': [],
  'HR Manager': [],
  'HR Executive': [],
  'Manager': [],
  'Employee': [
    'mobile.access',
    'attendance.view_own',
    'leave.view_own',
    'remote.view_own',
    'visits.view_own',
    'payroll.view_own',
    'salary_slips.view_own',
    'tasks.view_own',
    'notifications.view',
    'profile.view',
  ],
};

export interface NavItemConfig {
  name: string;
  href: string;
  icon: any;
  permission?: string | string[];
  feature?: keyof SubscriptionFeatures;
  roles?: string[];
  hideForRoles?: string[];
  badge?: string;
}

export interface NavSectionConfig {
  id: string;
  category: string;
  sectionIcon: any;
  items: NavItemConfig[];
  roles?: string[];
  hideForRoles?: string[];
  feature?: keyof SubscriptionFeatures;
}

export const CENTRAL_NAVIGATION: NavSectionConfig[] = [
  // PLATFORM SECTION (Super Admin Only)
  {
    id: 'platform',
    category: 'PLATFORM MANAGEMENT',
    sectionIcon: ShieldCheck,
    roles: ['Super Admin'],
    items: [
      { name: 'SaaS Overview', href: '/super-admin', icon: LayoutDashboard, permission: 'platform.all' },
      { name: 'Tenants', href: '/super-admin', icon: Building2, permission: 'tenants.manage' },
      { name: 'Subscription Plans', href: '/super-admin', icon: Layers, permission: 'plans.manage' },
      { name: 'Audit Logs', href: '/audit-logs', icon: History, permission: 'audit_logs.view' },
      { name: 'Global Settings', href: '/settings', icon: Settings, permission: 'settings.global' },
    ],
  },

  // OVERVIEW
  {
    id: 'overview',
    category: 'OVERVIEW',
    sectionIcon: LayoutDashboard,
    roles: ['Super Admin'],
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    ],
  },

  // HRM MANAGEMENT (Super Admin Consolidated Management)
  {
    id: 'hrm',
    category: 'HRM MANAGEMENT',
    sectionIcon: Users,
    feature: 'hrm',
    roles: ['Super Admin'],
    items: [
      {
        name: 'Employees',
        href: '/employees',
        icon: Users,
        permission: 'employee.view',
      },
      {
        name: 'Departments',
        href: '/departments',
        icon: Building2,
        permission: 'department.view',
      },
      {
        name: 'Designations',
        href: '/designations',
        icon: Award,
        permission: 'designation.view',
      },
      {
        name: 'Attendance',
        href: '/attendance',
        icon: Clock,
        permission: 'attendance.view_all',
      },
      {
        name: 'Leave',
        href: '/leaves',
        icon: Calendar,
        permission: 'leave.view_all',
      },
      {
        name: 'Remote Work',
        href: '/remote-work',
        icon: Laptop,
        permission: 'remote.view_all',
      },
      {
        name: 'Visits',
        href: '/visits',
        icon: Activity,
        permission: 'visits.view_all',
      },
      {
        name: 'Payroll',
        href: '/payroll',
        icon: Banknote,
        feature: 'payroll',
        permission: 'payroll.view',
      },
      {
        name: 'Geo Tracking',
        href: '/geo-tracking',
        icon: MapPin,
        feature: 'geo_tracking',
        permission: 'geo_tracking.view',
      },
    ],
  },

  // CRM & SALES (Super Admin Consolidated CRM)
  {
    id: 'crm',
    category: 'CRM & SALES',
    sectionIcon: Kanban,
    feature: 'crm',
    roles: ['Super Admin'],
    items: [
      { name: 'Leads', href: '/leads', icon: UserCheck, permission: 'leads.view' },
      { name: 'Contacts', href: '/contacts', icon: Contact, permission: 'contacts.view' },
      { name: 'Companies', href: '/companies', icon: Building2, permission: 'companies.view' },
      { name: 'Deals Pipeline', href: '/crm', icon: Kanban, permission: 'deals.view' },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
      { name: 'Activities', href: '/activities', icon: Activity, permission: 'activities.view' },
      {
        name: 'Data Capture',
        href: '/data-capture',
        icon: Database,
        feature: 'data_capture',
        permission: 'data_capture.view',
      },
    ],
  },

  // ADMIN & SYSTEM
  {
    id: 'admin',
    category: 'ADMIN & SYSTEM',
    sectionIcon: ShieldCheck,
    roles: ['Super Admin'],
    items: [
      {
        name: 'Reports',
        href: '/reports',
        icon: BarChart3,
        feature: 'reports',
        permission: 'reports.view',
      },
      {
        name: 'Roles & Permissions',
        href: '/roles-permissions',
        icon: ShieldCheck,
        permission: 'roles.manage',
      },
      {
        name: 'Audit Logs',
        href: '/audit-logs',
        icon: History,
        permission: 'audit_logs.view',
      },
      {
        name: 'Tenant Settings',
        href: '/settings',
        icon: Settings,
        permission: 'settings.view',
      },
      {
        name: 'Data Management',
        href: '/settings/data-management',
        icon: Database,
        permission: 'data_reset.view',
      },
      {
        name: 'Subscription',
        href: '/super-admin',
        icon: CreditCard,
        permission: 'subscription.view',
      },
    ],
  },
];

// Helper Functions
export function getUserRole(user: UserType | null): string {
  if (!user || !user.roles || user.roles.length === 0) return 'Employee';
  return user.roles[0];
}

export function getUserPermissions(user: UserType | null): string[] {
  if (!user) return [];
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions;
  }
  const role = getUserRole(user);
  return ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS['Employee'];
}

export function getUserFeatures(user: UserType | null): SubscriptionFeatures {
  if (!user || !user.subscriptionFeatures) {
    return DEFAULT_SUBSCRIPTION_FEATURES;
  }
  return {
    ...DEFAULT_SUBSCRIPTION_FEATURES,
    ...user.subscriptionFeatures,
  };
}

export function isFeatureEnabled(
  user: UserType | null,
  feature?: keyof SubscriptionFeatures
): boolean {
  if (!feature) return true;
  const features = getUserFeatures(user);
  return !!features[feature];
}

export function hasPermission(
  user: UserType | null,
  requiredPermission?: string | string[]
): boolean {
  if (!requiredPermission) return true;
  const userPerms = getUserPermissions(user);

  // Super Admin wildcard
  if (userPerms.includes('platform.all')) return true;

  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some((perm) => userPerms.includes(perm));
  }
  return userPerms.includes(requiredPermission);
}

export function canAccessItem(user: UserType | null, item: NavItemConfig): boolean {
  const role = getUserRole(user);

  // Check explicit roles allowlist
  if (item.roles && !item.roles.includes(role)) {
    return false;
  }

  // Check explicit hideForRoles blacklist
  if (item.hideForRoles && item.hideForRoles.includes(role)) {
    return false;
  }

  // Check subscription feature availability
  if (item.feature && !isFeatureEnabled(user, item.feature)) {
    return false;
  }

  // Check permission
  if (item.permission && !hasPermission(user, item.permission)) {
    return false;
  }

  return true;
}

export function canAccessSection(user: UserType | null, section: NavSectionConfig): boolean {
  const role = getUserRole(user);

  if (section.roles && !section.roles.includes(role)) {
    return false;
  }

  if (section.hideForRoles && section.hideForRoles.includes(role)) {
    return false;
  }

  if (section.feature && !isFeatureEnabled(user, section.feature)) {
    return false;
  }

  return true;
}

export function filterNavigation(
  sections: NavSectionConfig[],
  user: UserType | null
): NavSectionConfig[] {
  const role = getUserRole(user);
  // Only Super Admin has navigation items in the Admin Panel
  if (!ADMIN_PANEL_ALLOWED_ROLES.includes(role)) {
    return [];
  }

  return sections
    .filter((section) => canAccessSection(user, section))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessItem(user, item)),
    }))
    .filter((section) => section.items.length > 0);
}

export const ADMIN_PANEL_ALLOWED_ROLES: string[] = ['Super Admin'];

// Route Protection Definition for Direct URL Protection
export interface RouteAccessResult {
  allowed: boolean;
  reason?: 'UNAUTHENTICATED' | 'NO_PERMISSION' | 'FEATURE_DISABLED' | 'ADMIN_ONLY';
  requiredPermission?: string;
  requiredFeature?: string;
  message?: string;
}

export function checkRouteAccess(pathname: string, user: UserType | null): RouteAccessResult {
  // Public routes
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-otp'
  ) {
    return { allowed: true };
  }

  if (!user) {
    return {
      allowed: false,
      reason: 'UNAUTHENTICATED',
      message: 'Please sign in to access this page.',
    };
  }

  const role = getUserRole(user);

  // STRICT REQUIREMENT: Admin Panel is only accessible to Super Admin and HR roles
  if (!ADMIN_PANEL_ALLOWED_ROLES.includes(role)) {
    return {
      allowed: false,
      reason: 'ADMIN_ONLY',
      message: `Access Restricted: The QuikBoom Admin Panel is reserved exclusively for Super Admin and HR Administrators. Employees with role "${role}" must use the QuikBoom Mobile App.`,
    };
  }

  // Find if route matches any navigation item
  for (const section of CENTRAL_NAVIGATION) {
    // Check section feature
    if (section.feature && !isFeatureEnabled(user, section.feature)) {
      const isRouteInSection = section.items.some(
        (i) => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href))
      );
      if (isRouteInSection) {
        return {
          allowed: false,
          reason: 'FEATURE_DISABLED',
          requiredFeature: section.feature,
          message: `The "${section.feature.toUpperCase()}" module is not included in your tenant subscription plan.`,
        };
      }
    }

    for (const item of section.items) {
      const matches = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
      if (matches) {
        // Check feature
        if (item.feature && !isFeatureEnabled(user, item.feature)) {
          return {
            allowed: false,
            reason: 'FEATURE_DISABLED',
            requiredFeature: item.feature,
            message: `The "${item.name}" feature is currently disabled or not available in your current subscription.`,
          };
        }

        // Check role restriction
        if (item.hideForRoles && item.hideForRoles.includes(role)) {
          return {
            allowed: false,
            reason: 'NO_PERMISSION',
            message: `Users with role "${role}" do not have permission to access ${item.name}.`,
          };
        }

        // Check permission
        if (item.permission && !hasPermission(user, item.permission)) {
          const permStr = Array.isArray(item.permission) ? item.permission.join(' or ') : item.permission;
          return {
            allowed: false,
            reason: 'NO_PERMISSION',
            requiredPermission: permStr,
            message: `Access denied. You lack the required permission (${permStr}) to view this resource.`,
          };
        }

        return { allowed: true };
      }
    }
  }

  // Default allowed for generic sub-pages unless restricted
  return { allowed: true };
}
