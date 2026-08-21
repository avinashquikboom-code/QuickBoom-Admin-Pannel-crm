'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import {
  CENTRAL_NAVIGATION,
  filterNavigation,
  getUserRole,
  NavSectionConfig,
} from '@/lib/access-control';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ isCollapsed: controlledCollapsed, onToggleCollapse, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const role = getUserRole(user);

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleSidebar = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // ACCORDION SINGLE SOURCE OF TRUTH: Only ONE expandable parent section open at a time
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Get filtered navigation sections based on user role, permissions, and subscription features
  const accessibleSections = filterNavigation(CENTRAL_NAVIGATION, user);

  // Route-aware initial state & auto-expansion on navigation
  useEffect(() => {
    if (!pathname) return;

    // Find the section that contains the current active route
    const matchingSection = accessibleSections.find((section) =>
      section.items.some((item) => {
        if (item.href === '/dashboard' || item.href === '/super-admin') {
          return pathname === item.href;
        }
        return pathname === item.href || pathname.startsWith(item.href);
      })
    );

    if (matchingSection) {
      // Open ONLY the matching section, closing all others
      setOpenSection(matchingSection.id);
    }
  }, [pathname]);

  // Handle accordion toggle: click closed -> open it; click open -> close it; click another -> switch to it
  const handleToggleSection = (sectionId: string) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white text-slate-700 flex flex-col h-screen sticky top-0 border-r border-slate-200 shadow-xs z-40 transition-all duration-300 ease-in-out select-none`}
    >
      {/* QuikBoom Brand Header */}
      <div
        className={`h-16 flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        } border-b border-slate-200 bg-slate-50/60`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {isCollapsed ? (
            <div className="w-10 h-10 relative flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="QuikBoom Logo"
                width={40}
                height={40}
                className="w-9 h-9 object-contain"
                priority
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative h-9 max-w-[130px] flex items-center">
                <Image
                  src="/logo.png"
                  alt="QuikBoom Logo"
                  width={130}
                  height={36}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
              <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#1AA14D] border border-emerald-200/60 uppercase shrink-0 truncate">
                {role === 'Super Admin' ? 'Super Admin' : role === 'HR' ? 'HR' : 'Admin'}
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

      {/* Dynamic Navigation Section Cards with Single Accordion Behavior */}
      <div className="flex-1 py-4 px-2 space-y-2.5 overflow-y-auto custom-scrollbar">
        {accessibleSections.map((section) => {
          const SectionIcon = section.sectionIcon;
          const isOpen = openSection === section.id;

          // Check if any child item in this section is currently active
          const isSectionActive = section.items.some((item) => {
            if (item.href === '/dashboard' || item.href === '/super-admin') {
              return pathname === item.href;
            }
            return pathname === item.href || (pathname && pathname.startsWith(item.href));
          });

          // Single-item sections (e.g. OVERVIEW with just Dashboard)
          const isSingleItemSection = section.items.length === 1;

          if (isCollapsed) {
            return (
              <div key={section.id} className="space-y-1.5 pt-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && item.href !== '/super-admin' && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name + item.href}
                      href={item.href}
                      title={item.name}
                      aria-current={isActive ? 'page' : undefined}
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

          // Render single-item non-accordion link (e.g., Dashboard)
          if (isSingleItemSection) {
            const singleItem = section.items[0];
            const isActive = pathname === singleItem.href;
            const ItemIcon = singleItem.icon;

            return (
              <div key={section.id}>
                <Link
                  href={singleItem.href}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all duration-200 font-extrabold cursor-pointer group ${
                    isActive
                      ? 'border-[#23C45E]/40 bg-[#E8F9EE] text-[#1AA14D] shadow-xs'
                      : 'border-slate-200/70 bg-slate-50/40 text-slate-700 hover:bg-slate-50/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors ${
                        isActive
                          ? 'bg-[#23C45E] text-white shadow-xs'
                          : 'bg-slate-200/80 text-slate-600 group-hover:bg-[#E8F9EE] group-hover:text-[#23C45E]'
                      }`}
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-extrabold tracking-wider uppercase">
                      {singleItem.name}
                    </span>
                  </div>
                </Link>
              </div>
            );
          }

          // Expandable Parent Section (Accordion)
          return (
            <div
              key={section.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isSectionActive
                  ? 'border-[#23C45E]/30 bg-[#E8F9EE]/20 shadow-xs'
                  : 'border-slate-200/70 bg-slate-50/40 hover:bg-slate-50/80'
              }`}
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => handleToggleSection(section.id)}
                aria-expanded={isOpen}
                aria-controls={`sidebar-section-${section.id}`}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left font-extrabold cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors shrink-0 ${
                      isSectionActive
                        ? 'bg-[#23C45E] text-white shadow-xs'
                        : 'bg-slate-200/80 text-slate-600 group-hover:bg-[#E8F9EE] group-hover:text-[#23C45E]'
                    }`}
                  >
                    <SectionIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-800 truncate">
                    {section.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-600">
                    {section.items.length}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-slate-700' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Section Items Accordion Body */}
              {isOpen && (
                <div
                  id={`sidebar-section-${section.id}`}
                  className="px-2 pb-2.5 pt-1 space-y-1 border-t border-slate-100/80 animate-in fade-in-50 duration-150"
                >
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && item.href !== '/super-admin' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.name + item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                          isActive
                            ? 'bg-[#23C45E] text-white shadow-sm shadow-[#23C45E]/25 font-bold translate-x-0.5'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-2xs'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                        {item.feature && (
                          <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-bold uppercase opacity-60">
                            {item.feature}
                          </span>
                        )}
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
      <div
        className={`p-3 border-t border-slate-200 bg-slate-50/60 ${
          isCollapsed ? 'flex flex-col items-center gap-2' : ''
        }`}
      >
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20 truncate">
                    {role}
                  </span>
                </div>
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
