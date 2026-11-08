'use client';

import * as React from 'react';
import { LoginBrandingPanel, LOGIN_BRAND, QbSuiteLogoMark } from './login-branding-panel';
import { LoginFormCard } from './login-form-card';

function MobileBrandMark() {
  return (
    <div className="flex items-center gap-3">
      <QbSuiteLogoMark size="sm" />
      <div>
        <p className="text-base font-bold" style={{ color: LOGIN_BRAND.navy }}>
          QB Suite
        </p>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: LOGIN_BRAND.muted }}
        >
          Admin Panel
        </p>
      </div>
    </div>
  );
}

export function AdminLoginScreen() {
  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-white">
      <LoginBrandingPanel />

      <section
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:w-[57%] lg:shrink-0"
        style={{ backgroundColor: LOGIN_BRAND.mint }}
      >
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto overscroll-none px-4 py-8 sm:px-6 lg:overflow-hidden lg:px-10 lg:py-10">
          <div className="mb-6 w-full max-w-[680px] lg:hidden">
            <MobileBrandMark />
          </div>
          <React.Suspense
            fallback={
              <div
                className="h-[min(520px,85vh)] w-[90%] max-w-[680px] animate-pulse rounded-[28px] bg-white"
                style={{ boxShadow: '0 8px 40px rgba(20, 33, 61, 0.06)' }}
              />
            }
          >
            <LoginFormCard className="w-[90%] max-w-[680px]" />
          </React.Suspense>
        </div>
      </section>
    </div>
  );
}
