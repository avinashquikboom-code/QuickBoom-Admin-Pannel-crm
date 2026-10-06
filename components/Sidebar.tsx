'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  userOverride?: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

/**
 * Determine the SINGLE active navigation item href across all accessible sections.
 * Resolves exact matches first, query-param specific matches, and nested route prefixes with specificity ranking.
 */
export function getActiveNavHref(
  sections: NavSectionConfig[],
  currentPathname: string | null,
  searchString: string = ''
): string | null {
  if (!currentPathname) return null;

  // Normalize: remove trailing slashes
  const currentPath = currentPathname.split('?')[0].replace(/\/+$/, '') || '/';
  const rawSearch = (searchString || (currentPathname.includes('?') ? currentPathname.split('?')[1] : '')).replace(/^\?/, '');
  const currentParams = new URLSearchParams(rawSearch);
  const rawCurrentTab = currentParams.get('tab');
  const currentTab = rawCurrentTab === 'employee' ? 'employees' : rawCurrentTab;

  let bestHref: string | null = null;
  let highestScore = -1;

  for (const section of sections) {
    for (const item of section.items) {
      const candidates = [item, ...(item.children || [])];
      for (const candidate of candidates) {
        if (!candidate.href) continue;

        const [rawItemPath, rawItemQuery] = candidate.href.split('?');
        const itemPath = rawItemPath.replace(/\/+$/, '') || '/';
        const itemParams = new URLSearchParams(rawItemQuery || '');
        const rawItemTab = itemParams.get('tab');
        const itemTab = rawItemTab === 'employee' ? 'employees' : rawItemTab;

        let score = -1;

        // Check if item or current path is Data Management
        const isCurrentDataManagement =
          currentPath === '/settings/data-management' ||
          currentPath === '/data-management' ||
          currentPath.startsWith('/data-management/');

        const isItemDataManagement =
          itemPath === '/settings/data-management' ||
          itemPath === '/data-management' ||
          itemPath.startsWith('/data-management/');

        if (isCurrentDataManagement && isItemDataManagement) {
          // Special precision matching for Data Management:
          // Support route path aliases e.g. /data-management/overview, /data-management/module-reset, etc.
          let resolvedCurrentTab = currentTab;
          if (!resolvedCurrentTab) {
            if (
              currentPath === '/data-management/overview' ||
              currentPath === '/settings/data-management' ||
              currentPath === '/data-management'
            ) {
              resolvedCurrentTab = 'summary';
            } else if (currentPath === '/data-management/module-reset') {
              resolvedCurrentTab = 'modules';
            } else if (currentPath === '/data-management/employee-reset') {
              resolvedCurrentTab = 'employees';
            } else if (currentPath === '/data-management/bin') {
              resolvedCurrentTab = 'bin';
            } else if (currentPath === '/data-management/reset-history') {
              resolvedCurrentTab = 'history';
            }
          }

          let resolvedItemTab = itemTab;
          if (!resolvedItemTab) {
            if (
              itemPath === '/data-management/overview' ||
              itemPath === '/settings/data-management' ||
              itemPath === '/data-management'
            ) {
              resolvedItemTab = 'summary';
            } else if (itemPath === '/data-management/module-reset') {
              resolvedItemTab = 'modules';
            } else if (itemPath === '/data-management/employee-reset') {
              resolvedItemTab = 'employees';
            } else if (itemPath === '/data-management/bin') {
              resolvedItemTab = 'bin';
            } else if (itemPath === '/data-management/reset-history') {
              resolvedItemTab = 'history';
            }
          }

          if (resolvedCurrentTab && resolvedItemTab && resolvedCurrentTab === resolvedItemTab) {
            score = 1000;
          } else if ((!resolvedCurrentTab || resolvedCurrentTab === 'summary') && resolvedItemTab === 'summary') {
            score = 1000;
          } else {
            score = -1;
          }
        } else if (itemTab) {
          // General query param match
          if (currentPath === itemPath && currentTab === itemTab) {
            score = 1000;
          } else if (currentPath === itemPath) {
            score = 50;
          }
        } else if (rawItemQuery) {
          // Generic query param match
          if (currentPath === itemPath && rawSearch.includes(rawItemQuery)) {
            score = 1000;
          } else if (currentPath === itemPath) {
            score = 50;
          }
        } else {
          // 2. Exact pathname match without query param
          if (currentPath === itemPath) {
            score = 500;
          }
          // 3. Route alias compatibility (Deals/CRM, Offices, Live Dashboard)
          else if (
            (itemPath === '/deals' || itemPath === '/crm') &&
            (currentPath === '/deals' || currentPath === '/crm')
          ) {
            score = 400;
          } else if (
            (itemPath === '/hrms/offices' || itemPath === '/offices' || itemPath === '/hrm/offices') &&
            (currentPath === '/hrms/offices' || currentPath === '/offices' || currentPath === '/hrm/offices')
          ) {
            score = 400;
          } else if (
            (itemPath === '/hrm/live-dashboard' || itemPath === '/live-dashboard') &&
            (currentPath === '/hrm/live-dashboard' || currentPath === '/live-dashboard')
          ) {
            score = 400;
          } else if (
            (itemPath === '/settings/notifications' || itemPath === '/notifications') &&
            (currentPath === '/settings/notifications' || currentPath === '/notifications')
          ) {
            score = 500;
          } else if (
            (itemPath === '/teams' || itemPath === '/team-management') &&
            (currentPath === '/teams' || currentPath === '/team-management')
          ) {
            score = 450;
          }
          // 4. Strict nested route prefix match (e.g. /customers/123 -> /customers)
          // Root and single top-level endpoints should not prefix-match other paths
          else if (
            itemPath !== '/' &&
            itemPath !== '/dashboard' &&
            itemPath !== '/super-admin' &&
            currentPath.startsWith(`${itemPath}/`)
          ) {
            score = 100 + itemPath.length; // More specific prefix gets higher score
          }
        }

        if (score > highestScore) {
          highestScore = score;
          bestHref = candidate.href;
        }
      }
    }
  }

  return highestScore >= 0 ? bestHref : null;
}

