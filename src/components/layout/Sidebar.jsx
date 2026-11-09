'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    faBriefcase,
    faBullhorn,
    faBullseye,
    faChartBar,
    faChevronDown,
    faClone,
    faDatabase,
    faFileLines,
    faGauge,
    faGear,
    faLayerGroup,
    faRightFromBracket,
    faStar,
    faTrash,
    faUser,
    faVideo,
} from '@fortawesome/free-solid-svg-icons';
import { navigation as crm } from '@/modules/crm/navigation';
import { navigation as hrm } from '@/modules/hrm/navigation';
import { navigation as customer } from '@/modules/customer/navigation';
import {
    aiSocialNavigation,
    contentNavigation,
    dataCaptureNavigation,
    influencerNavigation,
    masterNavigation,
    settingsNavigation,
    templatesNavigation,
} from '@/modules/sidebar/extra-navigation';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { toast } from '@/hooks/use-toast';
import { logoutAdmin } from '@/lib/auth/admin-login';
import { cn } from '@/lib/utils';

const groups = [
    { name: 'Dashboard', icon: faGauge, href: '/admin/dashboard', matchExact: true },
    { name: 'Master', icon: faDatabase, items: masterNavigation },
    { name: 'HRM', icon: faBriefcase, items: hrm },
    { name: 'Sales & CRM', icon: faUser, items: crm },
    { name: 'Customers', icon: faFileLines, items: customer },
    { name: 'Data Capture', icon: faBullseye, items: dataCaptureNavigation },
    { name: 'Templates', icon: faClone, items: templatesNavigation },
    { name: 'Influencer Management', icon: faBullhorn, items: influencerNavigation },
    { name: 'AI & Social', icon: faStar, items: aiSocialNavigation },
    { name: 'Content Management', icon: faVideo, items: contentNavigation },
    { name: 'Data Management', icon: faTrash, href: '/admin/settings/data-management' },
    { name: 'Reports', icon: faChartBar, href: '/admin/sections/reports' },
    { name: 'Settings', icon: faGear, items: settingsNavigation },
];

