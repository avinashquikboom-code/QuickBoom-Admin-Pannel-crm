'use client';

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { faBars, faBuilding, faGear, faMagnifyingGlass, faPlus, faRightFromBracket, faTableCellsLarge, faUserTie, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/common/Input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/common/Drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/common/Dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logoutAdmin } from '@/lib/auth/admin-login';
import { readSession, updateSessionUser } from '@/lib/auth/admin-session';
import { adminProfile } from '@/lib/auth/admin-profile';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { NotificationDropdown } from './NotificationDropdown';
import api from '../../../lib/api';
export function Header() {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = React.useState(false);
    const [sessionUser, setSessionUser] = React.useState(null);
    React.useEffect(() => {
        let active = true;
        const update = () => {
            const current = readSession()?.user ?? null;
            if (active) setSessionUser(current);
        };
        update();
        window.addEventListener('storage', update);
        window.addEventListener('qb-admin-profile-updated', update);

        const session = readSession();
        if (session?.token) {
            api.get('/auth/profile', { qbAdminSession: true })
                .then((res) => {
                    const record = res?.data ?? res;
                    if (active && record?.id) {
                        setSessionUser(record);
                        updateSessionUser(record);
                    }
                })
                .catch(() => {});
        }

        return () => {
            active = false;
            window.removeEventListener('storage', update);
            window.removeEventListener('qb-admin-profile-updated', update);
        };
    }, []);
    const profile = adminProfile(sessionUser);
    const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    React.useEffect(() => {
        const desktop = window.matchMedia('(min-width: 768px)');
        const update = () => { if (desktop.matches) setMobileOpen(false); };
        desktop.addEventListener('change', update);
        return () => desktop.removeEventListener('change', update);
    }, []);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchQuery.trim())
            return;
        const q = searchQuery.toLowerCase();
        if (q.includes('emp') || q.includes('sarah') || q.includes('alex') || q.includes('priya')) {
            router.push('/admin/hrm/employees');
        }
        else if (q.includes('att') || q.includes('clock') || q.includes('punch')) {
            router.push('/admin/hrm/attendance');
        }
        else if (q.includes('overtime') || q.includes('ot')) {
            router.push('/admin/hrm/overtime');
        }
        else if (q.includes('exp') || q.includes('claim')) {
            router.push('/admin/hrm/expense-claims');
        }
        else if (q.includes('pay') || q.includes('salary')) {
            router.push('/admin/hrm/payroll');
        }
        else if (q.includes('lead') || q.includes('deal') || q.includes('crm')) {
            router.push('/admin/crm/leads');
        }
        else {
            toast.info('Search Query', {
                description: `Filtering records for "${searchQuery}"`,
            });
        }
    };
    return (<header className="sticky top-0 z-40 flex h-16 shrink-0 gap-3 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur-sm">
      {/* Mobile full-width search overlay */}
      {mobileSearchOpen ? (
        <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1 items-center gap-2">
          <button type="button" aria-label="Open Navigation" onClick={() => { setMobileSearchOpen(false); setMobileOpen(true); }} className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden">
            <FontAwesomeIcon icon={faBars} className="size-5" />
          </button>
          <div className="relative min-w-0 flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"/>
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, lead, deal..."
              className="h-9 pl-8 pr-3 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-brand w-full"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
            aria-label="Close search"
          >
            <FontAwesomeIcon icon={faXmark} className="size-4" />
          </button>
        </form>
      ) : (
        <>
          {/* Left: Mobile hamburger & Sidebar toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden" aria-label="Open Navigation">
                <FontAwesomeIcon icon={faBars} className="size-5"/>
              </SheetTrigger>
              <SheetContent aria-label="Navigation" side="left" className="p-0 w-72 max-w-[85vw]" overlayClassName="bg-black/60 backdrop-blur-xs">
                <SheetTitle className="sr-only">Main navigation</SheetTitle>
                <SheetDescription className="sr-only">Choose a QB Suite module or page.</SheetDescription>
                <React.Suspense fallback={null}>
                  <Sidebar onNavigate={() => setMobileOpen(false)} className="w-full border-none"/>
                </React.Suspense>
              </SheetContent>
            </Sheet>

            {/* Desktop / Tablet Sidebar Collapse Toggle */}
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Toggle sidebar"
              className="hidden md:inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <FontAwesomeIcon icon={faBars} className="size-4.5" />
            </button>
          </div>

          {/* Right: Search, Notifications & User Avatar */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 sm:hidden"
              aria-label="Open search"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="size-4" />
            </button>

            {/* Quick Search (Tablet & Desktop) */}
            <form onSubmit={handleSearchSubmit} className="relative hidden min-w-0 sm:block w-36 md:w-48 lg:w-56">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="h-9 pl-8 pr-3 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-brand"/>
            </form>

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Quick Actions"
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                <FontAwesomeIcon icon={faPlus} className="size-3 text-[#20C466]" />
                <span>Quick Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5">
                <DropdownMenuItem onClick={() => router.push('/admin/crm/leads')} className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="size-3.5 text-emerald-600" />
                  <span>Add Lead</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/hrm/employees')} className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserTie} className="size-3.5 text-blue-600" />
                  <span>New Employee</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/crm/tasks')} className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2">
                  <FontAwesomeIcon icon={faTableCellsLarge} className="size-3.5 text-purple-600" />
                  <span>Create Task</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/data-capture')} className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-[#173D30] flex items-center gap-2">
                  <FontAwesomeIcon icon={faBuilding} className="size-3.5 text-teal-600" />
                  <span>Data Capture</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications Popover connected to real backend */}
            <NotificationDropdown />

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`Account menu for ${profile.name}`} className="flex min-w-0 items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <Avatar className="size-8 border border-slate-200">
              <AvatarImage src={sessionUser?.avatar || undefined} alt={profile.name} />
              <AvatarFallback className="bg-brand text-primary-foreground font-semibold text-xs">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 max-w-36 lg:max-w-48 sm:flex flex-col text-left">
              <span className="truncate text-xs font-semibold text-slate-900 leading-tight">
                {profile.name}
              </span>
              <span className="truncate text-[10px] text-slate-500 font-medium">
                {profile.role}
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[min(240px,calc(100vw-2rem))] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5">
                <div className="flex min-w-0 flex-col break-words">
                  <span className="text-xs font-semibold text-slate-900">
                    {profile.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {profile.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push('/admin/profile')} className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <FontAwesomeIcon icon={faUserTie} className="size-4 text-slate-500"/>
                <span>Admin Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <FontAwesomeIcon icon={faGear} className="size-4 text-slate-500"/>
                <span>System Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 my-1"/>
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={loggingOut}
                onClick={async () => {
                  if (loggingOut) return;
                  setLoggingOut(true);
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
                className={cn("text-xs p-2 rounded-lg cursor-pointer text-rose-600 hover:bg-rose-50 flex items-center gap-2", loggingOut && "opacity-50 cursor-not-allowed")}
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="size-4 text-rose-500"/>
                <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </>
      )}
    </header>);
}
