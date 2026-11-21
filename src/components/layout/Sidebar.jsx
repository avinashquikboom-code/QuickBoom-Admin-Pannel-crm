'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, Mail } from 'lucide-react';
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
    faBolt,
    faIndustry,
} from '@fortawesome/free-solid-svg-icons';
import { navigation as crm } from '@/modules/crm/navigation';
import { navigation as hrm } from '@/modules/hrm/navigation';
import { navigation as customer } from '@/modules/customer/navigation';
import {
    aiSocialNavigation,
    contentNavigation,
    dataCaptureNavigation,
    emailMarketingNavigation,
    influencerNavigation,
    masterNavigation,
    settingsNavigation,
    whatsAppMarketingNavigation,
} from '@/modules/sidebar/extra-navigation';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { toast } from '@/hooks/use-toast';
import { logoutAdmin } from '@/lib/auth/admin-login';
import { cn } from '@/lib/utils';

const groups = [
    { name: 'Dashboard', icon: faGauge, href: '/admin/dashboard', matchExact: true },
    { name: 'CRM', icon: faUser, items: crm },
    { name: 'HRM', icon: faBriefcase, items: hrm },
    { name: 'Projects', icon: faIndustry, href: '/admin/production/dashboard' },
    { name: 'Data Capture', icon: faBullseye, items: dataCaptureNavigation },
    { name: 'Customers', icon: faFileLines, items: customer },
    { name: 'WhatsApp Marketing', icon: MessageSquare, items: whatsAppMarketingNavigation },
    { name: 'Reports', icon: faChartBar, href: '/admin/reports' },
    { name: 'Integrations', icon: faBolt, href: '/admin/settings/integrations' },
    { name: 'Master', icon: faDatabase, items: masterNavigation },
    { name: 'Settings', icon: faGear, items: settingsNavigation },
    { name: 'Email Marketing', icon: Mail, items: emailMarketingNavigation },
    { name: 'Influencer Management', icon: faBullhorn, items: influencerNavigation },
    { name: 'AI & Social', icon: faStar, items: aiSocialNavigation },
    { name: 'Content Management', icon: faVideo, items: contentNavigation },
];

