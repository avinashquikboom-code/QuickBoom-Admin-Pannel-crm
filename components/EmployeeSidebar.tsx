'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap,
  LayoutDashboard,
  PlusCircle,
  UserSearch,
  Building2,
  Fingerprint,
  FileText,
  Radio,
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { hasPermission } from '@/lib/access-control';
import { toast } from 'react-hot-toast';

export interface EmployeeSidebarProps {
  user?: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function EmployeeSidebar({
  user: userProp,
  isCollapsed = false,
  onToggleCollapse,
  onNavigate,
  onClose,
}: EmployeeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const storeUser = useEmployeeAuthStore((state) => state.user);
  const logout = useEmployeeAuthStore((state) => state.logout);
  const user = userProp || storeUser;

  // Fetch full employee profile to display accurate employee code, designation, etc.
  const { data: profile } = useQuery({
    queryKey: ['employee-sidebar-profile', user?.id],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees/profile/me');
        return res?.data?.data || res?.data || res;
      } catch {
        return null;
      }
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const firstName = profile?.firstName || user?.firstName || 'Employee';
  const lastName = profile?.lastName || user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const empCode =
    profile?.employeeCode ||
    (user as any)?.employeeCode ||
    (user as any)?.employee?.employeeCode ||
    'EMP-004';
  const designation =
    profile?.designation?.name ||
    profile?.designation ||
    (user as any)?.designation ||
    'TELESALES EXECUTIVE';
  const initials = `${firstName[0] || 'E'}${lastName[0] || ''}`.toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    if (onNavigate) onNavigate();
    if (onClose) onClose();
    router.push('/employee/login');
  };

  // Primary navigation items (CRM)
  const primaryNavItems = [
    {
      name: 'Dashboard',
      href: '/employee/dashboard',
      icon: LayoutDashboard,
      permission: ['employee.dashboard.view', 'dashboard.view'],
    },
    {
      name: 'Data Capture',
      href: '/employee/data-capture',
      icon: PlusCircle,
      permission: ['data_capture', 'employee.data_capture.view', 'DATA_CAPTURE'],
    },
    {
      name: 'Leads',
      href: '/employee/leads',
      icon: UserSearch,
      permission: ['leads', 'employee.leads.view', 'LEADS'],
    },
    {
      name: 'Customers',
      href: '/employee/customers',
      icon: Building2,
      permission: ['customers', 'employee.customers.view', 'CUSTOMERS'],
    },
  ].filter((item) => hasPermission(user, item.permission));

  // HRM & Workplace items
  const hrmNavItems = [
    {
      name: 'Attendance',
      href: '/employee/attendance',
      icon: Fingerprint,
      permission: ['employee.attendance.view', 'attendance.view_own', 'attendance.view'],
    },
    {
      name: 'Requests & Applications',
      href: '/employee/leaves',
      icon: FileText,
      permission: ['employee.leave.view', 'leave.view_own', 'leave.view'],
    },
    {
      name: 'Remote Work',
      href: '/employee/remote-work',
      icon: Radio,
      permission: ['employee.remote_work.view', 'remote.view_own', 'remote.view'],
    },
    {
      name: 'Salary Slips',
      href: '/employee/salary-slips',
      icon: Receipt,
      permission: ['employee.salary.view', 'salary_slips.view_own', 'salary.view'],
    },
  ].filter((item) => hasPermission(user, item.permission));

  const isSettingsActive = pathname === '/employee/settings';

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } bg-white text-slate-800 flex flex-col h-full select-none transition-all duration-300 ease-in-out border-r border-slate-200/90 shadow-xs`}
    >
      {/* ── Brand Header (QB Suite) ────────────────────────────────────────── */}
      <div
        className={`h-20 flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        } border-b border-slate-100 bg-white`}
      >
        <Link
          href="/employee/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 group min-w-0"
        >
          {/* Green Squircle with Lightning Bolt */}
          <div className="w-11 h-11 rounded-2xl bg-[#16A34A] flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform shrink-0">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
                QB Suite
              </span>
              <span className="text-[10px] font-black text-[#16A34A] uppercase tracking-wider leading-none mt-1.5">
                BUSINESS SUITE
              </span>
            </div>
          )}
        </Link>

        {/* Action button: Close for mobile drawer, Toggle for desktop */}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden lg:flex items-center justify-center"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-slate-500" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-500" />
            )}
          </button>
        ) : null}
      </div>

      {/* ── Employee Profile Card ──────────────────────────────────────────── */}
      <div className={`p-4 border-b border-slate-100 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <Link
          href="/employee/profile"
          onClick={onNavigate}
          className={`w-full rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between'
          }`}
          title="View Profile"
        >
          {/* Avatar with Initials */}
          <div className="w-11 h-11 rounded-full bg-[#E8F9EE] text-[#1AA14D] font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200/40 shadow-2xs">
            {initials}
          </div>

          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1 ml-3 mr-2">
                <p className="text-sm font-bold text-slate-900 truncate leading-snug">
                  {fullName}
                </p>
                <div className="text-[11px] font-medium text-slate-500 truncate leading-tight mt-0.5 flex items-center gap-1">
                  <span className="text-[#16A34A] font-bold shrink-0">{empCode}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 font-semibold uppercase truncate">
                    {designation}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-[#E8F9EE] text-[#1AA14D] border border-emerald-200/60 uppercase shrink-0">
                ACTIVE
              </span>
            </>
          )}
        </Link>
      </div>

      {/* ── Scrollable Navigation Items ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar">
        {/* Primary CRM Items */}
        <div className="space-y-1">
          {primaryNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/employee/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            if (isCollapsed) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={item.name}
                  className={`flex items-center justify-center w-12 h-11 mx-auto rounded-xl transition-all duration-150 relative group ${
                    isActive
                      ? 'bg-[#E8F9EE] text-[#1AA14D] font-bold border border-[#23C45E]/40 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#1AA14D]' : 'text-slate-500'}`} />
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                    {item.name}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#E8F9EE] text-[#1AA14D] font-bold border border-[#23C45E]/40 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#1AA14D]'
                        : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive
                      ? 'text-[#1AA14D]'
                      : 'text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5'
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* ── HRM & Workplace Section ───────────────────────────────────────── */}
        {hrmNavItems.length > 0 && (
          <div>
            {!isCollapsed && (
              <p className="px-3.5 pb-2 text-[11px] font-black tracking-wider text-slate-400 uppercase">
                HRM & Workplace
              </p>
            )}
            <div className="space-y-1">
              {hrmNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                const Icon = item.icon;

                if (isCollapsed) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={item.name}
                      className={`flex items-center justify-center w-12 h-11 mx-auto rounded-xl transition-all duration-150 relative group ${
                        isActive
                          ? 'bg-[#E8F9EE] text-[#1AA14D] font-bold border border-[#23C45E]/40 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? 'text-[#1AA14D]' : 'text-slate-500'}`}
                      />
                      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                        {item.name}
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                      isActive
                        ? 'bg-[#E8F9EE] text-[#1AA14D] font-bold border border-[#23C45E]/40 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#1AA14D]'
                            : 'text-slate-500 group-hover:text-slate-800'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-[#1AA14D]'
                          : 'text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── System Section (Settings & Logout) ───────────────────────────── */}
        <div className="pt-1">
          {!isCollapsed && (
            <p className="px-3.5 pb-2 text-[11px] font-black tracking-wider text-slate-400 uppercase">
              System
            </p>
          )}

          {isCollapsed ? (
            <div className="space-y-2 pt-1">
              {/* Collapsed Settings */}
              <Link
                href="/employee/settings"
                onClick={onNavigate}
                title="Settings"
                className={`flex items-center justify-center w-12 h-11 mx-auto rounded-xl transition-all duration-150 relative group ${
                  isSettingsActive
                    ? 'bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/40 font-bold shadow-xs'
                    : 'bg-emerald-50/70 text-[#1AA14D] hover:bg-emerald-100'
                }`}
              >
                <Settings className="w-5 h-5 text-[#1AA14D]" />
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  Settings
                </span>
              </Link>

              {/* Collapsed Logout */}
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="flex items-center justify-center w-12 h-11 mx-auto rounded-xl bg-rose-50 text-[#DC2626] hover:bg-rose-100 transition-all duration-150 relative group cursor-pointer"
              >
                <LogOut className="w-5 h-5 text-[#DC2626]" />
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  Logout
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Settings Pill Card (Green styled matching mobile reference) */}
              <Link
                href="/employee/settings"
                onClick={onNavigate}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all cursor-pointer shadow-2xs group ${
                  isSettingsActive
                    ? 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/60 ring-2 ring-emerald-500/10 font-bold'
                    : 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/30 hover:bg-[#dcfce7] font-bold'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Settings className="w-5 h-5 text-[#1AA14D] shrink-0" />
                  <span className="text-sm font-bold text-[#1AA14D] truncate">Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#1AA14D] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Logout Pill Card (Soft Red styled matching mobile reference) */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#FEECEB] text-[#DC2626] border border-[#FCA5A5]/40 hover:bg-[#fee2e2] transition-all cursor-pointer shadow-2xs font-bold group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LogOut className="w-5 h-5 text-[#DC2626] shrink-0" />
                  <span className="text-sm font-bold text-[#DC2626] truncate">Logout</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#DC2626] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
