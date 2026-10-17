import { Clock3, MonitorSmartphone, LayoutDashboard, Users, Building2, Award, Clock, Calendar, Laptop, MapPin, Banknote, UserCheck, Contact, Kanban, CheckSquare, Activity, BarChart3, ShieldCheck, History, Settings, Database, CreditCard, Layers, FileText, User, DollarSign, Ticket, TrendingUp, Target, Briefcase, Bell, Trash2, RefreshCw, Megaphone, Image as ImageIcon, Zap, Share2, Sparkles, Video, Coins, Mail, MessageSquare, Copy, UserX } from 'lucide-react';
import { User as UserType } from './store';



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

export interface NavSubItemConfig {
  name: string;
  href: string;
  icon?: any;
  
  roles?: string[];
  hideForRoles?: string[];
  badge?: string;
}

export interface NavItemConfig {
  name: string;
  href: string;
  icon: any;
  
  feature?: keyof SubscriptionFeatures;
  roles?: string[];
  hideForRoles?: string[];
  badge?: string;
  children?: NavSubItemConfig[];
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
  customer: NavSectionConfig[];
  employee: NavSectionConfig[];
} = {
  superAdmin: [
    // 1. Dashboard
    {
      id: 'dashboard',
      category: 'Dashboard',
      sectionIcon: LayoutDashboard,
      roles: ['Super Admin'],
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard,  },
      ],
    },

    // 2. Master Data
    {
      id: 'master',
      category: 'Master',
      sectionIcon: Database,
      roles: ['Super Admin'],
      items: [
        { name: 'Departments', href: '/master/departments', icon: Building2,  },
        { name: 'Designations', href: '/master/designations', icon: Award,  },
        { name: 'Employee Types', href: '/master/employee-types', icon: Users,  },
        { name: 'Leave Types', href: '/master/leave-types', icon: Calendar,  },
        { name: 'Leave Policies', href: '/master/leave-policies', icon: FileText,  },
        { name: 'Work Types', href: '/master/work-types', icon: Briefcase,  },
        { name: 'Activity Types', href: '/master/activity-types', icon: Activity,  },
        { name: 'Task Status', href: '/master/task-status', icon: CheckSquare,  },
        { name: 'Lead Stages', href: '/master/lead-stages', icon: Kanban,  },
        { name: 'Lead Sources', href: '/master/lead-sources', icon: Target,  },
        { name: 'Subscription Plans', href: '/master/subscription-plans', icon: Layers,  },
        { name: 'Expense Categories', href: '/master/expense-categories', icon: CreditCard,  },
        { name: 'Loan Types', href: '/master/loan-types', icon: DollarSign,  },
        { name: 'Payment Methods', href: '/master/payment-methods', icon: Banknote,  },
      ],
    },

    // 3. HRM
    {
      id: 'hrm',
      category: 'HRM',
      sectionIcon: Briefcase,
      feature: 'hrm',
      roles: ['Super Admin'],
      items: [
        { name: 'Live Dashboard', href: '/hrm/live-dashboard', icon: Activity,  badge: 'LIVE' },
        { name: 'Office Management', href: '/hrms/offices', icon: Building2,  },
        { name: 'Employees', href: '/employees', icon: Users,  },
        { name: 'Team Management', href: '/teams', icon: Users,  },
        { name: 'Attendance', href: '/attendance', icon: Clock,  },
        { name: 'Shifts', href: '/shifts', icon: Clock,  },
        { name: 'Leave', href: '/leaves', icon: Calendar,  },
        { name: 'Remote Work', href: '/remote-work', icon: Laptop,  },
        { name: 'Geo Tracking', href: '/geo-tracking', icon: MapPin, feature: 'geo_tracking',  },
        { name: 'Payroll', href: '/payroll', icon: Banknote, feature: 'payroll',  },
        { name: 'Commissions', href: '/commissions', icon: Coins, feature: 'payroll',  },
        { name: 'Loans', href: '/loans', icon: DollarSign, feature: 'payroll',  },
        { name: 'Claims & Expenses', href: '/claims', icon: CreditCard, feature: 'payroll',  },
      ],
    },

    // 4. Data Capture
    {
      id: 'data-capture',
      category: 'Data Capture',
      sectionIcon: Target,
      feature: 'data_capture',
      roles: ['Super Admin', 'SUPER_ADMIN', 'Customer Owner', 'Customer Admin', 'Manager'],
      items: [
        { name: 'Data Capture', href: '/data-capture', icon: Target,  },
        { name: 'Capture History', href: '/data-capture/history', icon: History,  },
        { name: 'Usage & Quota', href: '/data-capture/usage', icon: Activity,  },
      ],
    },

    // 5. CRM
    {
      id: 'crm',
      category: 'CRM',
      sectionIcon: Users,
      feature: 'crm',
      roles: ['Super Admin'],
      items: [
        { name: 'Leads', href: '/leads', icon: UserCheck,  },
        { name: 'Lead Limits', href: '/leads/limits', icon: ShieldCheck,  },
        { name: 'Contacts', href: '/contacts', icon: Contact,  },
        { name: 'Companies', href: '/companies', icon: Building2,  },
        { name: 'Deals', href: '/deals', icon: Kanban,  },
        { name: 'Visits', href: '/visits', icon: Activity,  },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare,  },
        { name: 'Activities', href: '/activities', icon: Activity,  },
      ],
    },

    // 6. Templates (Dedicated Top-Level Section)
    {
      id: 'templates',
      category: 'Templates',
      sectionIcon: Copy,
      roles: ['Super Admin'],
      items: [
        { name: 'Email Templates', href: '/templates/email', icon: Mail,  },
        { name: 'Meta Templates', href: '/templates/meta', icon: MessageSquare,  },
      ],
    },

    // 7. Customers & Subscriptions
    {
      id: 'customers',
      category: 'Customers',
      sectionIcon: Building2,
      roles: ['Super Admin'],
      items: [
        { name: 'All Customers', href: '/customers', icon: Building2,  },
        { name: 'Invoices & Billing', href: '/invoices', icon: FileText,  },
        { name: 'Subscription Plans', href: '/customers/plans', icon: Layers,  },
        { name: 'Coupons', href: '/customers/coupons', icon: Ticket,  },
        { name: 'Active Subscriptions', href: '/customers/subscriptions', icon: ShieldCheck,  },
        { name: 'Offline Payment Requests', href: '/customers/offline-requests', icon: Clock,  },
        { name: 'Resource Usage', href: '/customers/usage', icon: Activity,  },
        { name: 'Super Admin Hub', href: '/super-admin', icon: ShieldCheck,  },
      ],
    },

    // 7. Influencer Management
    {
      id: 'influencer-management',
      category: 'Influencer Management',
      sectionIcon: Megaphone,
      roles: ['Super Admin'],
      items: [
        { name: 'Influencer Hub', href: '/influencers', icon: Award,  },
        { name: 'Influencer Applications', href: '/influencers/applications', icon: UserCheck,  },
        { name: 'Influencer Bookings', href: '/influencers/bookings', icon: CheckSquare,  },
      ],
    },

    // 8. AI & Social
    {
      id: 'ai-social',
      category: 'AI & Social',
      sectionIcon: Sparkles,
      roles: ['Super Admin'],
      items: [
        { name: 'AI Studio & Social', href: '/marketing/ai-studio', icon: Sparkles,  },
        { name: 'AI Credits Management', href: '/marketing/ai-credits', icon: Coins,  },
        { name: 'SSM Account Access Details', href: '/marketing/social-media', icon: Share2,  },
      ],
    },

    // 9. Content Management
    {
      id: 'content-management',
      category: 'Content Management',
      sectionIcon: Video,
      roles: ['Super Admin'],
      items: [
        { name: 'Trending Content', href: '/trending', icon: TrendingUp,  },
        { name: 'Home Banners', href: '/marketing/banners', icon: ImageIcon,  },
        { name: 'Marketing Videos', href: '/marketing/videos', icon: Video,  },
      ],
    },

    // 10. Data Management
    {
      id: 'data-management',
      category: 'Data Management',
      sectionIcon: Trash2,
      roles: ['Super Admin'],
      items: [
        { name: 'Data Overview', href: '/settings/data-management', icon: Database,  },
        { name: 'Module-wise Reset', href: '/settings/data-management?tab=modules', icon: RefreshCw,  },
        { name: 'Employee-wise Reset', href: '/settings/data-management?tab=employees', icon: User,  },
        { name: 'Bin', href: '/settings/data-management?tab=bin', icon: Trash2,  },
        { name: 'Reset History', href: '/settings/data-management?tab=history', icon: History,  },
      ],
    },

    // 11. Reports (Positioned directly above Settings)
    {
      id: 'reports',
      category: 'Reports',
      sectionIcon: BarChart3,
      feature: 'reports',
      roles: ['Super Admin'],
      items: [
        { name: 'Reports', href: '/reports', icon: BarChart3,  },
      ],
    },

    // 12. Settings
    {
      id: 'settings',
      category: 'Settings',
      sectionIcon: Settings,
      roles: ['Super Admin'],
      items: [
        { name: 'Notification Center', href: '/settings/notifications', icon: Bell,  },
        { name: 'Commission Settings', href: '/commissions?tab=settings', icon: Coins,  },
        { name: 'Company Policies', href: '/settings/policies', icon: FileText,  },
        { name: 'Integrations', href: '/settings', icon: Zap,  },
        { name: 'Account Deletion', href: '/settings/account-deletion', icon: UserX },
        { name: 'Activity Logs', href: '/activity-logs', icon: Activity,  },
      ],
    },
  ],

    customer: [
    {
      id: 'dashboard',
      category: 'Dashboard',
      sectionIcon: LayoutDashboard,
      roles: ['Customer'],
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard,  },
      ],
    },
    {
      id: 'subscription-plans',
      category: 'Subscriptions',
      sectionIcon: Layers,
      roles: ['Customer'],
      items: [
        { name: 'Subscription Plans', href: '/customers/plans', icon: Layers,  },
      ],
    },
    {
      id: 'invoices',
      category: 'Billing',
      sectionIcon: FileText,
      roles: ['Customer'],
      items: [
        { name: 'Invoices & Billing', href: '/invoices', icon: FileText,  },
      ],
    },
    {
      id: 'profile',
      category: 'Account',
      sectionIcon: User,
      roles: ['Customer'],
      items: [
        { name: 'Profile', href: '/profile', icon: User,  },
      ],
    },
    {
      id: 'social-media',
      category: 'Social Media',
      sectionIcon: Share2,
      roles: ['Customer'],
      items: [
        { name: 'SSM Account Access', href: '/marketing/social-media', icon: Share2,  },
      ],
    },
    {
      id: 'influencers',
      category: 'Influencers',
      sectionIcon: Megaphone,
      roles: ['Customer'],
      items: [
        { name: 'Influencer Hub', href: '/influencers', icon: Award,  },
        { name: 'My Influencer Bookings', href: '/influencers/bookings', icon: CheckSquare,  },
      ],
    },
    {
      id: 'notifications',
      category: 'Notifications',
      sectionIcon: Bell,
      roles: ['Customer'],
      items: [
        { name: 'Notifications', href: '/settings/notifications', icon: Bell,  },
      ],
    }
  ],
    employee: [
    {
      id: 'dashboard',
      category: 'Dashboard',
      sectionIcon: LayoutDashboard,
      roles: ['Employee'],
      items: [
        { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard,  },
      ],
    },
    {
      id: 'crm',
      category: 'CRM / Sales',
      sectionIcon: Layers,
      roles: ['Employee'],
      items: [
        { name: 'Data Capture', href: '/employee/data-capture', icon: Database,  },
        { name: 'Leads', href: '/employee/leads', icon: Users,  },
        { name: 'Customers', href: '/employee/customers', icon: Building2,  },
      ],
    },
    {
      id: 'workplace',
      category: 'HRM & Workplace',
      sectionIcon: Clock3,
      roles: ['Employee'],
      items: [
        { name: 'Attendance', href: '/employee/attendance', icon: Clock3,  },
        { name: 'Requests & Leaves', href: '/employee/leaves', icon: Calendar,  },
        { name: 'Remote Work', href: '/employee/remote-work', icon: MonitorSmartphone,  },
        { name: 'Salary Slips', href: '/employee/salary-slips', icon: FileText,  },
      ],
    },
    {
      id: 'system',
      category: 'System',
      sectionIcon: Settings,
      roles: ['Employee'],
      items: [
        { name: 'Profile', href: '/employee/profile', icon: User,  },
        { name: 'Notifications', href: '/employee/notifications', icon: Bell,  },
        { name: 'Settings', href: '/employee/settings', icon: Settings,  },
      ],
    }
  ],
  hr: [
    // 1. Dashboard
    {
      id: 'dashboard',
      category: 'Dashboard',
      sectionIcon: LayoutDashboard,
      roles: ['HR'],
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard,  },
      ],
    },

    // 2. Offices & Branches
    {
      id: 'offices',
      category: 'Offices',
      sectionIcon: Building2,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Office Management', href: '/hrms/offices', icon: Building2,  },
      ],
    },

    // 3. Employees
    {
      id: 'employees',
      category: 'Employees',
      sectionIcon: Users,
      feature: 'hrm',
      roles: ['HR'],
      items: [
        { name: 'Employees', href: '/employees', icon: Users,  },
        { name: 'Team Management', href: '/teams', icon: Users,  },
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
        { name: 'Departments', href: '/departments', icon: Building2,  },
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
        { name: 'Designations', href: '/designations', icon: Award,  },
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
        { name: 'Live Dashboard', href: '/hrm/live-dashboard', icon: Activity,  badge: 'LIVE' },
        { name: 'Attendance', href: '/attendance', icon: Clock,  },
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
        { name: 'Shifts & Guidance', href: '/shifts', icon: Clock,  },
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
        { name: 'Leave', href: '/leaves', icon: Calendar,  },
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
        { name: 'Remote Work', href: '/remote-work', icon: Laptop,  },
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
        { name: 'Visits', href: '/visits', icon: Activity,  },
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
        { name: 'Geo Tracking', href: '/geo-tracking', icon: MapPin,  },
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
        { name: 'Payroll', href: '/payroll', icon: Banknote,  },
        { name: 'Loans', href: '/loans', icon: DollarSign,  },
        { name: 'Claims & Expenses', href: '/claims', icon: CreditCard,  },
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
        { name: 'Reports', href: '/reports', icon: BarChart3,  },
      ],
    },

    // 12. Settings
    {
      id: 'settings',
      category: 'Settings',
      sectionIcon: Settings,
      roles: ['HR'],
      items: [
        { name: 'Notification Center', href: '/settings/notifications', icon: Bell,  },
        { name: 'Account Deletion', href: '/settings/account-deletion', icon: UserX },
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
  const roleList = user.accountType ? [user.accountType] : (Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []));
  if (roleList.length === 0) return 'Unauthorized';
  const hasAdmin = roleList.some(
    (r) => {
      const norm = String(r).toUpperCase().replace(/\s+/g, '_');
      return norm === 'SUPER_ADMIN' || norm === 'ADMIN' || norm === 'COMPANY_ADMIN';
    }
  );
  if (hasAdmin) return 'Super Admin';
  const hasCustomer = roleList.some((r) => {
    const norm = String(r).toUpperCase().replace(/\s+/g, '_');
    return norm === 'CUSTOMER_OWNER' || norm === 'CUSTOMER_ADMIN' || norm === 'CUSTOMER';
  });
  if (hasCustomer) return 'Customer';
  const hasEmployee = roleList.some((r) => {
    const norm = String(r).toUpperCase().replace(/\s+/g, '_');
    return norm === 'EMPLOYEE' || norm === 'STAFF';
  });
  if (hasEmployee) return 'Employee';
  return roleList[0];
}

