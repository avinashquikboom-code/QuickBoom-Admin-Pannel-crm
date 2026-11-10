'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faLayerGroup,
    faIdBadge,
    faUsers,
    faCalendar,
    faCalendarCheck,
    faCalendarXmark,
    faFileLines,
    faListCheck,
    faChartBar,
    faTags,
    faMoneyBill,
    faCreditCard,
    faDatabase,
    faEnvelope,
    faMessage,
    faStar,
    faShareNodes,
    faImage,
    faVideo,
    faGear,
    faBell,
    faBolt,
    faMugHot,
    faClock,
    faIndianRupeeSign,
    faWallet,
    faBuilding,
    faPeopleGroup,
    faLocationDot,
    faPercent,
    faShieldHalved,
    faAddressBook,
    faHandshake,
    faUserCheck,
    faIndustry,
    faGauge,
    faBullhorn,
    faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';

// Global route registry mapping pathname patterns to module category and default icon
const routeRegistry = {
    // Master Sections
    'departments': { category: 'MASTER MANAGEMENT', title: 'Departments', icon: faLayerGroup },
    'designations': { category: 'MASTER MANAGEMENT', title: 'Designations', icon: faIdBadge },
    'employee-types': { category: 'MASTER MANAGEMENT', title: 'Employee Types', icon: faUsers },
    'leave-types': { category: 'MASTER MANAGEMENT', title: 'Leave Types', icon: faCalendar },
    'leave-policies': { category: 'MASTER MANAGEMENT', title: 'Leave Policies', icon: faFileLines },
    'work-types': { category: 'MASTER MANAGEMENT', title: 'Work Types', icon: faListCheck },
    'activity-types': { category: 'MASTER MANAGEMENT', title: 'Activity Types', icon: faChartBar },
    'task-status': { category: 'MASTER MANAGEMENT', title: 'Task Status', icon: faListCheck },
    'subscription-plans': { category: 'MASTER MANAGEMENT', title: 'Subscription Plans', icon: faLayerGroup },
    'expense-categories': { category: 'MASTER MANAGEMENT', title: 'Expense Categories', icon: faTags },
    'loan-types': { category: 'MASTER MANAGEMENT', title: 'Loan Types', icon: faMoneyBill },
    'payment-methods': { category: 'MASTER MANAGEMENT', title: 'Payment Methods', icon: faCreditCard },

    // Data Capture & Templates
    'data-capture': { category: 'DATA CAPTURE ENGINE', title: 'Data Capture', icon: faDatabase },
    'usage-quota': { category: 'DATA CAPTURE ENGINE', title: 'Usage & Quotas', icon: faChartBar },
    'email-templates': { category: 'TEMPLATES & ASSETS', title: 'Email Templates', icon: faEnvelope },
    'meta-templates': { category: 'TEMPLATES & ASSETS', title: 'Meta Templates', icon: faMessage },

    // AI & Social
    'ai-studio': { category: 'AI & SOCIAL STUDIO', title: 'AI Studio', icon: faStar },
    'ai-credits': { category: 'AI & SOCIAL STUDIO', title: 'AI Credits', icon: faCreditCard },
    'ssm-access': { category: 'AI & SOCIAL STUDIO', title: 'Social Account Access', icon: faShareNodes },

    // Influencer & Content
    'influencer-hub': { category: 'INFLUENCER MANAGEMENT', title: 'Influencer Hub', icon: faIdBadge },
    'influencer-applications': { category: 'INFLUENCER MANAGEMENT', title: 'Influencer Applications', icon: faUsers },
    'influencer-bookings': { category: 'INFLUENCER MANAGEMENT', title: 'Influencer Bookings', icon: faCalendar },
    'trending-content': { category: 'CONTENT MANAGEMENT', title: 'Trending Content', icon: faChartBar },
    'home-banners': { category: 'CONTENT MANAGEMENT', title: 'Home Banners', icon: faImage },
    'marketing-videos': { category: 'CONTENT MANAGEMENT', title: 'Marketing Videos', icon: faVideo },

    // Workforce & HRM Sections
    'office-management': { category: 'WORKFORCE MANAGEMENT', title: 'Office Management', icon: faBuilding },
    'team-management': { category: 'WORKFORCE MANAGEMENT', title: 'Team Management', icon: faPeopleGroup },
    'shifts': { category: 'WORKFORCE MANAGEMENT', title: 'Shifts & Rosters', icon: faClock },
    'remote-work': { category: 'WORKFORCE MANAGEMENT', title: 'Remote Work', icon: faCalendar },
    'geo-tracking': { category: 'WORKFORCE MANAGEMENT', title: 'Geo Tracking', icon: faLocationDot },
    'commissions': { category: 'COMPENSATION & PAYROLL', title: 'Commissions', icon: faPercent },

    // CRM Sections
    'lead-limits': { category: 'SALES & CRM', title: 'Lead Limits', icon: faShieldHalved },
    'contacts': { category: 'SALES & CRM', title: 'Contacts Directory', icon: faAddressBook },
    'companies': { category: 'SALES & CRM', title: 'Companies & Accounts', icon: faBuilding },
    'deals': { category: 'SALES & CRM', title: 'Deals Pipeline', icon: faHandshake },
    'visits': { category: 'SALES & CRM', title: 'Field Visits', icon: faUserCheck },
    'tasks': { category: 'OPERATIONS', title: 'Tasks Management', icon: faListCheck },
    'activities': { category: 'OPERATIONS', title: 'Activity Stream', icon: faChartBar },

    // System & Data Governance
    'notification-center': { category: 'SYSTEM GOVERNANCE', title: 'Notification Center', icon: faBell },
    'commission-settings': { category: 'SYSTEM GOVERNANCE', title: 'Commission Rules', icon: faCreditCard },
    'company-policies': { category: 'SYSTEM GOVERNANCE', title: 'Company Policies', icon: faFileLines },
    'activity-logs': { category: 'SYSTEM GOVERNANCE', title: 'Activity Logs', icon: faChartBar },
    'data-management': { category: 'DATA GOVERNANCE', title: 'Data Management', icon: faDatabase },
    'reports': { category: 'ENTERPRISE REPORTS', title: 'Enterprise Reports', icon: faChartBar },
};

