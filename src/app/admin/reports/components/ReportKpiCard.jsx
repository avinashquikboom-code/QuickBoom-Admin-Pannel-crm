'use client';

import * as React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ReportKpiCard({
  title,
  value,
  badge,
  icon: Icon,
  subtitle,
  sparkColor = '#20C466',
  loading = false,
  className,
}) {
  const sparkData = React.useMemo(() => {
    const num = Number(String(value).replace(/[^0-9.-]+/g, '')) || 24;
    return [
      { val: Math.max(3, Math.round(num * 0.4)) },
      { val: Math.max(4, Math.round(num * 0.65)) },
      { val: Math.max(3, Math.round(num * 0.5)) },
      { val: Math.max(6, Math.round(num * 0.85)) },
      { val: Math.max(5, Math.round(num * 0.7)) },
      { val: Math.max(7, Math.round(num * 0.95)) },
      { val: Math.max(6, num) },
    ];
  }, [value]);

  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 min-h-[148px]',
        className
      )}
    >
      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {title}
              </p>
              <p className="mt-1.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                {value}
              </p>
            </div>
            {Icon && (
              <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-[#EAF7EF] text-[#173D30] shadow-2xs">
                <Icon className="size-4 sm:size-5" />
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
            {badge && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <TrendingUp className="size-2.5" />
                {badge}
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] text-slate-400 font-medium truncate">
                {subtitle}
              </span>
            )}

            <div className="h-7 w-16 shrink-0 ml-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient id={`spark-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={sparkColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke={sparkColor}
                    strokeWidth={1.8}
                    fill={`url(#spark-${title.replace(/\s+/g, '')})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
