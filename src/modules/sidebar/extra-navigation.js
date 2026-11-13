import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import {
    faBell,
    faBolt,
    faBoxesStacked,
    faBuilding,
    faBullhorn,
    faCartShopping,
    faChartBar,
    faClock,
    faClockRotateLeft,
    faCreditCard,
    faDatabase,
    faDiagramProject,
    faEnvelope,
    faFileLines,
    faGear,
    faIdBadge,
    faImage,
    faIndustry,
    faLayerGroup,
    faLocationDot,
    faListCheck,
    faMessage,
    faMoneyBill,
    faPlus,
    faShareNodes,
    faStar,
    faTags,
    faTrash,
    faUsers,
    faVideo,
} from '@fortawesome/free-solid-svg-icons';

export const dataCaptureNavigation = [
    { name: 'Data Capture', href: '/admin/data-capture', icon: faDatabase, matchExact: true },
    { name: 'Usage & Quota', href: '/admin/data-capture/usage', icon: faChartBar },
    { name: 'Capture History', href: '/admin/data-capture/history', icon: faClockRotateLeft },
];

export const masterNavigation = [
    { name: 'Departments', href: '/admin/sections/departments', icon: faLayerGroup },
    { name: 'Stage Management', href: '/admin/sections/stage-management', icon: faDiagramProject },
    { name: 'Designations', href: '/admin/sections/designations', icon: faIdBadge },
    { name: 'Employee Types', href: '/admin/sections/employee-types', icon: faUsers },
    { name: 'Leave Types', href: '/admin/sections/leave-types', icon: faCalendar },
    { name: 'Leave Policies', href: '/admin/sections/leave-policies', icon: faFileLines },
    { name: 'Work Types', href: '/admin/sections/work-types', icon: faListCheck },
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

export const templatesNavigation = [
    { name: 'Email Templates', href: '/admin/sections/email-templates', icon: faEnvelope },
    {
        name: 'Meta Templates',
        href: '/admin/sections/meta-templates',
        icon: faMessage,
        children: [
            { name: 'All Templates', href: '/admin/sections/meta-templates', icon: faLayerGroup },
            { name: 'Add Single Template', href: '/admin/sections/meta-templates/create', icon: faPlus },
            { name: 'Campaigns', href: '/admin/sections/meta-templates/campaigns', icon: faBullhorn },
        ],
    },
];

export const aiSocialNavigation = [
    { name: 'AI Studio & Social', href: '/admin/ai-studio', icon: faStar },
    { name: 'AI Credits Management', href: '/admin/ai-credits', icon: faCreditCard },
    { name: 'SSM Account Access Details', href: '/admin/ssm-access', icon: faShareNodes },
];

export const influencerNavigation = [
    { name: 'Influencer Hub', href: '/admin/influencers', icon: faIdBadge },
    { name: 'Influencer Applications', href: '/admin/influencers/applications', icon: faUsers },
    { name: 'Influencer Bookings', href: '/admin/influencers/bookings', icon: faClock },
];

export const contentNavigation = [
    { name: 'Trending Content', href: '/admin/content/trending', icon: faChartBar },
    { name: 'Home Banners', href: '/admin/content/banners', icon: faImage },
    { name: 'Marketing Videos', href: '/admin/content/videos', icon: faVideo },
];

export const settingsNavigation = [
    { name: 'General Settings', href: '/admin/settings', icon: faGear, matchExact: true },
    { name: 'Company Settings', href: '/admin/settings/company', icon: faBuilding },
    { name: 'Integrations', href: '/admin/settings/integrations', icon: faBolt },
    { name: 'Google Maps Management', href: '/admin/settings/google-maps', icon: faLocationDot },
    { name: 'Notifications', href: '/admin/settings/notifications', icon: faBell },
    { name: 'Data Management', href: '/admin/settings/data-management', icon: faTrash },
    { name: 'Commission Settings', href: '/admin/settings/commissions', icon: faCreditCard },
    { name: 'Activity Logs', href: '/admin/settings/activity-logs', icon: faChartBar },
];