export function isBpoEmployee(user: any): boolean {
  if (!user) return false;

  // 1. Explicit boolean flag from backend
  if (user.isBpo === true || user.employee?.isBpo === true) {
    return true;
  }
  if (user.isBpo === false || user.employee?.isBpo === false) {
    return false;
  }

  // 2. Department check
  const dept = String(
    user.department ||
    user.departmentName ||
    user.employee?.department ||
    user.employee?.departmentName ||
    user.employee?.department?.name ||
    user.employee?.department?.code ||
    ''
  ).toUpperCase();
  if (dept.includes('BPO')) return true;

  // 3. Designation check
  const desig = String(
    user.designation ||
    user.designationName ||
    user.employee?.designation ||
    user.employee?.designationName ||
    user.employee?.designation?.name ||
    user.employee?.designation?.code ||
    ''
  ).toUpperCase();
  if (desig.includes('BPO') || desig.includes('TELE')) return true;

  // 4. Team check
  const team = String(
    user.team ||
    user.teamName ||
    user.employee?.team ||
    user.employee?.teamName ||
    ''
  ).toUpperCase();
  if (team.includes('BPO')) return true;

  return false;
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
  const role = getUserRole(user);
  if (role === 'Super Admin') return true;
  const features = getUserFeatures(user);
  return !!features[feature];
}

