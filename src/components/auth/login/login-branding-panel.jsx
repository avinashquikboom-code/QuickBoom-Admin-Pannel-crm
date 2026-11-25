'use client';

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { icons } from '@/theme/icons';
import { LoginDashboardPreview } from './login-dashboard-preview';

/** QB Suite Login Design System Tokens */
export const LOGIN_BRAND = {
  primary: '#123D32',
  darkGreen: '#073D30',
  secondaryGreen: '#176B50',
  accentGreen: '#22C55E',
  darkEmerald: '#073D30',
  bright: '#22C55E',
  light: '#E8F1EC',
  mint: '#F3F8F5',
  navy: '#142D25',
  muted: '#64748B',
  inputBorder: '#E2E8E5',
  error: '#DC2626',
};

const FEATURES = [
  { label: 'HRM & Team Management', desc: 'Attendance, payroll & staff', icon: icons.users },
  { label: 'Sales & CRM', desc: 'Leads, deals & pipelines', icon: icons.chart },
  { label: 'Operations & Projects', desc: 'Tasks, workflows & visits', icon: icons.layers },
  { label: 'Finance & Reports', desc: 'Invoices, billing & insights', icon: icons.database },
];

export function QbSuiteLogoMark({ size = 'md', variant = 'dark' }) {
  const box = size === 'sm' ? 'size-10 rounded-[12px]' : 'size-11 rounded-[13px]';
  const icon = size === 'sm' ? 'size-[18px]' : 'size-5';
  const isLight = variant === 'light';
  return (
    <div
      className={`flex shrink-0 items-center justify-center shadow-sm ${box}`}
      style={{
        background: isLight
          ? 'rgba(255, 255, 255, 0.14)'
          : `linear-gradient(135deg, ${LOGIN_BRAND.primary} 0%, ${LOGIN_BRAND.secondaryGreen} 100%)`,
        border: isLight ? '1px solid rgba(255, 255, 255, 0.22)' : 'none',
      }}
    >
      <FontAwesomeIcon icon={icons.layers} className={`${icon} text-white`} aria-hidden />
    </div>
  );
}

export function LoginBrandingPanel() {
  return (
    <section
      className="relative hidden min-h-0 flex-col justify-between overflow-hidden lg:flex lg:w-[45%] lg:shrink-0"
      style={{
        background: `linear-gradient(155deg, ${LOGIN_BRAND.darkGreen} 0%, ${LOGIN_BRAND.primary} 52%, ${LOGIN_BRAND.secondaryGreen} 100%)`,
      }}
      aria-label="QB Suite introduction"
    >
      {/* Subtle glowing radial accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: LOGIN_BRAND.accentGreen }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-60px] bottom-[22%] size-72 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: LOGIN_BRAND.accentGreen }}
      />

      {/* Subtle decorative curves */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
        viewBox="0 0 600 900"
        preserveAspectRatio="none"
      >
        <path
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          d="M-40,140 C140,80 340,220 640,110"
        />
        <path
          fill="none"
          stroke="#22C55E"
          strokeWidth="1.2"
          d="M-40,640 C160,570 380,710 640,590"
        />
        <circle cx="520" cy="120" r="140" fill="none" stroke="#FFFFFF" strokeWidth="1" />
      </svg>

      {/* Top & middle content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 pt-7 pb-3 xl:px-12 xl:pt-9">
        {/* Brand header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <QbSuiteLogoMark variant="light" />
            <div>
              <p className="text-lg font-bold leading-none tracking-tight text-white">
                QB Suite
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                Admin Panel
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-emerald-100 backdrop-blur-xs">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: LOGIN_BRAND.accentGreen }}
            />
            Business Operations Platform
          </span>
        </div>

        {/* Headline */}
        <div className="mt-7 max-w-md xl:mt-8">
          <h1 className="text-[1.85rem] font-bold leading-[1.18] tracking-tight text-white xl:text-[2.15rem]">
            One Platform to Run{' '}
            <span className="text-[#4ADE80]">Your Business.</span>
          </h1>
          <p className="mt-3 max-w-[26rem] text-[13.5px] leading-relaxed text-emerald-100/80 xl:text-sm">
            Unify workforce management, sales pipelines, daily operations, and financial reporting in one secure enterprise workspace.
          </p>
        </div>

        {/* 2-Column Feature Grid */}
        <div className="mt-6 grid max-w-lg grid-cols-2 gap-3 xl:mt-7">
          {FEATURES.map(({ label, desc, icon }) => (
            <div
              key={label}
              className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-xs transition hover:bg-white/[0.1]"
            >
              <div
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.16)' }}
              >
                <FontAwesomeIcon
                  icon={icon}
                  className="size-3.5"
                  style={{ color: LOGIN_BRAND.accentGreen }}
                  aria-hidden
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{label}</p>
                <p className="mt-0.5 truncate text-[11px] text-emerald-100/65">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Product Preview */}
      <div className="relative z-10 flex justify-center px-8 pt-2 pb-5 xl:px-12">
        <LoginDashboardPreview />
      </div>
    </section>
  );
}
