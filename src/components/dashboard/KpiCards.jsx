'use client';

import * as React from 'react';
import {
  Users,
  Target,
  Building2,
  IndianRupee,
  Handshake,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function KpiCards({ summary, leads, customers, deals, loading }) {
  const cards = [
    {
      id: 'employees',
      title: 'Total Employees',
      value: summary?.workforce?.total ?? 0,
      note: `${summary?.workforce?.active ?? 0} active staff`,
      icon: Users,
      badge: 'Workforce',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      iconBg: 'bg-emerald-50 text-emerald-600',
      accentColor: 'from-emerald-500/10 to-transparent',
    },
    {
      id: 'leads',
      title: 'Active Leads',
      value: leads?.total ?? 0,
      note: `${leads?.new ?? 0} new · ${leads?.converted ?? 0} won`,
      icon: Target,
      badge: 'CRM Pipeline',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
      iconBg: 'bg-blue-50 text-blue-600',
      accentColor: 'from-blue-500/10 to-transparent',
    },
    {
      id: 'customers',
      title: 'Total Customers',
      value: customers?.totalCustomers ?? 0,
      note: `${customers?.activeCustomers ?? 0} active accounts`,
      icon: Building2,
      badge: 'Clients',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/60',
      iconBg: 'bg-teal-50 text-teal-600',
      accentColor: 'from-teal-500/10 to-transparent',
    },
    {
      id: 'revenue',
      title: 'Revenue (₹)',
      value: Number(summary?.revenue?.totalRevenue ?? 0),
      currency: true,
      note: `${summary?.revenue?.invoicesCount ?? 0} invoices paid`,
      icon: IndianRupee,
      badge: 'Financials',
      badgeColor: 'bg-brand-light text-brand-dark border-brand/20',
      iconBg: 'bg-brand text-white',
      accentColor: 'from-brand/15 to-transparent',
    },
    {
      id: 'deals',
      title: 'Open Deals',
      value: deals?.open ?? 0,
      note: `Pipeline: ₹${Number(deals?.pipelineValue ?? 0).toLocaleString('en-IN')}`,
      icon: Handshake,
      badge: `${deals?.won ?? 0} won`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/60',
      iconBg: 'bg-purple-50 text-purple-600',
      accentColor: 'from-purple-500/10 to-transparent',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs h-36"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md mt-2" />
            <Skeleton className="h-3.5 w-36 rounded-md mt-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            style={{ animationDelay: `${idx * 60}ms` }}
            className={cn(
              'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-2'
            )}
          >
            {/* Top subtle gradient highlight */}
            <div
              className={cn(
                'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
                card.accentColor
              )}
            />

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 shadow-2xs',
                    card.iconBg
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
              </div>

              <div className="mt-2.5">
                <AnimatedMetric value={card.value} currency={card.currency} />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <p className="truncate text-xs font-medium text-slate-500">
                {card.note}
              </p>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide',
                  card.badgeColor
                )}
              >
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnimatedMetric({ value, currency }) {
  const [displayValue, setDisplayValue] = React.useState(Number(value) || 0);
  const [direction, setDirection] = React.useState(0);
  const previous = React.useRef(Number(value) || 0);
  React.useEffect(() => {
    const next = Number(value) || 0;
    const start = previous.current;
    if (next === start) return;
    setDirection(next > start ? 1 : -1);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplayValue(next);
      previous.current = next;
      return;
    }
    let frame;
    const began = performance.now();
    const duration = 650;
    const tick = (now) => {
      const progress = Math.min(1, (now - began) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (next - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previous.current = next;
    };
    frame = requestAnimationFrame(tick);
    const reset = setTimeout(() => setDirection(0), 1400);
    return () => { cancelAnimationFrame(frame); clearTimeout(reset); };
  }, [value]);
  const formatted = Math.round(displayValue).toLocaleString('en-IN');
  return <p className={`truncate text-2xl sm:text-[26px] font-extrabold tracking-tight transition-colors duration-500 ${direction > 0 ? 'text-emerald-700' : direction < 0 ? 'text-rose-700' : 'text-slate-900'}`} aria-label={currency ? `₹${formatted}` : formatted}>
    {currency ? '₹' : ''}{formatted}{direction !== 0 && <span className="ml-1 inline-flex align-middle" aria-label={direction > 0 ? 'Increased' : 'Decreased'}>{direction > 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}</span>}
  </p>;
}