function getRouteMetadata(pathname) {
    if (!pathname) {
        return { category: 'ADMINISTRATION', icon: faLayerGroup };
    }

    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (pathname.includes('/admin/data-capture/history')) {
        return { category: 'DATA CAPTURE ENGINE', icon: faClockRotateLeft };
    }
    if (pathname.includes('/admin/data-capture/usage')) {
        return { category: 'DATA CAPTURE ENGINE', icon: faChartBar };
    }

    if (routeRegistry[lastSegment]) {
        const item = routeRegistry[lastSegment];
        return {
            category: item.category,
            icon: item.icon,
        };
    }

    if (pathname.includes('/admin/hrm/')) {
        const hrmNames = {
            'dashboard': { title: 'HRM Dashboard', icon: faGauge },
            'employees': { title: 'Employees', icon: faUsers },
            'attendance': { title: 'Attendance', icon: faCalendarCheck },
            'break-management': { title: 'Break Management', icon: faMugHot },
            'leaves': { title: 'Leaves', icon: faCalendarXmark },
            'overtime': { title: 'Overtime Approvals', icon: faClock },
            'payroll': { title: 'Payroll', icon: faWallet },
            'salary-slips': { title: 'Salary Slips', icon: faFileLines },
            'expense-claims': { title: 'Expense Claims', icon: faIndianRupeeSign },
            'announcements': { title: 'Announcements', icon: faBell },
            'reports': { title: 'HRM Reports', icon: faChartBar },
        };
        const meta = hrmNames[lastSegment] || { title: lastSegment, icon: faUsers };
        return {
            category: 'HUMAN RESOURCE MANAGEMENT',
            icon: meta.icon,
        };
    }

    if (pathname.includes('/admin/crm/')) {
        const crmNames = {
            'leads': { title: 'Leads', icon: faUsers },
            'customers': { title: 'Customers', icon: faBuilding },
            'campaigns': { title: 'Campaigns', icon: faBullhorn },
            'whatsapp': { title: 'WhatsApp Gateway', icon: faWhatsapp },
        };
        const meta = crmNames[lastSegment] || { title: lastSegment, icon: faUsers };
        return {
            category: 'SALES & CRM',
            icon: meta.icon,
        };
    }

    if (pathname.includes('/admin/settings')) {
        return {
            category: 'SYSTEM GOVERNANCE',
            icon: faGear,
        };
    }

    if (pathname.includes('/admin/production')) {
        return {
            category: 'OPERATIONS & PRODUCTION',
            icon: faIndustry,
        };
    }

    if (pathname.includes('/admin/customer')) {
        return {
            category: 'CUSTOMER SUCCESS',
            icon: faUsers,
        };
    }

    if (pathname === '/admin/dashboard') {
        return {
            category: 'EXECUTIVE DASHBOARD',
            icon: faGauge,
        };
    }

    // Default fallback
    return {
        category: 'ADMINISTRATION',
        icon: faLayerGroup,
    };
}

