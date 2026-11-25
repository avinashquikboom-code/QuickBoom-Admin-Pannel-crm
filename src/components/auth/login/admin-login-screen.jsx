'use client';

import * as React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { icons } from '@/theme/icons';
import { LoginBrandingPanel, LOGIN_BRAND, QbSuiteLogoMark } from './login-branding-panel';
import { LoginFormCard } from './login-form-card';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

function MobileBrandMark() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <QbSuiteLogoMark size="sm" />
        <div>
          <p className="text-base font-bold leading-none" style={{ color: LOGIN_BRAND.navy }}>
            QB Suite
          </p>
          <p
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: LOGIN_BRAND.muted }}
          >
            Admin Panel
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8E5] bg-white px-2.5 py-1 text-[11px] font-medium text-[#123D32]">
        <span className="size-1.5 rounded-full bg-[#22C55E]" />
        Operations
      </span>
    </div>
  );
}

export function AdminLoginScreen() {
  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-white lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden">
      {/* Left 45% Branding Panel (Desktop) */}
      <LoginBrandingPanel />

      {/* Right 55% Login Form & Minimal Footer */}
      <section
        className="relative flex min-h-dvh min-w-0 flex-1 flex-col justify-between overflow-y-auto px-4 py-6 sm:px-8 lg:min-h-0 lg:w-[55%] lg:shrink-0 lg:px-10 lg:py-6"
        style={{ backgroundColor: LOGIN_BRAND.mint }}
      >
        {/* Top spacer / mobile compact brand */}
        <div className="mx-auto w-full max-w-[460px] lg:hidden">
          <MobileBrandMark />
        </div>
        <div className="hidden lg:block" />

        {/* Centered Login Card */}
        <div className="my-auto flex w-full items-center justify-center py-4">
          <React.Suspense
            fallback={
              <div
                className="h-[460px] w-full max-w-[460px] animate-pulse rounded-2xl border border-[#E2E8E5] bg-white"
                style={{ boxShadow: '0 12px 40px rgba(7, 61, 48, 0.08)' }}
              />
            }
          >
            <LoginFormCard />
          </React.Suspense>
        </div>

        {/* Minimal Footer */}
        <footer className="mx-auto flex w-full max-w-[540px] flex-col items-center justify-between gap-2 border-t border-[#E2E8E5]/80 pt-3 text-[11px] text-[#64748B] sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>© 2026 QB Suite. All rights reserved.</span>
            <span className="hidden sm:inline text-[#CBD5E1]">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-[#123D32]">
              <FontAwesomeIcon icon={icons.lock} className="size-2.5 text-[#22C55E]" aria-hidden />
              Secure Login
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/forgot-password" className="hover:text-[#123D32]">
              Help &amp; Support
            </Link>
            <a href="https://qbapp.online/privacy" target="_blank" rel="noreferrer" className="hover:text-[#123D32]">
              Privacy Policy
            </a>
            <a href="https://qbapp.online/terms" target="_blank" rel="noreferrer" className="hover:text-[#123D32]">
              Terms of Service
            </a>
            <span className="rounded bg-[#E8F1EC] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#123D32]">
              v{APP_VERSION}
            </span>
          </div>
        </footer>
      </section>
    </div>
  );
}
