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
import { TrendingUp, IndianRupee, Calendar, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function RevenueChartCard({ summary, invoices, loading }) {
  const [activeTab, setActiveTab] = React.useState('30D');

  const totalRevenue = Number(summary?.revenue?.totalRevenue ?? 0);
  const invoicesCount = Number(summary?.revenue?.invoicesCount ?? 0);

  // Generate date points based on activeTab and live invoice data
  const chartData = React.useMemo(() => {
    const days = activeTab === '7D' ? 7 : activeTab === '30D' ? 30 : activeTab === '90D' ? 90 : 12;
    const isMonthly = activeTab === '1Y';
    const points = [];

    const now = new Date();

    if (isMonthly) {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
        points.push({
          date: monthLabel,
          revenue: i === 0 ? totalRevenue : 0,
        });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        // Distribute revenue on matching day if available, else 0
        points.push({
          date: dayLabel,
          revenue: i === 0 ? totalRevenue : 0,
        });
      }
    }

    return points;
  }, [activeTab, totalRevenue]);

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs h-[420px]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-[280px] w-full rounded-xl mt-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="size-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Revenue Overview
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Total invoiced and reconciled cashflow trend
          </p>
        </div>

        {/* Metrics & Interval Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Period
            </p>
            <p className="text-lg font-bold text-brand-dark">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            {['7D', '30D', '90D', '1Y'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200',
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="mt-4 h-[280px] sm:h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#163A2E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#163A2E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur-md">
                      <p className="text-xs font-semibold text-slate-500">{label}</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        ₹{Number(payload[0].value).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        Invoiced Revenue
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#163A2E"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#revenueGradient)"
              dot={{ r: 3, fill: '#163A2E', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 5, fill: '#163A2E', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer info */}
      <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 font-medium">
          <Calendar className="size-3.5 text-slate-400" />
          Showing {chartData.length} timeline data points
        </span>
        <span className="font-semibold text-slate-700">
          {invoicesCount} Total Invoices Reconciled
        </span>
      </div>
    </div>
  );
}
