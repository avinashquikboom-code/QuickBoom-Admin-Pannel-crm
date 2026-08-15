'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  Clock,
  Calendar,
  Laptop,
  MapPin,
  Banknote,
  FileSpreadsheet,
  UserCheck,
  Contact,
  Kanban,
  CheckSquare,
  Activity,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  Zap,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface NavSection {
  category: string;
  sectionIcon: any;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    category: 'OVERVIEW',
    sectionIcon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    category: 'HRM MANAGEMENT',
    sectionIcon: Users,
    items: [
      { name: 'Employees', href: '/employees', icon: Users },
      { name: 'Attendance', href: '/attendance', icon: Clock },
      { name: 'Geo Tracking', href: '/geo-tracking', icon: MapPin },
      { name: 'Visits', href: '/visits', icon: Activity },
      { name: 'Leave', href: '/leaves', icon: Calendar },
      { name: 'Remote Work', href: '/remote-work', icon: Laptop },
      { name: 'Salary', href: '/salary', icon: Banknote },
      { name: 'Salary Slips', href: '/salary-slips', icon: FileSpreadsheet },
    ],
  },
  {
    category: 'CRM & SALES',
    sectionIcon: Kanban,
    items: [
      { name: 'Leads', href: '/leads', icon: UserCheck },
      { name: 'Contacts', href: '/contacts', icon: Contact },
      { name: 'Companies', href: '/companies', icon: Building2 },
      { name: 'Deals Pipeline', href: '/crm', icon: Kanban },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Activities', href: '/activities', icon: Activity },
    ],
  },
  {
    category: 'ADMIN & SYSTEM',
    sectionIcon: ShieldCheck,
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'Roles & Permissions', href: '/roles-permissions', icon: ShieldCheck },
      { name: 'Audit Logs', href: '/audit-logs', icon: History },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  // Track expanded state for each section (all expanded by default)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (category: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen sticky top-0 border-r border-slate-200/80 shadow-xs z-40">
      {/* QuikBoom Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200/80 justify-between bg-slate-50/60">
        <div className="flex items-center gap-3 font-extrabold text-lg text-slate-900">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="flex flex-col">
            <span className="tracking-tight text-base font-black leading-tight text-slate-900">
              QUIKBOOM
            </span>
            <span className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase">
              CRM & HRM
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Section Cards */}
      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar">
        {navigationSections.map((section) => {
          const isCollapsed = !!collapsedSections[section.category];
          const SectionIcon = section.sectionIcon;

          // Check if any child item in this section is currently active
          const isSectionActive = section.items.some(
            (item) => pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
          );

          return (
            <div
              key={section.category}
              className={`rounded-2xl border transition-all duration-200 ${
                isSectionActive
                  ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                  : 'border-slate-200/70 bg-slate-50/40 hover:bg-slate-50/80'
              }`}
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.category)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left font-extrabold cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors ${
                      isSectionActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200/80 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                    }`}
                  >
                    <SectionIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-800">
                    {section.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/60 text-slate-600">
                    {section.items.length}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Section Items */}
              {!isCollapsed && (
                <div className="px-2 pb-2.5 pt-1 space-y-1 border-t border-slate-100">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 font-bold translate-x-0.5'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-2xs'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/60">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'System Admin'}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold truncate">
                {user?.tenantName || 'QuikBoom Enterprise'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="p-2 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
