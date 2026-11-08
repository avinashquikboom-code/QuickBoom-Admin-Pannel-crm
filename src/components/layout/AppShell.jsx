'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MainLayout } from './MainLayout';

const STANDALONE_PREFIXES = ['/login', '/forgot-password'];

function AppShellWithRoute({ children }) {
  const pathname = usePathname();
  const standalone = STANDALONE_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (standalone) {
    return children;
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
