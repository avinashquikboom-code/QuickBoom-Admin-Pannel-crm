'use client';

import * as React from 'react';
import {
  Users,
  Target,
  Building2,
  IndianRupee,
  Handshake,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

export function KpiCards({ summary, leads, customers, deals, loading }) {
  const cards = [
    {
      id: 'employees',
      title: 'Total Employees',
      value: Number(summary?.workforce?.total ?? 0),
      note: `${summary?.workforce?.active ?? 0} active staff`,
      icon: Users,
      badge: 'Workforce',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      iconBg: 'bg-emerald-50 text-emerald-700',
      accentColor: 'from-emerald-700 to-emerald-900',
      borderHover: 'hover:border-emerald-300',
    },
    {
      id: 'leads',
      title: 'Active Leads',
      value: Number(leads?.total ?? 0),
      note: `${leads?.new ?? 0} new · ${leads?.converted ?? 0} won`,
      icon: Target,
      badge: 'CRM Pipeline',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200/80',
      iconBg: 'bg-blue-50 text-blue-700',
      accentColor: 'from-blue-600 to-blue-800',
      borderHover: 'hover:border-blue-300',
    },
    {
      id: 'customers',
      title: 'Total Customers',
      value: Number(customers?.totalCustomers ?? customers?.total ?? 0),
      note: `${customers?.activeCustomers ?? 0} active accounts`,
      icon: Building2,
      badge: 'Clients',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200/80',
      iconBg: 'bg-teal-50 text-teal-700',
      accentColor: 'from-teal-600 to-teal-800',
      borderHover: 'hover:border-teal-300',
    },
    {
      id: 'revenue',
      title: 'Revenue (₹)',
      value: Number(summary?.revenue?.totalRevenue ?? 0),
      currency: true,
      note: `${summary?.revenue?.invoicesCount ?? 0} invoices paid`,
      icon: IndianRupee,
      badge: 'Financials',
      badgeColor: 'bg-emerald-100/70 text-emerald-900 border-emerald-300/80',
      iconBg: 'bg-[#163A2E] text-white',
      accentColor: 'from-[#163A2E] to-[#0D231B]',
      borderHover: 'hover:border-[#163A2E]',
    },
    {
      id: 'deals',
      title: 'Open Deals',
      value: Number(deals?.open ?? 0),
      note: `Pipeline: ₹${Number(deals?.pipelineValue ?? 0).toLocaleString('en-IN')}`,
      icon: Handshake,
      badge: `${deals?.won ?? 0} won`,
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200/80',
      iconBg: 'bg-purple-50 text-purple-700',
      accentColor: 'from-purple-600 to-purple-800',
      borderHover: 'hover:border-purple-300',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex min-h-[144px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs"
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
      <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            style={{ animationDelay: `${idx * 50}ms` }}
            className={cn(
              'group relative flex min-w-0 min-h-[144px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 pt-5 sm:p-5 sm:pt-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md animate-in fade-in slide-in-from-bottom-2',
              card.borderHover
            )}
          >
            {/* Top forest-green accent gradient stripe */}
            <div
              className={cn(
                'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90 transition-opacity group-hover:opacity-100',
                card.accentColor
              )}
            />

            <div>
              <div className="flex min-w-0 items-start justify-between gap-2.5">
                <p className="min-w-0 flex-1 break-words text-[11px] font-bold uppercase leading-snug tracking-wider text-slate-500">
                  {card.title}
                </p>
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-xl shadow-2xs transition-transform duration-300 group-hover:scale-105',
                    card.iconBg
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
              </div>

              <div className="mt-2.5">
                <p className="break-words text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[26px]">
                  <AnimatedCounter
                    value={card.value}
                    prefix={card.currency ? '₹' : ''}
                    showIndicator={true}
                  />
                </p>
              </div>
            </div>

            <div className="mt-3 flex min-w-0 flex-wrap items-start justify-between gap-2 border-t border-slate-100 pt-2.5">
              <p className="min-w-0 flex-1 break-words text-xs font-medium leading-relaxed text-slate-500" title={card.note}>
                {card.note}
              </p>
              <span
                className={cn(
                  'max-w-full break-words rounded-full border px-2 py-0.5 text-[10px] font-bold leading-snug tracking-wide',
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
