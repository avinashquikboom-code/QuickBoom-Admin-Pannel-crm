'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    icon?: LucideIcon;
    variant?: 'primary' | 'indigo' | 'purple' | 'amber';
  };
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  badge,
  actions,
  className = '',
}: AdminPageHeaderProps) {
  const badgeClasses = {
    primary: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  };

  const selectedBadgeVariant = badge?.variant || 'primary';
  const BadgeIcon = badge?.icon;

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-lg border border-emerald-800 ${className}`}
    >
      <div className="min-w-0 flex-1">
        {badge && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${badgeClasses[selectedBadgeVariant]}`}
            >
              {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
              {badge.text}
            </span>
          </div>
        )}

        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white truncate break-words">
          {title}
        </h1>

        {description && (
          <p className="text-xs md:text-sm text-slate-200 mt-1 font-medium leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">{actions}</div>
      )}
    </div>
  );
}
