'use client';

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { icons } from '@/theme/icons';

/** Minimal login brand tokens. */
export const LOGIN_BRAND = {
  primary: '#163A2E',
  darkGreen: '#204C3D',
  light: '#E8F1EC',
  mint: '#F3F8F5',
  navy: '#172B24',
  muted: '#718078',
  inputBorder: '#E2E8E5',
};

const FEATURES = [
  { label: 'HRM & Team Management', icon: icons.users },
  { label: 'Sales & CRM', icon: icons.chart },
  { label: 'Operations & Projects', icon: icons.layers },
  { label: 'Finance & Reports', icon: icons.database },
];

export function QbSuiteLogoMark({ size = 'md' }) {
  const box = size === 'sm' ? 'size-11 rounded-[14px]' : 'size-12 rounded-[14px]';
  const icon = size === 'sm' ? 'size-5' : 'size-[22px]';
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${box}`}
      style={{ backgroundColor: LOGIN_BRAND.primary }}
    >
      <FontAwesomeIcon icon={icons.layers} className={`${icon} text-white`} aria-hidden />
    </div>
  );
}

export function LoginBrandingPanel() {
  return (
    <section
      className="relative hidden min-h-0 flex-col overflow-hidden bg-white lg:flex lg:w-[43%] lg:shrink-0"
      aria-label="QB Suite introduction"
    >
      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-8 py-10 xl:px-14 xl:py-12">
        <div className="flex items-center gap-3">
          <QbSuiteLogoMark />
          <div>
            <p className="text-lg font-bold leading-none" style={{ color: LOGIN_BRAND.navy }}>
              QB Suite
            </p>
            <p
              className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: LOGIN_BRAND.muted }}
            >
              Admin Panel
            </p>
          </div>
        </div>

        <div className="mt-12 max-w-md xl:mt-14">
          <h1
            className="text-[1.875rem] font-bold leading-[1.25] tracking-tight xl:text-[2rem]"
            style={{ color: LOGIN_BRAND.navy }}
          >
            One Platform to
            <br />
            Run{' '}
            <span style={{ color: LOGIN_BRAND.primary }}>
              Your Business
              <span
                className="mt-2 block h-0.5 w-[min(100%,200px)] rounded-full"
                style={{ backgroundColor: LOGIN_BRAND.primary, opacity: 0.45 }}
              />
            </span>
          </h1>
          <p className="mt-5 max-w-[22rem] text-sm leading-relaxed xl:text-[15px]" style={{ color: LOGIN_BRAND.muted }}>
            Manage HRM, Sales, Operations, Finance and more with a powerful, unified admin panel.
          </p>
        </div>

        <div className="mt-10 grid max-w-lg grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:mt-12">
          {FEATURES.map(({ label, icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: LOGIN_BRAND.light }}
              >
                <FontAwesomeIcon icon={icon} className="size-[18px]" style={{ color: LOGIN_BRAND.darkGreen }} aria-hidden />
              </div>
              <span className="text-sm font-semibold" style={{ color: LOGIN_BRAND.navy }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle bottom waves — desktop only */}
      <svg
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 hidden w-full sm:block"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: '100px' }}
      >
        <path
          fill={LOGIN_BRAND.light}
          d="M0,80 C360,40 720,100 1080,55 C1260,35 1380,65 1440,50 L1440,120 L0,120 Z"
        />
        <path
          fill={LOGIN_BRAND.mint}
          fillOpacity="0.9"
          d="M0,95 C400,60 800,110 1200,70 C1320,55 1400,85 1440,75 L1440,120 L0,120 Z"
        />
      </svg>
    </section>
  );
}
