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
import { TrendingUp, IndianRupee, FileCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

const formatINR = (val) => {
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}k`;
  return `₹${num.toLocaleString('en-IN')}`;
};

export function RevenueChartCard({ summary, invoices = [], dateFrom, dateTo, loading }) {
  const totalRevenue = Number(summary?.revenue?.totalRevenue ?? 0);
  const invoicesCount = Number(summary?.revenue?.invoicesCount ?? 0);
  const avgInvoiceValue = invoicesCount > 0 ? Math.round(totalRevenue / invoicesCount) : 0;

  // Build continuous date series for the selected or default date range
  const chartData = React.useMemo(() => {
    const list = Array.isArray(invoices) ? invoices : [];
    const revenueMap = new Map();

    list.forEach((inv) => {
      const isPaid = String(inv.status || '').toUpperCase() === 'PAID';
      const dateStr = inv.issueDate || inv.createdAt;
      if (!isPaid || !dateStr) return;
      const parsed = new Date(dateStr);
      if (Number.isNaN(parsed.getTime())) return;
      const key = parsed.toISOString().slice(0, 10);
      revenueMap.set(key, (revenueMap.get(key) || 0) + Number(inv.totalAmount || 0));
    });

    if (revenueMap.size === 0 && totalRevenue > 0) {
      const days = 7;
      const now = new Date();
      const points = [];
      const sliceRevenue = Math.round(totalRevenue / days);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 4);
        points.push({
          date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          revenue: sliceRevenue,
          invoices: Math.max(1, Math.round(invoicesCount / days)),
        });
      }
      return points;
    }

    if (revenueMap.size === 0) {
      const now = new Date();
      return Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (5 - i) * 5);
        return {
          date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          revenue: 0,
          invoices: 0,
        };
      });
    }

    return [...revenueMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, rev]) => ({
        date: new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
        revenue: rev,
        invoices: 1,
      }));
  }, [invoices, totalRevenue, invoicesCount]);

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[460px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 min-h-[56px]">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-b border-slate-100 pb-4">
          <Skeleton className="h-[74px] rounded-xl" />
          <Skeleton className="h-[74px] rounded-xl" />
          <Skeleton className="h-[74px] rounded-xl" />
        </div>
        <Skeleton className="h-[250px] w-full rounded-xl mt-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header (min-h-[56px] matching LeadsByStageCard) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 min-h-[56px]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#163A2E]">
              <TrendingUp className="size-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Revenue Overview
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Realized cashflow and invoice payments
            {dateFrom && dateTo ? ` (${dateFrom} to ${dateTo})` : ' (Current billing cycle)'}
          </p>
        </div>

        {/* Quick Period Aggregates */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-100/80 bg-emerald-50/40 px-3 py-1.5">
            <span className="text-[11px] font-medium text-slate-500">Total Period:</span>
            <span className="text-sm font-extrabold text-[#163A2E]">
              <AnimatedCounter value={totalRevenue} prefix="₹" />
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metrics Boxes (h-[74px] matching LeadsByStageCard) */}
      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
          <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <IndianRupee className="size-3 text-slate-400" /> Total Invoiced
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-slate-900">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
          <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <FileCheck className="size-3 text-slate-400" /> Paid Invoices
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-slate-900">
            <AnimatedCounter value={invoicesCount} />
          </p>
        </div>
        <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
          <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <TrendingUp className="size-3 text-slate-400" /> Avg Ticket Size
          </p>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-slate-900">
            ₹{avgInvoiceValue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="mt-4 flex-1 h-[270px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#163A2E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#163A2E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
              opacity={0.8}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickFormatter={formatINR}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const value = Number(payload[0]?.value || 0);
                return (
                  <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-xs p-3 shadow-lg">
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 text-base font-extrabold text-[#163A2E]">
                      ₹{value.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Verified Paid Revenue</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#163A2E"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#revenueGradient)"
              isAnimationActive={true}
              animationDuration={800}
              activeDot={{
                r: 6,
                fill: '#163A2E',
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
