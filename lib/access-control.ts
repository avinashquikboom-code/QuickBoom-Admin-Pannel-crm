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
  Target,
  Briefcase,
  Bell,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Megaphone,
  Image as ImageIcon,
  Zap,
  Share2,
} from 'lucide-react';
import { User as UserType } from './store';

export type UserRole =
  | 'Super Admin'
  | 'SUPER_ADMIN'
  | 'HR'
  | 'HR Manager'
  | 'HR Executive'
  | 'Customer Owner'
  | 'Customer Admin'
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

const SUPER_ADMIN_PERMISSIONS: string[] = [
  'platform.all',
  'dashboard.view',
  'crm.all',
  'crm.manage',
  'leads.view',
  'contacts.view',
  'companies.view',
  'deals.view',
  'tasks.view',
  'activities.view',
  'data_capture.view',
  'data_capture.manage',
  'hrm.all',
  'hrm.manage',
  'employee.view',
  'employee.manage',
  'employee.create',
  'employee.update',
  'department.view',
  'department.create',
  'department.update',
  'designation.view',
  'designation.create',
  'designation.update',
  'attendance.view',
  'attendance.view_all',
  'attendance.manage',
  'attendance.correction',
  'leave.view',
  'leave.view_all',
  'leave.approve',
  'leave.reject',
  'remote.view',
  'remote.view_all',
  'remote.approve',
  'remote.reject',
  'visits.view',
  'visits.view_all',
  'geo_tracking.view',
  'payroll.view',
  'payroll.manage',
  'payroll.generate',
  'payroll.salary_slip',
  'reports.view',
  'reports.manage',
  'reports.team',
  'reports.platform',
  'notifications.view',
  'roles.manage',
  'permissions.manage',
  'settings.view',
  'settings.manage',
  'settings.global',
  'subscription.view',
  'subscription.manage',
  'customers.manage',
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
  'data_reset.execute',
  'trending.view',
  'trending.manage',
  'banners.view',
  'banners.manage',
  'marketing.view',
  'marketing.manage',
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': SUPER_ADMIN_PERMISSIONS,
  'SUPER_ADMIN': SUPER_ADMIN_PERMISSIONS,
  'HR': [
    'dashboard.view',
    'employee.view',
    'employee.create',
    'employee.update',
    'department.view',
    'department.create',
    'department.update',
    'designation.view',
    'designation.create',
    'designation.update',
    'attendance.view',
    'attendance.view_all',
    'attendance.manage',
    'attendance.correction',
    'leave.view',
    'leave.view_all',
    'leave.approve',
    'leave.reject',
    'remote.view',
    'remote.view_all',
    'remote.approve',
    'remote.reject',
    'visits.view',
    'visits.view_all',
    'geo_tracking.view',
    'payroll.view',
    'payroll.manage',
    'payroll.generate',
    'payroll.salary_slip',
    'reports.view',
    'notifications.view',
  ],
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

export const adminNavigation: {
  superAdmin: NavSectionConfig[];
  hr: NavSectionConfig[];
} = {
  superAdmin: [
    // 1. Dashboard
    {
      id: 'dashboard',
      category: 'Dashboard',
      sectionIcon: LayoutDashboard,
      roles: ['Super Admin'],
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
      ],
    },

    // 2. HRM
    {
      id: 'hrm',
      category: 'HRM',
      sectionIcon: Briefcase,
      feature: 'hrm',
      roles: ['Super Admin'],
      items: [
        { name: 'Live Dashboard', href: '/hrm/live-dashboard', icon: Activity, permission: 'attendance.view_all', badge: 'LIVE' },
        { name: 'Employees', href: '/employees', icon: Users, permission: 'employee.view' },
        { name: 'Teams', href: '/teams', icon: Users, permission: 'employee.view' },
        { name: 'Departments', href: '/departments', icon: Building2, permission: 'department.view' },
        { name: 'Designations', href: '/designations', icon: Award, permission: 'designation.view' },
        { name: 'Attendance', href: '/attendance', icon: Clock, permission: 'attendance.view_all' },
        { name: 'Shifts', href: '/shifts', icon: Clock, permission: 'attendance.view_all' },
        { name: 'Leave', href: '/leaves', icon: Calendar, permission: 'leave.view_all' },
        { name: 'Remote Work', href: '/remote-work', icon: Laptop, permission: 'remote.view_all' },
        { name: 'Geo Tracking', href: '/geo-tracking', icon: MapPin, feature: 'geo_tracking', permission: 'geo_tracking.view' },
        { name: 'Payroll', href: '/payroll', icon: Banknote, feature: 'payroll', permission: 'payroll.view' },
        { name: 'Loans', href: '/loans', icon: DollarSign, feature: 'payroll', permission: 'payroll.view' },
        { name: 'Claims & Expenses', href: '/claims', icon: CreditCard, feature: 'payroll', permission: 'payroll.view' },
      ],
    },

    // 3. CRM
    {
      id: 'crm',
      category: 'CRM',
      sectionIcon: Users,
      feature: 'crm',
      roles: ['Super Admin'],
      items: [
        { name: 'Leads', href: '/leads', icon: UserCheck, permission: 'leads.view' },
        { name: 'Contacts', href: '/contacts', icon: Contact, permission: 'contacts.view' },
        { name: 'Companies', href: '/companies', icon: Building2, permission: 'companies.view' },
        { name: 'Deals', href: '/deals', icon: Kanban, permission: 'deals.view' },
        { name: 'Visits', href: '/visits', icon: Activity, permission: 'visits.view_all' },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
        { name: 'Activities', href: '/activities', icon: Activity, permission: 'activities.view' },
      ],
    },

    // 4. Data Capture
    {
      id: 'data-capture',
      category: 'Data Capture',
      sectionIcon: Target,
      feature: 'data_capture',
      roles: ['Super Admin'],
      items: [
        { name: 'New Capture', href: '/data-capture', icon: Target, permission: 'data_capture.view' },
        { name: 'Capture History', href: '/data-capture/history', icon: History, permission: 'data_capture.view' },
        { name: 'Usage & Quota', href: '/data-capture/usage', icon: Activity, permission: 'data_capture.view' },
      ],
    },

    // 5. Reports
    {
      id: 'reports',
      category: 'Reports',
      sectionIcon: BarChart3,
      feature: 'reports',
      roles: ['Super Admin'],
      items: [
        { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
      ],
    },

    // 6. Notifications
    {
      id: 'notifications',
      category: 'Notifications',
      sectionIcon: Bell,
      roles: ['Super Admin'],
      items: [
        { name: 'Notifications', href: '/notifications', icon: Bell, permission: 'notifications.view' },
      ],
    },

    // 7. Customers & Subscriptions
    {
      id: 'customers',
      category: 'Customers',
      sectionIcon: Building2,
      roles: ['Super Admin'],
      items: [
        { name: 'All Customers', href: '/customers', icon: Building2, permission: 'customers.manage' },
        { name: 'Invoices & Billing', href: '/invoices', icon: FileText, permission: 'customers.manage' },
        { name: 'Subscription Plans', href: '/customers/plans', icon: Layers, permission: 'plans.manage' },
        { name: 'Active Subscriptions', href: '/customers/subscriptions', icon: ShieldCheck, permission: 'subscriptions.manage' },
        { name: 'Offline Payment Requests', href: '/customers/offline-requests', icon: Clock, permission: 'subscriptions.manage' },
        { name: 'Resource Usage', href: '/customers/usage', icon: Activity, permission: 'subscription.view' },
        { name: 'Super Admin Hub', href: '/super-admin', icon: ShieldCheck, permission: 'customers.manage' },
      ],
    },

    // 8. Marketing
    {
      id: 'marketing',
      category: 'Marketing',
      sectionIcon: Megaphone,
      roles: ['Super Admin'],
      items: [
        { name: 'Trending Content', href: '/trending', icon: TrendingUp, permission: 'customers.manage' },
        { name: 'Home Banners', href: '/marketing/banners', icon: ImageIcon, permission: 'customers.manage' },
        { name: 'Social Media Handlers', href: '/marketing/social-media', icon: Share2, permission: 'customers.manage' },
      ],
    },

    // 9. Data Management
    {
      id: 'data-management',
      category: 'Data Management',
      sectionIcon: Trash2,
      roles: ['Super Admin'],
      items: [
        { name: 'Data Overview', href: '/settings/data-management', icon: Database, permission: 'data_reset.view' },
        { name: 'Module-wise Reset', href: '/settings/data-management?tab=modules', icon: RefreshCw, permission: 'data_reset.module' },
        { name: 'Employee-wise Reset', href: '/settings/data-management?tab=employees', icon: User, permission: 'data_reset.employee' },
        { name: 'Reset History', href: '/settings/data-management?tab=history', icon: History, permission: 'data_reset.view' },
      ],
    },

    // 10. Settings
    {
      id: 'settings',
      category: 'Settings',
      sectionIcon: Settings,
      roles: ['Super Admin'],
      items: [
        { name: 'Roles & Permissions', href: '/roles-permissions', icon: ShieldCheck, permission: 'roles.manage' },
        { name: 'Company Policies', href: '/settings/policies', icon: FileText, permission: 'settings.view' },
        { name: 'Integrations', href: '/settings', icon: Zap, permission: 'settings.global' },
      ],
    },
  ],

  hr: [
    // 1. Dashboard
    {
      id: 'dashboard',
      category: 'Dashboard',
      sectionIcon: LayoutDashboard,
      roles: ['HR'],
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
      ],
    },

    // 2. Employees
    {
      id: 'employees',
      category: 'Employees',
      sectionIcon: Users,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Employees', href: '/employees', icon: Users, permission: 'employee.view' },
      ],
    },

    // 3. Departments
    {
      id: 'departments',
      category: 'Departments',
      sectionIcon: Building2,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Departments', href: '/departments', icon: Building2, permission: 'department.view' },
      ],
    },

    // 4. Designations
    {
      id: 'designations',
      category: 'Designations',
      sectionIcon: Award,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Designations', href: '/designations', icon: Award, permission: 'designation.view' },
      ],
    },

    // 5. Attendance
    {
      id: 'attendance',
      category: 'Attendance',
      sectionIcon: Clock,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Live Dashboard', href: '/hrm/live-dashboard', icon: Activity, permission: 'attendance.view', badge: 'LIVE' },
        { name: 'Attendance', href: '/attendance', icon: Clock, permission: 'attendance.view' },
      ],
    },

    // 5b. Shifts
    {
      id: 'shifts',
      category: 'Shifts',
      sectionIcon: Clock,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Shifts & Guidance', href: '/shifts', icon: Clock, permission: 'attendance.view' },
      ],
    },

    // 6. Leave
    {
      id: 'leaves',
      category: 'Leave',
      sectionIcon: Calendar,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Leave', href: '/leaves', icon: Calendar, permission: 'leave.view' },
      ],
    },

    // 7. Remote Work
    {
      id: 'remote-work',
      category: 'Remote Work',
      sectionIcon: Laptop,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Remote Work', href: '/remote-work', icon: Laptop, permission: 'remote.view' },
      ],
    },

    // 8. Visits
    {
      id: 'visits',
      category: 'Visits',
      sectionIcon: Activity,
      feature: 'crm',
      roles: ['HR'],
      items: [
        { name: 'Visits', href: '/visits', icon: Activity, permission: 'visits.view' },
      ],
    },

    // 9. Geo Tracking
    {
      id: 'geo-tracking',
      category: 'Geo Tracking',
      sectionIcon: MapPin,
      feature: 'geo_tracking',
      roles: ['HR'],
      items: [
        { name: 'Geo Tracking', href: '/geo-tracking', icon: MapPin, permission: 'geo_tracking.view' },
      ],
    },

    // 10. Payroll
    {
      id: 'payroll',
      category: 'Payroll',
      sectionIcon: Banknote,
      feature: 'payroll',
      roles: ['HR'],
      items: [
        { name: 'Payroll', href: '/payroll', icon: Banknote, permission: 'payroll.view' },
        { name: 'Loans', href: '/loans', icon: DollarSign, permission: 'payroll.view' },
        { name: 'Claims & Expenses', href: '/claims', icon: CreditCard, permission: 'payroll.view' },
      ],
    },

    // 11. Reports
    {
      id: 'reports',
      category: 'Reports',
      sectionIcon: BarChart3,
      feature: 'reports',
      roles: ['HR'],
      items: [
        { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
      ],
    },

    // 12. Notifications
    {
      id: 'notifications',
      category: 'Notifications',
      sectionIcon: Bell,
      roles: ['HR'],
      items: [
        { name: 'Notifications', href: '/notifications', icon: Bell, permission: 'notifications.view' },
      ],
    },
  ],
};

