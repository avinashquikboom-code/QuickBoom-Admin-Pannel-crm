'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RouteGuard } from '@/components/RouteGuard';
import Image from 'next/image';
import {
  Bell,
  Search,
  Menu,
  X,
  Shield,
  Layers,
  ChevronDown,
  Check,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getUserRole, getUserFeatures, UserRole, SubscriptionFeatures } from '@/lib/access-control';
import { toast } from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const switchRole = useAuthStore((state) => state.switchRole);
  const toggleSubscriptionFeature = useAuthStore((state) => state.toggleSubscriptionFeature);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);

  const currentRole = getUserRole(user);
  const features = getUserFeatures(user);

  const availableRoles: UserRole[] = [
    'Super Admin',
  ];

  const subscriptionFeatureKeys: (keyof SubscriptionFeatures)[] = [
    'crm',
    'hrm',
    'payroll',
    'data_capture',
    'geo_tracking',
    'reports',
  ];

  const handleRoleChange = (role: UserRole) => {
    switchRole(role);
    setShowRoleMenu(false);
    toast.success(`Active role switched to: ${role}`, {
      icon: '🛡️',
    });
  };

  const handleToggleFeature = (feat: keyof SubscriptionFeatures) => {
    const nextState = !features[feat];
    toggleSubscriptionFeature(feat, nextState);
    toast.success(`Subscription feature "${feat.toUpperCase()}": ${nextState ? 'ENABLED' : 'DISABLED'}`, {
      icon: nextState ? '✅' : '⏸️',
    });
  };

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
                placeholder="Search leads, tasks, records..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23C45E] focus:outline-none text-slate-900 font-medium truncate"
              />
            </div>
          </div>

          {/* Right Header Actions & Role Switcher Simulator */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRoleMenu(!showRoleMenu);
                  setShowFeatureMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F9EE] border border-[#23C45E]/30 text-[#1AA14D] hover:bg-[#23C45E] hover:text-white transition-all text-xs font-black cursor-pointer shadow-2xs"
                title="Switch Active Role for Testing"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Role:</span>
                <span className="font-extrabold">{currentRole}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                      Switch Role Matrix
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {availableRoles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(r)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          currentRole === r
                            ? 'bg-[#23C45E] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{r}</span>
                        {currentRole === r && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subscription Feature Toggles Pill */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => {
                  setShowFeatureMenu(!showFeatureMenu);
                  setShowRoleMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-all text-xs font-bold cursor-pointer"
                title="Toggle Subscription Features for Customer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#23C45E]" />
                <span>Subscription Features</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showFeatureMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-1 py-1 border-b border-slate-100 mb-2">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                      Active Plan Features
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Toggle features on/off for current customer</p>
                  </div>
                  <div className="space-y-1.5">
                    {subscriptionFeatureKeys.map((k) => {
                      const enabled = !!features[k];
                      return (
                        <div
                          key={k}
                          onClick={() => handleToggleFeature(k)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-bold transition-all border border-transparent hover:border-slate-100"
                        >
                          <span className="uppercase text-[11px] text-slate-800 tracking-wider">
                            {k.replace('_', ' ')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              enabled
                                ? 'bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}
                          >
                            {enabled ? 'Active' : 'Off'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 bg-[#23C45E] rounded-full absolute top-2 right-2" />
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 flex items-center justify-center font-bold text-xs shadow-2xs">
                {user?.firstName?.[0] || 'D'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'Demo User'}
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
    </div>
  );
}