export function PageHeader(props) {
    return (
        <React.Suspense fallback={<PageHeaderBase {...props} currentPath="" />}>
            <PageHeaderWithRoute {...props} />
        </React.Suspense>
    );
}

function PageHeaderWithRoute(props) {
    const pathname = usePathname();
    return <PageHeaderBase {...props} currentPath={pathname} />;
}

function PageHeaderBase({
    title,
    description,
    category,
    icon,
    badge,
    badgeVariant = 'green',
    primaryAction,
    secondaryAction,
    actions,
    rightContent,
    stats,
    tabs,
    children,
    className,
    currentPath = '',
}) {
    const routeMeta = React.useMemo(() => getRouteMetadata(currentPath), [currentPath]);

    const resolvedCategory = category || routeMeta.category;
    const resolvedIcon = icon || routeMeta.icon;

    const renderedBadge = typeof badge === 'string' ? (
        <Badge
            variant="outline"
            className={cn(
                'text-xs font-semibold py-0.5 px-2.5 rounded-full border shadow-2xs',
                badgeVariant === 'green'
                    ? 'border-brand/30 bg-brand-light text-brand-dark'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
            )}
        >
            {badge}
        </Badge>
    ) : badge;

    return (
        <section
            aria-label={typeof title === 'string' ? title : 'Page Header'}
            className={cn('flex w-full min-w-0 flex-col gap-4', className)}
        >
            <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    {(category || renderedBadge) && (
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                            {category && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#163A2E]">{category}</p>}
                            {renderedBadge}
                        </div>
                    )}
                    <h1 className="break-words text-2xl font-semibold text-[#172B24]">{title || routeMeta.title}</h1>
                    {description && <p className="mt-1 break-words text-sm text-[#718078]">{description}</p>}
                </div>
                {(primaryAction || secondaryAction || actions || rightContent || resolvedIcon) && (
                    <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                        {secondaryAction}
                        {primaryAction}
                        {actions}
                        {rightContent}
                    </div>
                )}
            </div>
            {children}
            {tabs && <div className="min-w-0 overflow-x-auto">{tabs}</div>}
            {stats && (
                Array.isArray(stats) ? (
                    <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
                        {stats.map((item, index) => (
                            <div key={item.label || index} className="rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">{item.label}</p>
                                <p className="mt-2 text-2xl font-bold text-[#163A2E]">{item.value ?? '—'}</p>
                            </div>
                        ))}
                    </div>
                ) : stats
            )}
        </section>
    );
}
