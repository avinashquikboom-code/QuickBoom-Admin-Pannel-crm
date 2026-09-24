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
        variant?: 'primary' | 'indigo' | 'purple' | 'amber' | 'blue' | 'emerald';
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
  iconColor = 'text-[#25D366]',
  badge,
  actions,
  breadcrumbs,
  className = '',
}: AdminPageHeaderProps) {
  const badgeClasses = {
    primary: 'bg-emerald-50 text-[#1AA14D] border-emerald-200',
    emerald: 'bg-emerald-50 text-[#1AA14D] border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const isBadgeString = typeof badge === 'string';
  const badgeText = isBadgeString ? badge : badge?.text;
  const selectedBadgeVariant = (!isBadgeString && badge?.variant) || 'primary';
  const BadgeIcon = !isBadgeString ? badge?.icon : undefined;
  const showPulsingDot = isBadgeString ? true : badge?.pulsingDot !== false;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-slate-400 font-normal">/</span>}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-800 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-slate-800 font-bold' : ''}>
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
              <div className="shrink-0">
                <Icon className={`w-7 h-7 ${iconColor}`} />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight break-words">
              {title}
            </h1>
            {badgeText && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${badgeClasses[selectedBadgeVariant]}`}
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