// Visibility follows the authenticated workspace; record access is enforced by the API.
export function isAuthenticatedUser(user: UserType | null): boolean { return Boolean(user?.id); }

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

  const baseSections = role === 'Super Admin' 
    ? adminNavigation.superAdmin 
    : role === 'Customer' 
      ? adminNavigation.customer 
      : role === 'Employee' 
        ? adminNavigation.employee 
        : [];

  if (baseSections.length === 0) return [];

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
  '/leads/stages',
  '/leads/limits',
  '/contacts',
  '/companies',
  '/visits',
  '/tasks',
  '/activities',
  '/data-capture',
  '/super-admin',
  '/settings/data-management',
  '/audit-logs',
  '/activity-logs',
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

  // Route matching is handled below. But enforce path restrictions based on role
  if (role === 'Employee' && !pathname.startsWith('/employee')) {
    return {
      allowed: false,
      reason: 'NO_PERMISSION',
      message: 'Employees can only access the /employee sections.',
    };
  }

  if (role !== 'Super Admin' && role !== 'Customer' && role !== 'Employee') {
    return {
      allowed: false,
      reason: 'ADMIN_ONLY',
      message: 'Access Denied: Unrecognized role context.',
    };
  }

  const activeNav = role === 'Super Admin' 
    ? adminNavigation.superAdmin 
    : role === 'Customer' 
      ? adminNavigation.customer 
      : adminNavigation.employee;

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
      const matches =
        pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
        (item.href === '/settings/notifications' && (pathname === '/notifications' || pathname.startsWith('/notifications'))) ||
        (item.href === '/hrms/offices' && (pathname === '/offices' || pathname === '/hrm/offices')) ||
        (item.href === '/hrm/live-dashboard' && pathname === '/live-dashboard') ||
        (item.href === '/teams' && pathname === '/team-management');
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


        return { allowed: true };
      }
    }
  }

  // Default allowed for authorized sub-pages
  return { allowed: true };
}
