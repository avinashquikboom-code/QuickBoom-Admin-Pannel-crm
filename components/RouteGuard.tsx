'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { checkRouteAccess, getUserRole } from '@/lib/access-control';
import { ShieldAlert, Lock, ArrowLeft, LayoutDashboard, Layers, Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  // Wait for client mount and Zustand hydration from localStorage before evaluating route access
  if (!isClientReady || !hasHydrated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#23C45E] animate-spin" />
          <span className="text-xs font-bold text-slate-500">Restoring administrative session...</span>
        </div>
      </div>
    );
  }

  // If client hydrated but unauthenticated on dashboard routes, redirect smoothly to login
  if (!isAuthenticated || !user) {
    const isPublicRoute =
      pathname === '/login' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname === '/verify-otp';

    if (!isPublicRoute) {
      if (typeof window !== 'undefined') {
        router.replace('/login');
      }
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#23C45E] animate-spin" />
            <span className="text-xs font-bold text-slate-500">Redirecting to login...</span>
          </div>
        </div>
      );
    }
  }

  const access = checkRouteAccess(pathname, user);

  if (access.allowed) {
    return <>{children}</>;
  }

  const role = getUserRole(user);

  // ADMIN PANEL ACCESS RESTRICTION: Only Super Admin
  if (access.reason === 'ADMIN_ONLY') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-[#23C45E]/30 text-[#1AA14D] flex items-center justify-center mx-auto shadow-md shadow-[#23C45E]/10">
            <ShieldAlert className="w-10 h-10 text-[#23C45E]" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px] font-black uppercase tracking-wider">
              403 • Super Admin Only
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Super Admin Access Only
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
              Access Denied: The Admin Panel is strictly for SUPER_ADMIN only. Other roles must use the mobile application.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400">Your Logged-in Role:</span>
              <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400">Permitted Admin Role:</span>
              <span className="font-bold text-[#1AA14D]">Super Admin</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="font-bold text-slate-500">Employee Workspace:</span>
              <span className="font-extrabold text-blue-600">QuikBoom Flutter Mobile App</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/login');
              }}
              className="w-full sm:w-auto flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FEATURE DISABLED (Subscription Plan limit)
  if (access.reason === 'FEATURE_DISABLED') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Layers className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-100/80 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-wider">
              Subscription Feature Not Available
            </span>
            <h2 className="text-xl font-black text-slate-900">
              {access.requiredFeature ? access.requiredFeature.toUpperCase() : 'Module'} Feature Disabled
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {access.message ||
                'This module is not included in your organization’s active subscription plan.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400">Current Role:</span>
              <span className="font-extrabold text-slate-800">{role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400">Feature Key:</span>
              <span className="font-extrabold text-amber-700">{access.requiredFeature || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400">Status:</span>
              <span className="font-extrabold text-rose-600">Inactive in Subscription</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3 px-4 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#23C45E]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NO PERMISSION
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-rose-100/80 text-rose-800 rounded-full text-[10px] font-black uppercase tracking-wider">
            403 • Unauthorized Access
          </span>
          <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {access.message ||
              `Your role (${role}) does not have permission to view or manage this administrative module.`}
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400">Your Role:</span>
            <span className="font-extrabold text-slate-900">{role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-400">Requested Path:</span>
            <span className="font-mono text-slate-700 font-bold">{pathname}</span>
          </div>
          {access.requiredPermission && (
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-400">Required Permission:</span>
              <span className="font-mono text-rose-600 font-bold text-[10px]">
                {access.requiredPermission}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-3 px-4 bg-[#23C45E] hover:bg-[#1AA14D] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#23C45E]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
