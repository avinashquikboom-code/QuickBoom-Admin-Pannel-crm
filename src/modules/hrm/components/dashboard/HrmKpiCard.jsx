'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';

export function HrmKpiCard({
  title,
  value,
  prefix = '',
  suffix = '',
  subtitle,
  icon: Icon,
  iconColor = 'text-[#163A2E]',
  iconBg = 'bg-emerald-50',
  accentBorder = 'from-emerald-500/80 to-[#163A2E]/80',
  progressPercent = null,
  progressColor = 'bg-emerald-500',
  loading = false,
  onClick,
}) {
  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[140px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="size-10 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-3 w-36 rounded-md" />
        </div>
      </div>
    );
  }

  const numVal = Number(value || 0);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:border-emerald-950/20 hover:shadow-md',
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      {/* Top subtle accent gradient stripe */}
      <div className={cn('absolute top-0 inset-x-0 h-1 bg-gradient-to-r opacity-90', accentBorder)} />

      {/* Header with Title and Pastel Icon badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</span>
        {Icon && (
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105',
              iconBg,
              iconColor
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>

      {/* Value and Subtitle */}
      <div className="mt-2 space-y-1">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          <AnimatedCounter
            value={numVal}
            prefix={prefix}
            suffix={suffix}
            showIndicator={false}
          />
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>
        )}

        {/* Optional Progress Bar */}
        {progressPercent !== null && (
          <div className="mt-2 pt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn('h-full rounded-full transition-all duration-500 ease-out', progressColor)}
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
