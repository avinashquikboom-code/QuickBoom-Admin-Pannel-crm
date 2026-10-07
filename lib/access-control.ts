import { Clock3, MonitorSmartphone, CalendarDays,

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
  Sparkles,
  Video,
  Coins,
  Mail,
  MessageSquare,
  Copy,
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
  'data_capture.create',
  'data_capture.edit',
  'data_capture.delete',
  'data_capture.manage',
  'templates.view',
  'templates.create',
  'templates.edit',
  'templates.delete',
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
  'team.view',
  'team.manage',
  'team.create',
  'team.update',
  'teams.view',
  'teams.manage',
  'squad.view',
  'squad.manage',
  'squads.view',
  'squads.manage',
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': SUPER_ADMIN_PERMISSIONS,
  'SUPER_ADMIN': SUPER_ADMIN_PERMISSIONS,
  'HR': [
    'dashboard.view',
    'employee.view',
    'employee.create',
    'employee.update',
    'team.view',
    'team.manage',
    'team.create',
    'team.update',
    'teams.view',
    'teams.manage',
    'squad.view',
    'squad.manage',
    'squads.view',
    'squads.manage',
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
    'employee.dashboard.view',
    'dashboard.view',
    'attendance.view_own',
    'attendance.view',
    'employee.attendance.view',
    'leave.view_own',
    'leave.view',
    'employee.leave.view',
    'remote.view_own',
    'remote.view',
    'employee.remote_work.view',
    'calendar.view',
    'employee.calendar.view',
    'visits.view_own',
    'payroll.view_own',
    'salary_slips.view_own',
    'salary.view',
    'employee.salary.view',
    'tasks.view_own',
    'notifications.view',
    'employee.notifications.view',
    'profile.view',
    'employee.profile.view',
    'settings.view',
    'employee.settings.view',
  ],
};

export interface NavSubItemConfig {
  name: string;
  href: string;
  icon?: any;
  permission?: string | string[];
  roles?: string[];
  hideForRoles?: string[];
  badge?: string;
}

