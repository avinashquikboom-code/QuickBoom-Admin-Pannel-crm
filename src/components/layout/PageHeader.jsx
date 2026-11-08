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
            className={cn(
                'relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50/80 p-5 sm:p-6 shadow-xs backdrop-blur-xs transition-all',
                className
            )}
        >
            {/* Subtle dashboard-inspired architectural accent graphics in background */}
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-52 rounded-full bg-brand/5 blur-2xl" />
            <div aria-hidden="true" className="pointer-events-none absolute right-16 bottom-0 hidden lg:flex items-end gap-1.5 opacity-25">
                <span className="w-2 rounded-t-sm bg-brand/40" style={{ height: '1.75rem' }} />
                <span className="w-2 rounded-t-sm bg-brand/70" style={{ height: '2.5rem' }} />
                <span className="w-2 rounded-t-sm bg-brand-dark/50" style={{ height: '1.25rem' }} />
                <span className="w-2 rounded-t-sm bg-brand" style={{ height: '3.25rem' }} />
            </div>

            {/* Main Header Content */}
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: Icon + Category + Title + Subtitle */}
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5 min-w-0">
                    {resolvedIcon && (
                        <div className="size-11 sm:size-12 rounded-xl bg-white border border-brand/20 shadow-xs flex items-center justify-center text-brand-dark shrink-0 ring-4 ring-brand/10">
                            {React.isValidElement(resolvedIcon) ? (
                                resolvedIcon
                            ) : (
                                <FontAwesomeIcon icon={resolvedIcon} className="size-5 sm:size-5.5 text-brand" />
                            )}
                        </div>
                    )}

                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            {resolvedCategory && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-brand-light/90 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-[0.14em] uppercase text-brand-dark border border-brand/20">
                                    <span className="size-1.5 rounded-full bg-brand" />
                                    {resolvedCategory}
                                </span>
                            )}
                            {renderedBadge}
                        </div>

                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                            {title}
                        </h1>

                        {description && (
                            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Actions & Controls */}
                {(primaryAction || secondaryAction || actions || rightContent) && (
                    <div className="flex flex-wrap items-center gap-2.5 sm:self-auto shrink-0 pt-2 lg:pt-0">
                        {secondaryAction}
                        {primaryAction}
                        {actions}
                        {rightContent}
                    </div>
                )}
            </div>

            {/* Bottom Row: Optional Statistics or Custom Tabs */}
            {stats && (
                <div className="relative z-10 mt-5 pt-4 border-t border-slate-200/70">
                    {Array.isArray(stats) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {stats.map((s, i) => (
                                <div key={i} className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        {s.label}
                                    </span>
                                    <div className="mt-0.5 flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-slate-900">
                                            {s.value}
                                        </span>
                                        {s.change && (
                                            <span
                                                className={cn(
                                                    'text-[10px] font-semibold',
                                                    s.changeType === 'increase'
                                                        ? 'text-emerald-600'
                                                        : s.changeType === 'decrease'
                                                        ? 'text-rose-600'
                                                        : 'text-slate-500'
                                                )}
                                            >
                                                {s.change}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        stats
                    )}
                </div>
            )}

            {tabs && (
                <div className="relative z-10 mt-4 pt-3 border-t border-slate-200/70">
                    {tabs}
                </div>
            )}

            {children && (
                <div className="relative z-10 mt-4 pt-3">
                    {children}
                </div>
            )}
        </section>
    );
}
