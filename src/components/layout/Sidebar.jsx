'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    faRightFromBracket,
    faStar,
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
    { name: 'Data Capture', icon: faBullseye, items: dataCaptureNavigation },
    { name: 'CRM', icon: faUser, items: crm },
    { name: 'Customers', icon: faFileLines, items: customer },
    { name: 'Templates', icon: faClone, items: templatesNavigation },
    { name: 'Influencer Management', icon: faBullhorn, items: influencerNavigation },
    { name: 'AI & Social', icon: faStar, items: aiSocialNavigation },
    { name: 'Content Management', icon: faVideo, items: contentNavigation },
    { name: 'Reports', icon: faChartBar, href: '/admin/reports' },
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
                    : 'text-slate-600 hover:bg-brand-light/80'
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

function NavExpandableItem({ item, pathname, collapsed, onNavigate }) {
    const childActive = item.children.some((child) => isActive(child, pathname));
    const parentActive = item.href ? isActive(item, pathname) : childActive;
    const [open, setOpen] = React.useState(parentActive || childActive);
    const contentId = React.useId();

    React.useEffect(() => {
        if (childActive || parentActive) setOpen(true);
    }, [pathname, childActive, parentActive]);

    if (collapsed) {
        return (
            <NavLink
                item={{ ...item, href: item.href || item.children[0]?.href }}
                pathname={pathname}
                collapsed
                onNavigate={onNavigate}
            />
        );
    }

    return (
        <div className="space-y-0.5">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls={contentId}
                className={cn(
                    'flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    parentActive ? 'bg-brand-light/70 text-brand-dark' : 'text-slate-600 hover:bg-brand-light/80',
                )}
            >
                {item.icon ? (
                    <FontAwesomeIcon icon={item.icon} size={16} className={cn('shrink-0', parentActive ? 'text-brand-dark' : 'text-slate-400')} />
                ) : null}
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <FontAwesomeIcon icon={faChevronDown} className={cn('size-3 text-slate-400 transition-transform', open && 'rotate-180')} />
            </button>
            <div id={contentId} hidden={!open} className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                {item.children.map((child) => (
                    <NavLink key={child.href} item={child} pathname={pathname} collapsed={false} onNavigate={onNavigate} />
                ))}
            </div>
        </div>
    );
}

function NavItems({ items, pathname, collapsed, onNavigate }) {
    return items.map((item) =>
        item.children ? (
            <NavExpandableItem key={item.name} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
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
                active ? 'bg-brand text-primary-foreground' : 'text-slate-600 hover:bg-brand-light/80'
            )}
        >
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-white/15 text-primary-foreground' : 'bg-slate-100 text-slate-500')}>
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
                className={cn('flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-brand-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand', containsActive ? 'text-brand-dark' : 'text-slate-600')}
            >
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', containsActive ? 'bg-brand text-primary-foreground' : 'bg-slate-100 text-slate-500')}>
                    <FontAwesomeIcon icon={group.icon} size={14} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    {group.name}
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
        <React.Suspense fallback={<aside className={cn('flex h-full shrink-0 flex-col border-r border-slate-200 bg-white text-slate-800 transition-[width] duration-300 motion-reduce:transition-none w-20 lg:w-72', props.className)} />}>
            <SidebarContent {...props} />
        </React.Suspense>
    );
}

function SidebarContent({ className = '', onNavigate }) {
    const pathname = usePathname();
    const router = useRouter();
    const { collapsed, setCollapsed } = useSidebarStore();
    const isCollapsed = collapsed && !onNavigate;

    React.useEffect(() => {
        if (onNavigate) return;
        const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
        const update = () => { if (tablet.matches) setCollapsed(true); };
        update();
        tablet.addEventListener('change', update);
        return () => tablet.removeEventListener('change', update);
    }, [setCollapsed, onNavigate]);

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
                <Image
                    src="/app_logo.png"
                    alt="QB Suite app logo"
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-xl object-contain"
                    priority
                />
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
