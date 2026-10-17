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
  const badgeClasses: Record<string, string> = {
    primary: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const isBadgeString = typeof badge === 'string';
  const badgeText = isBadgeString ? badge : badge?.text;
  const selectedBadgeVariant = (!isBadgeString && badge?.variant) || 'emerald';
  const BadgeIcon = !isBadgeString ? badge?.icon : undefined;
  const showPulsingDot = isBadgeString ? true : badge?.pulsingDot !== false;

  return (
    <div
      className={`bg-white text-slate-900 px-4 py-3.5 sm:px-5 sm:py-4.5 rounded-2xl border border-slate-200/80 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Section: Icon + Title/Badge + Description */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shadow-2xs shrink-0">
              <Icon
                className={`w-5 h-5 ${
                  iconColor && iconColor.includes('text-') ? iconColor : 'text-[#23C45E]'
                }`}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-wrap mb-1"
              >
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.label}>
                      {idx > 0 && <span className="text-slate-300 font-normal">/</span>}
                      {crumb.href && !isLast ? (
                        <Link
                          href={crumb.href}
                          className="text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isLast ? 'text-slate-700 font-bold' : 'text-slate-400'}>
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${
                    badgeClasses[selectedBadgeVariant] || badgeClasses.emerald
                  }`}
                >
                  {showPulsingDot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                  {badgeText}
                </span>
              )}
            </div>

            {description && (
              <p className="text-[13px] sm:text-sm text-slate-500 font-normal leading-relaxed mt-1 max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:self-center">
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

