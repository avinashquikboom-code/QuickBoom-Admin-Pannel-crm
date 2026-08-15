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
  PanelLeftClose,
  PanelLeftOpen,
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
      { name: 'Departments', href: '/departments', icon: Building2 },
      { name: 'Designations', href: '/designations', icon: Award },
      { name: 'Attendance', href: '/attendance', icon: Clock },
      { name: 'Leave', href: '/leaves', icon: Calendar },
      { name: 'Remote Work', href: '/remote-work', icon: Laptop },
      { name: 'Visits', href: '/visits', icon: Activity },
      { name: 'Payroll', href: '/payroll', icon: Banknote },
      { name: 'Geo Tracking', href: '/geo-tracking', icon: MapPin },
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

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed: controlledCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleSidebar = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Track expanded state for each section (all expanded by default)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (category: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white text-slate-700 flex flex-col h-screen sticky top-0 border-r border-slate-200 shadow-xs z-40 transition-all duration-300 ease-in-out`}
    >
      {/* QuikBoom Brand Header */}
      <div
        className={`h-16 flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        } border-b border-slate-200 bg-slate-50/60`}
      >
        <div className="flex items-center gap-3 font-extrabold text-lg text-slate-900 overflow-hidden">
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-[#23C45E] flex items-center justify-center text-white shadow-md shadow-[#23C45E]/20">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="tracking-tight text-base font-black leading-tight text-slate-900 truncate">
                QUIKBOOM
              </span>
              <span className="text-[10px] font-extrabold tracking-widest text-[#23C45E] uppercase truncate">
                CRM & HRM
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer hidden lg:flex items-center justify-center"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-slate-500" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* Navigation Section Cards */}
      <div className="flex-1 py-4 px-2 space-y-3 overflow-y-auto custom-scrollbar">
        {navigationSections.map((section) => {
          const isSectionCollapsed = !!collapsedSections[section.category];
          const SectionIcon = section.sectionIcon;

          // Check if any child item in this section is currently active
          const isSectionActive = section.items.some(
            (item) => pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
          );

          if (isCollapsed) {
            return (
              <div key={section.category} className="space-y-1.5 pt-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={item.name}
                      className={`flex items-center justify-center w-12 h-11 mx-auto rounded-xl transition-all duration-150 relative group ${
                        isActive
                          ? 'bg-[#23C45E] text-white shadow-sm shadow-[#23C45E]/25 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      {/* Floating tooltip */}
                      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          }

          return (
            <div
              key={section.category}
              className={`rounded-2xl border transition-all duration-200 ${
                isSectionActive
                  ? 'border-[#23C45E]/30 bg-[#E8F9EE]/30 shadow-xs'
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
                        ? 'bg-[#23C45E] text-white'
                        : 'bg-slate-200/80 text-slate-600 group-hover:bg-[#E8F9EE] group-hover:text-[#23C45E]'
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
                  {isSectionCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Section Items */}
              {!isSectionCollapsed && (
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
                            ? 'bg-[#23C45E] text-white shadow-sm shadow-[#23C45E]/25 font-bold translate-x-0.5'
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
      <div className={`p-3 border-t border-slate-200 bg-slate-50/60 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`min-w-0 flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'flex-1 mr-2'}`}>
            <div className="w-9 h-9 min-w-[36px] rounded-full bg-[#23C45E] text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
              {user?.firstName?.[0] || 'D'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'Demo User'}
                </p>
                <p className="text-[10px] text-[#23C45E] font-bold truncate">
                  {user?.tenantName || 'QuikBoom Enterprise'}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
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
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="p-2 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer w-10 h-10 flex items-center justify-center"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

