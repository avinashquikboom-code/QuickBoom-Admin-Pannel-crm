'use client';

import * as React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PieChart as PieIcon, ShieldCheck, UserCheck, UserX, UserPlus } from 'lucide-react';
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

// Custom Donut Tooltip
function CustomStatusTooltip({ active, payload, total }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload;
  if (!item || item.isEmpty) return null;

  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-xs font-bold text-slate-800">{item.name}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="text-slate-500 font-medium">Count:</span>
        <span className="font-extrabold text-slate-900">
          {item.value.toLocaleString('en-IN')} ({pct}%)
        </span>
      </div>
    </div>
  );
}

export function CustomerStatusCard({
  customers = {},
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

  const total = Number(customers.totalCustomers ?? 0);
  const activeCount = Number(customers.activeCustomers ?? 0);
  const inactiveCount = Number(customers.inactiveCustomers ?? 0);
  const newCount = Number(customers.newCustomers ?? 0);

  // Derive donut segments:
  // If activeCount contains newCount, segment them cleanly:
  // - Established Active: max(0, activeCount - newCount)
  // - New Accounts (Last 30d): newCount
  // - Inactive Accounts: inactiveCount
  const chartSegments = React.useMemo(() => {
    if (total === 0) {
      return [{ name: 'No Customers', value: 1, color: '#E2E8F0', isEmpty: true }];
    }

    const segments = [];

    // Active
    const establishedActive = Math.max(0, activeCount - newCount);
    if (establishedActive > 0) {
      segments.push({
        key: 'active',
        name: 'Active',
        value: establishedActive,
        displayCount: activeCount,
        color: '#16A34A',
      });
    }

    // New (last 30d)
    if (newCount > 0) {
      segments.push({
        key: 'new',
        name: 'New (30d)',
        value: newCount,
        displayCount: newCount,
        color: '#3B82F6',
      });
    }

    // If activeCount didn't produce a slice (e.g. activeCount === 0 but inactive > 0):
    if (activeCount > 0 && establishedActive === 0 && newCount === 0) {
      segments.push({
        key: 'active',
        name: 'Active',
        value: activeCount,
        displayCount: activeCount,
        color: '#16A34A',
      });
    }

    // Inactive
    if (inactiveCount > 0) {
      segments.push({
        key: 'inactive',
        name: 'Inactive',
        value: inactiveCount,
        displayCount: inactiveCount,
        color: '#94A3B8',
      });
    }

    return segments.length > 0
      ? segments
      : [{ name: 'No Customers', value: 1, color: '#E2E8F0', isEmpty: true }];
  }, [total, activeCount, inactiveCount, newCount]);

  const animatedTotal = useCountUp(total, 800);
  const animatedActive = useCountUp(activeCount, 800);
  const animatedInactive = useCountUp(inactiveCount, 800);
  const animatedNew = useCountUp(newCount, 800);

  // Status breakdown items for the symmetrical legend
  const legendItems = [
    {
      label: 'Active',
      count: animatedActive,
      percentage: total > 0 ? ((activeCount / total) * 100).toFixed(1) : '0.0',
      color: '#16A34A',
      bgTone: 'bg-emerald-50 border-emerald-100 text-emerald-800',
      icon: UserCheck,
    },
    {
      label: 'Inactive',
      count: animatedInactive,
      percentage: total > 0 ? ((inactiveCount / total) * 100).toFixed(1) : '0.0',
      color: '#94A3B8',
      bgTone: 'bg-slate-50 border-slate-200 text-slate-700',
      icon: UserX,
    },
    {
      label: 'New (30d)',
      count: animatedNew,
      percentage: total > 0 ? ((newCount / total) * 100).toFixed(1) : '0.0',
      color: '#3B82F6',
      bgTone: 'bg-blue-50 border-blue-100 text-blue-800',
      icon: UserPlus,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[420px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 min-h-[56px]">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex-1 my-4 flex items-center justify-center">
          <Skeleton className="size-44 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
    );
  }

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
            <PieIcon className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Customers by Status</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live account status and lifecycle breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 shrink-0">
          <ShieldCheck className="size-3 text-[#16A34A]" />
          <span>{animatedTotal.toLocaleString('en-IN')} Total</span>
        </div>
      </div>

      {/* 2. Donut Chart with Center Total Counter */}
      <div className="relative mt-2 flex-1 min-h-[220px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              data={chartSegments}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={total > 0 ? 3 : 0}
              dataKey="value"
              isAnimationActive={!reducedMotion}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {chartSegments.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-all duration-300 hover:opacity-85 focus:outline-none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomStatusTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total
          </span>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#173D30]">
            {animatedTotal.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            Accounts
          </span>
        </div>
      </div>

      {/* 3. Symmetrical Legend with Color Dots, Labels, Counts, and Percentages */}
      <div className="mt-2 pt-3 border-t border-slate-100">
        <div className="grid grid-cols-3 gap-2">
          {legendItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                'flex flex-col justify-between rounded-xl border p-2 sm:p-2.5 transition-colors',
                item.bgTone
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-semibold truncate">
                  {item.label}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-1">
                <span className="text-xs sm:text-sm font-bold">
                  {item.count.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-medium opacity-75">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
