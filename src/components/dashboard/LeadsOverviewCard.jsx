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
  const totalLeads = Number(leads?.total ?? 0);
  const chartData = (leads?.series || []).map((point) => ({ date: point.date, leads: Number(point.leads || 0) }));

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


        </div>

        {/* Big metric count + trend */}
        <div className="mt-4 flex items-baseline gap-3 flex-wrap">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            <AnimatedCounter value={totalLeads} />
          </div>

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
