'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { faBars, faBell, faBuilding, faCheckDouble, faGear, faMagnifyingGlass, faRightFromBracket, faTableCellsLarge, faUserTie, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/common/Input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/common/Drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/common/Dropdown';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/Popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { toast } from '@/hooks/use-toast';
import { logoutAdmin } from '@/lib/auth/admin-login';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
export function Header() {
    const router = useRouter();
    const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const notifications = [
        {
            id: 1,
            title: 'New Overtime Request',
            time: '10m ago',
            desc: 'Sarah Jenkins applied for 4.5h overtime on Cloud Infra v3.',
            unread: true,
        },
        {
            id: 2,
            title: 'New Enterprise Deal',
            time: '1h ago',
            desc: `Deal DEAL-804 with Aegean Advisory moved to Won (${formatCurrency(29000)}).`,
            unread: true,
        },
        {
            id: 3,
            title: 'Expense Claim Pending',
            time: '3h ago',
            desc: `Liam Chen submitted an expense claim of ${formatCurrency(845.50)} for travel.`,
            unread: false,
        },
    ];
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
    return (<header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Left: Mobile hamburger & Sidebar toggle */}
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden" aria-label="Open Navigation">
            <FontAwesomeIcon icon={faBars} className="size-5"/>
          </SheetTrigger>
          <SheetContent aria-label="Navigation" side="left" className="p-0 w-72 max-w-[80vw]"><SheetTitle className="sr-only">Main navigation</SheetTitle><SheetDescription className="sr-only">Choose a QB Suite module or page.</SheetDescription>
            <React.Suspense fallback={null}>
              <Sidebar onNavigate={() => setMobileOpen(false)} className="w-full border-none"/>
            </React.Suspense>
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Toggle sidebar"
          className="hidden lg:inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <FontAwesomeIcon icon={faBars} className="size-4.5" />
        </button>
      </div>

      {/* Right: Search, Notifications & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-48 md:w-60">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search employee, lead, deal..." className="h-9 pl-8 pr-3 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-brand"/>
        </form>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
            <FontAwesomeIcon icon={faBell} className="size-4.5"/>
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-primary-foreground shadow-xs">
              2
            </span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 bg-white border border-slate-200 shadow-xl rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Notifications
                </span>
                <Badge className="bg-brand-light text-brand-dark text-[10px] font-bold h-4 px-1.5 shadow-none">
                  2 New
                </Badge>
              </div>
              <button onClick={() => toast.success('All marked as read')} className="text-xs text-brand hover:text-brand-dark flex items-center gap-1 font-medium">
                <FontAwesomeIcon icon={faCheckDouble} className="size-3.5"/>
                Mark read
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {notifications.map((n) => (<div key={n.id} className={`p-3 text-xs hover:bg-slate-50/80 transition-colors ${n.unread ? 'bg-brand-light/30' : ''}`}>
                  <div className="flex items-center justify-between font-medium text-slate-900">
                    <span className="flex items-center gap-1.5">
                      {n.unread && (<span className="size-1.5 rounded-full bg-brand shrink-0"/>)}
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="mt-1 text-slate-500 leading-relaxed">{n.desc}</p>
                </div>))}
            </div>
            <div className="p-2 border-t border-slate-100 text-center bg-slate-50/40 rounded-b-xl">
              <Link href="/hrm/announcements" className="text-xs font-semibold text-brand hover:text-brand-dark">
                View all company updates →
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <Avatar className="size-8 border border-slate-200">
              <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" alt="Alexander Vance"/>
              <AvatarFallback className="bg-brand text-primary-foreground font-semibold text-xs">
                AV
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                Alexander Vance
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Super Admin
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900">
                    Alexander Vance
                  </span>
                  <span className="text-[11px] text-slate-500">
                    alexander.vance@qbsuite.com
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push('/admin/hrm/employees')} className="text-xs p-2 rounded-lg cursor-pointer text-slate-700 hover:bg-slate-50 flex items-center gap-2">
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
              <DropdownMenuItem onClick={async () => {
                await logoutAdmin();
                toast.success('Signed out successfully');
                router.push('/login');
              }} className="text-xs p-2 rounded-lg cursor-pointer text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                <FontAwesomeIcon icon={faRightFromBracket} className="size-4 text-rose-500"/>
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>);
}
