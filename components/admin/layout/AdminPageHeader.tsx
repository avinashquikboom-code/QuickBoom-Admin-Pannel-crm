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
    primary: 'bg-emerald-500/20 text-[#23C45E] border-emerald-500/30',
    emerald: 'bg-emerald-500/20 text-[#23C45E] border-emerald-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-700/60 text-slate-200 border-slate-600',
  };

  const isBadgeString = typeof badge === 'string';
  const badgeText = isBadgeString ? badge : badge?.text;
  const selectedBadgeVariant = (!isBadgeString && badge?.variant) || 'emerald';
  const BadgeIcon = !isBadgeString ? badge?.icon : undefined;
  const showPulsingDot = isBadgeString ? true : badge?.pulsingDot !== false;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-700/60 shadow-xl ${className}`}
    >
      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider flex-wrap mb-1"
            >
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.label}>
                    {idx > 0 && <span className="text-slate-500 font-normal">/</span>}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? 'text-white font-bold' : 'text-slate-300'}>
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-white border border-white/15 flex items-center justify-center font-bold shadow-xs shrink-0">
                <Icon className={`w-5 h-5 ${iconColor && iconColor.includes('text-') ? iconColor : 'text-[#23C45E]'}`} />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
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
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed mt-1">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 z-10">
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

