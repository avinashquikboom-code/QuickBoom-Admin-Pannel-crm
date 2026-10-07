'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { EmployeeSidebar } from '@/components/EmployeeSidebar';
import { RouteGuard } from '@/components/RouteGuard';
import { FcmProvider } from '@/components/FcmProvider';
import { Bell, LogOut, Menu, Loader2 } from 'lucide-react';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { getUserRole } from '@/lib/access-control';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useEmployeeAuthStore((state) => state.user);
  const isAuthenticated = useEmployeeAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useEmployeeAuthStore((state) => state._hasHydrated);
  const logout = useEmployeeAuthStore((state) => state.logout);
  const router = useRouter();
  
  const [isClientReady, setIsClientReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    setIsClientReady(true);
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['employee-notifications', 'unread-count'],
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

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/employee/login');
  };

  // Wait for client mount and hydration
  if (!isClientReady || !hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          <span className="text-xs font-bold text-slate-500">Checking authorization...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect smoothly to employee login
  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') {
      router.replace('/employee/login');
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          <span className="text-xs font-bold text-slate-500">Redirecting to employee login...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden lg:block sticky top-0 h-screen">
        <EmployeeSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          user={user}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 max-w-[320px] w-full bg-white shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-left duration-200">
            <EmployeeSidebar
              onClose={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
              user={user}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white">
          <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F9EE] ring-1 ring-[#23C45E]/20">
                  <Image src="/app_logo.png" alt="QuikBoom" width={20} height={20} className="object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-tight text-slate-900">Employee Workspace</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">QuikBoom</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/employee/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="hidden items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 py-1 pl-1 pr-1.5 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1AA14D] text-sm font-bold text-white">
                  {user?.firstName?.[0] || 'E'}
                </div>
                <div className="min-w-0 pr-1">
                  <p className="truncate text-sm font-semibold leading-tight text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1AA14D]">
                    {getUserRole(user)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-rose-600"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 sm:hidden"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50 relative isolate pb-20 p-4 sm:p-6 lg:p-8">
          <RouteGuard userOverride={user}>{children}</RouteGuard>
        </main>
      </div>

      {/* FCM Integration */}
      <FcmProvider />
    </div>
  );
}
