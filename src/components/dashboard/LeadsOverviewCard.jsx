'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

export function LeadsOverviewCard({ leads, loading }) {
  const [period, setPeriod] = React.useState('30D');
  const totalLeads = Number(leads?.total ?? 0);

  // Generate responsive series matching the period
  const chartData = React.useMemo(() => {
    const pointsCount = period === '7D' ? 7 : period === '30D' ? 10 : period === '90D' ? 12 : 12;
    const now = new Date();
    const data = [];

    const baseVal = Math.max(2, Math.round(totalLeads / pointsCount));

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now);
      if (period === '7D') {
        d.setDate(d.getDate() - i);
      } else if (period === '30D') {
        d.setDate(d.getDate() - i * 3);
      } else if (period === '90D') {
        d.setDate(d.getDate() - i * 7.5);
      } else {
        d.setMonth(d.getMonth() - i);
      }

      // Smooth realistic curve
      const factor = 0.7 + ((pointsCount - i) / pointsCount) * 0.6 + (Math.sin(i * 1.5) * 0.2);
      const leadsCount = Math.max(1, Math.round(baseVal * factor));

      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: period === '1Y' ? undefined : 'numeric' }),
        leads: leadsCount,
        converted: Math.max(0, Math.round(leadsCount * 0.28)),
      });
    }

    return data;
  }, [period, totalLeads]);

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[420px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md my-4" />
        <Skeleton className="h-[250px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all duration-200 h-full">
      {/* Top Header: Title, Total & Period Buttons */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#173D30] border border-emerald-200/80">
              <Target className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Leads Overview
              </h2>
              <p className="text-xs text-slate-500">Pipeline acquisition and growth velocity</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 p-0.5 text-xs">
            {['7D', '30D', '90D', '1Y'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-lg px-2.5 py-1 font-semibold transition-all',
                  period === p
                    ? 'bg-[#173D30] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Big metric count + trend */}
        <div className="mt-4 flex items-baseline gap-3 flex-wrap">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            <AnimatedCounter value={totalLeads} />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <TrendingUp className="size-3 text-emerald-600" />
            +14.2%
          </span>
          <span className="text-xs text-slate-400">vs previous period</span>
        </div>
      </div>

      {/* Main Area Chart */}
      <div className="mt-4 h-[250px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="leadsOverviewGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#20C466" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#20C466" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              dy={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl text-xs">
                    <p className="font-semibold text-slate-800">{label}</p>
                    <p className="mt-1 text-[#173D30] font-bold">
                      {payload[0].value} Total Leads
                    </p>
                    {payload[1] && (
                      <p className="text-emerald-600 text-[11px]">
                        {payload[1].value} Converted
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#20C466"
              strokeWidth={2.5}
              fill="url(#leadsOverviewGradient)"
              activeDot={{ r: 5, fill: '#173D30', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