export function isItemActive(
  itemHref: string,
  currentPathname: string | null,
  sections?: NavSectionConfig[],
  searchString: string = ''
): boolean {
  if (!currentPathname || !itemHref) return false;
  const navSections = sections || CENTRAL_NAVIGATION;
  const activeHref = getActiveNavHref(navSections, currentPathname, searchString);
  return activeHref === itemHref;
}

function SidebarInner({ isCollapsed: controlledCollapsed, onToggleCollapse, onNavigate, userOverride }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const logout = useAuthStore((state) => state.logout);
  const storeUser = useAuthStore((state) => state.user);
  const user = userOverride || storeUser;
  const role = getUserRole(user);

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  // Next.js searchParams reactive query string
  const searchString = searchParams?.toString() ? `?${searchParams.toString()}` : '';

  const toggleSidebar = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Get filtered navigation sections based on user role, permissions, and subscription features
  let accessibleSections = filterNavigation(CENTRAL_NAVIGATION, user);

  // FLATTEN Employee Web Sidebar:
  // Required by business logic to render Employee Web sidebar as a flat list
  // instead of an accordion/dropdown structure.
  if (role === 'Employee') {
    const flatItems = accessibleSections.flatMap(section => section.items);
    accessibleSections = flatItems.map((item, index) => ({
      id: `flat-employee-nav-${index}`,
      category: item.name,
      sectionIcon: item.icon,
      roles: ['Employee'],
      items: [item]
    }));
  }

  // ACCORDION SINGLE SOURCE OF TRUTH: Only ONE expandable parent section open at a time
  const [openSection, setOpenSection] = useState<string | null>(() => {
    if (!pathname) return null;
    const initialMatch = accessibleSections.find((section) =>
      section.items.some(
        (item) =>
          item.href === pathname ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
          (item.href === '/settings/notifications' && (pathname === '/notifications' || pathname.startsWith('/notifications')))
      )
    );
    return initialMatch?.id ?? null;
  });

  // Single active item href derived dynamically from current route
  const activeHref = React.useMemo(() => {
    return getActiveNavHref(accessibleSections, pathname, searchString);
  }, [accessibleSections, pathname, searchString]);

  // Route-aware initial state & auto-expansion on navigation
  useEffect(() => {
    if (!pathname || !activeHref) return;

    // Find the section that contains the single active route
    const matchingSection = accessibleSections.find((section) =>
      section.items.some(
        (item) => item.href === activeHref || item.children?.some((child) => child.href === activeHref)
      )
    );

    if (matchingSection) {
      // Open ONLY the matching section, closing all others
      setOpenSection(matchingSection.id);
    }
  }, [pathname, activeHref]);

  // Submenu expansion state (Leads expanded by default or when on lead route)
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({
    Leads: true,
  });

  useEffect(() => {
    if (pathname && (pathname.startsWith('/leads') || pathname === '/leads')) {
      setExpandedSubmenus((prev) => ({ ...prev, Leads: true }));
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
      {/* QB Suite Brand Header */}
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
                  alt="QB Suite Logo"
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

          // Check if any child item in this section is currently the single active item
          const isSectionActive = section.items.some((item) => item.href === activeHref);

          // Single-item sections (e.g. OVERVIEW with just Dashboard)
          const isSingleItemSection = section.items.length === 1;

          if (isCollapsed) {
            return (
              <div key={section.id} className="space-y-1.5 pt-1">
                {section.items.map((item) => {
                  const isActive = item.href === activeHref;
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
            const isActive = singleItem.href === activeHref;
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
                    const hasChildren = Boolean(item.children && item.children.length > 0);
                    const isSubmenuOpen = expandedSubmenus[item.name] ?? false;
                    const isChildActive = hasChildren && item.children!.some((c) => c.href === activeHref);
                    const isDirectActive = item.href === activeHref;
                    const isItemOrChildActive = isDirectActive || isChildActive || (pathname ? pathname.startsWith(item.href) : false);
                    const Icon = item.icon;

                    if (hasChildren) {
                      return (
                        <div key={item.name + item.href} className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSubmenus((prev) => ({
                                ...prev,
                                [item.name]: !prev[item.name],
                              }))
                            }
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer ${
                              isItemOrChildActive
                                ? 'bg-[#E8F9EE] text-[#1AA14D] font-bold border border-[#23C45E]/30'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`w-4 h-4 ${isItemOrChildActive ? 'text-[#1AA14D]' : 'text-slate-400'}`} />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isSubmenuOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'
                              }`}
                            />
                          </button>

                          {isSubmenuOpen && (
                            <div className="ml-4 pl-2.5 border-l-2 border-emerald-200/60 space-y-1 py-0.5 animate-in fade-in-50 duration-150">
                              {item.children!.map((subItem) => {
                                const isSubActive = subItem.href === activeHref;
                                return (
                                  <Link
                                    key={subItem.name + subItem.href}
                                    href={subItem.href}
                                    onClick={onNavigate}
                                    aria-current={isSubActive ? 'page' : undefined}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                                      isSubActive
                                        ? 'bg-[#23C45E] text-white shadow-xs font-bold translate-x-0.5'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isSubActive ? 'bg-white' : 'bg-slate-300'
                                      }`}
                                    />
                                    <span className="truncate">{subItem.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive = item.href === activeHref;

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
              {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.email || 'User')}
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

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense
      fallback={
        <aside
          className={`${
            props.isCollapsed ? 'w-20' : 'w-64'
          } bg-white text-slate-700 flex flex-col h-screen sticky top-0 border-r border-slate-200 shadow-xs z-40 transition-all duration-300 ease-in-out select-none`}
        />
      }
    >
      <SidebarInner {...props} />
    </Suspense>
  );
}

