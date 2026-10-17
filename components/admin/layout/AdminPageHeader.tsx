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
  badge,
  actions,
  breadcrumbs,
  className = '',
}: AdminPageHeaderProps) {
  const isBadgeString = typeof badge === 'string';
  const badgeText = isBadgeString ? badge : badge?.text;
  const BadgeIcon = !isBadgeString ? badge?.icon : undefined;
  const showPulsingDot = isBadgeString ? true : badge?.pulsingDot !== false;

  return (
    <div
      className={`admin-page-header bg-brand text-slate-900 px-4 py-3.5 sm:px-5 sm:py-4.5 rounded-2xl border border-brand-700/30 shadow-xs ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section: Icon + Title/Badge + Description */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-white/90 text-brand-900 border border-brand-900/20 flex items-center justify-center shadow-2xs shrink-0">
              <Icon className="w-5 h-5 text-brand-900" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-900 uppercase tracking-wider flex-wrap mb-1"
              >
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.label}>
                      {idx > 0 && <span className="text-slate-900 font-normal">/</span>}
                      {crumb.href && !isLast ? (
                        <Link
                          href={crumb.href}
                          className="text-slate-900 hover:underline transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isLast ? 'text-slate-900 font-bold' : 'text-slate-900'}>
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-[22px] md:text-[24px] font-bold text-slate-900 tracking-tight leading-tight break-words">
                {title}
              </h1>
              {badgeText && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs bg-white/90 text-brand-900 border-brand-900/20"
                >
                  {showPulsingDot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-900 animate-pulse" />
                  )}
                  {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                  {badgeText}
                </span>
              )}
            </div>

            {description && (
              <p className="text-[13px] sm:text-sm text-slate-900 font-normal leading-relaxed mt-1 max-w-3xl">
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

