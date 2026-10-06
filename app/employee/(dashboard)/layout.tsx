'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { RouteGuard } from '@/components/RouteGuard';
import { FcmProvider } from '@/components/FcmProvider';
import { Bell, Menu, X, Check } from 'lucide-react';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { getUserRole } from '@/lib/access-control';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useEmployeeAuthStore((state) => state.user);
  const logout = useEmployeeAuthStore((state) => state.logout);
  const router = useRouter();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          userOverride={user}
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
              <Sidebar onNavigate={() => setMobileOpen(false)} userOverride={user} />
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all h-16">
          <div className="flex items-center justify-between px-4 sm:px-6 h-full gap-4">
            {/* Mobile Menu Toggle & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                  <Image src="/app_logo.png" alt="Logo" width={18} height={18} className="object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 tracking-tight leading-tight">Employee Workspace</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">QuikBoom</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notification Bell */}
              <Link
                href="/employee/notifications"
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-2 ring-rose-500/20 shadow-sm" />
                )}
              </Link>

              {/* Desktop Profile Display */}
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 leading-tight">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider leading-tight mt-0.5">
                    {getUserRole(user)}
                  </div>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm border-2 border-white shadow-sm ring-1 ring-slate-200">
                    {user?.firstName?.[0] || 'E'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <Check className="w-2 h-2 text-white" strokeWidth={4} />
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Logout
                </button>
              </div>
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