export interface NavItemConfig {
  name: string;
  href: string;
  icon: any;
  permission?: string | string[];
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
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
      ],
    },

    // 2. Master Data
    {
      id: 'master',
      category: 'Master',
      sectionIcon: Database,
      roles: ['Super Admin'],
      items: [
        { name: 'Departments', href: '/master/departments', icon: Building2, permission: 'department.view' },
        { name: 'Designations', href: '/master/designations', icon: Award, permission: 'designation.view' },
        { name: 'Employee Types', href: '/master/employee-types', icon: Users, permission: 'employee.view' },
        { name: 'Leave Types', href: '/master/leave-types', icon: Calendar, permission: 'leave.view' },
        { name: 'Leave Policies', href: '/master/leave-policies', icon: FileText, permission: 'leave.view' },
        { name: 'Work Types', href: '/master/work-types', icon: Briefcase, permission: 'tasks.view' },
        { name: 'Activity Types', href: '/master/activity-types', icon: Activity, permission: 'activities.view' },
        { name: 'Task Status', href: '/master/task-status', icon: CheckSquare, permission: 'tasks.view' },
        { name: 'Lead Stages', href: '/master/lead-stages', icon: Kanban, permission: 'leads.view' },
        { name: 'Lead Sources', href: '/master/lead-sources', icon: Target, permission: 'leads.view' },
        { name: 'Subscription Plans', href: '/master/subscription-plans', icon: Layers, permission: 'plans.manage' },
        { name: 'Expense Categories', href: '/master/expense-categories', icon: CreditCard, permission: 'payroll.view' },
        { name: 'Loan Types', href: '/master/loan-types', icon: DollarSign, permission: 'payroll.view' },
        { name: 'Payment Methods', href: '/master/payment-methods', icon: Banknote, permission: 'customers.manage' },
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
        { name: 'Live Dashboard', href: '/hrm/live-dashboard', icon: Activity, permission: 'attendance.view_all', badge: 'LIVE' },
        { name: 'Office Management', href: '/hrms/offices', icon: Building2, permission: 'hrm.manage' },
        { name: 'Employees', href: '/employees', icon: Users, permission: 'employee.view' },
        { name: 'Team Management', href: '/teams', icon: Users, permission: 'employee.view' },
        { name: 'Attendance', href: '/attendance', icon: Clock, permission: 'attendance.view_all' },
        { name: 'Shifts', href: '/shifts', icon: Clock, permission: 'attendance.view_all' },
        { name: 'Leave', href: '/leaves', icon: Calendar, permission: 'leave.view_all' },
        { name: 'Remote Work', href: '/remote-work', icon: Laptop, permission: 'remote.view_all' },
        { name: 'Geo Tracking', href: '/geo-tracking', icon: MapPin, feature: 'geo_tracking', permission: 'geo_tracking.view' },
        { name: 'Payroll', href: '/payroll', icon: Banknote, feature: 'payroll', permission: 'payroll.view' },
        { name: 'Commissions', href: '/commissions', icon: Coins, feature: 'payroll', permission: 'payroll.view' },
        { name: 'Loans', href: '/loans', icon: DollarSign, feature: 'payroll', permission: 'payroll.view' },
        { name: 'Claims & Expenses', href: '/claims', icon: CreditCard, feature: 'payroll', permission: 'payroll.view' },
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
        { name: 'New Capture', href: '/data-capture', icon: Target, permission: 'data_capture.view' },
        { name: 'Capture History', href: '/data-capture/history', icon: History, permission: 'data_capture.view' },
        { name: 'Usage & Quota', href: '/data-capture/usage', icon: Activity, permission: 'data_capture.view' },
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
        { name: 'Leads', href: '/leads', icon: UserCheck, permission: 'leads.view' },
        { name: 'Lead Limits', href: '/leads/limits', icon: ShieldCheck, permission: 'leads.view' },
        { name: 'Contacts', href: '/contacts', icon: Contact, permission: 'contacts.view' },
        { name: 'Companies', href: '/companies', icon: Building2, permission: 'companies.view' },
        { name: 'Deals', href: '/deals', icon: Kanban, permission: 'deals.view' },
        { name: 'Visits', href: '/visits', icon: Activity, permission: 'visits.view_all' },
        { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
        { name: 'Activities', href: '/activities', icon: Activity, permission: 'activities.view' },
      ],
    },

    // 6. Templates (Dedicated Top-Level Section)
    {
      id: 'templates',
      category: 'Templates',
      sectionIcon: Copy,
      roles: ['Super Admin'],
      items: [
        { name: 'Email Templates', href: '/templates/email', icon: Mail, permission: 'templates.view' },
        { name: 'Meta Templates', href: '/templates/meta', icon: MessageSquare, permission: 'templates.view' },
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

    // 7. Influencer Management
    {
      id: 'influencer-management',
      category: 'Influencer Management',
      sectionIcon: Megaphone,
      roles: ['Super Admin'],
      items: [
        { name: 'Influencer Hub', href: '/influencers', icon: Award, permission: 'customers.manage' },
        { name: 'Influencer Applications', href: '/influencers/applications', icon: UserCheck, permission: 'customers.manage' },
        { name: 'Influencer Bookings', href: '/influencers/bookings', icon: CheckSquare, permission: 'customers.manage' },
      ],
    },

    // 8. AI & Social
    {
      id: 'ai-social',
      category: 'AI & Social',
      sectionIcon: Sparkles,
      roles: ['Super Admin'],
      items: [
        { name: 'AI Studio & Social', href: '/marketing/ai-studio', icon: Sparkles, permission: 'customers.manage' },
        { name: 'AI Credits Management', href: '/marketing/ai-credits', icon: Coins, permission: 'customers.manage' },
        { name: 'SSM Account Access Details', href: '/marketing/social-media', icon: Share2, permission: 'customers.manage' },
      ],
    },

    // 9. Content Management
    {
      id: 'content-management',
      category: 'Content Management',
      sectionIcon: Video,
      roles: ['Super Admin'],
      items: [
        { name: 'Trending Content', href: '/trending', icon: TrendingUp, permission: 'customers.manage' },
        { name: 'Home Banners', href: '/marketing/banners', icon: ImageIcon, permission: 'customers.manage' },
        { name: 'Marketing Videos', href: '/marketing/videos', icon: Video, permission: 'customers.manage' },
      ],
    },

    // 10. Data Management
    {
      id: 'data-management',
      category: 'Data Management',
      sectionIcon: Trash2,
      roles: ['Super Admin'],
      items: [
        { name: 'Data Overview', href: '/settings/data-management', icon: Database, permission: 'data_reset.view' },
        { name: 'Module-wise Reset', href: '/settings/data-management?tab=modules', icon: RefreshCw, permission: 'data_reset.module' },
        { name: 'Employee-wise Reset', href: '/settings/data-management?tab=employees', icon: User, permission: 'data_reset.employee' },
        { name: 'Bin', href: '/settings/data-management?tab=bin', icon: Trash2, permission: 'data_reset.view' },
        { name: 'Reset History', href: '/settings/data-management?tab=history', icon: History, permission: 'data_reset.view' },
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
        { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
      ],
    },

    // 12. Settings
    {
      id: 'settings',
      category: 'Settings',
      sectionIcon: Settings,
      roles: ['Super Admin'],
      items: [
        { name: 'Notification Center', href: '/settings/notifications', icon: Bell, permission: 'notifications.view' },
        { name: 'Commission Settings', href: '/commissions?tab=settings', icon: Coins, permission: 'settings.view' },
        { name: 'Roles & Permissions', href: '/roles-permissions', icon: ShieldCheck, permission: 'roles.manage' },
        { name: 'Company Policies', href: '/settings/policies', icon: FileText, permission: 'settings.view' },
        { name: 'Integrations', href: '/settings', icon: Zap, permission: 'settings.global' },
        { name: 'Activity Logs', href: '/activity-logs', icon: Activity, permission: 'audit_logs.view' },
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
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'CUSTOMER_HOME' },
      ],
    },
    {
      id: 'subscription-plans',
      category: 'Subscriptions',
      sectionIcon: Layers,
      roles: ['Customer'],
      items: [
        { name: 'Subscription Plans', href: '/customers/plans', icon: Layers, permission: 'CUSTOMER_PLANS' },
      ],
    },
    {
      id: 'invoices',
      category: 'Billing',
      sectionIcon: FileText,
      roles: ['Customer'],
      items: [
        { name: 'Invoices & Billing', href: '/invoices', icon: FileText, permission: 'CUSTOMER_INVOICES' },
      ],
    },
    {
      id: 'profile',
      category: 'Account',
      sectionIcon: User,
      roles: ['Customer'],
      items: [
        { name: 'Profile', href: '/profile', icon: User, permission: 'CUSTOMER_PROFILE' },
      ],
    },
    {
      id: 'social-media',
      category: 'Social Media',
      sectionIcon: Share2,
      roles: ['Customer'],
      items: [
        { name: 'SSM Account Access', href: '/marketing/social-media', icon: Share2, permission: 'CUSTOMER_SSM' },
      ],
    },
    {
      id: 'influencers',
      category: 'Influencers',
      sectionIcon: Megaphone,
      roles: ['Customer'],
      items: [
        { name: 'Influencer Hub', href: '/influencers', icon: Award, permission: 'CUSTOMER_INFLUENCERS' },
        { name: 'My Influencer Bookings', href: '/influencers/bookings', icon: CheckSquare, permission: 'CUSTOMER_INFLUENCER_BOOKINGS' },
      ],
    },
    {
      id: 'notifications',
      category: 'Notifications',
      sectionIcon: Bell,
      roles: ['Customer'],
      items: [
        { name: 'Notifications', href: '/settings/notifications', icon: Bell, permission: 'CUSTOMER_NOTIFICATIONS' },
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
        { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard, permission: ['employee.dashboard.view', 'dashboard.view'] },
      ],
    },
    {
      id: 'crm',
      category: 'CRM / Sales',
      sectionIcon: Layers,
      roles: ['Employee'],
      items: [
        { name: 'Data Capture', href: '/employee/data-capture', icon: Database, permission: ['data_capture', 'employee.data_capture.view', 'DATA_CAPTURE'] },
        { name: 'Leads', href: '/employee/leads', icon: Users, permission: ['leads', 'employee.leads.view', 'LEADS'] },
        { name: 'Customers', href: '/employee/customers', icon: Building2, permission: ['customers', 'employee.customers.view', 'CUSTOMERS'] },
      ],
    },
    {
      id: 'workplace',
      category: 'HRM & Workplace',
      sectionIcon: Clock3,
      roles: ['Employee'],
      items: [
        { name: 'Attendance', href: '/employee/attendance', icon: Clock3, permission: ['employee.attendance.view', 'attendance.view_own', 'attendance.view'] },
        { name: 'Requests & Leaves', href: '/employee/leaves', icon: Calendar, permission: ['employee.leave.view', 'leave.view_own', 'leave.view'] },
        { name: 'Remote Work', href: '/employee/remote-work', icon: MonitorSmartphone, permission: ['employee.remote_work.view', 'remote.view_own', 'remote.view'] },
        { name: 'Salary Slips', href: '/employee/salary-slips', icon: FileText, permission: ['employee.salary.view', 'salary_slips.view_own', 'salary.view'] },
      ],
    },
    {
      id: 'system',
      category: 'System',
      sectionIcon: Settings,
      roles: ['Employee'],
      items: [
        { name: 'Profile', href: '/employee/profile', icon: User, permission: ['employee.profile.view', 'profile.view'] },
        { name: 'Notifications', href: '/employee/notifications', icon: Bell, permission: ['employee.notifications.view', 'notifications.view'] },
        { name: 'Settings', href: '/employee/settings', icon: Settings, permission: ['employee.settings.view', 'settings.view'] },
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
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
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
        { name: 'Office Management', href: '/hrms/offices', icon: Building2, permission: 'department.view' },
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
        { name: 'Employees', href: '/employees', icon: Users, permission: 'employee.view' },
        { name: 'Team Management', href: '/teams', icon: Users, permission: 'employee.view' },
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

    // 12. Settings
    {
      id: 'settings',
      category: 'Settings',
      sectionIcon: Settings,
      roles: ['HR'],
      items: [
        { name: 'Notification Center', href: '/settings/notifications', icon: Bell, permission: 'notifications.view' },
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

export function getUserPermissions(user: UserType | null): string[] {
  if (!user) return [];
  const role = getUserRole(user);
  if (role === 'Super Admin') {
    return Array.from(new Set([...SUPER_ADMIN_PERMISSIONS, ...(user.permissions || [])]));
  }
  const defaultRolePerms = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS['Employee'] || [];
  if (user.permissions && user.permissions.length > 0) {
    return Array.from(new Set([...defaultRolePerms, ...user.permissions]));
  }
  return defaultRolePerms;
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

export function normalizePermissionKey(perm: string): string[] {
  if (!perm || typeof perm !== 'string') return [];
  const clean = perm.trim().toLowerCase();
  const withoutEmployee = clean.replace(/^employee\./, '');
  const colonFormat = withoutEmployee.replace(/\./g, ':');
  const dotFormat = withoutEmployee.replace(/:/g, '.');
  const upperColon = withoutEmployee.toUpperCase().replace(/\./g, ':');
  const upperDot = withoutEmployee.toUpperCase().replace(/:/g, '.');
  return Array.from(new Set([clean, withoutEmployee, colonFormat, dotFormat, upperColon, upperDot]));
}

export function hasPermission(
  user: UserType | null,
  requiredPermission?: string | string[]
): boolean {
  if (!requiredPermission) return true;
  const role = getUserRole(user);
  if (role === 'Super Admin') return true;
  const userPerms = getUserPermissions(user);

  // Super Admin wildcard
  if (
    userPerms.includes('platform.all') ||
    userPerms.includes('PLATFORM.ALL') ||
    userPerms.includes('platform:all') ||
    userPerms.includes('PLATFORM:ALL') ||
    userPerms.includes('*') ||
    userPerms.includes('all')
  ) return true;

  const normalizedUserPerms = new Set<string>();
  for (const p of userPerms) {
    if (typeof p === 'string') {
      normalizePermissionKey(p).forEach((k) => normalizedUserPerms.add(k));
    } else if (p && typeof p === 'object' && (p as any).module && (p as any).action) {
      const k = `${(p as any).module}:${(p as any).action}`;
      normalizePermissionKey(k).forEach((item) => normalizedUserPerms.add(item));
    }
  }

  const checkSingle = (perm: string): boolean => {
    if (!perm) return true;
    if (userPerms.includes(perm)) return true;
    const variants = normalizePermissionKey(perm);
    return variants.some((v) => normalizedUserPerms.has(v));
  };

  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some((perm) => checkSingle(perm));
  }
  return checkSingle(requiredPermission);
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
  '/roles-permissions',
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

  if (pathname.startsWith('/employee')) {
    if (role === 'Employee' && !isBpoEmployee(user)) {
      return {
        allowed: false,
        reason: 'NO_PERMISSION',
        message: 'Employee Workspace is available only for BPO employees.',
      };
    }
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
