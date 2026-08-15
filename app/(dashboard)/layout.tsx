'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search leads, contacts, deals..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0F766E] focus:outline-none text-[#0F172A]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#F8FAFC] rounded-lg text-[#64748B] relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 bg-[#0F766E] rounded-full absolute top-2 right-2"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold text-sm">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-[#0F172A]">
                  {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
                </p>
                <p className="text-[10px] text-[#64748B] capitalize">{user?.roles?.[0] || 'Tenant Admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