// Fallback/Legacy reference
export const CENTRAL_NAVIGATION = adminNavigation.superAdmin;

export const ADMIN_PANEL_ALLOWED_ROLES: string[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'COMPANY_ADMIN',
];

// Helper Functions
export function getUserRole(user: UserType | null): string {
  if (!user) return 'Unauthorized';
  const roleList = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
  if (roleList.length === 0) return 'Unauthorized';
  const hasAdmin = roleList.some(
    (r) => {
      const norm = String(r).toUpperCase().replace(/\s+/g, '_');
      return norm === 'SUPER_ADMIN' || norm === 'ADMIN' || norm === 'COMPANY_ADMIN';
    }
  );
  if (hasAdmin) return 'Super Admin';
  return roleList[0];
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
  _sectionsIgnored: NavSectionConfig[] | undefined,
  user: UserType | null
): NavSectionConfig[] {
  const role = getUserRole(user);

  if (role !== 'Super Admin') {
    return [];
  }

  const baseSections = adminNavigation.superAdmin;

  return baseSections
    .filter((section) => canAccessSection(user, section))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessItem(user, item)),
    }))
    .filter((section) => section.items.length > 0);
}

export const SUPER_ADMIN_ONLY_ROUTES: string[] = [
  '/crm',
  '/leads',
  '/contacts',
  '/companies',
  '/visits',
  '/tasks',
  '/activities',
  '/data-capture',
  '/super-admin',
  '/settings/data-management',
  '/roles-permissions',
  '/audit-logs',
];

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

  // STRICT REQUIREMENT: Admin Panel is strictly accessible to Super Admin only
  if (role !== 'Super Admin') {
    return {
      allowed: false,
      reason: 'ADMIN_ONLY',
      message: 'Access Denied: The Admin Panel is strictly for SUPER_ADMIN only. Other roles must use the mobile application.',
    };
  }

  const activeNav = adminNavigation.superAdmin;

  // Find if route matches any navigation item
  for (const section of activeNav) {
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
          message: `The "${section.feature.toUpperCase()}" module is not included in your customer subscription plan.`,
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
            message: `Access denied (403). You lack the required permission (${permStr}) to view this resource.`,
          };
        }

        return { allowed: true };
      }
    }
  }

  // Default allowed for authorized sub-pages
  return { allowed: true };
}
