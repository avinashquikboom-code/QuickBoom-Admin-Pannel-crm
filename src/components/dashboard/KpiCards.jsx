'use client';

import * as React from 'react';
import {
  Target,
  Trophy,
  IndianRupee,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

const DUMMY_TREND = [
  { val: 12 },
  { val: 18 },
  { val: 15 },
  { val: 24 },
  { val: 22 },
  { val: 32 },
  { val: 38 },
];

export function KpiCards({ summary, leads, loading }) {
  const totalLeads = Number(leads?.total ?? 0);
  const convertedLeads = Number(leads?.converted ?? 0);
  const totalRevenue = Number(summary?.revenue?.totalRevenue ?? 0);
  const activeStaff = Number(summary?.workforce?.active ?? summary?.workforce?.total ?? 0);

  const cards = [
    {
      id: 'total-leads',
      title: 'Total Leads',
      value: totalLeads,
      currency: false,
      change: '+12.5%',
      isPositive: true,
      period: 'vs last month',
      icon: Target,
      iconBg: 'bg-emerald-50 text-[#173D30] border-emerald-200/80',
      sparklineColor: '#20C466',
    },
    {
      id: 'converted-leads',
      title: 'Converted',
      value: convertedLeads,
      currency: false,
      change: '+8.2%',
      isPositive: true,
      period: 'vs last month',
      icon: Trophy,
      iconBg: 'bg-teal-50 text-teal-800 border-teal-200/80',
      sparklineColor: '#0EA5E9',
    },
    {
      id: 'revenue',
      title: 'Revenue',
      value: totalRevenue,
      currency: true,
      change: '+15.3%',
      isPositive: true,
      period: 'vs last month',
      icon: IndianRupee,
      iconBg: 'bg-[#173D30] text-white border-emerald-900',
      sparklineColor: '#10B981',
    },
    {
      id: 'active-employees',
      title: 'Active Employees',
      value: activeStaff,
      currency: false,
      change: '+4.1%',
      isPositive: true,
      period: 'on duty today',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-800 border-blue-200/80',
      sparklineColor: '#3B82F6',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs min-h-[148px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md mt-3" />
            <div className="flex items-center justify-between mt-3">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 min-h-[148px]"
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <div className="mt-1.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                  <AnimatedCounter
                    value={card.value}
                    prefix={card.currency ? '₹' : ''}
                  />
                </div>
              </div>
              <span
                className={cn(
                  'flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs transition-transform group-hover:scale-105',
                  card.iconBg
                )}
              >
                <Icon className="size-4 sm:size-5" />
              </span>
            </div>

            {/* Bottom row: Trend badge & Mini Sparkline chart */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100/90 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tracking-wide',
                    card.isPositive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                  )}
                >
                  {card.isPositive ? (
                    <TrendingUp className="size-3 text-emerald-600" />
                  ) : (
                    <TrendingDown className="size-3 text-rose-600" />
                  )}
                  {card.change}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {card.period}
                </span>
              </div>

              {/* Sparkline chart */}
              <div className="h-8 w-20 sm:w-22 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DUMMY_TREND}>
                    <defs>
                      <linearGradient id={`spark-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.sparklineColor} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={card.sparklineColor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke={card.sparklineColor}
                      strokeWidth={1.8}
                      fill={`url(#spark-${card.id})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
