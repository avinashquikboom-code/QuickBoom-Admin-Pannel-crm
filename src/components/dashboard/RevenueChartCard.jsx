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
import { TrendingUp, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function RevenueChartCard({ summary, invoices, loading }) {
  const totalRevenue = Number(summary?.revenue?.totalRevenue ?? 0);
  const invoicesCount = Number(summary?.revenue?.invoicesCount ?? 0);

  const chartData = React.useMemo(() => {
    const byDay = new Map();
    (Array.isArray(invoices) ? invoices : []).forEach((invoice) => {
      if (String(invoice.status || '').toUpperCase() !== 'PAID' || !invoice.issueDate) return;
      const day = new Date(invoice.issueDate);
      if (Number.isNaN(day.getTime())) return;
      const key = day.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + Number(invoice.totalAmount || 0));
    });
    return [...byDay.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, revenue]) => ({
      date: new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue,
    }));
  }, [invoices]);

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
            Paid invoice amounts by issue date from the latest 10 invoice records
          </p>
        </div>

        {/* Period summary */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Period
            </p>
            <p className="text-lg font-bold text-brand-dark">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
          </div>

        </div>
      </div>

      {/* Main Chart Area */}
      <div className="mt-4 h-[280px] sm:h-[300px] w-full min-w-0">
        {chartData.length ? <ResponsiveContainer width="100%" height="100%">
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
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-sm text-slate-500">No paid invoice records are available in the latest 10 invoices.</div>}
      </div>

      {/* Footer info */}
      <div className="mt-3 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 font-medium">
          <Calendar className="size-3.5 text-slate-400" />
          {chartData.length} paid invoice dates in the latest 10 invoices
        </span>
        <span className="font-semibold text-slate-700">
          {invoicesCount} Total Invoices Reconciled
        </span>
      </div>
    </div>
  );
}