function isActive(item, pathname) {
    if (item.matchExact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
}

function itemActive(item, pathname) {
    if (item.children) return item.children.some((child) => isActive(child, pathname));
    return isActive(item, pathname);
}

function handleSidebarNavigation(event, href, onNavigate, router) {
    if (!onNavigate || (event.button !== undefined && event.button !== 0) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    // Start App Router navigation before closing the mobile drawer. Closing the
    // Sheet can unmount its Link during the click and otherwise swallow the route.
    event.preventDefault();
    router.push(href);
    onNavigate();
}

function SidebarIcon({ icon, size = 16, className }) {
    if (!icon) return null;
    if (typeof icon === 'object' && icon.prefix && icon.iconName) {
        return <FontAwesomeIcon icon={icon} size={size} className={className} />;
    }
    const IconComponent = icon;
    return <IconComponent size={size} className={cn('shrink-0', className)} />;
}

function NavLink({ item, pathname, collapsed, onNavigate }) {
    const router = useRouter();
    const active = isActive(item, pathname);
    return (
        <Link
            href={item.href}
            onClick={(event) => handleSidebarNavigation(event, item.href, onNavigate, router)}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.name : undefined}
            className={cn(
                'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer select-none',
                collapsed && 'justify-center px-0',
                active
                    ? 'bg-brand-light text-brand-dark font-semibold'
                    : 'text-slate-600 hover:bg-brand-light/80'
            )}
        >
            {item.icon && (
                <SidebarIcon
                    icon={item.icon}
                    size={16}
                    className={cn('shrink-0 transition-colors pointer-events-none', active ? 'text-brand-dark' : 'text-slate-400 group-hover:text-slate-600')}
                />
            )}
            {!collapsed && <span className="min-w-0 flex-1 truncate pointer-events-none">{item.name}</span>}
            {!collapsed && item.tag && (
                <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide pointer-events-none', active ? 'bg-white/70 text-brand-dark' : 'bg-slate-100 text-slate-400')}>
                    {item.tag}
                </span>
            )}
            {!collapsed && item.badge && !item.tag && (
                <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold pointer-events-none', active ? 'bg-white/70 text-brand-dark' : 'bg-amber-100 text-amber-700')}>
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
                    'flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer select-none',
                    parentActive ? 'bg-brand-light/70 text-brand-dark' : 'text-slate-600 hover:bg-brand-light/80',
                )}
            >
                {item.icon ? (
                    <SidebarIcon icon={item.icon} size={16} className={cn('shrink-0 pointer-events-none', parentActive ? 'text-brand-dark' : 'text-slate-400')} />
                ) : null}
                <span className="min-w-0 flex-1 truncate pointer-events-none">{item.name}</span>
                <FontAwesomeIcon icon={faChevronDown} className={cn('size-3 text-slate-400 transition-transform duration-200 pointer-events-none', open && 'rotate-180')} />
            </button>
            <div
                id={contentId}
                hidden={!open}
                className={cn('ml-3 space-y-0.5 border-l border-slate-200 py-1 pl-2', !open && 'hidden')}
            >
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
    const router = useRouter();
    const active = isActive(group, pathname);
    return (
        <Link
            href={group.href}
            onClick={(event) => handleSidebarNavigation(event, group.href, onNavigate, router)}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? group.name : undefined}
            className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl p-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer select-none',
                collapsed && 'justify-center px-0',
                active ? 'bg-brand text-primary-foreground' : 'text-slate-600 hover:bg-brand-light/80'
            )}
        >
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg pointer-events-none', active ? 'bg-white/15 text-primary-foreground' : 'bg-slate-100 text-slate-500')}>
                <SidebarIcon icon={group.icon} size={14} />
            </span>
            {!collapsed && (
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold pointer-events-none">
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
                className={cn(
                    'flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-brand-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer select-none',
                    containsActive ? 'text-brand-dark' : 'text-slate-600'
                )}
            >
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg pointer-events-none', containsActive ? 'bg-brand text-primary-foreground' : 'bg-slate-100 text-slate-500')}>
                    <SidebarIcon icon={group.icon} size={14} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold pointer-events-none">
                    {group.name}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className={cn('size-3 text-slate-400 transition-transform duration-200 pointer-events-none', open && 'rotate-180')} />
            </button>
            <div
                id={contentId}
                hidden={!open}
                className={cn('ml-6 space-y-0.5 border-l border-slate-200 py-1 pl-3', !open && 'hidden')}
            >
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
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
        const update = () => { if (tablet.matches) setCollapsed(true); };
        update();
        if (tablet.addEventListener) {
            tablet.addEventListener('change', update);
            return () => tablet.removeEventListener('change', update);
        } else if (tablet.addListener) {
            tablet.addListener(update);
            return () => tablet.removeListener(update);
        }
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
                onClick={(event) => handleSidebarNavigation(event, '/admin/dashboard', onNavigate, router)}
                aria-label="Quik dashboard"
                className={cn(
                    'flex w-full items-center border-b border-slate-100 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand select-none',
                    isCollapsed ? 'min-h-[90px] justify-center px-0' : cn('min-h-[90px] justify-start px-3.5 sm:px-4', onNavigate && 'pr-12')
                )}
            >
                {isCollapsed ? (
                    <div className="flex size-[70px] shrink-0 items-center justify-center">
                        <Image
                            src="/app_logo.png"
                            alt="Quik symbol"
                            width={70}
                            height={70}
                            style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                            className="size-[70px] shrink-0 rounded-xl object-contain object-center"
                            priority
                        />
                    </div>
                ) : (
                    <Image
                        src="/logo.png"
                        alt="Quik Logo"
                        width={260}
                        height={148}
                        className={cn(
                            'h-auto object-contain',
                            onNavigate ? 'w-[175px] max-w-[175px]' : 'w-full max-w-[260px]'
                        )}
                        style={{ objectPosition: 'left center' }}
                        priority
                    />
                )}
            </Link>

            {!isCollapsed && (
                <div className="flex items-center justify-between px-5 pb-2 pt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
                    <span className="rounded-md bg-brand-light px-2 py-1 text-[10px] font-semibold text-brand-dark">Super Admin</span>
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
                    <SidebarLogoutButton isCollapsed={isCollapsed} onNavigate={onNavigate} />
            </div>
        </aside>
    );
}

function SidebarLogoutButton({ isCollapsed, onNavigate }) {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = React.useState(false);

    return (
        <button
            type="button"
            aria-label="Logout"
            disabled={loggingOut}
            title={isCollapsed ? 'Logout' : undefined}
            onClick={async () => {
                if (loggingOut) return;
                setLoggingOut(true);
                onNavigate?.();
                try {
                    const result = await logoutAdmin();
                    if (result?.revoked) {
                        toast.success('Signed out successfully');
                    } else {
                        toast.success('Signed out successfully');
                    }
                } finally {
                    router.replace('/login');
                    router.refresh();
                }
            }}
            className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400',
                loggingOut && 'opacity-50 cursor-not-allowed',
                isCollapsed && 'justify-center px-0'
            )}
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <FontAwesomeIcon icon={faRightFromBracket} size={14} />
            </span>
            {!isCollapsed && (
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-600">
                    {loggingOut ? 'Signing out…' : 'Logout'}
                </span>
            )}
        </button>
    );
}