function isActive(item, pathname) {
    if (item.matchExact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
}

function itemActive(item, pathname) {
    if (item.children) return item.children.some((child) => isActive(child, pathname));
    return isActive(item, pathname);
}

function linkCount(items) {
    return items.reduce((count, item) => count + (item.children ? item.children.length : 1), 0);
}

function NavLink({ item, pathname, collapsed, onNavigate }) {
    const active = isActive(item, pathname);
    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.name : undefined}
            className={cn(
                'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                collapsed && 'justify-center px-0',
                active
                    ? 'bg-brand-light text-brand-dark font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
            )}
        >
            {item.icon && (
                <FontAwesomeIcon
                    icon={item.icon}
                    size={16}
                    className={cn('shrink-0', active ? 'text-brand-dark' : 'text-slate-400 group-hover:text-slate-600')}
                />
            )}
            {!collapsed && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
            {!collapsed && item.tag && (
                <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide', active ? 'bg-white/70 text-brand-dark' : 'bg-slate-100 text-slate-400')}>
                    {item.tag}
                </span>
            )}
            {!collapsed && item.badge && !item.tag && (
                <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-white/70 text-brand-dark' : 'bg-amber-100 text-amber-700')}>
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

function NavItems({ items, pathname, collapsed, onNavigate }) {
    return items.map((item) =>
        item.children ? (
            <div key={item.name} className="space-y-0.5">
                {!collapsed && (
                    <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {item.name}
                    </p>
                )}
                {item.children.map((child) => (
                    <NavLink key={child.href} item={child} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
            </div>
        ) : (
            <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
        )
    );
}
function FlatLink({ group, pathname, collapsed, onNavigate }) {
    const active = isActive(group, pathname);
    return (
        <Link
            href={group.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? group.name : undefined}
            className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl p-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                collapsed && 'justify-center px-0',
                active ? 'bg-brand-light text-brand-dark' : 'text-slate-600 hover:bg-slate-100'
            )}
        >
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-brand text-primary-foreground' : 'bg-slate-100 text-slate-500')}>
                <FontAwesomeIcon icon={group.icon} size={14} />
            </span>
            {!collapsed && (
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    {group.name}
                </span>
            )}
        </Link>
    );
}

function NavGroup({ group, pathname, collapsed, onNavigate }) {
    const containsActive = group.items.some((item) => itemActive(item, pathname));
    const [open, setOpen] = React.useState(containsActive);
    const contentId = React.useId();

    React.useEffect(() => {
        if (containsActive) setOpen(true);
    }, [pathname, containsActive]);

    if (collapsed) {
        return (
            <div className="space-y-1 border-t border-slate-100 pt-2">
                <NavItems items={group.items} pathname={pathname} collapsed onNavigate={onNavigate} />
            </div>
        );
    }

    return (
        <section className="space-y-1">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls={contentId}
                className={cn('flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand', containsActive ? 'text-brand-dark' : 'text-slate-600')}
            >
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', containsActive ? 'bg-brand text-primary-foreground' : 'bg-slate-100 text-slate-500')}>
                    <FontAwesomeIcon icon={group.icon} size={14} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    {group.name}
                </span>
                <span className="min-w-5 rounded-md bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-medium text-slate-400">
                    {linkCount(group.items)}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className={cn('size-3 text-slate-400 transition-transform', open && 'rotate-180')} />
            </button>
            <div id={contentId} hidden={!open} className="ml-6 space-y-0.5 border-l border-slate-200 py-1 pl-3">
                <NavItems items={group.items} pathname={pathname} collapsed={false} onNavigate={onNavigate} />
            </div>
        </section>
    );
}

export function Sidebar(props) {
    return (
        <React.Suspense fallback={<aside className={cn('flex h-full shrink-0 flex-col border-r border-slate-200 bg-white text-slate-800 transition-[width] duration-300 motion-reduce:transition-none w-72', props.className)} />}>
            <SidebarContent {...props} />
        </React.Suspense>
    );
}

function SidebarContent({ className = '', onNavigate }) {
    const pathname = usePathname();
    const router = useRouter();
    const { collapsed } = useSidebarStore();
    const isCollapsed = collapsed && !onNavigate;

    return (
        <aside
            className={cn(
                'flex h-full shrink-0 flex-col border-r border-slate-200 bg-white text-slate-800 transition-[width] duration-300 motion-reduce:transition-none',
                isCollapsed ? 'w-20' : 'w-72',
                className
            )}
        >
            <Link
                href="/admin/dashboard"
                onClick={onNavigate}
                aria-label="QB Suite dashboard"
                className={cn('flex min-h-20 items-center gap-3 border-b border-slate-100 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand', isCollapsed && 'justify-center px-0')}
            >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-primary-foreground shadow-sm">
                    <FontAwesomeIcon icon={faLayerGroup} className="size-5" />
                </div>
                {!isCollapsed && (
                    <div className="min-w-0">
                        <p className="text-lg font-bold leading-tight tracking-tight text-slate-900">QB Suite</p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin Panel</p>
                    </div>
                )}
            </Link>

            {!isCollapsed && (
                <div className="flex items-center justify-between px-5 pb-2 pt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
                    <span className="rounded-md bg-brand-light px-2 py-1 text-[10px] font-semibold text-brand-dark">Admin</span>
                </div>
            )}
            <ScrollArea className="min-h-0 flex-1">
                <nav aria-label="Main navigation" className={cn('space-y-1 p-3', isCollapsed && 'px-2')}>
                    {groups.map((group) =>
                        group.href ? (
                            <FlatLink
                                key={group.name}
                                group={group}
                                pathname={pathname}
                                collapsed={isCollapsed}
                                onNavigate={onNavigate}
                            />
                        ) : (
                            <NavGroup
                                key={group.name}
                                group={group}
                                pathname={pathname}
                                collapsed={isCollapsed}
                                onNavigate={onNavigate}
                            />
                        )
                    )}
                </nav>
            </ScrollArea>
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 p-3">
                    <button
                        type="button"
                        aria-label="Logout"
                        title={isCollapsed ? 'Logout' : undefined}
                        onClick={async () => {
                            await logoutAdmin();
                            toast.success('Signed out successfully');
                            onNavigate?.();
                            router.push('/login');
                        }}
                        className={cn(
                            'flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400',
                            isCollapsed && 'justify-center px-0'
                        )}
                    >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                            <FontAwesomeIcon icon={faRightFromBracket} size={14} />
                        </span>
                        {!isCollapsed && (
                            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-600">
                                Logout
                            </span>
                        )}
                    </button>
            </div>
        </aside>
    );
}
