'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  iconColor?: string;
  badge?:
    | string
    | {
        text: string;
        icon?: LucideIcon;
        variant?: 'primary' | 'indigo' | 'purple' | 'amber' | 'blue' | 'emerald' | 'rose' | 'slate';
        pulsingDot?: boolean;
      };
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-[#23C45E]',
  badge,
  actions,
  breadcrumbs,
  className = '',
}: AdminPageHeaderProps) {
  const isBadgeString = typeof badge === 'string';
  const badgeText = isBadgeString ? badge : badge?.text;
  const BadgeIcon = !isBadgeString ? badge?.icon : undefined;
  const showPulsingDot = isBadgeString ? true : badge?.pulsingDot !== false;
  const selectedBadgeVariant = !isBadgeString ? badge?.variant || 'emerald' : 'emerald';

  const badgeClasses: Record<string, string> = {
    primary: 'bg-emerald-500/15 text-[#23C45E] border-emerald-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700',
  };

  return (
    <div
      className={`admin-page-header bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-3.5 sm:px-5 sm:py-4.5 rounded-2xl border border-slate-700/60 shadow-md shadow-slate-900/10 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section: Icon + Title/Badge + Description */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-white/10 text-[#23C45E] border border-white/15 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Icon className={`w-5 h-5 shrink-0 ${iconColor && iconColor.includes('text-') ? iconColor : 'text-[#23C45E]'}`} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400/90 uppercase tracking-wider flex-wrap mb-1"
              >
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.label}>
                      {idx > 0 && <span className="text-slate-500 font-normal">/</span>}
                      {crumb.href && !isLast ? (
                        <Link
                          href={crumb.href}
                          className="text-emerald-400/90 hover:text-emerald-300 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isLast ? 'text-white/90 font-bold' : 'text-slate-400'}>
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-[22px] md:text-[24px] font-bold text-white tracking-tight leading-tight break-words">
                {title}
              </h1>
              {badgeText && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${
                    badgeClasses[selectedBadgeVariant] || badgeClasses.emerald
                  }`}
                >
                  {showPulsingDot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                  {badgeText}
                </span>
              )}
            </div>

            {description && (
              <p className="text-[13px] sm:text-sm text-white/70 font-normal leading-relaxed mt-1 max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 max-w-full lg:self-center [&>div]:max-w-full [&>div]:flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export interface AdminPageHeroProps {
  title: string;
  description?: string;
  badge?:
    | string
    | {
        text: string;
        icon?: LucideIcon;
        variant?: 'primary' | 'indigo' | 'purple' | 'amber' | 'blue' | 'emerald';
        pulsingDot?: boolean;
      };
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function AdminPageHero({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className = '',
}: AdminPageHeroProps) {
  return (
    <AdminPageHeader
      title={title}
      description={description}
      badge={badge}
      actions={actions}
      breadcrumbs={breadcrumbs}
      className={className}
    />
  );
}

// Aliases for standard Admin Panel Page Header
export const PageHeader = AdminPageHeader;
export type PageHeaderProps = AdminPageHeaderProps;

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = 'full',
  className = '',
}: PageContainerProps) {
  const maxWMap = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`space-y-6 ${maxWMap[maxWidth]} mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

