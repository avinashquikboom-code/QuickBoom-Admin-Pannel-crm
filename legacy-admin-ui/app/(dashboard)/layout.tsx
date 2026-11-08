'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { RouteGuard } from '@/components/RouteGuard';
import { FcmProvider } from '@/components/FcmProvider';
import Image from 'next/image';
import { Bell, Search, Menu, X, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getUserRole } from '@/lib/access-control';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const currentRole = getUserRole(user);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['admin-notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/notifications', {
          params: { unreadOnly: 'true', limit: 20 },
        });
        const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
        const total = res?.pagination?.total ?? res?.meta?.total ?? (Array.isArray(items) ? items.length : 0);
        return Number(total) || (Array.isArray(items) ? items.length : 0);
      } catch {
        return 0;
      }
    },
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full bg-white shadow-2xl z-10 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 font-black text-slate-900 text-sm">
                <Image
                  src="/logo.png"
                  alt="QuikBoom"
                  width={110}
                  height={28}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer shrink-0"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees, tasks, records..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium truncate"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F9EE] border border-[#23C45E]/30 text-[#1AA14D] text-xs font-black shadow-2xs">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Role:</span>
              <span className="font-extrabold">{currentRole}</span>
            </div>

            {/* Notification Bell */}
            <Link
              href="/settings/notifications"
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 relative cursor-pointer block"
              title="Notification Center"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] bg-[#23C45E] text-slate-950 font-black text-[10px] rounded-full absolute -top-1 -right-1 flex items-center justify-center px-1 shadow-xs border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 flex items-center justify-center font-bold text-xs shadow-2xs">
                {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.email || 'User')}
                </p>
                <p className="text-[10px] text-[#1AA14D] font-bold capitalize truncate">
                  {currentRole}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Protected by RouteGuard */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 max-w-full">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>

      {/* FCM Background Push Notification Integration & Permission Banner */}
      <FcmProvider />
    </div>
  );
}
