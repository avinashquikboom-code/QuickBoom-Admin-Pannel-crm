'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

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
  className = '',
}: AdminPageHeroProps) {
  const badgeClasses = {
    primary: 'bg-emerald-500/20 text-[#23C45E] border-emerald-500/30',
    emerald: 'bg-emerald-500/20 text-[#23C45E] border-emerald-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  const isBadgeString = typeof badge === 'string';
  const badgeText = isBadgeString ? badge : badge?.text;
  const selectedBadgeVariant = (!isBadgeString && badge?.variant) || 'primary';
  const BadgeIcon = !isBadgeString ? badge?.icon : undefined;
  const showPulsingDot = isBadgeString ? true : badge?.pulsingDot !== false;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl ${className}`}
    >
      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1 min-w-0">
          {badgeText && (
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${badgeClasses[selectedBadgeVariant]}`}
              >
                {showPulsingDot && (
                  <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                )}
                {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                {badgeText}
              </span>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
            {title}
          </h1>

          {description && (
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
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

// Alias for backward compatibility
export const AdminPageHeader = AdminPageHero;
export type AdminPageHeaderProps = AdminPageHeroProps;

