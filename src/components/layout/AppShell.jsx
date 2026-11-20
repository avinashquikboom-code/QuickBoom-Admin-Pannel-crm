'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from '@/components/common/Toast';
import { MainLayout } from './MainLayout';
import { useAuthStore } from '../../../lib/store';

const STANDALONE_PREFIXES = ['/login', '/forgot-password'];

function AppShellWithRoute({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const standalone = STANDALONE_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  const protectedRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/hrm');

  React.useEffect(() => {
    if (protectedRoute && hasHydrated && !isAuthenticated) {
      const next = `${pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [hasHydrated, isAuthenticated, pathname, protectedRoute, router]);

  if (standalone) {
    return (
      <>
        <Toaster position="top-right" closeButton duration={4500} />
        {children}
      </>
    );
  }

  if (protectedRoute && (!hasHydrated || !isAuthenticated)) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <span className="size-5 animate-spin rounded-full border-2 border-emerald-600/25 border-t-emerald-600" />
        <span className="sr-only">Checking admin session</span>
      </div>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}

export function AppShell({ children }) {
  return (
    <React.Suspense fallback={<MainLayout>{children}</MainLayout>}>
      <AppShellWithRoute>{children}</AppShellWithRoute>
    </React.Suspense>
  );
}
