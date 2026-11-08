import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import {
    faArrowRightArrowLeft,
    faBell,
    faBolt,
    faBoxesStacked,
    faBuilding,
    faBullhorn,
    faCartShopping,
    faChartBar,
    faChartLine,
    faClock,
    faCreditCard,
    faDatabase,
    faDiagramProject,
    faEnvelope,
    faFileInvoiceDollar,
    faFileLines,
    faGear,
    faIdBadge,
    faImage,
    faIndustry,
    faLayerGroup,
    faListCheck,
    faMessage,
    faMoneyBill,
    faReceipt,
    faShareNodes,
    faShieldHalved,
    faStar,
    faTags,
    faTrash,
    faUsers,
    faVideo,
    faWallet,
} from '@fortawesome/free-solid-svg-icons';

export const dataCaptureNavigation = [
    { name: 'Data Capture', href: '/admin/sections/data-capture', icon: faDatabase },
    { name: 'Usage & Quota', href: '/admin/sections/usage-quota', icon: faChartBar },
];

export const masterNavigation = [
    { name: 'Departments', href: '/admin/sections/departments', icon: faLayerGroup },
    { name: 'Designations', href: '/admin/sections/designations', icon: faIdBadge },
    { name: 'Employee Types', href: '/admin/sections/employee-types', icon: faUsers },
    { name: 'Leave Types', href: '/admin/sections/leave-types', icon: faCalendar },
    { name: 'Leave Policies', href: '/admin/sections/leave-policies', icon: faFileLines },
    { name: 'Work Types', href: '/admin/sections/work-types', icon: faListCheck },
    { name: 'Activity Types', href: '/admin/sections/activity-types', icon: faChartBar },
    { name: 'Task Status', href: '/admin/sections/task-status', icon: faListCheck },
    { name: 'Subscription Plans', href: '/admin/sections/subscription-plans', icon: faLayerGroup },
    { name: 'Expense Categories', href: '/admin/sections/expense-categories', icon: faTags },
    { name: 'Loan Types', href: '/admin/sections/loan-types', icon: faMoneyBill },
    { name: 'Payment Methods', href: '/admin/sections/payment-methods', icon: faCreditCard },
];

export const operationsNavigation = [
    { name: 'Tasks', href: '/admin/sections/tasks', icon: faListCheck },
    { name: 'Projects', href: '/admin/sections/projects', icon: faDiagramProject },
    { name: 'Production', href: '/admin/production/dashboard', icon: faIndustry },
    { name: 'Inventory', href: '/admin/sections/inventory', icon: faBoxesStacked },
    { name: 'Orders', href: '/admin/sections/orders', icon: faCartShopping },
];

export const financeNavigation = [
    { name: 'Revenue', href: '/admin/sections/revenue', icon: faChartLine },
    { name: 'Expenses', href: '/admin/sections/expenses', icon: faReceipt },
    { name: 'Payments', href: '/admin/sections/payments', icon: faMoneyBill },
    { name: 'Invoices', href: '/admin/sections/invoices', icon: faFileInvoiceDollar },
    { name: 'Wallet', href: '/admin/sections/wallet', icon: faWallet },
    { name: 'Transactions', href: '/admin/sections/transactions', icon: faArrowRightArrowLeft },
    { name: 'Financial Reports', href: '/admin/sections/financial-reports', icon: faChartBar },
];

export const templatesNavigation = [
    { name: 'Email Templates', href: '/admin/sections/email-templates', icon: faEnvelope },
    { name: 'Meta Templates', href: '/admin/sections/meta-templates', icon: faMessage },
];

export const aiSocialNavigation = [
    { name: 'AI Studio & Social', href: '/admin/sections/ai-studio', icon: faStar },
    { name: 'AI Credits Management', href: '/admin/sections/ai-credits', icon: faCreditCard },
    { name: 'SSM Account Access Details', href: '/admin/sections/ssm-access', icon: faShareNodes },
];

export const influencerNavigation = [
    { name: 'Influencer Hub', href: '/admin/sections/influencer-hub', icon: faIdBadge },
    { name: 'Influencer Applications', href: '/admin/sections/influencer-applications', icon: faUsers },
    { name: 'Influencer Bookings', href: '/admin/sections/influencer-bookings', icon: faClock },
];

export const contentNavigation = [
    { name: 'Trending Content', href: '/admin/sections/trending-content', icon: faChartBar },
    { name: 'Home Banners', href: '/admin/sections/home-banners', icon: faImage },
    { name: 'Marketing Videos', href: '/admin/sections/marketing-videos', icon: faVideo },
];

export const settingsNavigation = [
    { name: 'General Settings', href: '/admin/settings', icon: faGear, matchExact: true },
    { name: 'Company Settings', href: '/admin/sections/company-settings', icon: faBuilding },
    { name: 'User Management', href: '/admin/sections/user-management', icon: faUsers },
    { name: 'Roles & Permissions', href: '/admin/sections/permissions', icon: faShieldHalved },
    { name: 'Integrations', href: '/admin/settings/integrations', icon: faBolt },
    { name: 'Notifications', href: '/admin/sections/notification-center', icon: faBell },
    { name: 'Data Management', href: '/admin/settings/data-management', icon: faTrash },
    { name: 'Commission Settings', href: '/admin/sections/commission-settings', icon: faCreditCard },
    { name: 'Activity Logs', href: '/admin/sections/activity-logs', icon: faChartBar },
];
