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
  iconColor = 'text-[#1AA14D]',
  badge,
  actions,
  breadcrumbs,
  className = '',
}: AdminPageHeaderProps) {
  const badgeClasses: Record<string, string> = {
    primary: 'bg-emerald-50 text-[#1AA14D] border-emerald-200',
    emerald: 'bg-emerald-50 text-[#1AA14D] border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const isBadgeString = typeof badge === 'string';
  const badgeText = isBadgeString ? badge : badge?.text;
  const selectedBadgeVariant = (!isBadgeString && badge?.variant) || 'emerald';
  const BadgeIcon = !isBadgeString ? badge?.icon : undefined;
  const showPulsingDot = isBadgeString ? true : badge?.pulsingDot !== false;

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3 ${className}`}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 flex-wrap"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-slate-300 font-normal">/</span>}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-slate-500 hover:text-[#1AA14D] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-[#1AA14D] font-bold' : ''}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20 flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Icon className={`w-5 h-5 ${iconColor || 'text-[#1AA14D]'}`} />
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight break-words">
              {title}
            </h1>
            {badgeText && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                  badgeClasses[selectedBadgeVariant] || badgeClasses.emerald
                }`}
              >
                {showPulsingDot && (
                  <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                )}
                {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                {badgeText}
              </span>
            )}
          </div>

          {description && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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

