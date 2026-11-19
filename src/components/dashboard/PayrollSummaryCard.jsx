'use client';

import * as React from 'react';
import {
  Wallet,
  Banknote,
  ArrowUpRight,
  Receipt,
  MinusCircle,
  CheckCircle2,
  Calendar,
  Percent,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

export function PayrollSummaryCard({ summary, dateFrom, dateTo, loading }) {
  const payroll = summary?.payroll || {};

  const grossSalary = Number(payroll.grossSalary ?? 0);
  const totalDeductions = Number(payroll.totalDeductions ?? 0);
  const netDisbursed = Number(payroll.netDisbursed ?? Math.max(0, grossSalary - totalDeductions));
  const slipsGenerated = Number(payroll.slipsGenerated ?? 0);

  const monthLabel = React.useMemo(() => {
    if (dateFrom && dateTo) {
      return `${dateFrom} to ${dateTo}`;
    }
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [dateFrom, dateTo]);

  const payoutRate =
    grossSalary > 0
      ? Math.round((netDisbursed / grossSalary) * 100)
      : slipsGenerated > 0
      ? 100
      : 100;

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[370px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl my-4" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-950/20 transition-all duration-300 h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 h-11">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Wallet className="size-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Payroll Summary
              </h2>
              <p className="text-xs text-slate-500">Compensation & net disbursements</p>
            </div>
          </div>
          <Link
            href="/admin/hrm/payroll"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2E] hover:underline"
          >
            Payroll <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* Net Payable Hero Banner (Matches Attendance & Tasks) */}
        <div className="mt-4 rounded-xl border border-teal-100/80 bg-gradient-to-r from-teal-50/50 via-emerald-50/30 to-teal-50/20 p-3 sm:p-3.5 min-h-[92px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                Net Payable
              </p>
              <p className="mt-0.5 text-2xl font-extrabold text-[#163A2E]">
                <AnimatedCounter value={netDisbursed} prefix="₹" />
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                <Receipt className="size-3" /> {slipsGenerated} Slips
              </span>
              <p className="mt-1 text-[11px] text-slate-500">
                Cycle: {monthLabel}
              </p>
            </div>
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-teal-200/60">
            <div
              className="h-full rounded-full bg-[#163A2E] transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, payoutRate))}%` }}
              title="Disbursement Ratio"
            />
          </div>
        </div>

        {/* 4 Stat Blocks (2x2 grid matching Attendance & Tasks) */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600">Gross Salary</span>
              <Banknote className="size-3.5 text-emerald-600" />
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-slate-900">
              <AnimatedCounter value={grossSalary} prefix="₹" />
            </p>
          </div>

          <div className="rounded-xl border border-rose-100/60 bg-rose-50/30 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-rose-800">Total Deductions</span>
              <MinusCircle className="size-3.5 text-rose-600" />
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-rose-950">
              <AnimatedCounter value={totalDeductions} prefix="₹" />
            </p>
          </div>

          <div className="rounded-xl border border-teal-100/60 bg-teal-50/30 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-teal-800">Salary Slips</span>
              <Receipt className="size-3.5 text-teal-600" />
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-teal-950">
              <AnimatedCounter value={slipsGenerated} />
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100/60 bg-emerald-50/30 p-2.5 sm:p-3 h-[74px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-800">Take-Home Ratio</span>
              <Percent className="size-3.5 text-emerald-600" />
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-emerald-950">
              <AnimatedCounter value={payoutRate} suffix="%" />
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info (Matches Attendance & Tasks) */}
      <div className="mt-3 border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-500 h-7">
        <span className="flex items-center gap-1 font-medium text-slate-600">
          <Calendar className="size-3 text-slate-400" />
          Statutory compliance active
        </span>
        <Link
          href="/admin/hrm/salary-slips"
          className="font-semibold text-[#163A2E] hover:underline"
        >
          View salary slips →
        </Link>
      </div>
    </div>
  );
}
