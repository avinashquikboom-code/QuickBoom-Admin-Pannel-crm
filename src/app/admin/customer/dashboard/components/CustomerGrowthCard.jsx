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
import { TrendingUp, Users, Calendar, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Count-up hook respecting prefers-reduced-motion
function useCountUp(target, duration = 800) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setCount(Number(target) || 0);
      return;
    }

    const numTarget = Number(target) || 0;
    if (numTarget === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();
    let animId;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easedProgress * numTarget);
      setCount(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(numTarget);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return count;
}

// Custom Tooltip
function CustomGrowthTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  const count = data?.count ?? 0;
  const cumulative = data?.cumulative ?? count;

  return (
    <div className="rounded-xl border border-emerald-100 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-1.5">
        <span className="flex size-2 rounded-full bg-[#16A34A]" />
        <span className="text-xs font-bold text-slate-800">{data?.label || label}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-slate-500 font-medium">New Customers:</span>
          <span className="font-extrabold text-[#16A34A]">{count.toLocaleString('en-IN')}</span>
        </div>
        {cumulative > count && (
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-500 font-medium">Cumulative Total:</span>
            <span className="font-bold text-slate-700">{cumulative.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomerGrowthCard({
  monthlyGrowth = [],
  totalCustomers = 0,
  newCustomers = 0,
  loading = false,
}) {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handler = (e) => setReducedMotion(e.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, []);

  // Format chart series
  const chartData = React.useMemo(() => {
    if (Array.isArray(monthlyGrowth) && monthlyGrowth.length > 0) {
      return monthlyGrowth.map((item) => ({
        month: item.month,
        label: item.label || item.month,
        shortLabel: item.shortLabel || (item.label ? item.label.slice(0, 3) : item.month),
        count: Number(item.count || 0),
        cumulative: Number(item.cumulative || item.count || 0),
      }));
    }

    // Default 12-month calendar series
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    return months.map((m) => ({
      month: `${currentYear}-${m}`,
      label: `${m} ${currentYear}`,
      shortLabel: m,
      count: 0,
      cumulative: 0,
    }));
  }, [monthlyGrowth]);

  // Aggregate stats for metric pills
  const totalInPeriod = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr.count || 0), 0);
  }, [chartData]);

  const peakMonth = React.useMemo(() => {
    if (!chartData.length) return { label: '—', count: 0 };
    return chartData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), chartData[0]);
  }, [chartData]);

  const animatedTotalAcquired = useCountUp(totalInPeriod || totalCustomers, 800);
  const animatedNew = useCountUp(newCustomers, 800);

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[420px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 min-h-[56px]">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3 border-b border-slate-100 pb-4">
          <Skeleton className="h-[74px] rounded-xl" />
          <Skeleton className="h-[74px] rounded-xl" />
          <Skeleton className="h-[74px] rounded-xl" />
        </div>
        <div className="flex-1 mt-4 flex items-center justify-center">
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const hasAnyData = totalInPeriod > 0 || totalCustomers > 0;

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300',
        'hover:border-emerald-200 hover:shadow-md h-full min-h-[420px]'
      )}
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 min-h-[56px] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-100 shrink-0">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Customer Growth</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Monthly account registrations and growth trajectory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[11px] font-bold text-[#16A34A] shrink-0">
          <Sparkles className="size-3" />
          <span>Growth Trend</span>
        </div>
      </div>

      {/* 2. Top Metric Summary Bar (3 pills matching standard dashboard geometry) */}
      <div className="mt-3.5 grid grid-cols-3 gap-2.5 sm:gap-3 border-b border-slate-100 pb-3.5">
        {/* Acquired in Period */}
        <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-2.5 flex flex-col justify-between min-h-[68px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Users className="size-3 text-slate-400" />
            <span>In Period</span>
          </p>
          <p className="text-base sm:text-lg font-bold text-slate-900">
            {animatedTotalAcquired.toLocaleString('en-IN')}
          </p>
        </div>

        {/* New (30d) */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 flex flex-col justify-between min-h-[68px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#16A34A] flex items-center gap-1">
            <Sparkles className="size-3 text-[#16A34A]" />
            <span>New (30d)</span>
          </p>
          <p className="text-base sm:text-lg font-bold text-emerald-950">
            {animatedNew.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Peak Month */}
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-2.5 flex flex-col justify-between min-h-[68px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-800 flex items-center gap-1">
            <Calendar className="size-3 text-teal-600" />
            <span>Peak Month</span>
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-bold text-teal-950 truncate max-w-[70px] sm:max-w-none">
              {peakMonth.shortLabel || '—'}
            </span>
            {peakMonth.count > 0 && (
              <span className="text-[11px] font-semibold text-teal-700">({peakMonth.count})</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Area Chart Container */}
      <div className="relative mt-3 flex-1 min-h-[220px] w-full flex items-center justify-center">
        {!hasAnyData ? (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#16A34A] border border-emerald-100">
              <Users className="size-6" />
            </div>
            <p className="text-xs font-semibold text-slate-800">No Customer Growth Data</p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              No new accounts registered during the selected date range.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart
              data={chartData}
              margin={{ top: 14, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="customerGrowthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fontSize: 11, fill: '#64748B' }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <Tooltip content={<CustomGrowthTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="New Customers"
                stroke="#16A34A"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#customerGrowthFill)"
                isAnimationActive={!reducedMotion}
                animationDuration={1000}
                animationEasing="ease-out"
                dot={{
                  r: 3.5,
                  fill: '#16A34A',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: '#16A34A',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  className: 'drop-shadow-sm',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 4. Footer Note */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>X-Axis: Timeline</span>
        <span>Y-Axis: Registrations</span>
      </div>
    </div>
  );
}
